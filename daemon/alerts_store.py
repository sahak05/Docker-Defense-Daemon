import os
import json
import logging
from typing import List, Dict

log = logging.getLogger(__name__)


def read_alerts(file_path: str) -> List[Dict]:
    alerts = []
    if not os.path.exists(file_path):
        return alerts
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    alerts.append(json.loads(line))
                except Exception:
                    continue
    except Exception as e:
        log.exception(f"Failed to read alerts file {file_path}: {e}")
    return alerts


def write_alerts(alerts: List[Dict], file_path: str) -> None:
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as f:
            for a in alerts:
                f.write(json.dumps(a) + "\n")
    except Exception as e:
        log.exception(f"Failed to write alerts file {file_path}: {e}")


def append_alert(alert: Dict, file_path: str) -> None:
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(alert) + "\n")
    except Exception as e:
        log.exception(f"Failed to append alert to {file_path}: {e}")


def compact_alerts_file(file_path: str) -> None:
    """
    Remove duplicate alerts from the file, keeping the most recent occurrence for each ID.
    This prevents duplicate IDs from accumulating in the alerts store.
    """
    alerts = read_alerts(file_path)
    if not alerts:
        return

    # Keep the most recent occurrence: iterate from end (newest) to start
    seen = set()
    unique_newest = []
    for alert in reversed(alerts):
        aid = alert.get("id")
        if not aid:
            # keep alerts without id as-is (they may be processed later)
            unique_newest.append(alert)
            continue
        if aid in seen:
            continue
        seen.add(aid)
        unique_newest.append(alert)

    # unique_newest currently newest-first; reverse to oldest-first for file
    compacted = list(reversed(unique_newest))
    try:
        write_alerts(compacted, file_path)
    except Exception as e:
        log.exception(f"Failed to compact alerts file {file_path}: {e}")
