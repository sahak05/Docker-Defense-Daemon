from flask import Blueprint, jsonify, request, current_app
import os
import json
import logging
import threading
from datetime import datetime, timezone

import docker
from events import add_event
from utils import (
    persist_alert_line,
    enrich_with_inspect,
    trivy_scan_image,
    approvals_get,
    approvals_set,
    load_config,
    generate_unique_id,
    ensure_alert_has_id,
    deduplicate_alerts,
    find_alert_by_id_or_base,
)
from alerts_store import read_alerts, write_alerts, append_alert

RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

alerts_bp = Blueprint("alerts", __name__)
log = logging.getLogger(__name__)


@alerts_bp.route("/health", methods=["GET"])
def health():
    return "OK", 200


@alerts_bp.route("/api/alerts", methods=["GET"])
def list_alerts():
    ALERTS_FILE = current_app.config.get("ALERTS_FILE")
    limit = max(1, min(1000, int(request.args.get("limit", "100"))))
    if not ALERTS_FILE or not os.path.exists(ALERTS_FILE):
        return jsonify([]), 200
    try:
        rows = read_alerts(ALERTS_FILE)
        rows = list(reversed(rows))
        rows = deduplicate_alerts(rows)[:limit]
        return jsonify(rows), 200
    except Exception as e:
        log.exception("reading alerts failed")
        return jsonify({"error": str(e)}), 500


AUDIT_FILE = os.environ.get("AUDIT_FILE", "/app/alerts/audits.jsonl")


@alerts_bp.route("/api/alerts/<alert_id>/acknowledge", methods=["POST", "OPTIONS"])
def acknowledge_alert(alert_id):
    if request.method == "OPTIONS":
        return "", 204

    ALERTS_FILE = current_app.config.get("ALERTS_FILE")
    if not ALERTS_FILE:
        return jsonify({"error": "alerts file not configured"}), 500

    try:
        if not os.path.exists(ALERTS_FILE):
            return jsonify({"error": "Alerts file not found"}), 404

        alerts = read_alerts(ALERTS_FILE)
        alert, alert_index = find_alert_by_id_or_base(alerts, alert_id)
        if alert is None:
            log.warning("Alert %s not found in alerts.jsonl", alert_id)
            return jsonify({"error": f"Alert {alert_id} not found"}), 404

        alert["status"] = "acknowledged"
        alerts[alert_index] = alert

        # Write back updated alerts via store
        write_alerts(alerts, ALERTS_FILE)

        # Append audit line
        audit_entry = {
            "alert_id": alert_id,
            "original_id": alert.get("id"),
            "action": "acknowledged",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "api",
        }
        append_alert(audit_entry, AUDIT_FILE)

        log.info("Alert %s acknowledged (original_id: %s)", alert_id, alert.get("id"))
        return jsonify({"status": "acknowledged", "alert_id": alert_id}), 200
    except Exception as e:
        log.exception("Failed to acknowledge alert %s", alert_id)
        return jsonify({"error": str(e)}), 500


@alerts_bp.route("/api/alerts/<alert_id>/resolve", methods=["POST", "OPTIONS"])
def resolve_alert(alert_id):
    if request.method == "OPTIONS":
        return "", 204

    ALERTS_FILE = current_app.config.get("ALERTS_FILE")
    if not ALERTS_FILE:
        return jsonify({"error": "alerts file not configured"}), 500

    try:
        if not os.path.exists(ALERTS_FILE):
            return jsonify({"error": "Alerts file not found"}), 404

        alerts = read_alerts(ALERTS_FILE)
        alert, alert_index = find_alert_by_id_or_base(alerts, alert_id)
        if alert is None:
            log.warning("Alert %s not found in alerts.jsonl", alert_id)
            return jsonify({"error": f"Alert {alert_id} not found"}), 404

        alert["status"] = "resolved"
        alerts[alert_index] = alert

        write_alerts(alerts, ALERTS_FILE)

        audit_entry = {
            "alert_id": alert_id,
            "original_id": alert.get("id"),
            "action": "resolved",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "api",
        }
        append_alert(audit_entry, AUDIT_FILE)

        log.info("Alert %s resolved (original_id: %s)", alert_id, alert.get("id"))
        return jsonify({"status": "resolved", "alert_id": alert_id}), 200
    except Exception as e:
        log.exception("Failed to resolve alert %s", alert_id)
        return jsonify({"error": str(e)}), 500


@alerts_bp.route("/api/alerts/<alert_id>", methods=["PATCH", "OPTIONS"])
def update_alert_status(alert_id):
    if request.method == "OPTIONS":
        return "", 204

    ALERTS_FILE = current_app.config.get("ALERTS_FILE")
    if not ALERTS_FILE:
        return jsonify({"error": "alerts file not configured"}), 500

    try:
        body = request.get_json(silent=True) or {}
        new_status = (body.get("status") or "").strip().lower()
        if new_status not in ("acknowledged", "resolved", "open"):
            return jsonify({"error": "invalid status", "detail": new_status}), 400

        if not os.path.exists(ALERTS_FILE):
            return jsonify({"error": "Alerts file not found"}), 404

        alerts = read_alerts(ALERTS_FILE)
        alert, idx = find_alert_by_id_or_base(alerts, alert_id)
        if alert is None:
            return jsonify({"error": f"Alert {alert_id} not found"}), 404

        alert["status"] = new_status
        alerts[idx] = alert
        write_alerts(alerts, ALERTS_FILE)

        append_alert({
            "alert_id": alert_id,
            "original_id": alert.get("id"),
            "action": f"status:{new_status}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "api",
        }, AUDIT_FILE)

        return jsonify({"status": new_status, "alert_id": alert_id}), 200
    except Exception as e:
        log.exception("Failed to update alert %s", alert_id)
        return jsonify({"error": str(e)}), 500


def _process_falco_alert(payload, alerts_file):
    """
    Falco alert processing logic:
    - Logs alerts from Falco
    - If rule matches one in config.yml -> kills shell (sh/bash/zsh) inside the same container
    - Does NOT kill container itself
    """
    try:
        rule = (payload or {}).get("rule")
        output = (payload or {}).get("output")
        priority = ((payload or {}).get("priority") or "warning").lower()
        fields = (payload or {}).get("output_fields") or {}

        container_id = (
            fields.get("container.id")
            or fields.get("containerId")
            or ((payload or {}).get("container") or {}).get("id")
            or ((payload or {}).get("context", {}) or {}).get("container_id")
            or ""
        )
        proc_name = fields.get("proc.name")
        user_name = fields.get("user.name")

        # Log Falco alert summary
        log.info(json.dumps({
            "source": "falco",
            "rule": rule,
            "output": output,
            "container_id": container_id,
            "proc": proc_name,
            "user": user_name
        }))

        # Enrich metadata and perform Trivy scan
        enrichment = enrich_with_inspect(container_id or "")
        image_ref = enrichment.get("image")
        image_id = enrichment.get("image_id")

        trivy_summary = None
        if image_ref:
            trivy_summary = trivy_scan_image(image_ref, image_id=image_id)

        # Build structured alert record
        alert_record = {
            "source": "falco",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "rule": rule,
            "summary": output,
            "severity": priority,
            "container": {
                "id": container_id,
                "name": enrichment.get("container_name"),
                "image": enrichment.get("image"),
                "user": enrichment.get("user"),
                "privileged": enrichment.get("privileged"),
                "cap_add": enrichment.get("cap_add"),
                "mounts": enrichment.get("mounts"),
            },
            "detected_risks": enrichment.get("detected_risks") or [],
            "process": proc_name,
            "user": user_name,
            "trivy": trivy_summary,
            "raw": payload,
        }

        # Persist alert (use the alerts_file parameter passed into this function)
        try:
            persist_alert_line(alert_record, alerts_file)
            log.info("[Falco] Persisted async alert for %s", container_id or "unknown")
        except Exception as e:
            log.exception("Failed to persist falco alert to %s: %s", alerts_file, e)

        # === Auto-stop or shell-kill logic ===
        cfg = load_config()
        auto_rules = (cfg.get("falco", {}) or {}).get("auto_stop_on_rules", []) or []
        stop_grace = int((cfg.get("falco") or {}).get("stop_grace_seconds", 5))
        dry = os.environ.get("DRY_RUN", "false").lower() in ("1", "true", "yes")

        if rule in auto_rules and container_id:
            try:
                client = docker.from_env()
                c = client.containers.get(container_id)

                proc_name = (payload or {}).get("output_fields", {}).get("proc.name", "")
                shell_procs = ["sh", "bash", "zsh"]

                # Kill only shell process (if rule matched & inside shell)
                if proc_name in shell_procs:
                    if not dry:
                        pid_out = c.exec_run("ps -eo pid,comm")
                        pid_lines = pid_out.output.decode().splitlines()

                        shell_killed = False
                        for line in pid_lines:
                            parts = line.strip().split(None, 1)
                            if len(parts) == 2:
                                pid, cmd = parts
                                if cmd.strip() == proc_name:
                                    if pid == "1":
                                        c.exec_run("kill -9 1")
                                        shell_killed = True
                                        alert_record["action_taken"] = f"shell '{proc_name}' was PID 1 — killed"
                                        break
                                    else:
                                        c.exec_run(f"kill -9 {pid}")
                                        shell_killed = True
                                        alert_record["action_taken"] = f"shell '{proc_name}' (PID {pid}) killed"
                                        break
                        if not shell_killed:
                            alert_record["action_taken"] = f"shell '{proc_name}' not found in ps list"
                    else:
                        alert_record["action_taken"] = f"would-kill shell '{proc_name}' (DRY_RUN)"
                else:
                    # Fallback: if not shell, just stop the container gracefully
                    if not dry:
                        c.stop(timeout=stop_grace)
                        alert_record["action_taken"] = "auto-stopped container"
                        log.info(f"{RED}[Falco] rule '{rule}' hit: killed shell in container {container_id} and container stopped{RESET}")
                    else:
                        alert_record["action_taken"] = "would-auto-stop container"

            except Exception as e:
                alert_record["action_taken_error"] = str(e)
                log.error("[Falco] Action failed for %s: %s", container_id, e)

        else:
            log.info(f"{YELLOW}[Falco] Rule '{rule}' not in auto-stop list: No shell action taken{RESET}")

    except Exception as e:
        log.exception("[Falco] Async processing failed: %s", e)


@alerts_bp.route("/api/falco-alert", methods=["POST"])
def falco_alert():
    ALERTS_FILE = current_app.config.get("ALERTS_FILE")
    try:
        payload = request.get_json(force=True, silent=False)
    except Exception as e:
        return jsonify({"error": f"invalid json: {e}"}), 400

    if not ALERTS_FILE:
        return jsonify({"error": "alerts file not configured"}), 500

    try:
        t = threading.Thread(target=_process_falco_alert, args=(payload, ALERTS_FILE), daemon=True)
        t.start()
    except Exception as e:
        log.exception("Failed to start falco alert thread: %s", e)
        return jsonify({"error": "failed to start background processor"}), 500

    return jsonify({"status": "received"}), 200


@alerts_bp.route("/api/approvals/<path:image_key>", methods=["GET"])
def get_approval(image_key):
    return jsonify(approvals_get(image_key) or {"approved": False}), 200


@alerts_bp.route("/api/approvals/<path:image_key>/approve", methods=["POST", "OPTIONS"])
def approve_image(image_key):
    if request.method == "OPTIONS":
        return "", 204

    approvals_set(image_key, True)
    add_event(
        event_type="Image Approved",
        message=f"Image '{image_key}' has been approved for deployment",
        details=f"Image key: {image_key}, Status: approved"
    )
    log.info("Image %s approved", image_key)
    return jsonify({"ok": True, "image": image_key, "approved": True}), 200


@alerts_bp.route("/api/approvals/<path:image_key>/deny", methods=["POST", "OPTIONS"])
def deny_image(image_key):
    if request.method == "OPTIONS":
        return "", 204

    approvals_set(image_key, False)
    add_event(
        event_type="Image Denied",
        message=f"Image '{image_key}' has been denied and will be blocked",
        details=f"Image key: {image_key}, Status: denied"
    )
    log.info("Image %s denied", image_key)
    return jsonify({"ok": True, "image": image_key, "approved": False}), 200
