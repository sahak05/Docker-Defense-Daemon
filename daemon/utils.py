# daemon/utils.py
import os
import json
import docker
import logging
from datetime import datetime
import yaml
from datetime import datetime, timedelta
import uuid
import alerts_store
import threading

_CONFIG = None
_APPROVALS = {}    
_TRIVY_CACHE = {}
_APPROVALS_LOCK = threading.Lock()

APPROVALS_FILE = os.environ.get("APPROVALS_FILE", "/app/alerts/approvals.jsonl")
os.makedirs(os.path.dirname(APPROVALS_FILE), exist_ok=True)   

def load_config(path="/app/config.yml"):
    global _CONFIG
    if _CONFIG is not None:
        return _CONFIG
    try:
        with open(path, "r") as f:
            _CONFIG = yaml.safe_load(f) or {}
    except Exception:
        _CONFIG = {}
    return _CONFIG

def generate_unique_id() -> str:
    """Generate a unique ID using UUID v4."""
    return str(uuid.uuid4())

def ensure_alert_has_id(alert: dict) -> dict:
    """
    Ensure alert has a unique ID. If missing, generate one.
    If ID exists but is not unique, a new one will be generated later at dashboard level.
    """
    if "id" not in alert or not alert.get("id"):
        alert["id"] = generate_unique_id()
    return alert

def deduplicate_alerts(alerts: list) -> list:
    """
    Deduplicate alerts by ID, keeping the first occurrence.
    This prevents duplicate alerts from being returned to the frontend.
    """
    seen = set()
    unique_alerts = []
    for alert in alerts:
        alert_id = alert.get("id")
        if alert_id and alert_id not in seen:
            seen.add(alert_id)
            unique_alerts.append(alert)
        elif not alert_id:
            # If no ID, ensure it gets one and add it
            alert = ensure_alert_has_id(alert)
            if alert["id"] not in seen:
                seen.add(alert["id"])
                unique_alerts.append(alert)
    return unique_alerts

def find_alert_by_id_or_base(alerts: list, alert_id: str) -> tuple:
    """
    Find an alert by exact ID or by base ID (before deduplication suffix).
    
    Returns: (alert_dict, index) or (None, -1) if not found
    
    Example: If looking for "id-1", will find original "id" in alerts
    """
    # Try exact match first
    for idx, alert in enumerate(alerts):
        if alert.get("id") == alert_id:
            return alert, idx
    
    # Try matching base ID (remove -1, -2, etc. suffixes added by frontend deduplication)
    import re
    # Check if alert_id ends with -number
    match = re.match(r'^(.+)-(\d+)$', alert_id)
    if match:
        base_id = match.group(1)
        for idx, alert in enumerate(alerts):
            if alert.get("id") == base_id:
                return alert, idx
    
    return None, -1


def _load_approvals_from_file():
    """Load approvals from the approvals.jsonl file into memory."""
    global _APPROVALS
    _APPROVALS = {}
    
    if not os.path.exists(APPROVALS_FILE):
        return
    
    try:
        with open(APPROVALS_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    entry = json.loads(line)
                    if "image_key" in entry and "approved" in entry:
                        _APPROVALS[entry["image_key"]] = {
                            "approved": entry["approved"],
                            "ts": entry.get("ts", datetime.utcnow().isoformat() + "Z")
                        }
                except Exception:
                    continue
    except Exception as e:
        logging.warning(f"Failed to load approvals from file: {e}")


def _save_approvals_to_file():
    """Save current approvals to the approvals.jsonl file."""
    try:
        with open(APPROVALS_FILE, "w", encoding="utf-8") as f:
            for image_key, approval_data in _APPROVALS.items():
                entry = {
                    "image_key": image_key,
                    "approved": approval_data.get("approved", False),
                    "ts": approval_data.get("ts", datetime.utcnow().isoformat() + "Z")
                }
                f.write(json.dumps(entry) + "\n")
    except Exception as e:
        logging.error(f"Failed to save approvals to file: {e}")


def approvals_get(image_key: str):
    """Get approval status for an image. Returns None if not found."""
    with _APPROVALS_LOCK:
        return _APPROVALS.get(image_key)


def approvals_set(image_key: str, approved: bool):
    """Set approval status for an image and persist to file."""
    with _APPROVALS_LOCK:
        _APPROVALS[image_key] = {
            "approved": approved,
            "ts": datetime.utcnow().isoformat() + "Z"
        }
        _save_approvals_to_file()

def policy_should_block(trivy_summary: dict, cfg: dict):
    if not trivy_summary:
        return False
    threshold = int(((cfg.get("trivy") or {}).get("block_if_high_or_critical", 0)))
    return trivy_summary.get("high_or_critical", 0) >= threshold

log = logging.getLogger(__name__)
log.setLevel(logging.INFO)

ALERTS_FILE = os.environ.get("ALERTS_FILE", "/app/alerts/alerts.jsonl")
os.makedirs(os.path.dirname(ALERTS_FILE), exist_ok=True)

DANGEROUS_CAPS = {"SYS_ADMIN", "SYS_PTRACE", "NET_ADMIN"}
SENSITIVE_PATH_HINTS = [
    "/var/run/docker.sock",
    "/etc",
    "/boot",
    "/dev",
    "/lib",
    "/proc",
    "/sys",
    "/usr",
]

def retrieve_all_risks(cid, metadata, image, action):
    hostcfg = metadata.get("HostConfig", {}) or {}
    cfg = metadata.get("Config", {}) or {}
    mounts = hostcfg.get("Binds") or []
    caps = set(hostcfg.get("CapAdd") or [])
    privileged = bool(hostcfg.get("Privileged", False))
    user = (cfg.get("User") or "").strip()
    secopt = hostcfg.get("SecurityOpt")
    networks = list((metadata.get("NetworkSettings") or {}).get("Networks") or [])
    env = cfg.get("Env") or []

    risks = []

    if privileged:
        risks.append({
            "rule": "Privileged mode enabled",
            "severity": "high",
            "description": "Container runs with --privileged flag."
        })

    for cap in caps:
        if cap in DANGEROUS_CAPS:
            risks.append({
                "rule": f"Dangerous capability {cap}",
                "severity": "high",
                "description": f"Capability {cap} may allow host/kernel manipulation."
            })

    for m in mounts:
        if "docker.sock" in m:
            risks.append({
                "rule": "Docker socket mount",
                "severity": "critical",
                "description": "Mounting docker.sock exposes full host control."
            })
        for hint in SENSITIVE_PATH_HINTS:
            if f":{hint}" in m or m.startswith(hint):
                risks.append({
                    "rule": f"Sensitive host path mount ({hint})",
                    "severity": "medium",
                    "description": f"Container mounts sensitive host path {hint}."
                })
                break

    if not user or user in ("0", "root"):
        risks.append({
            "rule": "Runs as root",
            "severity": "medium",
            "description": "No non-root user configured in container."
        })

    if secopt and any("seccomp=unconfined" in str(s) for s in secopt):
        risks.append({
            "rule": "Unconfined seccomp profile",
            "severity": "medium",
            "description": "Container running with unconfined seccomp profile."
        })

    container_json = {
        "id": cid,
        "image": image,
        "action": action,
        "volumesMounted": mounts,
        "capabilitiesAdded": list(caps),
        "privileged": privileged,
        "user": user,
        "securityOptions": secopt,
        "networks": networks,
        "environmentVariables": env,
    }

    return {
        "id": cid,
        "image": image,
        "action": action,
        "metadata": container_json,
        "risks": risks,
        "log_time": datetime.utcnow().isoformat() + "Z"
    }

def persist_alert(alert_json, file_path=ALERTS_FILE):
    try:
        # Use alerts_store append functionality and then compact the file to remove duplicates.
        alerts_store.append_alert(alert_json, file_path)
        cid = alert_json.get("id") or alert_json.get("container", {}).get("id") or alert_json.get("metadata", {}).get("id")
        log.info("Persisted alert%s to %s", f" for container {cid}" if cid else "", file_path)
        # Compact the alerts file to ensure duplicate IDs are removed and only the newest kept.
        try:
            alerts_store.compact_alerts_file(file_path)
        except Exception:
            # Don't fail the whole persist if compaction has an issue. Log and continue.
            log.exception("Failed to compact alerts file after append")
    except Exception as e:
        log.exception("Failed to persist alert: %s", e)

def persist_alert_line(obj: dict, path: str = ALERTS_FILE):
    persist_alert(obj, path)

def enrich_with_inspect(container_id: str) -> dict:
    if not container_id:
        return {}
    try:
        client = docker.from_env()
        c = client.containers.get(container_id)
        meta = client.api.inspect_container(container_id)

        hostcfg = meta.get("HostConfig", {}) or {}
        cfg = meta.get("Config", {}) or {}
        mounts = hostcfg.get("Binds") or []
        caps = hostcfg.get("CapAdd") or []
        privileged = bool(hostcfg.get("Privileged", False))
        user = (cfg.get("User") or "").strip()
        image = cfg.get("Image")
        image_id = meta.get("Image") 

        detected = []
        if privileged:
            detected.append("privileged")
        if any("docker.sock" in str(m) for m in mounts):
            detected.append("docker_sock_mount")
        if not user or user in ("0", "root"):
            detected.append("runs_as_root")
        for cap in caps:
            if cap in DANGEROUS_CAPS:
                detected.append(f"cap_{cap}")
        if any(any(h in str(m) for h in SENSITIVE_PATH_HINTS) for m in mounts):
            detected.append("sensitive_host_mount")

        return {
            "container_name": c.name,
            "image": image,
            "image_id": image_id,  
            "mounts": mounts,
            "cap_add": caps,
            "privileged": privileged,
            "user": user,
            "detected_risks": list(dict.fromkeys(detected)),
        }

    except Exception as e:
        log.warning("inspect failed for %s: %s", container_id, e)
        return {}

_TRIVY_CACHE = {}  # key -> summary

def trivy_scan_image(image_ref: str, image_id: str | None = None, timeout_sec: int = 90):
    
    import subprocess, json, logging
    log = logging.getLogger(__name__)

    if not image_ref:
        return None

    cache_key = image_id or image_ref
    if cache_key in _TRIVY_CACHE:
        return _TRIVY_CACHE[cache_key]

    try:
        out = subprocess.check_output(
            ["trivy", "image", "--quiet", "--format", "json", image_ref],
            stderr=subprocess.STDOUT, timeout=timeout_sec
        )
        data = json.loads(out)
        vulns = []
        for r in data.get("Results", []) or []:
            for v in r.get("Vulnerabilities", []) or []:
                vulns.append({
                    "id": v.get("VulnerabilityID"),
                    "pkg": v.get("PkgName"),
                    "ver": v.get("InstalledVersion"),
                    "sev": v.get("Severity"),
                })
        summary = {
            "count": len(vulns),
            "high_or_critical": sum(1 for x in vulns if x.get("sev") in ("HIGH","CRITICAL")),
            "sample": vulns[:5],
        }
        _TRIVY_CACHE[cache_key] = summary
        return summary

    except FileNotFoundError:
        log.warning("Trivy binary not found in container PATH; skipping scan.")
        return None
    except subprocess.CalledProcessError as e:
        log.warning("Trivy failed for %s: %s", image_ref, e)
        return None
    except Exception as e:
        log.warning("Trivy error for %s: %s", image_ref, e)
        return None
