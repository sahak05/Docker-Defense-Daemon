# CORS Fix for Daemon Control Endpoints

## Problem

When attempting to call the daemon control endpoints (`/api/daemon/stop` and `/api/daemon/restart`) from the frontend, requests were failing with CORS errors:

```text
Access to fetch at 'http://localhost:8080/api/daemon/stop' from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: It does not have HTTP ok status.

POST http://localhost:8080/api/daemon/stop net::ERR_FAILED
```

## Root Cause

Browsers send an OPTIONS (preflight) request before POST requests when making cross-origin calls. The daemon control endpoints were configured to only accept POST requests:

```python
@system_bp.route("/api/daemon/stop", methods=["POST"])
```

When the browser sent the OPTIONS request, Flask couldn't match it to any route handler and returned a 404. Even though Flask-CORS was configured on the app, the CORS middleware couldn't add proper headers to a 404 response.

## Solution

Updated both daemon control endpoints to explicitly handle OPTIONS requests:

```python
@system_bp.route("/api/daemon/stop", methods=["POST", "OPTIONS"])
def stop_daemon():
    # Handle CORS preflight
    if request.method == "OPTIONS":
        return "", 204
    # ... rest of endpoint logic
```

And similarly for `restart_daemon()`:

```python
@system_bp.route("/api/daemon/restart", methods=["POST", "OPTIONS"])
def restart_daemon():
    # Handle CORS preflight
    if request.method == "OPTIONS":
        return "", 204
    # ... rest of endpoint logic
```

### What This Does

- **Accepts OPTIONS requests** - Both endpoints now accept OPTIONS requests from the browser
- **Returns 204 No Content** - The preflight response returns 204 (No Content), which is the correct HTTP status
- **CORS headers applied** - Flask-CORS middleware now properly adds the `Access-Control-Allow-Origin: *` header to successful responses
- **POST requests work** - Actual POST requests go through the normal logic after preflight succeeds

## Verification

### Test OPTIONS Request

```bash
curl -i -X OPTIONS http://localhost:8080/api/daemon/stop
# Returns: 204 NO CONTENT with Access-Control-Allow-Origin: * header
```

### Test POST Request

```bash
curl -i -X POST http://localhost:8080/api/daemon/stop
# Returns: 200 with status JSON
```

## Frontend Impact

- ✅ Frontend requests now successfully pass the CORS preflight check
- ✅ Daemon control buttons should now work when clicked
- ✅ Success/error toasts will display appropriate feedback

## Files Modified

- `daemon/routes/system.py` - Added OPTIONS method support to both daemon control endpoints

## Testing

1. Navigate to System Status page in browser
2. Click "Stop Daemon" or "Restart Daemon" button
3. Confirm the dialog
4. Should see success toast (no more CORS errors)
5. Daemon should shutdown/restart as expected
