# Containers Endpoint Implementation

## What Was Done

### Backend (`daemon/app.py`)

- Added `/api/containers/list` endpoint
- Returns real running containers with live stats (CPU, memory, uptime)
- Optional `include_all` query param for stopped containers

### Frontend

- Created `useContainersData` hook for data fetching & auto-refresh
- Updated `ContainersPage.tsx` to use real data
- Added loading & error states

## Files Changed

```
✅ daemon/app.py              (~70 lines added)
✅ src/hooks/useContainersData.ts     (new, ~55 lines)
✅ src/pages/containers/ContainersPage.tsx    (updated for real data)
```

## Architecture

```
┌─────────────────────┐
│  /api/containers/list
│  (Backend Endpoint)
│  - Live CPU/memory stats
│  - Container metadata
└──────────┬──────────┘
           │ fetch every 5s
┌──────────▼──────────────┐
│ useContainersData Hook
│ - Auto-refresh
│ - Error handling
│ - Loading state
└──────────┬──────────────┘
           │
┌──────────▼────────────────┐
│ ContainersPage Component
│ - Display data
│ - Search/filter
│ - Stats calculations
└───────────────────────────┘
```

## Quick Test

1. Backend running: `docker compose up -d`
2. Open Containers page
3. Should see running containers with real stats
4. Data refreshes every 5 seconds

## Configuration

**Auto-refresh rate:** `useContainersData(5000)` in ContainersPage.tsx

- Change 5000 to adjust interval (ms)

**Include stopped:** `?include_all=true` query param
