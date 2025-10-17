# daemon/utils.py
import os
import json
import docker
import logging
from datetime import datetime

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
            "description": "No non-root user configured in contaciner."
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
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(alert_json) + "\n")
        cid = alert_json.get("id") or alert_json.get("container", {}).get("id") or alert_json.get("metadata", {}).get("id")
        log.info("Persisted alert%s to %s", f" for container {cid}" if cid else "", file_path)
    except Exception as e:
        log.exception("Failed to persist alert: %s", e)

# This is the helper our app imports 
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
