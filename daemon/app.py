import os
import sys
import time
import logging
from datetime import datetime, timezone
import docker
from flask import Flask
from flask_cors import CORS

# Initialize logging early
os.environ["PYTHONUNBUFFERED"] = "1"
logging.basicConfig(
    level=logging.INFO,
    stream=sys.stdout,
    format="%(asctime)s %(levelname)s %(message)s"
)

from events import docker_thread


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Shared state / config
    start_time = time.time()
    ALERTS_FILE = os.environ.get("ALERTS_FILE", "/app/alerts/alerts.jsonl")
    os.makedirs(os.path.dirname(ALERTS_FILE), exist_ok=True)

    # Load approvals from file into memory
    from utils import _load_approvals_from_file
    _load_approvals_from_file()
    logging.info("Approvals loaded from file")

    # Try to create a Docker client for reuse; handlers may override if needed
    docker_client = None
    try:
        docker_client = docker.from_env()
        logging.info("Docker version: %s", docker_client.version())
    except Exception as e:
        logging.warning("Could not create Docker client: %s", e)

    # Expose shared objects via app.config
    app.config["START_TIME"] = start_time
    app.config["ALERTS_FILE"] = ALERTS_FILE
    app.config["DOCKER_CLIENT"] = docker_client

    # Register blueprints (route modules)
    from routes.alerts import alerts_bp
    from routes.containers import containers_bp
    from routes.system import system_bp

    app.register_blueprint(alerts_bp)
    app.register_blueprint(containers_bp)
    app.register_blueprint(system_bp)

    return app


app = create_app()


if __name__ == "__main__":
    # Start background Docker event listener
    try:
        docker_thread()
    except Exception:
        logging.exception("Failed to start docker_thread")

    # Run Flask
    from werkzeug.serving import run_simple
    run_simple("0.0.0.0", 8080, app, use_reloader=False)

    
    