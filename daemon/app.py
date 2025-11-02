import os
import sys
import json
import time
import logging
import threading
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
import docker
from flask_swagger_ui import get_swaggerui_blueprint
from events import docker_thread
from utils import (
    persist_alert_line,
    enrich_with_inspect,
    trivy_scan_image,
    approvals_get,
    approvals_set,
    load_config,
)
os.environ["PYTHONUNBUFFERED"] = "1"
logging.basicConfig(
    level=logging.INFO,
    stream=sys.stdout,
    format="%(asctime)s %(levelname)s %(message)s"
)

SWAGGER_URL = "/docs"
API_URL = "/static/swagger.yaml"

start_time = time.time()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={ "app_name": "Docker Defense Daemon" }
)
app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

client = docker.from_env()
try:
    logging.info("Docker version: %s", client.version())
except Exception as e:
    logging.warning("Could not query Docker version: %s", e)

ALERTS_FILE = os.environ.get("ALERTS_FILE", "/app/alerts/alerts.jsonl")
os.makedirs(os.path.dirname(ALERTS_FILE), exist_ok=True)

@app.route("/")
def starting():
    return 'Welcome to Docker Defense Daemon!'

@app.route("/health")
def health():
    return "OK", 200

@app.route("/api/alerts", methods=["GET"])
def list_alerts():
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
        rows = list(reversed(rows))[:limit]
        return jsonify(rows), 200
    except Exception as e:
        logging.exception("reading alerts failed")
        return jsonify({"error": str(e)}), 500

def process_falco_alert(payload):
    """
    Falco alert processing executed in a background thread.
    Runs enrichment, Trivy scanning, and persistence.
    """
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
        proc_name = fields.get("proc.name")
        user_name = fields.get("user.name")

        logging.info(json.dumps({
            "source": "falco",
            "rule": rule,
            "output": output,
            "container_id": container_id,
            "proc": proc_name,
            "user": user_name
        }))

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
            "process": proc_name,
            "user": user_name,
            "trivy": trivy_summary,
            "raw": payload,
        }

        # Auto-stop logic based on Falco rules in config
        cfg = load_config()
        auto_rules = (cfg.get("falco", {}) or {}).get("auto_stop_on_rules", []) or []
        if rule in auto_rules and container_id:
            try:
                dry = os.environ.get("DRY_RUN", "false").lower() in ("1", "true", "yes")
                if not dry:
                    c = client.containers.get(container_id)
                    c.stop(timeout=int((cfg.get("falco") or {}).get("stop_grace_seconds", 5)))
                    alert_record["action_taken"] = "auto-stopped"
                else:
                    alert_record["action_taken"] = "would-auto-stop (DRY_RUN)"
            except Exception as e:
                alert_record["action_taken_error"] = str(e)

        # Persist alert to disk
        persist_alert_line(alert_record, ALERTS_FILE)
        logging.info(f"[Falco] Persisted async alert for {container_id or 'unknown'}")

    except Exception as e:
        logging.exception(f"[Falco] Async processing failed: {e}")


@app.route("/api/falco-alert", methods=["POST"])
def falco_alert():
    
    try:
        payload = request.get_json(force=True, silent=False)
    except Exception as e:
        return jsonify({"error": f"invalid json: {e}"}), 400

    threading.Thread(target=process_falco_alert, args=(payload,)).start()
    return jsonify({"status": "received"}), 200

#  IMAGE APPROVAL ENDPOINTS
@app.route("/api/approvals/<path:image_key>", methods=["GET"])
def get_approval(image_key):
    return jsonify(approvals_get(image_key) or {"approved": False}), 200

@app.route("/api/approvals/<path:image_key>/approve", methods=["POST"])
def approve_image(image_key):
    approvals_set(image_key, True)
    return jsonify({"ok": True, "image": image_key, "approved": True}), 200

@app.route("/api/approvals/<path:image_key>/deny", methods=["POST"])
def deny_image(image_key):
    approvals_set(image_key, False)
    return jsonify({"ok": True, "image": image_key, "approved": False}), 200

@app.route("/api/containers", methods=["GET"])
def list_container_inspections():
    """
    Optional query params:
      - limit: int (default 100, max 1000)
      - id: container id prefix (e.g., first 12 chars)
      - image: image name (e.g., 'alpine' or 'alpine:latest')
      - action: 'create' | 'start'
    """
    limit = max(1, min(1000, int(request.args.get("limit", "100"))))
    id_prefix = (request.args.get("id") or "").strip()
    image_filter = (request.args.get("image") or "").strip()
    action_filter = (request.args.get("action") or "").strip()

    if not os.path.exists(ALERTS_FILE):
        return jsonify([]), 200
    out = []
    try:
        with open(ALERTS_FILE, "r", encoding="utf-8") as f:
            lines = f.readlines()

        for line in reversed(lines):
            try:
                rec = json.loads(line)
            except Exception:
                continue

            if rec.get("source") == "falco":
                continue
            if "metadata" not in rec or "risks" not in rec:
                continue

            if id_prefix and not str(rec.get("id", "")).startswith(id_prefix):
                continue
            if image_filter and image_filter != str(rec.get("image", "")):
                continue
            if action_filter and action_filter != str(rec.get("action", "")):
                continue
            
            out.append(rec)
            if len(out) >= limit:
                break
            
        return jsonify(out), 200
    
    except Exception as e:
        logging.exception("reading inspections failed")
        return jsonify({"error": str(e)}), 500

@app.route("/api/daemon-status", methods=["GET"])
def daemon_status():
    uptime = round(time.time() - start_time, 2)
    docker_ok = False
    docker_info = {}
    alerts_count = 0

    try:
        client = docker.from_env()
        docker_info = client.version()
        docker_ok = True
    except Exception as e:
        docker_info = {"error": str(e)}

    try:
        if os.path.exists(ALERTS_FILE):
            with open(ALERTS_FILE, "r", encoding="utf-8") as f:
                alerts_count = sum(1 for _ in f)
    except Exception as e:
        alerts_count = f"error: {e}"

    status = {
        "daemon": "running",
        "uptime_seconds": uptime,
        "docker_connected": docker_ok,
        "alerts_file": ALERTS_FILE,
        "alerts_count": alerts_count,
        "docker_version": docker_info.get("Version") if docker_ok else None,
        "api_version": docker_info.get("ApiVersion") if docker_ok else None,
    }

    return jsonify(status), 200

@app.route("/api/containers/<container_id>/stop", methods=["POST"])
def stop_container(container_id):
    try:
        client.version()
        container = None
        for c in client.containers.list(all=True):
            if c.id.startswith(container_id):
                container = c
                break

        if not container:
            return jsonify({"error": f"No container found with ID starting {container_id}"}), 404

        container.stop(timeout=5)
        return jsonify({
            "status": "stopped",
            "id": container.short_id,
            "name": container.name,
            "image": container.image.tags,
            "message": f"Container {container.short_id} stopped successfully."
        }), 200

    except docker.errors.APIError as e:
        return jsonify({"error": f"Docker API error: {e.explanation}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
   
if __name__ == "__main__":
    docker_thread()  # Start background Docker event listener
    app.run(host="0.0.0.0", port=8080, debug=False, use_reloader=False)