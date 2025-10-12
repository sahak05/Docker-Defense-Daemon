import time 
from flask import Flask, request, jsonify 
import docker
import subprocess
import json
import logging, sys
import os
os.environ["PYTHONUNBUFFERED"] = "1"

from events import docker_thread

logging.basicConfig(
    level=logging.INFO,
    stream=sys.stdout,
    format="%(asctime)s %(levelname)s %(message)s"
)



app = Flask(__name__)

client = docker.from_env()
print(client.version())

@app.route('/')
def starting():
    return 'Welcome to our daemon defense for containers!'

@app.route("/health")
def health():
    return "OK", 200

@app.route("/api/falco-alert", methods=["POST"])
def falco_alert():
    try:
        payload = request.get_json(force=True, silent=False)
    except Exception as e:
        return jsonify({"error": f"invalid json: {e}"}), 400

    rule = payload.get("rule")
    output = payload.get("output")
    fields = payload.get("output_fields") or {}
    container_id = fields.get("container.id")
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

    #TODO: persist to /app/alerts, correlate with inspect/Trivy
    return jsonify({"status": "received"}), 200

if __name__ == "__main__":
    docker_thread()
    app.run(host="0.0.0.0", port=8080, debug=False, use_reloader=False)