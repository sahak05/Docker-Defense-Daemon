import threading, time
import docker
import json
import subprocess
import logging
from datetime import datetime
from utils import trivy_scan_image

from utils import retrieve_all_risks, persist_alert
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

log = logging.getLogger(__name__)
log.setLevel(logging.INFO)

ALERTS_FILE = "/app/alerts/alerts.jsonl"


def run_trivy_scan(image_name: str):
    # Run a Trivy scan on the image and return summarized vulnerabilities.
    # If Trivy is not installed or fails, return None instead of crashing.

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


def docker_event_listener():
    client = docker.from_env()
    for event in client.api.events(decode=True):
        if event.get("Type") == "container" and event.get("Action") in ("create", "start", "restart"):
            cid = event.get("id")[:12]
            c_image = event.get("Actor", {}).get("Attributes", {}).get("image", "")
            c_action = event["Action"]
            print(f"{GREEN}[INFO]{RESET} [Docker Listener] {cid} on event {c_action} with image ({c_image})")
            try:
                metadata_inspection = client.api.inspect_container(cid)
                threading.Thread(
                    target=analyze_container,
                    args=(cid, metadata_inspection, c_image, c_action),
                    daemon=True,
                ).start()
                time.sleep(1)
            except Exception as e:
                print(f"{YELLOW}[WARN]{RESET} Failed to inspect container {cid}: {e}")


def analyze_container(cid, metadata_inspection, image, action):
    try:
        risks_mapping = retrieve_all_risks(cid, metadata_inspection, image, action)

        # Grab image refs for correlation
        image_ref = risks_mapping.get("image") or ""
        image_id  = (metadata_inspection or {}).get("Image") or ""

        # Synchronous Trivy (with timeout + cache)
        trivy_summary = trivy_scan_image(image_ref, image_id=image_id)
        risks_mapping["trivy"] = trivy_summary or {"count": 0, "note": "trivy skipped"}

        #persist full results (config + trivy)
        persist_alert(risks_mapping, ALERTS_FILE)

        #print risk summary to console
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
