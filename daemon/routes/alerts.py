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

alerts_bp = Blueprint("alerts", __name__)
log = logging.getLogger(__name__)


@alerts_bp.route("/", methods=["GET"])
def root():
    return 'Welcome to Docker Defense Daemon!', 200


@alerts_bp.route("/health", methods=["GET"])
def health():
    return "OK", 200


@alerts_bp.route("/api/alerts", methods=["GET"])
def list_alerts():
    ALERTS_FILE = current_app.config.get("ALERTS_FILE")
    limit = max(1, min(1000, int(request.args.get("limit", "100"))))
    if not os.path.exists(ALERTS_FILE):
        return jsonify([]), 200
    try:
        rows = []
        with open(ALERTS_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    rows.append(json.loads(line))
                except Exception:
                    continue
        rows = list(reversed(rows))
        rows = deduplicate_alerts(rows)[:limit]
        return jsonify(rows), 200
    except Exception as e:
        logging.exception("reading alerts failed")
        return jsonify({"error": str(e)}), 500


def _read_alerts_file(alerts_file):
    alerts = []
    if not os.path.exists(alerts_file):
        return alerts
    with open(alerts_file, "r", encoding="utf-8") as f:
        for line in f:
            try:
                alerts.append(json.loads(line))
            except Exception:
                continue
    return alerts


@alerts_bp.route("/api/alerts/<alert_id>/acknowledge", methods=["POST", "OPTIONS"])
def acknowledge_alert(alert_id):
    if request.method == "OPTIONS":
        return "", 204
    
    ALERTS_FILE = current_app.config.get("ALERTS_FILE")
    try:
        if not os.path.exists(ALERTS_FILE):
            return jsonify({"error": "Alerts file not found"}), 404

        alerts = _read_alerts_file(ALERTS_FILE)
        alert, alert_index = find_alert_by_id_or_base(alerts, alert_id)
        if alert is None:
            logging.warning(f"Alert {alert_id} not found in alerts.jsonl")
            return jsonify({"error": f"Alert {alert_id} not found"}), 404

        alert["status"] = "acknowledged"
        alerts[alert_index] = alert

        with open(ALERTS_FILE, "w", encoding="utf-8") as f:
            for a in alerts:
                f.write(json.dumps(a) + "\n")

        audit_entry = {
            "alert_id": alert_id,
            "original_id": alert.get("id"),
            "action": "acknowledged",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "api",
        }
        with open(ALERTS_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(audit_entry) + "\n")

        logging.info(f"Alert {alert_id} acknowledged (original_id: {alert.get('id')})")
        return jsonify({"status": "acknowledged", "alert_id": alert_id}), 200
    except Exception as e:
        logging.exception(f"Failed to acknowledge alert {alert_id}")
        return jsonify({"error": str(e)}), 500


@alerts_bp.route("/api/alerts/<alert_id>/resolve", methods=["POST", "OPTIONS"])
def resolve_alert(alert_id):
    if request.method == "OPTIONS":
        return "", 204
    
    ALERTS_FILE = current_app.config.get("ALERTS_FILE")
    try:
        if not os.path.exists(ALERTS_FILE):
            return jsonify({"error": "Alerts file not found"}), 404

        alerts = _read_alerts_file(ALERTS_FILE)
        alert, alert_index = find_alert_by_id_or_base(alerts, alert_id)
        if alert is None:
            logging.warning(f"Alert {alert_id} not found in alerts.jsonl")
            return jsonify({"error": f"Alert {alert_id} not found"}), 404

        alert["status"] = "resolved"
        alerts[alert_index] = alert

        with open(ALERTS_FILE, "w", encoding="utf-8") as f:
            for a in alerts:
                f.write(json.dumps(a) + "\n")

        audit_entry = {
            "alert_id": alert_id,
            "original_id": alert.get("id"),
            "action": "resolved",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "api",
        }
        with open(ALERTS_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(audit_entry) + "\n")

        logging.info(f"Alert {alert_id} resolved (original_id: {alert.get('id')})")
        return jsonify({"status": "resolved", "alert_id": alert_id}), 200
    except Exception as e:
        logging.exception(f"Failed to resolve alert {alert_id}")
        return jsonify({"error": str(e)}), 500


def _process_falco_alert(payload, alerts_file):
    try:
        rule = payload.get("rule")
        output = payload.get("output")
        priority = (payload.get("priority") or "warning").lower()
        fields = payload.get("output_fields") or {}

        container_id = (
            fields.get("container.id")
            or fields.get("containerId")
            or (payload.get("container") or {}).get("id")
            or (payload.get("context", {}) or {}).get("container_id")
            or ""
        )

        enrichment = enrich_with_inspect(container_id or "")
        image_ref = enrichment.get("image")
        image_id = enrichment.get("image_id")

        trivy_summary = None
        if image_ref:
            trivy_summary = trivy_scan_image(image_ref, image_id=image_id)

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
            "process": payload.get("proc.name"),
            "user": payload.get("user.name"),
            "trivy": trivy_summary,
            "raw": payload,
        }

        # Auto-stop logic
        cfg = load_config()
        auto_rules = (cfg.get("falco", {}) or {}).get("auto_stop_on_rules", []) or []
        if rule in auto_rules and container_id:
            try:
                dry = os.environ.get("DRY_RUN", "false").lower() in ("1", "true", "yes")
                if not dry:
                    client = docker.from_env()
                    c = client.containers.get(container_id)
                    c.stop(timeout=int((cfg.get("falco") or {}).get("stop_grace_seconds", 5)))
                    alert_record["action_taken"] = "auto-stopped"
                else:
                    alert_record["action_taken"] = "would-auto-stop (DRY_RUN)"
            except Exception as e:
                alert_record["action_taken_error"] = str(e)

        persist_alert_line(alert_record, alerts_file)
        log.info(f"[Falco] Persisted async alert for {container_id or 'unknown'}")

    except Exception as e:
        log.exception(f"[Falco] Async processing failed: {e}")


@alerts_bp.route("/api/falco-alert", methods=["POST"])
def falco_alert():
    ALERTS_FILE = current_app.config.get("ALERTS_FILE")
    try:
        payload = request.get_json(force=True, silent=False)
    except Exception as e:
        return jsonify({"error": f"invalid json: {e}"}), 400

    threading.Thread(target=_process_falco_alert, args=(payload, ALERTS_FILE)).start()
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
    logging.info(f"Image {image_key} approved")
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
    logging.info(f"Image {image_key} denied")
    return jsonify({"ok": True, "image": image_key, "approved": False}), 200
