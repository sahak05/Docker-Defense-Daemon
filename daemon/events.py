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
                # handle image pulls too
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
            metadata = {}
            try:
                metadata = client.api.inspect_container(cid)
            except Exception:
                pass
            image_id = (metadata or {}).get("Image")  # sha256:...

            if action == "create":
                # skip if not enforcing
                mode = ((cfg.get("gate") or {}).get("mode") or "monitor").lower()
                if (cfg.get("trivy", {}).get("enabled", True)) and mode == "enforce":
                    # if there is a prior approval for this image digest, allow
                    key = image_id or image_ref
                    appr = approvals_get(key)
                    if appr and appr.get("approved") is True:
                        pass
                    else:
                        trivy_summary = trivy_scan_image(image_ref or "", image_id=image_id)
                        if policy_should_block(trivy_summary or {}, cfg):
                            if (cfg.get("gate", {}).get("auto_remove_blocked_container", True)):
                                try:
                                    client.api.remove_container(cid, force=True)
                                except Exception:
                                    pass
                            # write a "blocked" alert
                            alert = {
                                "source": "daemon",
                                "timestamp": datetime.utcnow().isoformat()+"Z",
                                "rule": "image_blocked_by_trivy",
                                "summary": f"Blocked container create: {image_ref} (digest {image_id})",
                                "severity": "high",
                                "container": {"id": cid, "image": image_ref},
                                "trivy": trivy_summary,
                                "status": "blocked",
                            }
                            persist_alert(alert, "/app/alerts/alerts.jsonl")
                            continue

            risks_mapping = retrieve_all_risks(cid, metadata, image_ref, action)

            # attach trivy summary (cached or fresh)
            if image_ref:
                trivy_summary = trivy_scan_image(image_ref, image_id=image_id)
                risks_mapping["trivy"] = trivy_summary or {"count":0}

            persist_alert(risks_mapping, "/app/alerts/alerts.jsonl")

            risks = risks_mapping.get("risks") or []
            if risks:
                print(f"[!] Risks found for container {cid}:")
                for r in risks:
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
