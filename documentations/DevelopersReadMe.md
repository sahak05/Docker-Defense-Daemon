# Docker Defense Daemon

A lightweight container security monitoring system that detects risky configurations, scans images for vulnerabilities, and monitors runtime behavior.

## 🎯 Project Overview

This security daemon provides:

- **Real-time Docker event monitoring** - Tracks container lifecycle events
- **Configuration risk detection** - Identifies privileged containers, dangerous mounts, and risky capabilities
- **Image vulnerability scanning** - Integrates Trivy for CVE detection
- **Runtime behavior monitoring** - Uses Falco to detect suspicious container activities
- **Web-based dashboard** - React UI for visualizing alerts and managing policies

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│   Runtime Image (Python only)       │
│                                     │
│  Build UI on host (Vite)            │
│  - npm ci && npm run build          │
│  - Output: packages/ui/build        │
│                                     │
│  Image copies UI → ./static         │
│  Flask serves UI + API              │
└─────────────────┬───────────────────┘
                  │ Port 8080
         ┌────────▼────────┐
         │  Defense Daemon │ (Flask Backend + React UI)
         │  - Static Files │ (React SPA)
         │  - Event Loop   │
         │  - Risk Engine  │
         │  - Trivy Scan   │
         └────────┬────────┘
                  │
    ┌─────────────┼─────────────────┐
    │             │                 │
┌───▼────┐ ┌─────▼────┐   ┌────────▼─────┐
│ Docker │ │  Falco   │   │  /alerts/    │
│ Events │ │ Runtime  │   │ (Storage)    │
└────────┘ └──────────┘   └──────────────┘
```

## 📋 Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine 20.10+ (Linux)
- Docker Compose v2.0+
- Node.js 18+ & npm (only for UI rebuilds)
- **Note:** Falco works best on Linux. Windows/Mac users may experience limited Falco functionality

### Installation Links

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac)
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Yarn](https://classic.yarnpkg.com/en/docs/install) - After Node.js: `npm install -g yarn`

## 🚀 Quick Start

See also: `./QuickStart.md` for concise commands and guidance.

### Compose (Recommended)

```powershell
# Build and start all services (uses host-built UI)
docker compose up -d --build

# View logs in real-time
docker compose logs -f

# Stop all services
docker compose down
```

Access the app at `http://localhost:8080`.

If you changed the UI, rebuild locally first:

```powershell
cd packages/ui
npm ci
npm run build
cd ../..
```

### Development Mode (UI Hot Reload)

For UI development with instant hot reload:

```powershell
# Terminal 1: Start backend services
docker compose up -d

# Terminal 2: Start UI dev server
cd packages/ui
npm install  # First time only (or npm ci if lockfile exists)
npm run dev
```

The dev UI will be available at `http://localhost:5173` with hot reload enabled.

**Note:** In dev mode, the UI dev server proxies API calls to the Flask backend at `http://localhost:8080`.

## 🧪 Testing the System

### Test 1: Basic Falco Detection

Falco triggers an alert when a shell is spawned in a container:

```bash
docker run --rm -it alpine sh
```

**Expected:** Check daemon logs for Falco alert JSON

```bash
docker compose logs -f daemon-defense
```

### Test 2: Multiple Risk Flags

Launch a container with maximum security risks:

```bash
docker run -d \
  --name test_all_risks \
  --privileged \
  --user 0 \
  --cap-add=SYS_ADMIN \
  --cap-add=SYS_PTRACE \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /:/hostroot:ro \
  -v /etc:/etc_host:ro \
  alpine sleep 3600
```

**Expected:** Daemon should detect:

- ✅ Privileged flag
- ✅ Docker socket mount
- ✅ Host filesystem mount
- ✅ Root user
- ✅ Dangerous capabilities

View detected risks in the UI or logs:

```bash
docker compose logs daemon-defense | grep -i "risk\|alert"
```

### Test 3: Quick Privileged Container Test

```bash
docker run -it --rm --privileged -v /:/hostroot:ro alpine sh
# Type 'exit' to close
```

### Cleanup Test Containers

```bash
docker rm -f test_all_risks
```

## 📁 Project Structure

```
docker-defense-daemon/
├── daemon/              # Flask backend + Docker SDK
│   ├── app.py          # Main daemon logic (serves UI + API)
│   ├── Dockerfile      # Runtime-only image (Python + Trivy)
│   ├── requirements.txt
│   ├── routes/         # API blueprints
│   └── static/         # Built UI assets (copied from host)
├── packages/ui/         # React frontend (Vite + React)
│   ├── src/            # React components, pages, hooks
│   ├── package.json
│   ├── vite.config.ts
│   └── build/          # Build output (not in repo)
├── falco_rules/        # Falco custom rules
│   └── custom.rules
├── alerts/             # Persistent alert storage (JSONL)
│   ├── alerts.jsonl
│   └── approvals.jsonl
├── docker-compose.yml  # Multi-container orchestration
├── postcss.config.cjs  # PostCSS/Tailwind config
└── documentations/     # Project documentation
```

## 🔧 Development Workflow

### Full Stack Rebuild (Production Mode)

```bash
# Rebuild everything (backend + UI)
docker compose up -d --build

# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f daemon-defense
docker compose logs -f falco
```

### Backend Development

```bash
# Restart daemon after Python code changes
docker compose restart daemon-defense

# Rebuild only daemon (if Dockerfile changed)
docker compose up -d --build daemon-defense

# View daemon logs
docker compose logs -f daemon-defense
```

### Frontend Development (Hot Reload)

For rapid UI development without rebuilding Docker:

```bash
# Start backend in Docker
docker compose up -d

# Start UI dev server (from project root)
cd packages/ui
yarn install  # First time only
yarn dev      # Runs on http://localhost:5173
```

**Dev server features:**

- ⚡ Instant hot module replacement (HMR)
- 🔄 API proxy to `http://localhost:8080`
- 🐛 Better error messages and stack traces

### UI Production Build (Standalone)

```powershell
# Build UI locally (required before image copy)
cd packages/ui
npm ci
npm run build

# Preview production build (optional)
npm run preview
```

### Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f falco
docker compose logs -f daemon-defense
```

## ⚙️ Configuration

### Policy Configuration (Coming in Week 3)

The daemon will support YAML-based policies:

```yaml
# Example policy.yaml
severity_threshold: 7
auto_stop_enabled: true
rules:
  privileged_flag: 5
  docker_socket_mount: 4
  host_mount: 3
```

### Falco Rules

Custom rules are defined in `falco/falco_rules.yaml`. Refer to [Falco documentation](https://falco.org/docs/) for rule syntax.

## 🛠️ API Endpoints (updated)

### Alert Management

| Endpoint                       | Method | Description                            |
| ------------------------------ | ------ | -------------------------------------- |
| `/api/alerts`                  | GET    | Fetch all security alerts              |
| `/api/alerts/<id>/acknowledge` | POST   | Acknowledge an alert                   |
| `/api/alerts/<id>/resolve`     | POST   | Resolve an alert                       |
| `/api/alerts/<id>`             | PATCH  | Set status: acknowledged/resolved/open |
| `/api/falco-alert`             | POST   | Receive alerts from Falco              |

### Container Management

| Endpoint                       | Method | Description                      |
| ------------------------------ | ------ | -------------------------------- |
| `/api/containers`              | GET    | List all monitored containers    |
| `/api/containers/images/list`  | GET    | List container images            |
| `/api/containers/<id>/stop`    | POST   | Stop a container                 |
| `/api/containers/<id>/inspect` | GET    | Get container inspection details |

### Image Approvals

| Endpoint                         | Method | Description               |
| -------------------------------- | ------ | ------------------------- |
| `/api/alerts/approve/<imageKey>` | POST   | Approve a container image |
| `/api/alerts/deny/<imageKey>`    | POST   | Deny a container image    |

### System Status

| Endpoint              | Method | Description                   |
| --------------------- | ------ | ----------------------------- |
| `/api/system-status`  | GET    | Get system health and metrics |
| `/api/daemon/restart` | POST   | Restart the daemon            |
| `/api/daemon/stop`    | POST   | Stop the daemon               |

### Events

| Endpoint      | Method | Description     |
| ------------- | ------ | --------------- |
| `/api/events` | GET    | Fetch event log |

### Static UI (Production)

| Endpoint  | Method | Description                     |
| --------- | ------ | ------------------------------- |
| `/`       | GET    | Serve React app (index.html)    |
| `/<path>` | GET    | Serve static assets or fallback |

## 📚 Resources

- [Docker Networking Explained](https://www.youtube.com/watch?v=bKFMS5C4CG0)
- [Docker Compose Getting Started](https://docs.docker.com/compose/gettingstarted/)
- [Trivy Documentation](https://github.com/aquasecurity/trivy)
- [Falco Setup Guide](https://falco.org/docs/setup/container/)
- [Docker SDK for Python](https://docker-py.readthedocs.io/en/stable/)
- [Flask Tutorial](https://www.geeksforgeeks.org/python/flask-tutorial/)
- [React + Vite](https://vitejs.dev/guide/)

## 🤝 Team Assignments

**Group 2: Security Implementation**

- **Abdoul** - Daemon & Docker integration, REST API, Trivy hooks
- **Gureet** - Falco integration, runtime detection, alert correlation
- **Ishaq** - React UI, policy editor, auto-remediation logic

## 📅 Sprint Timeline

- **Week 1** - Environment setup + event monitoring
- **Week 2** - Risk detection + Trivy/Falco integration
- **Week 3** - Policy engine + auto-remediation
- **Week 4** - Testing, documentation, and demo preparation

## 🐛 Troubleshooting

### Daemon can't connect to Docker

```bash
# Ensure Docker socket is mounted
docker compose down
docker compose up -d
```

### Falco not starting

```bash
# Check kernel compatibility
docker compose logs falco

# Falco requires kernel headers on the host
```

### UI not loading (404 errors)

```bash
# Rebuild with UI build included
docker compose down
docker compose up -d --build

# Check if static folder exists in container
docker exec docker-defense-daemon-daemon-defense-1 ls -la /app/static
```

### UI build fails during Docker build

**Common issues:**

- **TypeScript errors:** Check `docker compose logs` for TS compilation errors
- **Missing dependencies:** Ensure `yarn.lock` is up to date
- **Out of memory:** Increase Docker memory allocation in Docker Desktop settings

```bash
# See full build output
docker compose up --build

# Check build logs
docker compose logs daemon-defense
```

### UI can't reach backend API

**In production mode (port 8080):**

- UI and API are on the same origin, no CORS issues
- Check that daemon container is healthy: `docker compose ps`

**In development mode (UI on 5173, backend on 8080):**

- Ensure CORS is configured in Flask (`flask_cors` installed)
- Verify proxy settings in `packages/ui/vite.config.ts`
- Check backend is accessible: `curl http://localhost:8080/api/alerts`

### Changes not reflecting after rebuild

```bash
# Clear Docker cache and rebuild from scratch
docker compose down
docker system prune -f
docker compose up -d --build
```

## 📝 License
