import threading, time
import docker
import json
import subprocess
import logging
from datetime import datetime, timezone
from utils import trivy_scan_image
from typing import Optional

from utils import retrieve_all_risks, persist_alert, generate_unique_id
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

log = logging.getLogger(__name__)
log.setLevel(logging.INFO)

ALERTS_FILE = "/app/alerts/alerts.jsonl"

# In-memory events storage (persists during daemon runtime)
events_store = []
events_lock = threading.Lock()
MAX_EVENTS = 1000  # Keep last 1000 events


def add_event(event_type: str, message: str, container: Optional[str] = None, details: Optional[str] = None) -> None:
    """
    Add an event to the in-memory events store.
    
    Args:
        event_type: Type of event (e.g., "Container Started", "Alert Created", "Health Check")
        message: Human-readable message
        container: Optional container name/ID
        details: Optional detailed information
    """
    global events_store
    
    event = {
        "id": generate_unique_id(),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "type": event_type,
        "message": message,
    }
    
    if container:
        event["container"] = container
    
    if details:
        event["details"] = details
    
    with events_lock:
        events_store.insert(0, event)  # Insert at beginning (newest first)
        # Keep only last MAX_EVENTS
        if len(events_store) > MAX_EVENTS:
            events_store = events_store[:MAX_EVENTS]


def get_events(limit: int = 100, event_type: Optional[str] = None, container: Optional[str] = None):
    """
    Retrieve events from the in-memory store with optional filtering.
    
    Args:
        limit: Maximum number of events to return
        event_type: Filter by event type
        container: Filter by container name/ID
    
    Returns:
        List of events matching criteria
    """
    global events_store
    
    with events_lock:
        results = list(events_store)
    
    # Apply filters
    if event_type:
        results = [e for e in results if e.get("type") == event_type]
    
    if container:
        results = [e for e in results if e.get("container") == container]
    
    # Return limited results
    return results[:limit]


def run_trivy_scan(image_name: str):
    # Run a Trivy scan on the image and return summarized vulnerabilities.

    if not image_name:
        return None

    try:
        print(f"{BLUE}[INFO]{RESET} Running Trivy scan for image: {image_name}")
        cmd = ["trivy", "image", "--quiet", "--format", "json", image_name]
        out = subprocess.check_output(cmd, stderr=subprocess.STDOUT, timeout=90)
        data = json.loads(out)

        vulns = []
        for result in data.get("Results", []) or []:
            for v in result.get("Vulnerabilities", []) or []:
                vulns.append({
                    "id": v.get("VulnerabilityID"),
                    "pkg": v.get("PkgName"),
                    "ver": v.get("InstalledVersion"),
                    "sev": v.get("Severity"),
                    "cvss": v.get("CVSS", {}),
                })

        summary = {
            "count": len(vulns),
            "high_or_critical": sum(1 for v in vulns if v.get("sev") in ("HIGH", "CRITICAL")),
            "sample": vulns[:5],
        }
        print(f"{GREEN}[INFO]{RESET} Trivy scan complete for {image_name} — total vulns: {summary['count']}")
        return summary

    except subprocess.CalledProcessError as e:
        print(f"{YELLOW}[WARN]{RESET} Trivy scan failed for {image_name}: {e}")
        return None
    except FileNotFoundError:
        print(f"{YELLOW}[WARN]{RESET} Trivy not installed — skipping scan for {image_name}")
        return None
    except Exception as e:
        print(f"{YELLOW}[WARN]{RESET} Trivy error for {image_name}: {e}")
        return None


from utils import (
    retrieve_all_risks, persist_alert, load_config,
    trivy_scan_image, approvals_get, approvals_set, policy_should_block
)

def docker_event_listener():
    client = docker.from_env()
    cfg = load_config()

    for event in client.api.events(decode=True):
        try:
            if event.get("Type") != "container":
                if event.get("Type") == "image" and event.get("Action") == "pull":
                    repo = (event.get("Actor", {}) or {}).get("Attributes", {}).get("name", "")
                    if repo:
                        trivy_scan_image(repo, image_id=None)
                continue

            action = event.get("Action") or ""
            if action not in ("create", "start", "restart"):
                continue

            cid = (event.get("id") or "")[:12]
            attrs = event.get("Actor", {}).get("Attributes", {}) or {}
            image_ref = attrs.get("image", "") or attrs.get("image.name", "")
            container_name = attrs.get("name", "") or cid
            metadata = {}
            image_id = None
            risks_mapping = None  

            try:
                metadata = client.api.inspect_container(cid)
                image_id = (metadata or {}).get("Image")
            except Exception:
                pass

            if action == "create":
                mode = ((cfg.get("gate") or {}).get("mode") or "monitor").lower()
                trivy_enabled = cfg.get("trivy", {}).get("enabled", True)
                container_blocked = False

                if trivy_enabled and mode == "enforce":
                    key = image_id or image_ref
                    appr = approvals_get(key)
                    if not (appr and appr.get("approved") is True):
                        trivy_summary = trivy_scan_image(image_ref or "", image_id=image_id)

                        if policy_should_block(trivy_summary or {}, cfg):
                            logging.info(f"{RED}[Trivy] Blocking container {cid} due to high/critical vulnerabilities.")

                            if cfg.get("gate", {}).get("auto_remove_blocked_container", True):
                                try:
                                    client.api.remove_container(cid, force=True)
                                    logging.info(f"{YELLOW}[Trivy] Container {cid} removed successfully.")
                                except Exception as e:
                                    logging.warning(f"{RED}[Trivy] Failed to remove container {cid}: {e}")

                            alert = {
                                "source": "daemon",
                                "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                                "rule": "image_blocked_by_trivy",
                                "summary": f"Blocked container creation: {image_ref} (digest {image_id})",
                                "severity": "high",
                                "container": {"id": cid, "image": image_ref},
                                "trivy": trivy_summary,
                                "status": "blocked",
                            }
                            persist_alert(alert, "/app/alerts/alerts.jsonl")
                            container_blocked = True

                # Collect risk summary only if container was allowed
                if not container_blocked:
                    try:
                        risks_mapping = retrieve_all_risks(cid, metadata, image_ref, action)

                        if image_ref:
                            trivy_summary = trivy_scan_image(image_ref, image_id=image_id)
                            risks_mapping["trivy"] = trivy_summary or {"count": 0}

                        persist_alert(risks_mapping, "/app/alerts/alerts.jsonl")
                    except Exception as e:
                        logging.warning(f"[Daemon] Failed to persist risk mapping for {cid}: {e}")

            # Track all actions
            if action == "start":
                add_event("Container Started", f"Container {container_name} started successfully", container=container_name, details=f"Image: {image_ref}")
            elif action == "restart":
                add_event("Container Restarted", f"Container {container_name} restarted", container=container_name, details=f"Image: {image_ref}")
            elif action == "create":
                add_event("Container Created", f"Container {container_name} created", container=container_name, details=f"Image: {image_ref}")

            # ✅ Safe access: only if risks_mapping was set
            if risks_mapping and risks_mapping.get("risks"):
                print(f"[!] Risks found for container {cid}:")
                for r in risks_mapping["risks"]:
                    print(f" - {r['rule']} ({r['severity']}): {r['description']}")

        except Exception as e:
            print(f"[WARN] event loop error: {e}")



def analyze_container(cid, metadata_inspection, image, action):
    try:
        risks_mapping = retrieve_all_risks(cid, metadata_inspection, image, action)

        # Grab image refs for correlation 
        image_ref = risks_mapping.get("image") or ""
        image_id  = (metadata_inspection or {}).get("Image") or ""

        trivy_summary = trivy_scan_image(image_ref, image_id=image_id)
        risks_mapping["trivy"] = trivy_summary or {"count": 0, "note": "trivy skipped"}

        persist_alert(risks_mapping, ALERTS_FILE)

        if risks_mapping.get("risks"):
            print(f"{YELLOW}[!] Risks found for container {cid}:{RESET}")
            for r in risks_mapping["risks"]:
                print(f"{RED} - {r['rule']} ({r['severity']}){RESET}: {r['description']}")
        else:
            print(f"{BLUE}[INFO]{RESET} No config risks detected for {cid} ({image})")

        if trivy_summary and trivy_summary["count"] > 0:
            print(
                f"{YELLOW}[!] Trivy detected {trivy_summary['count']} vulnerabilities "
                f"({trivy_summary['high_or_critical']} high/critical){RESET}"
            )

    except Exception as e:
        print(f"{RED}[ERROR]{RESET} analyze_container failed for {cid}: {e}")
def docker_thread():
    t = threading.Thread(target=docker_event_listener, daemon=True)
    t.start()
    return t
