from flask import Blueprint, jsonify, request, current_app
import logging
import docker
import json
import os
import time
from datetime import datetime, timezone

containers_bp = Blueprint("containers", __name__)
log = logging.getLogger(__name__)


def _get_docker_client():
    client = current_app.config.get("DOCKER_CLIENT")
    if client:
        return client
    try:
        return docker.from_env()
    except Exception:
        return None


@containers_bp.route("/api/containers", methods=["GET"])
def list_container_inspections():
    """
    Optional query params:
      - limit: int (default 100, max 1000)
      - id: container id prefix (e.g., first 12 chars)
      - image: image name
      - action: 'create' | 'start'
    """
    limit = max(1, min(1000, int(request.args.get("limit", "100"))))
    id_prefix = (request.args.get("id") or "").strip()
    image_filter = (request.args.get("image") or "").strip()
    action_filter = (request.args.get("action") or "").strip()

    ALERTS_FILE = current_app.config.get("ALERTS_FILE")
    if not ALERTS_FILE or not ALERTS_FILE:
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


@containers_bp.route("/api/containers/list", methods=["GET", "OPTIONS"])
def list_running_containers():
    if request.method == "OPTIONS":
        return "", 200

    try:
        include_all = request.args.get("include_all", "false").lower() in ("1", "true", "yes")
        client = _get_docker_client()
        if not client:
            return jsonify({"error": "Docker client not available"}), 503

        containers_list = client.containers.list(all=include_all)
        result = []
        for container in containers_list:
            try:
                cpu_percent = 0.0
                memory_usage = 0.0
                memory_limit = 0.0
                if container.status == "running":
                    try:
                        stats = container.stats(stream=False)
                        if "cpu_stats" in stats and "system_cpu_usage" in stats["cpu_stats"]:
                            cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - stats["precpu_stats"]["cpu_usage"]["total_usage"]
                            system_delta = stats["cpu_stats"]["system_cpu_usage"] - stats["precpu_stats"]["system_cpu_usage"]
                            cpu_percent = (cpu_delta / system_delta) * 100.0 if system_delta > 0 else 0.0
                        if "memory_stats" in stats:
                            memory_usage = stats["memory_stats"].get("usage", 0) / (1024 ** 3)
                            memory_limit = stats["memory_stats"].get("limit", 0) / (1024 ** 3)
                    except Exception as stats_err:
                        logging.debug(f"Could not get stats for {container.name}: {stats_err}")

                start_time_str = container.attrs.get("State", {}).get("StartedAt", "")
                uptime_str = "N/A"
                if start_time_str:
                    try:
                        from datetime import datetime, timezone
                        start = datetime.fromisoformat(start_time_str.replace("Z", "+00:00"))
                        now = datetime.now(timezone.utc)
                        delta = now - start
                        days = delta.days
                        hours = delta.seconds // 3600
                        minutes = (delta.seconds % 3600) // 60
                        uptime_str = f"{days}d {hours}h {minutes}m"
                    except Exception:
                        uptime_str = "N/A"

                result.append({
                    "id": container.id[:12],
                    "name": container.name,
                    "image": container.image.tags[0] if container.image.tags else "unknown",
                    "status": container.status,
                    "uptime": uptime_str,
                    "cpu": round(cpu_percent, 1),
                    "memory": round(memory_usage, 2),
                    "memory_limit": round(memory_limit, 2),
                    "created": container.attrs.get("Created", ""),
                    "last_event": container.attrs.get("State", {}).get("Status", "unknown"),
                    "full_id": container.id,
                })
            except Exception as e:
                logging.warning(f"Error processing container {container.name}: {e}")
                try:
                    result.append({
                        "id": container.id[:12],
                        "name": container.name,
                        "image": container.image.tags[0] if container.image.tags else "unknown",
                        "status": container.status,
                        "uptime": "N/A",
                        "cpu": 0.0,
                        "memory": 0.0,
                        "memory_limit": 0.0,
                        "created": container.attrs.get("Created", ""),
                        "last_event": "stats unavailable",
                        "full_id": container.id,
                    })
                except Exception:
                    pass

        return jsonify(result), 200
    except Exception as e:
        logging.exception("Error listing containers")
        return jsonify({"error": str(e)}), 500


@containers_bp.route("/api/containers/<container_id>/stop", methods=["POST", "OPTIONS"])
def stop_container(container_id):
    if request.method == "OPTIONS":
        return "", 204
    
    try:
        client = _get_docker_client()
        if not client:
            return jsonify({"error": "Docker client not available"}), 503
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
            "message": f"Container {container.short_id} stopped successfully.",
        }), 200

    except docker.errors.APIError as e:
        return jsonify({"error": f"Docker API error: {e.explanation}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@containers_bp.route("/api/containers/<container_id>/start", methods=["POST", "OPTIONS"])
def start_container(container_id):
    if request.method == "OPTIONS":
        return "", 204
    
    try:
        client = _get_docker_client()
        if not client:
            return jsonify({"error": "Docker client not available"}), 503
        container = None
        for c in client.containers.list(all=True):
            if c.id.startswith(container_id):
                container = c
                break

        if not container:
            return jsonify({"error": f"No container found with ID starting {container_id}"}), 404

        container.start()
        return jsonify({
            "status": "started",
            "id": container.short_id,
            "name": container.name,
            "image": container.image.tags,
            "message": f"Container {container.short_id} started successfully.",
        }), 200

    except docker.errors.APIError as e:
        return jsonify({"error": f"Docker API error: {e.explanation}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@containers_bp.route("/api/containers/<container_id>/restart", methods=["POST", "OPTIONS"])
def restart_container(container_id):
    if request.method == "OPTIONS":
        return "", 204
    
    try:
        client = _get_docker_client()
        if not client:
            return jsonify({"error": "Docker client not available"}), 503
        container = None
        for c in client.containers.list(all=True):
            if c.id.startswith(container_id):
                container = c
                break

        if not container:
            return jsonify({"error": f"No container found with ID starting {container_id}"}), 404

        container.restart(timeout=5)
        return jsonify({
            "status": "restarted",
            "id": container.short_id,
            "name": container.name,
            "image": container.image.tags,
            "message": f"Container {container.short_id} restarted successfully.",
        }), 200

    except docker.errors.APIError as e:
        return jsonify({"error": f"Docker API error: {e.explanation}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@containers_bp.route("/api/containers/images/list", methods=["GET", "OPTIONS"])
def list_container_images():
    """
    Get a list of all unique images used by containers (running and stopped).
    Returns deduped list of images with approval status.
    """
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        from utils import approvals_get
        
        client = _get_docker_client()
        if not client:
            return jsonify({"error": "Docker client not available"}), 503

        containers_list = client.containers.list(all=True)
        images = {}  # Use dict to deduplicate by image tag
        
        for container in containers_list:
            try:
                image_tags = container.image.tags if container.image.tags else [f"sha256:{container.image.id.split(':')[1][:12]}"]
                for tag in image_tags:
                    if tag not in images:
                        # Get approval status from utils
                        approval = approvals_get(tag)
                        images[tag] = {
                            "imageKey": tag,
                            "imageName": tag,
                            "approved": approval.get("approved") if approval else False,
                            "lastUpdated": approval.get("ts") if approval else None,
                        }
            except Exception as e:
                logging.debug(f"Error processing image from container {container.name}: {e}")
        
        result = list(images.values())
        return jsonify(result), 200
    
    except Exception as e:
        logging.exception("Error listing container images")
        return jsonify({"error": str(e)}), 500
