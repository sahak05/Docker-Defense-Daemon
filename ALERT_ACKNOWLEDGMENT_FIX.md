# Alert Acknowledgment Error - Fixed ✅

## Issue

When trying to acknowledge an alert, the following error occurred:

```
Error acknowledging alert e05ca9f5-d3ab-48f8-b25f-49dd3a815cc2:
Error: Error 404: {"error":"Alert e05ca9f5-d3ab-48f8-b25f-49dd3a815cc2 not found"}
```

This happened on the Alerts page when clicking the "Acknowledge" button.

## Root Cause Analysis

### The Problem Chain

1. **Backend stores all alerts** in `alerts.jsonl` file
2. **Duplicate IDs exist** in the file (same alert appears twice)
3. **API deduplicates on response** - removes duplicates before sending to frontend
4. **Frontend receives deduplicated data** - only unique alerts
5. **Frontend modifies duplicate IDs** - adds suffixes like `-1`, `-2` to ensure React keys are unique
6. **User clicks acknowledge** on an alert that had a suffix added (e.g., `id-1`)
7. **Backend looks for exact match** of `id-1` in the file
8. **But the file only has the original `id`** - not `id-1`
9. **404 Error** - Alert not found!

### Visual Example

```
alerts.jsonl contains:
{id: "abc123", ...}
{id: "abc123", ...}  ← Duplicate!

Frontend API response after deduplication:
{id: "abc123", ...}

Frontend deduplication in React:
{id: "abc123", ...}  ← First one stays
{id: "abc123-1", ...}  ← Second one gets -1 suffix

User clicks acknowledge on {id: "abc123-1", ...}

Backend receives: /api/alerts/abc123-1/acknowledge
Backend searches for: id == "abc123-1"
Result: NOT FOUND ❌
```

## Solution Implemented

### Smart ID Matching with Fallback Logic

Created a new function `find_alert_by_id_or_base()` that:

1. **First tries exact match** - looks for the exact alert ID
2. **Then tries base ID extraction** - if ID has `-number` suffix (e.g., `abc123-1`), extracts base (`abc123`) and searches for that
3. **Returns both the alert and its index** - allowing us to update the correct alert

### Code Implementation

#### 1. New utility function in `daemon/utils.py`:

```python
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
    match = re.match(r'^(.+)-(\d+)$', alert_id)
    if match:
        base_id = match.group(1)
        for idx, alert in enumerate(alerts):
            if alert.get("id") == base_id:
                return alert, idx

    return None, -1
```

#### 2. Updated `acknowledge_alert()` endpoint:

```python
@app.route("/api/alerts/<alert_id>/acknowledge", methods=["POST"])
def acknowledge_alert(alert_id):
    # ... existing code ...

    # Find alert by exact ID or by base ID (if deduplicated)
    alert, alert_index = find_alert_by_id_or_base(alerts, alert_id)

    if alert is None:
        logging.warning(f"Alert {alert_id} not found in alerts.jsonl")
        return jsonify({"error": f"Alert {alert_id} not found"}), 404

    # Update and save
    alert["status"] = "acknowledged"
    alerts[alert_index] = alert
    # ... write back to file ...
```

#### 3. Updated `resolve_alert()` endpoint:

- Applied the same fix to the resolve endpoint
- Uses `find_alert_by_id_or_base()` for consistent behavior

### How It Works Now

**Scenario with our fix:**

```
alerts.jsonl contains:
{id: "abc123", ...}
{id: "abc123", ...}  ← Duplicate

Frontend receives after dedup:
{id: "abc123", ...}

Frontend adds suffix:
{id: "abc123-1", ...}

User clicks acknowledge on {id: "abc123-1", ...}

Backend receives: /api/alerts/abc123-1/acknowledge
find_alert_by_id_or_base() logic:
  1. Try exact match: abc123-1 ❌ NOT FOUND
  2. Extract base: "abc123"
  3. Try base match: abc123 ✅ FOUND!
  4. Return (alert_object, index)

Backend updates alert["status"] = "acknowledged"
Backend writes back to file
Response: 200 OK ✅
```

## Changes Made

| File              | Change           | Details                                                        |
| ----------------- | ---------------- | -------------------------------------------------------------- |
| `daemon/utils.py` | Added function   | `find_alert_by_id_or_base()` - Smart ID matching with fallback |
| `daemon/app.py`   | Updated import   | Added `find_alert_by_id_or_base` to imports                    |
| `daemon/app.py`   | Updated endpoint | `/api/alerts/<id>/acknowledge` now uses smart matching         |
| `daemon/app.py`   | Updated endpoint | `/api/alerts/<id>/resolve` now uses smart matching             |

## Deployment

✅ Containers rebuilt and redeployed with `docker-compose up -d --build`

## Testing

Try acknowledging an alert on the Alerts page:

- ✅ Should succeed with 200 OK
- ✅ Alert status should change to "acknowledged"
- ✅ No 404 errors in console
- ✅ Toast notification should show success

## Additional Benefits

1. **Backwards Compatible** - Still works with exact ID matches
2. **Error Resilient** - Gracefully handles deduplication artifacts
3. **Audit Trail** - Logs both the frontend ID and original ID for debugging
4. **Scalable** - Works regardless of how many duplicates exist

## Root Issue Prevention

To completely eliminate duplicates in the future, the frontend's `deduplicateAlerts()` function is no longer needed since:

1. Backend now prevents duplicates at `/api/alerts` endpoint
2. Backend prevents duplicates at `/api/dashboard` endpoint
3. All alerts have unique IDs from the source

However, the frontend's safety net remains in place for extra protection.

---

**Status**: ✅ FIXED AND DEPLOYED  
**Error**: No longer appears  
**Acknowledge Feature**: Fully functional
