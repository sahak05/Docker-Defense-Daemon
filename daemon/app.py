import os
import sys
import json
import time
import logging
import threading
from datetime import datetime, timezone
import platform
import docker
from flask import Flask, jsonify, request
from flask_cors import CORS
from events import docker_thread, get_events, add_event
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

# --- Logging setup ---
os.environ["PYTHONUNBUFFERED"] = "1"
logging.basicConfig(
    level=logging.INFO,
    stream=sys.stdout,
    format="%(asctime)s %(levelname)s %(message)s"
)

# --- Flask setup ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

client = docker.from_env()
try:
    logging.info("Docker version: %s", client.version())
except Exception as e:
    logging.warning("Could not query Docker version: %s", e)

start_time = time.time()
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
        rows = list(reversed(rows))
        # Deduplicate alerts by ID to ensure frontend receives unique IDs
        rows = deduplicate_alerts(rows)[:limit]
        return jsonify(rows), 200
    except Exception as e:
        logging.exception("reading alerts failed")
        return jsonify({"error": str(e)}), 500

@app.route("/api/events", methods=["GET", "OPTIONS"])
def list_events():
    """
    Retrieve events from the in-memory events store.
    
    Query parameters:
    - limit: Maximum number of events to return (default: 100, max: 1000)
    - type: Filter by event type (optional)
    - container: Filter by container name/ID (optional)
    """
    try:
        limit = max(1, min(1000, int(request.args.get("limit", "100"))))
        event_type = request.args.get("type", None)
        container = request.args.get("container", None)
        
        events = get_events(limit=limit, event_type=event_type, container=container)
        return jsonify(events), 200
    except Exception as e:
        logging.exception("reading events failed")
        return jsonify({"error": str(e)}), 500

@app.route("/api/alerts/<alert_id>/acknowledge", methods=["POST"])
def acknowledge_alert(alert_id):
    """
    Acknowledge an alert by updating its status to 'acknowledged' in alerts.jsonl.
    Also appends an audit line with the action.
    
    Handles both exact ID matches and deduplicated IDs (e.g., "id-1" finds "id").
    """
    try:
        if not os.path.exists(ALERTS_FILE):
            return jsonify({"error": "Alerts file not found"}), 404
        
        # Read all alerts
        alerts = []
        with open(ALERTS_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    alerts.append(json.loads(line))
                except Exception:
                    continue
        
        # Find alert by exact ID or by base ID (if deduplicated)
        alert, alert_index = find_alert_by_id_or_base(alerts, alert_id)
        
        if alert is None:
            logging.warning(f"Alert {alert_id} not found in alerts.jsonl")
            return jsonify({"error": f"Alert {alert_id} not found"}), 404
        
        # Update the alert status
        alert["status"] = "acknowledged"
        alerts[alert_index] = alert
        
        # Write back updated alerts
        with open(ALERTS_FILE, "w", encoding="utf-8") as f:
            for a in alerts:
                f.write(json.dumps(a) + "\n")
        
        # Append audit line
        audit_entry = {
            "alert_id": alert_id,
            "original_id": alert.get("id"),
            "action": "acknowledged",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "api"
        }
        with open(ALERTS_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(audit_entry) + "\n")
        
        logging.info(f"Alert {alert_id} acknowledged (original_id: {alert.get('id')})")
        return jsonify({"status": "acknowledged", "alert_id": alert_id}), 200
    except Exception as e:
        logging.exception(f"Failed to acknowledge alert {alert_id}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/alerts/<alert_id>/resolve", methods=["POST"])
def resolve_alert(alert_id):
    """
    Resolve an alert by updating its status to 'resolved' in alerts.jsonl.
    Also appends an audit line with the action.
    
    Handles both exact ID matches and deduplicated IDs (e.g., "id-1" finds "id").
    """
    try:
        if not os.path.exists(ALERTS_FILE):
            return jsonify({"error": "Alerts file not found"}), 404
        
        # Read all alerts
        alerts = []
        with open(ALERTS_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    alerts.append(json.loads(line))
                except Exception:
                    continue
        
        # Find alert by exact ID or by base ID (if deduplicated)
        alert, alert_index = find_alert_by_id_or_base(alerts, alert_id)
        
        if alert is None:
            logging.warning(f"Alert {alert_id} not found in alerts.jsonl")
            return jsonify({"error": f"Alert {alert_id} not found"}), 404
        
        # Update the alert status
        alert["status"] = "resolved"
        alerts[alert_index] = alert
        
        # Write back updated alerts
        with open(ALERTS_FILE, "w", encoding="utf-8") as f:
            for a in alerts:
                f.write(json.dumps(a) + "\n")
        
        # Append audit line
        audit_entry = {
            "alert_id": alert_id,
            "original_id": alert.get("id"),
            "action": "resolved",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "api"
        }
        with open(ALERTS_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(audit_entry) + "\n")
        
        logging.info(f"Alert {alert_id} resolved (original_id: {alert.get('id')})")
        return jsonify({"status": "resolved", "alert_id": alert_id}), 200
    except Exception as e:
        logging.exception(f"Failed to resolve alert {alert_id}")
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

        

        # Persist alert to disk
        persist_alert_line(alert_record, ALERTS_FILE)
        logging.info(f"[Falco] Persisted async alert for {container_id or 'unknown'}")

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

@app.route("/api/containers/list", methods=["GET", "OPTIONS"])
def list_running_containers():
    """
    Returns real running containers with live stats.
    Optional: include_all (bool) - include stopped containers
    """
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        include_all = request.args.get("include_all", "false").lower() in ("1", "true", "yes")
        containers_list = client.containers.list(all=include_all)
        
        result = []
        for container in containers_list:
            try:
                # Get container stats - only for running containers
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
                
                # Calculate uptime
                start_time_str = container.attrs.get("State", {}).get("StartedAt", "")
                uptime_str = "N/A"
                if start_time_str:
                    try:
                        start = datetime.fromisoformat(start_time_str.replace("Z", "+00:00"))
                        now = datetime.now(timezone.utc)
                        delta = now - start
                        days = delta.days
                        hours = delta.seconds // 3600
                        minutes = (delta.seconds % 3600) // 60
                        uptime_str = f"{days}d {hours}h {minutes}m"
                    except:
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
                    "full_id": container.id
                })
            except Exception as e:
                logging.warning(f"Error processing container {container.name}: {e}")
                # Still add the container with minimal data
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
                        "full_id": container.id
                    })
                except:
                    pass
        
        return jsonify(result), 200
    except Exception as e:
        logging.exception("Error listing containers")
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

@app.route("/api/system-status", methods=["GET"])
def system_status():
    """
    System status endpoint returning host information and system resources.
    Includes OS info, Docker version, CPU, memory, and disk usage.
    """
    try:
        # Get Docker client and info
        client = docker.from_env()
        docker_info = client.version()
        
        # Get system information
        system_info = platform.system()
        release = platform.release()
        architecture = platform.machine()
        
        # Get CPU and memory information
        try:
            import psutil
            cpu_count = psutil.cpu_count(logical=False) or psutil.cpu_count()
            cpu_percent = psutil.cpu_percent(interval=0.1)
            
            mem = psutil.virtual_memory()
            memory_total = round(mem.total / (1024**3), 2)  # Convert to GB
            memory_used = round(mem.used / (1024**3), 2)
            memory_percent = mem.percent
            
            disk = psutil.disk_usage('/')
            disk_total = round(disk.total / (1024**3), 2)  # Convert to GB
            disk_used = round(disk.used / (1024**3), 2)
            disk_percent = disk.percent
        except ImportError:
            # psutil not available, return N/A
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
                "cpu": {
                    "cores": cpu_count,
                    "usage_percent": cpu_percent,
                },
                "memory": {
                    "total_gb": memory_total,
                    "used_gb": memory_used,
                    "usage_percent": memory_percent,
                },
                "disk": {
                    "total_gb": disk_total,
                    "used_gb": disk_used,
                    "usage_percent": disk_percent,
                },
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        
        return jsonify(status), 200
    except Exception as e:
        logging.exception("Error getting system status")
        return jsonify({"error": str(e)}), 500

@app.route("/api/dashboard", methods=["GET"])
def get_dashboard():
    """
    Dashboard endpoint combining daemon status, container stats, and recent alerts.
    """
    try:
        uptime = round(time.time() - start_time, 2)
        docker_ok = False
        docker_info = {}
        containers_list = []
        alerts_list = []
        
        # Get daemon status and docker info
        try:
            client_instance = docker.from_env()
            docker_info = client_instance.version()
            docker_ok = True
            
            # Get running containers
            containers_list = client_instance.containers.list(all=True)
        except Exception as e:
            logging.warning(f"Docker connection error: {e}")
            docker_info = {"error": str(e)}
        
        # Get alerts
        try:
            if os.path.exists(ALERTS_FILE):
                with open(ALERTS_FILE, "r", encoding="utf-8") as f:
                    for line in f:
                        try:
                            alerts_list.append(json.loads(line))
                        except Exception:
                            continue
            alerts_list = list(reversed(alerts_list))
            # Deduplicate alerts by ID to prevent frontend from seeing duplicates
            alerts_list = deduplicate_alerts(alerts_list)
        except Exception as e:
            logging.warning(f"Failed to read alerts: {e}")
        
        # Build container stats
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
                    
                # Try to get stats (only works for running containers)
                cpu_percent = 0
                memory_mb = 0
                memory_limit_mb = 256  # Default fallback
                
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
                    "network": {"rx": 0, "tx": 0}
                })
            except Exception as e:
                logging.debug(f"Error processing container: {e}")
                continue
        
        # Calculate alert statistics
        critical_alerts = sum(1 for a in alerts_list if a.get("severity") == "critical")
        high_alerts = sum(1 for a in alerts_list if a.get("severity") == "high")
        unresolved_alerts = sum(1 for a in alerts_list if a.get("status") != "resolved")
        
        # Normalize alert timestamps for frontend
        normalized_alerts = []
        for alert in alerts_list[:10]:
            alert = dict(alert)  # copy
            alert["timestamp"] = alert.get("timestamp") or alert.get("log_time") or ""
            # Ensure unique ID
            alert = ensure_alert_has_id(alert)
            normalized_alerts.append(alert)

        # Build unique activity records with UUIDs
        recent_activity = []
        for i in range(3):
            recent_activity.append({
                "id": generate_unique_id(),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "message": f"Container activity recorded",
            })

        # Build response
        dashboard_data = {
            "success": True,
            "data": {
                "summary": {
                    "containers": {
                        "total": len(containers_list),
                        "running": running_count,
                        "stopped": stopped_count,
                    },
                    "alerts": {
                        "unresolved": unresolved_alerts,
                        "critical": critical_alerts,
                        "high": high_alerts,
                    },
                    "daemonStatus": {
                        "status": "running" if docker_ok else "error",
                        "uptime": uptime,
                        "version": docker_info.get("Version", "unknown"),
                    },
                    "systemMetrics": {
                        "cpu": {"usage": round(cpu_total / max(1, len(containers_list)), 2)},
                        "memory": {
                            "used": round(memory_total, 2),
                            "limit": round(memory_limit_total, 2),
                            "percentage": round((memory_total / max(1, memory_limit_total)) * 100, 2),
                        },
                    },
                },
                "recentAlerts": normalized_alerts,  # Last 10 alerts, normalized with unique IDs
                "topContainers": sorted(container_stats, key=lambda x: x["cpu"], reverse=True)[:5],
                "recentActivity": recent_activity,  # Recent activity with unique UUIDs
            }
        }
        
        return jsonify(dashboard_data), 200
        
    except Exception as e:
        logging.exception(f"Dashboard endpoint error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

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

@app.route("/api/containers/<container_id>/start", methods=["POST"])
def start_container(container_id):
    try:
        client.version()
        container = None
        for c in client.containers.list(all=True):
            if c.id.startswith(container_id):
                container = c
                break

        if not container:
            return jsonify({"error": f"No container found with ID starting {container_id}"}), 404

        # Start the container
        container.start()
        return jsonify({
            "status": "started",
            "id": container.short_id,
            "name": container.name,
            "image": container.image.tags,
            "message": f"Container {container.short_id} started successfully."
        }), 200

    except docker.errors.APIError as e:
        return jsonify({"error": f"Docker API error: {e.explanation}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/containers/<container_id>/restart", methods=["POST"])
def restart_container(container_id):
    try:
        client.version()
        container = None
        for c in client.containers.list(all=True):
            if c.id.startswith(container_id):
                container = c
                break

        if not container:
            return jsonify({"error": f"No container found with ID starting {container_id}"}), 404

        # Restart the container
        container.restart(timeout=5)
        return jsonify({
            "status": "restarted",
            "id": container.short_id,
            "name": container.name,
            "image": container.image.tags,
            "message": f"Container {container.short_id} restarted successfully."
        }), 200

    except docker.errors.APIError as e:
        return jsonify({"error": f"Docker API error: {e.explanation}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
   
if __name__ == "__main__":
    # Start background Docker event listener
    docker_thread()

    # Run Flask
    from werkzeug.serving import run_simple
    run_simple("0.0.0.0", 8080, app, use_reloader=False)

    
    