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
┌─────────────────┐
│   React UI      │ (Port 3000 in dev, served by Flask in prod)
│   (Vite/React)  │
└────────┬────────┘
         │ HTTP/REST
┌────────▼────────┐
│  Defense Daemon │ (Flask Backend)
│  - Event Loop   │
│  - Risk Engine  │
│  - Trivy Scan   │
└────────┬────────┘
         │
    ┌────┴─────┬─────────────────┐
    │          │                 │
┌───▼────┐ ┌──▼─────┐   ┌──────▼─────┐
│ Docker │ │ Falco  │   │  /alerts/  │
│ Events │ │ Runtime│   │ (Storage)  │
└────────┘ └────────┘   └────────────┘
```

## 📋 Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine 20.10+ (Linux)
- Docker Compose v2.0+
- Node.js 18+ & Yarn (for UI development)
- **Note:** Falco works best on Linux. Windows/Mac users may experience limited Falco functionality

### Installation Links

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac)
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Yarn](https://classic.yarnpkg.com/en/docs/install) - After Node.js: `npm install -g yarn`

## 🚀 Quick Start

### 1. Start the Security Stack

```bash
# Start all services (daemon + Falco)
docker compose up -d

# View logs in real-time
docker compose logs -f

# Stop all services
docker compose down
```

### 2. Run the React UI (Development)

```bash
# Install dependencies (first time only)
yarn install

# Start the development server
yarn dev:ui
```

The UI will be available at `http://localhost:3000`

### 3. Build UI for Production

```bash
# Build optimized React bundle
yarn build:ui

# Preview production build
yarn start:ui
```

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
│   ├── app.py          # Main daemon logic
│   ├── Dockerfile      # Daemon container image
│   └── requirements.txt
├── packages/ui/         # React frontend (Yarn workspace)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── falco/              # Falco configuration
│   └── falco_rules.yaml
├── alerts/             # Persistent alert storage
├── docker-compose.yml  # Multi-container orchestration
└── README.md
```

## 🔧 Development Workflow

### Backend (Daemon)

```bash
# View daemon logs
docker compose logs -f daemon-defense

# Restart daemon after code changes
docker compose restart daemon-defense

# Rebuild daemon image
docker compose up -d --build daemon-defense
```

### Frontend (React UI)

```bash
# Hot reload development
yarn dev:ui

# Lint code
yarn workspace ui lint

# Build production bundle
yarn build:ui
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

## 🛠️ API Endpoints

| Endpoint           | Method | Description               |
| ------------------ | ------ | ------------------------- |
| `/api/alerts`      | GET    | Fetch all security alerts |
| `/api/falco-alert` | POST   | Receive alerts from Falco |
| `/api/containers`  | GET    | List monitored containers |
| `/api/stop/<id>`   | POST   | Stop a risky container    |

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

### UI can't reach backend

- Ensure CORS is configured in Flask
- Check that backend is running on expected port
- Verify proxy settings in `vite.config.ts`

## 📝 License
