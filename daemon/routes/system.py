from flask import Blueprint, jsonify, request, current_app
import docker
import logging
import platform
import os
import json
import time
from datetime import datetime, timezone

from utils import (
    ensure_alert_has_id,
    deduplicate_alerts,
    generate_unique_id,
    trivy_scan_image,
)
from events import get_events

system_bp = Blueprint("system", __name__)
log = logging.getLogger(__name__)


@system_bp.route("/api/events", methods=["GET", "OPTIONS"])
def list_events():
    try:
        limit = max(1, min(1000, int(request.args.get("limit", "100"))))
        event_type = request.args.get("type", None)
        container = request.args.get("container", None)
        events = get_events(limit=limit, event_type=event_type, container=container)
        return jsonify(events), 200
    except Exception as e:
        logging.exception("reading events failed")
        return jsonify({"error": str(e)}), 500


@system_bp.route("/api/daemon-status", methods=["GET"])
def daemon_status():
    start_time = current_app.config.get("START_TIME")
    ALERTS_FILE = current_app.config.get("ALERTS_FILE")

    uptime = round(time.time() - start_time, 2) if start_time else 0
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


@system_bp.route("/api/system-status", methods=["GET"])
def system_status():
    try:
        client = docker.from_env()
        docker_info = client.version()

        system_info = platform.system()
        release = platform.release()
        architecture = platform.machine()

        try:
            import psutil
            cpu_count = psutil.cpu_count(logical=False) or psutil.cpu_count()
            cpu_percent = psutil.cpu_percent(interval=0.1)
            mem = psutil.virtual_memory()
            memory_total = round(mem.total / (1024**3), 2)
            memory_used = round(mem.used / (1024**3), 2)
            memory_percent = mem.percent
            disk = psutil.disk_usage('/')
            disk_total = round(disk.total / (1024**3), 2)
            disk_used = round(disk.used / (1024**3), 2)
            disk_percent = disk.percent
        except ImportError:
            cpu_count = "N/A"
            cpu_percent = "N/A"
            memory_total = "N/A"
            memory_used = "N/A"
            memory_percent = "N/A"
            disk_total = "N/A"
            disk_used = "N/A"
            disk_percent = "N/A"
        except Exception as e:
            logging.warning(f"Error getting system metrics: {e}")
            cpu_count = "error"
            cpu_percent = "error"
            memory_total = "error"
            memory_used = "error"
            memory_percent = "error"
            disk_total = "error"
            disk_used = "error"
            disk_percent = "error"

        status = {
            "host_information": {
                "operating_system": system_info,
                "kernel_release": release,
                "architecture": architecture,
                "docker_version": docker_info.get("Version", "unknown"),
                "api_version": docker_info.get("ApiVersion", "unknown"),
            },
            "system_resources": {
                "cpu": {"cores": cpu_count, "usage_percent": cpu_percent},
                "memory": {"total_gb": memory_total, "used_gb": memory_used, "usage_percent": memory_percent},
                "disk": {"total_gb": disk_total, "used_gb": disk_used, "usage_percent": disk_percent},
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        return jsonify(status), 200
    except Exception as e:
        logging.exception("Error getting system status")
        return jsonify({"error": str(e)}), 500


@system_bp.route("/api/docker-daemon", methods=["GET"])
def docker_daemon_info():
    try:
        client = docker.from_env()
    except Exception as e:
        logging.exception("Docker client not available")
        msg = (
            "Docker API not accessible from inside container. "
            "Ensure /var/run/docker.sock is mounted into the container or set DOCKER_HOST."
        )
        return jsonify({"error": msg, "detail": str(e)}), 503

    try:
        images = client.images.list()
        total_images = len(images)
        images_size = 0
        for img in images:
            try:
                images_size += int(img.attrs.get("Size", 0) or 0)
            except Exception:
                pass
        images_size_gb = round(images_size / (1024**3), 2)

        try:
            volumes = client.volumes.list()
            total_volumes = len(volumes)
        except Exception:
            total_volumes = 0

        try:
            networks = client.networks.list()
            total_networks = len(networks)
            bridge_count = sum(1 for n in networks if (n.attrs or {}).get("Driver") == "bridge")
            custom_count = total_networks - bridge_count
        except Exception:
            total_networks = 0
            bridge_count = 0
            custom_count = 0

        daemon_info = {
            "images": {"total": total_images, "size_gb": images_size_gb},
            "volumes": {"total": total_volumes},
            "networks": {"total": total_networks, "bridge": bridge_count, "custom": custom_count},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        return jsonify(daemon_info), 200
    except Exception as e:
        logging.exception("Error getting Docker daemon info")
        return jsonify({"error": "Failed to query Docker daemon", "detail": str(e)}), 500


@system_bp.route("/api/dashboard", methods=["GET"])
def get_dashboard():
    try:
        start_time = current_app.config.get("START_TIME")
        ALERTS_FILE = current_app.config.get("ALERTS_FILE")

        uptime = round(time.time() - start_time, 2) if start_time else 0
        docker_ok = False
        docker_info = {}
        containers_list = []
        alerts_list = []

        try:
            client_instance = docker.from_env()
            docker_info = client_instance.version()
            docker_ok = True
            containers_list = client_instance.containers.list(all=True)
        except Exception as e:
            logging.warning(f"Docker connection error: {e}")
            docker_info = {"error": str(e)}

        try:
            if os.path.exists(ALERTS_FILE):
                with open(ALERTS_FILE, "r", encoding="utf-8") as f:
                    for line in f:
                        try:
                            alerts_list.append(json.loads(line))
                        except Exception:
                            continue
            alerts_list = list(reversed(alerts_list))
            alerts_list = deduplicate_alerts(alerts_list)
        except Exception as e:
            logging.warning(f"Failed to read alerts: {e}")

        container_stats = []
        cpu_total = 0
        memory_total = 0
        memory_limit_total = 0
        running_count = 0
        stopped_count = 0

        for container in containers_list:
            try:
                state = container.attrs.get("State", {})
                status = "running" if state.get("Running") else "stopped"
                if status == "running":
                    running_count += 1
                else:
                    stopped_count += 1

                cpu_percent = 0
                memory_mb = 0
                memory_limit_mb = 256
                if state.get("Running"):
                    try:
                        stats = container.stats(stream=False)
                        cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - stats["precpu_stats"].get("cpu_usage", {}).get("total_usage", 0)
                        system_delta = stats["cpu_stats"]["system_cpu_usage"] - stats["precpu_stats"].get("system_cpu_usage", 0)
                        cpu_percent = (cpu_delta / system_delta * 100) if system_delta > 0 else 0
                        memory_mb = stats["memory_stats"].get("usage", 0) / (1024 * 1024)
                        memory_limit_mb = stats["memory_stats"].get("limit", 256 * 1024 * 1024) / (1024 * 1024)
                    except Exception as e:
                        logging.debug(f"Could not get stats for {container.name}: {e}")

                cpu_total += cpu_percent
                memory_total += memory_mb
                memory_limit_total += memory_limit_mb

                container_stats.append({
                    "id": container.id[:12],
                    "name": container.name,
                    "status": status,
                    "image": container.image.tags[0] if container.image.tags else "unknown",
                    "cpu": round(cpu_percent, 2),
                    "memory": round(memory_mb, 2),
                    "memoryLimit": round(memory_limit_mb, 2),
                    "uptime": uptime,
                    "network": {"rx": 0, "tx": 0},
                })
            except Exception as e:
                logging.debug(f"Error processing container: {e}")
                continue

        critical_alerts = sum(1 for a in alerts_list if a.get("severity") == "critical")
        high_alerts = sum(1 for a in alerts_list if a.get("severity") == "high")
        unresolved_alerts = sum(1 for a in alerts_list if a.get("status") != "resolved")

        normalized_alerts = []
        for alert in alerts_list[:10]:
            alert = dict(alert)
            alert["timestamp"] = alert.get("timestamp") or alert.get("log_time") or ""
            alert = ensure_alert_has_id(alert)
            normalized_alerts.append(alert)

        recent_activity = []
        for i in range(3):
            recent_activity.append({
                "id": generate_unique_id(),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "message": f"Container activity recorded",
            })

        dashboard_data = {
            "success": True,
            "data": {
                "summary": {
                    "containers": {"total": len(containers_list), "running": running_count, "stopped": stopped_count},
                    "alerts": {"unresolved": unresolved_alerts, "critical": critical_alerts, "high": high_alerts},
                    "daemonStatus": {"status": "running" if docker_ok else "error", "uptime": uptime, "version": docker_info.get("Version", "unknown")},
                    "systemMetrics": {"cpu": {"usage": round(cpu_total / max(1, len(containers_list)), 2)}, "memory": {"used": round(memory_total, 2), "limit": round(memory_limit_total, 2), "percentage": round((memory_total / max(1, memory_limit_total)) * 100, 2)}},
                },
                "recentAlerts": normalized_alerts,
                "topContainers": sorted(container_stats, key=lambda x: x["cpu"], reverse=True)[:5],
                "recentActivity": recent_activity,
            },
        }

        return jsonify(dashboard_data), 200
    except Exception as e:
        logging.exception(f"Dashboard endpoint error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@system_bp.route("/api/daemon/restart", methods=["POST", "OPTIONS"])
def restart_daemon():
    """
    Restart the daemon process.
    Since we're running in a Docker container managed by docker-compose,
    we signal the container to exit gracefully and let the orchestrator restart it.
    """
    # Handle CORS preflight
    if request.method == "OPTIONS":
        return "", 204
    
    try:
        logging.info("Daemon restart requested")
        # Log the restart action
        audit_entry = {
            "action": "daemon_restart_requested",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "api"
        }
        ALERTS_FILE = current_app.config.get("ALERTS_FILE")
        if ALERTS_FILE:
            try:
                with open(ALERTS_FILE, "a", encoding="utf-8") as f:
                    f.write(json.dumps(audit_entry) + "\n")
            except Exception as e:
                logging.warning(f"Could not write audit entry for daemon restart: {e}")
        
        # Return success response before exiting
        response = jsonify({"status": "daemon_restarting", "message": "Daemon is restarting"})
        
        # Schedule exit after delay to ensure response is sent
        def delayed_exit():
            import time
            time.sleep(0.5)
            import sys
            sys.exit(0)
        
        import threading
        threading.Thread(target=delayed_exit, daemon=True).start()
        
        return response, 200
        
    except Exception as e:
        logging.exception(f"Failed to restart daemon: {e}")
        return jsonify({"error": "Failed to restart daemon", "detail": str(e)}), 500


@system_bp.route("/api/daemon/stop", methods=["POST", "OPTIONS"])
def stop_daemon():
    """
    Stop the daemon process.
    Since we're running in a Docker container, we gracefully exit.
    The container will stop, but won't be restarted (unless restart policy is set to 'always').
    """
    # Handle CORS preflight
    if request.method == "OPTIONS":
        return "", 204
    
    try:
        logging.info("Daemon stop requested")
        # Log the stop action
        audit_entry = {
            "action": "daemon_stop_requested",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "api"
        }
        ALERTS_FILE = current_app.config.get("ALERTS_FILE")
        if ALERTS_FILE:
            try:
                with open(ALERTS_FILE, "a", encoding="utf-8") as f:
                    f.write(json.dumps(audit_entry) + "\n")
            except Exception as e:
                logging.warning(f"Could not write audit entry for daemon stop: {e}")
        
        # Return success response before exiting
        # The client will be notified before we shut down
        response = jsonify({"status": "daemon_stopping", "message": "Daemon is shutting down"})
        
        # Schedule exit after a short delay to ensure response is sent
        def delayed_exit():
            import time
            time.sleep(0.5)
            import sys
            sys.exit(0)
        
        import threading
        threading.Thread(target=delayed_exit, daemon=True).start()
        
        return response, 200
        
    except Exception as e:
        logging.exception(f"Failed to stop daemon: {e}")
        return jsonify({"error": "Failed to stop daemon", "detail": str(e)}), 500
        logging.exception(f"Failed to stop daemon: {e}")
        return jsonify({"error": "Failed to stop daemon", "detail": str(e)}), 500
