import os
import sys
import time
import logging
from datetime import datetime, timezone
import docker
from flask import Flask, send_from_directory, send_file
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
    # Set static folder for built UI
    static_folder = os.path.join(os.path.dirname(__file__), 'static')
    app = Flask(__name__, static_folder=static_folder, static_url_path='')
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

    # Serve UI static files
    @app.route('/')
    def serve_index():
        """Serve the React app's index.html"""
        static_dir = app.static_folder
        if static_dir and os.path.exists(os.path.join(static_dir, 'index.html')):
            return send_from_directory(static_dir, 'index.html')
        return "UI not built. Run 'npm run build' in packages/ui", 404

    @app.route('/<path:path>')
    def serve_static(path):
        """Serve static assets or fallback to index.html for React Router"""
        static_dir = app.static_folder
        if static_dir:
            # Check if the file exists in static folder
            file_path = os.path.join(static_dir, path)
            if os.path.exists(file_path) and os.path.isfile(file_path):
                return send_from_directory(static_dir, path)
            # Fallback to index.html for React Router routes
            if os.path.exists(os.path.join(static_dir, 'index.html')):
                return send_from_directory(static_dir, 'index.html')
        return "UI not built", 404

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