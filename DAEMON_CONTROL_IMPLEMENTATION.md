# Daemon Control Implementation

## Overview

Successfully implemented daemon restart and stop functionality that allows users to control the daemon lifecycle from the System Status page.

## Architecture

### Backend (Python/Flask)

#### New Endpoints Added to `daemon/routes/system.py`

**POST /api/daemon/restart**

- **Purpose**: Gracefully restart the daemon
- **Behavior**: Calls `sys.exit(0)` to trigger a clean shutdown; docker-compose is configured to automatically restart the container
- **Response**: JSON with status field
- **Logging**: Audit entry logged before shutdown

**POST /api/daemon/stop**

- **Purpose**: Gracefully stop the daemon
- **Behavior**: Returns 200 response first, then spawns a background thread to exit after 0.5s delay (ensures response is sent before process terminates)
- **Response**: JSON with status `"daemon_stopping"`
- **Logging**: Audit entry logged before shutdown
- **Note**: Requires manual restart (docker-compose will not auto-restart with stop policy)

### Frontend (React/TypeScript)

#### New API Functions in `packages/ui/src/utils/dashboard.ts`

```typescript
export async function restartDaemon(): Promise<{ status: string }>;
export async function stopDaemon(): Promise<{ status: string }>;
```

Both functions:

- Call the corresponding backend endpoints via `apiFetch()`
- Include proper error handling and logging
- Throw errors for UI error handling

#### Updated `packages/ui/src/pages/system-status/SystemStatus.tsx`

**Handler: `handleRestartDaemon()`**

- Shows confirmation dialog: "Are you sure you want to restart the daemon? The system will be temporarily unavailable."
- On confirmation:
  - Calls `restartDaemon()` API
  - Shows success toast: "Daemon restart initiated. The system will come back online shortly."
  - Waits 3 seconds then attempts to reconnect and refresh status
  - On error: Shows error toast with error message

**Handler: `handleStopDaemon()`**

- Shows confirmation dialog: "Are you sure you want to stop the daemon? This will shut down the entire system monitoring. You will need to manually restart it."
- On confirmation:
  - Calls `stopDaemon()` API
  - Shows success toast: "Daemon stop initiated. The system is shutting down."
  - Waits 2 seconds then attempts to reconnect
  - If offline, shows error: "System is offline. Please restart the daemon manually."
  - On error: Shows error toast with error message

## User Flow

1. **Navigate to System Status page**
2. **Click "Restart Daemon" or "Stop Daemon" button** on the Daemon Status Card
3. **Confirmation dialog appears** with appropriate warning
4. **On confirm**:
   - Request sent to backend
   - Button disabled during operation
   - Success message shown
   - System attempts to reconnect after brief delay
5. **On cancel**: Dialog closes, no action taken

## Technical Details

### Graceful Shutdown

- **Restart**: Immediate `sys.exit(0)` triggers docker-compose restart policy
- **Stop**: Delayed exit in background thread ensures API response is delivered before process terminates

### Error Handling

- Both API functions include try-catch blocks
- Errors logged to console
- User-friendly error messages shown in toast notifications
- System attempts reconnection after operations

### State Management

- `isOperating` state prevents multiple concurrent operations
- Loading states prevent duplicate requests
- Error state displayed in UI

## Testing

### Backend Verification

```bash
# Health check
curl http://localhost:8080/health

# System status (should respond before/after daemon operations)
curl http://localhost:8080/api/system-status

# Daemon endpoints (test carefully as they trigger shutdown)
curl -X POST http://localhost:8080/api/daemon/restart
curl -X POST http://localhost:8080/api/daemon/stop
```

### Frontend Testing

1. Open System Status page in browser
2. Click "Restart Daemon" button
3. Confirm dialog appears
4. Click confirm (or cancel to skip)
5. Success/error toast appears
6. System reconnects and refreshes data
7. Repeat for "Stop Daemon" button

## Future Enhancements

1. **Real Daemon Status**: Replace `mockDaemonInfo` with data from `/api/daemon-status` endpoint
2. **Polling**: Add background polling to auto-refresh daemon status
3. **Rich Confirmations**: Replace `window.confirm()` with custom modal for better UX
4. **Audit Trail**: Display daemon operations in an audit log
5. **Health Recovery**: Auto-restart daemon if health check fails (optional)

## Files Modified

| File                                                   | Changes                                                                      |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `daemon/routes/system.py`                              | Added `POST /api/daemon/restart` and `POST /api/daemon/stop` endpoints       |
| `packages/ui/src/utils/dashboard.ts`                   | Added `restartDaemon()` and `stopDaemon()` functions                         |
| `packages/ui/src/pages/system-status/SystemStatus.tsx` | Updated handlers to call API functions with confirmations and error handling |

## Deployment Status

✅ Backend endpoints implemented and tested  
✅ Frontend API functions implemented  
✅ Handlers wired to buttons with confirmations  
✅ Docker rebuild completed successfully  
✅ Health check verified (200 OK)  
✅ Ready for end-to-end testing
