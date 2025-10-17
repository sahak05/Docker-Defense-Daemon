import time 
from flask import Flask, request, jsonify 
import docker
import subprocess
import json
import logging, sys
import os
from datetime import datetime, timezone
from flask_cors import CORS

from events import docker_thread
from utils import (
    persist_alert_line,
    enrich_with_inspect,
    trivy_scan_image,
)
os.environ["PYTHONUNBUFFERED"] = "1"
logging.basicConfig(
    level=logging.INFO,
    stream=sys.stdout,
    format="%(asctime)s %(levelname)s %(message)s"
)

app = Flask(__name__)
# allow UI served on another port/origin to call /api/*
CORS(app, resources={r"/api/*": {"origins": "*"}})

client = docker.from_env()
try:
    logging.info("Docker version: %s", client.version())
except Exception as e:
    logging.warning("Could not query Docker version: %s", e)
ALERTS_FILE = os.environ.get("ALERTS_FILE", "/app/alerts/alerts.jsonl")
os.makedirs(os.path.dirname(ALERTS_FILE), exist_ok=True)

@app.route("/")
def starting():
    return 'Welcome to our daemon defense for containers!'

@app.route("/health")
def health():
    return "OK", 200

@app.route("/api/alerts", methods=["GET"])
def list_alerts():

    limit = max(1, min(1000, int(request.args.get("limit", "100"))))
    if not os.path.exists(ALERTS_FILE):
        return jsonify([]), 200
    rows = []
    try:
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

@app.route("/api/falco-alert", methods=["POST"])
def falco_alert():
    # Receives Falco JSON (http_output)adds: enrichment(docker inspect),optional Trivy summary and persistence to alerts.jsonl
    try:
        payload = request.get_json(force=True, silent=False)
    except Exception as e:
        return jsonify({"error": f"invalid json: {e}"}), 400

    rule = payload.get("rule")
    output = payload.get("output")
    priority = (payload.get("priority") or "warning").lower()
    fields = payload.get("output_fields") or {}
    container_id = (fields.get("container.id") or fields.get("containerId")
    or (payload.get("container") or {}).get("id")
    or (payload.get("context", {}) or {}).get("container_id") or "" )
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

    # enrichment
    enrichment = enrich_with_inspect(container_id or "")

    # Trivy(skipped if not available)
    image_ref = enrichment.get("image")
    image_id  = enrichment.get("image_id")
    trivy = None
    if image_ref:
        trivy = trivy_scan_image(image_ref, image_id=image_id)

    alert_record = {
        "source": "falco",
        "timestamp":  datetime.now(timezone.utc).isoformat(),
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
        "trivy": trivy,   
        "raw": payload     
    }
    persist_alert_line(alert_record, ALERTS_FILE)
    return jsonify({"status": "received"}), 200

if __name__ == "__main__":
    docker_thread()
    app.run(host="0.0.0.0", port=8080, debug=False, use_reloader=False)