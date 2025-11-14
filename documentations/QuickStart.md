# Docker Defense Daemon — Quick Start

Concise runbook for local runs and demos.

## What Changed

- Host-built UI: Build the React app locally; the image copies `packages/ui/build` into `daemon/static`.
- Slim runtime image: Node builder removed. Python 3.12-slim + Trivy only.
- Stable alert IDs: Alerts get a UUID at write-time; new PATCH endpoint for status updates.
- Audit & events logs: `audits.jsonl` and `events.jsonl` alongside `alerts.jsonl`.
- Graceful Docker client: Endpoints still work if `/var/run/docker.sock` isn’t mounted.
- Trivy TTL cache: `TRIVY_CACHE_TTL` controls image scan caching (seconds).
- Compose-first workflow: Falco ships alerts to the daemon automatically.

## Prerequisites

- Docker Desktop (Windows/macOS/Linux) with `docker compose` v2.
- Optional (only if rebuilding UI): Node 18+ and yarn.

## When To Use Which Command

- Use compose (recommended) when you want the full stack (daemon + Falco):
  - `docker compose up -d --build`
- Use single-container backend only for quick UI/API checks (no Falco):
  - `docker build -f daemon/Dockerfile -t docker-defense-daemon:local .`
  - `docker run -p 8080:8080 -v /var/run/docker.sock:/var/run/docker.sock docker-defense-daemon:local`
- After UI changes: rebuild UI first, then rebuild the image:

  - `cd packages/ui; yarn ci` (or `yarn install` if no lockfile)
  - `yarn run build`

  - `cd ../..; docker compose up -d --build`

## DOs and DON’Ts

DO

- Do run `docker compose up -d --build` as the default path.
- Do keep `packages/ui/build` present (build it locally if missing).
- Do mount the Docker socket for richer container insights: `-v /var/run/docker.sock:/var/run/docker.sock`.

DON’T

- Don’t run `docker run` and `docker compose` on port 8080 at the same time.
- Don’t skip the UI build when changing frontend code.
- Don’t delete the `alerts` folder if you want to keep history.

## Commands

Recommended (full stack):

```powershell

# From repo root
docker compose up -d --build

# Stop
docker compose down
```

Backend only (no Falco):

```powershell
# Build image (expects host-built UI in packages/ui/build)
docker build -f daemon/Dockerfile -t docker-defense-daemon:local .

# Run; mounting Docker socket is optional but enables container insights
docker run -p 8080:8080 -v /var/run/docker.sock:/var/run/docker.sock docker-defense-daemon:local
```

Rebuild UI locally (only if needed):

```powershell
cd packages/ui
yarn ci
yarn run build
cd ../..
```

## Verify Quickly

```powershell
# Health
curl http://localhost:8080/health


# Daemon status
curl http://localhost:8080/api/daemon-status

# Recent alerts
curl "http://localhost:8080/api/alerts?limit=10"


# Update alert status (id from list): ack | resolve | open
curl -X PATCH http://localhost:8080/api/alerts/<id> -H "Content-Type: application/json" -d '{"status":"acknowledged"}'
```

## How It Works (now)

- Flask serves the React SPA from `daemon/static` and exposes `/api/*` endpoints.
- Falco sends alerts to `POST /api/falco-alert` (via compose wiring).
- Alerts persist to `alerts.jsonl`; audit actions to `audits.jsonl`; daemon events to `events.jsonl`.
- Docker socket mount enables enrichment and stats; without it, endpoints degrade gracefully.

## Diagram (architecture sketch)

```
+------------------+            HTTP POST            +------------------------+
|      Falco       |  ---------------------------->  |   Daemon (Flask+UI)    |
|  (falcosecurity) |                                |  - Serves React build   |
|  Rules + Events  |                                |  - /api/* endpoints     |
+------------------+                                |                        |
        ^                                          / \                       |
        |                                         /   \ optional             |

        |                                     /var/run/docker.sock           |
        |                                         \   /                      |
        |                                          \ /                       |
        |                                   +----------------+               |
        |                                   | Docker Engine  |               |
        |                                   +----------------+               |
        |                                                                  |
        |                     Persist JSONL (volume)                       |
        +--------------------------------------------------------------->  |
                                       alerts.jsonl / audits.jsonl / events.jsonl
```

## Troubleshooting

- Port busy: Stop existing containers using port 8080 (`docker ps`; `docker stop <id>`), or `docker compose down`.
- No Docker data: Ensure the Docker socket is mounted (`/var/run/docker.sock`) or set `DOCKER_HOST`.
- UI not updating: Rebuild UI (`yarn run build`) then re-run `docker compose up -d --build`.
