# Docker Defense Daemon - Complete Setup Guide

This guide walks you through setting up the Docker Defense Daemon project on **Windows**, **macOS**, and **Linux**.

**Choose your operating system:**

- [Windows Setup](#-windows-setup)
- [macOS Setup](#-macos-setup)
- [Linux Setup](#-linux-setup)
- [Common Steps (All Platforms)](#-common-steps-all-platforms)

---

## 🪟 Windows Setup

### Prerequisites Overview

Before running the project, you need:

1. **Docker Desktop** - To run containers
2. **Node.js** - JavaScript runtime for the UI
3. **Yarn** - Package manager for dependencies

---

### Step 1: Install Docker Desktop for Windows

#### 1.1 Download Docker Desktop

1. Go to: <https://www.docker.com/products/docker-desktop/>
2. Click **"Download for Windows"**
3. Save the installer file (`Docker Desktop Installer.exe`)

#### 1.2 Install Docker Desktop

1. **Run the installer** (`Docker Desktop Installer.exe`)
2. **Important:** During installation, ensure **"Use WSL 2 instead of Hyper-V"** is checked (recommended)
   - WSL 2 provides better performance and compatibility
3. Click **"Ok"** to proceed with installation
4. **Restart your computer** when prompted

#### 1.3 Start Docker Desktop

1. Open **Docker Desktop** from the Start Menu
2. Wait for it to fully start (this may take 1-2 minutes)
   - You'll see a **whale icon** 🐋 in your system tray when ready
   - The icon will stop animating when Docker is ready
3. You might need to:
   - Accept the Docker Subscription Service Agreement
   - Sign in to Docker Hub (you can skip this)

#### 1.4 Verify Docker Installation

Open **PowerShell** (or VS Code terminal) and run:

```powershell
docker --version
docker compose version
```

**Expected output:**

```
Docker version 24.x.x, build xxxxxxx
Docker Compose version v2.x.x
```

#### 1.5 Troubleshooting Docker (Windows)

<details>
<summary><b>❌ "WSL 2 installation is incomplete" error</b></summary>

Run this in **PowerShell as Administrator**:

```powershell
wsl --install
```

Then restart your computer.

Verify WSL is installed:

```powershell
wsl --version
```

</details>

<details>
<summary><b>❌ "Docker command not found" after installation</b></summary>

1. **Restart your terminal** (close and reopen VS Code/PowerShell)
2. **Restart your computer**
3. **Verify Docker Desktop is running** - check for whale icon in system tray
4. **Check PATH environment variable:**
   - Search "Environment Variables" in Windows Start Menu
   - Check if `C:\Program Files\Docker\Docker\resources\bin` is in PATH

</details>

<details>
<summary><b>❌ Docker Desktop won't start</b></summary>

1. Ensure **Virtualization is enabled** in BIOS:
   - Restart PC → Enter BIOS → Enable Intel VT-x or AMD-V
2. Update Windows to latest version
3. Try uninstalling and reinstalling Docker Desktop

</details>

---

### Step 2: Install Node.js (Windows)

#### 2.1 Download Node.js

1. Go to: <https://nodejs.org/>
2. Download the **LTS (Long Term Support)** version
3. Run the installer (`.msi` file)

#### 2.2 Install Node.js

1. Follow the installation wizard
2. **Important:** Keep the option **"Automatically install necessary tools"** checked
3. Complete installation and **restart your terminal**

#### 2.3 Verify Node.js Installation

```powershell
node --version
npm --version
```

---

### Step 3: Install Yarn (Windows)

```powershell
npm install -g yarn
yarn --version
```

#### Troubleshooting Yarn (Windows)

<details>
<summary><b>❌ "yarn : cannot be loaded because running scripts is disabled"</b></summary>

Run this in **PowerShell as Administrator**:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

</details>

**[Continue to Common Steps](#-common-steps-all-platforms)**

---

## 🍎 macOS Setup

### Prerequisites Overview

Before running the project, you need:

1. **Docker Desktop** - To run containers
2. **Homebrew** - macOS package manager (recommended)
3. **Node.js** - JavaScript runtime for the UI
4. **Yarn** - Package manager for dependencies

---

### Step 1: Install Docker Desktop for macOS

#### 1.1 Download Docker Desktop

1. Go to: <https://www.docker.com/products/docker-desktop/>
2. Choose your Mac chip:
   - **Apple Silicon (M1/M2/M3)** - Download "Mac with Apple chip"
   - **Intel** - Download "Mac with Intel chip"
3. Download the `.dmg` file

#### 1.2 Install Docker Desktop

1. Open the downloaded `.dmg` file
2. Drag **Docker.app** to your **Applications** folder
3. Open **Docker** from Applications
4. Grant necessary permissions when prompted
5. Wait for Docker to start (whale icon will appear in menu bar)

#### 1.3 Verify Docker Installation

Open **Terminal** and run:

```bash
docker --version
docker compose version
```

**Expected output:**

```
Docker version 24.x.x, build xxxxxxx
Docker Compose version v2.x.x
```

#### 1.4 Troubleshooting Docker (macOS)

<details>
<summary><b>❌ "Docker command not found"</b></summary>

1. Ensure Docker Desktop is running (check menu bar for whale icon)
2. Restart Terminal
3. If still not working, add to PATH:

   ```bash
   echo 'export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

</details>

---

### Step 2: Install Homebrew (macOS - Recommended)

Homebrew makes installing Node.js easier.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the on-screen instructions. After installation:

```bash
brew --version
```

---

### Step 3: Install Node.js (macOS)

#### Option A: Using Homebrew (Recommended)

```bash
brew install node
```

#### Option B: Using Official Installer

1. Go to: <https://nodejs.org/>
2. Download the **LTS version** for macOS
3. Run the installer package

#### Verify Installation

```bash
node --version
npm --version
```

---

### Step 4: Install Yarn (macOS)

```bash
# Using Homebrew
brew install yarn

# Or using npm
npm install -g yarn

# Verify
yarn --version
```

**[Continue to Common Steps](#-common-steps-all-platforms)**

---

## 🐧 Linux Setup

### Prerequisites Overview

Before running the project, you need:

1. **Docker Engine & Docker Compose** - To run containers
2. **Node.js** - JavaScript runtime for the UI
3. **Yarn** - Package manager for dependencies

---

### Step 1: Install Docker Engine (Linux)

#### For Ubuntu/Debian

```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker
```

#### For Fedora/RHEL

```bash
# Install Docker
sudo dnf install -y docker docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker
```

#### For Arch Linux

```bash
# Install Docker
sudo pacman -S docker docker-compose

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker
```

#### Add Your User to Docker Group (Important!)

```bash
# Add yourself to docker group (avoid using sudo for docker commands)
sudo usermod -aG docker $USER

# Log out and log back in for this to take effect
# Or run: newgrp docker
```

#### Verify Docker Installation

```bash
docker --version
docker compose version
```

**Expected output:**

```
Docker version 24.x.x, build xxxxxxx
Docker Compose version v2.x.x
```

#### Troubleshooting Docker (Linux)

<details>
<summary><b>❌ "Permission denied" when running docker commands</b></summary>

You need to add yourself to the docker group:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

Or logout and login again.

</details>

<details>
<summary><b>❌ Docker daemon not running</b></summary>

```bash
# Start Docker
sudo systemctl start docker

# Check status
sudo systemctl status docker
```

</details>

---

### Step 2: Install Node.js (Linux)

#### For Ubuntu/Debian

```bash
# Using NodeSource repository (recommended)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

#### For Fedora/RHEL

```bash
# Using NodeSource
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo dnf install -y nodejs

# Verify
node --version
npm --version
```

#### For Arch Linux

```bash
sudo pacman -S nodejs npm
```

---

### Step 3: Install Yarn (Linux)

```bash
# Install Yarn globally
sudo npm install -g yarn

# Verify
yarn --version
```

**[Continue to Common Steps](#-common-steps-all-platforms)**

---

## 🚀 Common Steps (All Platforms)

Once you have Docker, Node.js, and Yarn installed, follow these steps regardless of your operating system.

### Step 1: Navigate to Project Directory

<details>
<summary><b>Windows (PowerShell)</b></summary>

```powershell
cd C:\Users\OMOTOSHO\Desktop\myJourney\Docker-Defense-Daemon
```

</details>

<details>
<summary><b>macOS/Linux (Terminal)</b></summary>

```bash
cd ~/path/to/Docker-Defense-Daemon
```

</details>

**Important:** Make sure you're in the **project root** (where `docker-compose.yml` is located), NOT in the `daemon/` folder.

### Step 2: Verify Project Structure

```bash
ls docker-compose.yml
```

You should see the file listed. If not, you're in the wrong directory.

### Step 3: Install Node.js Dependencies

```bash
yarn install
```

This will install all dependencies for the React UI. It may take 1-2 minutes.

**Expected output:**

```
[1/4] Resolving packages...
[2/4] Fetching packages...
[3/4] Linking dependencies...
[4/4] Building fresh packages...
✨ Done in X.XXs
```

---

## ▶️ Running the Project

### Step 1: Start Backend Services (Docker Containers)

Make sure Docker is running (Windows: whale icon in system tray, macOS: whale in menu bar, Linux: `sudo systemctl status docker`).

**All Platforms:**

```bash
docker compose up -d
```

**Expected output:**

```
[+] Running 3/3
 ✔ Network docker-defense-daemon_default    Created
 ✔ Container falco                          Started
 ✔ Container daemon-defense                 Started
```

### Step 2: Verify Containers Are Running

```bash
docker compose ps
```

**Expected output:**

```
NAME              IMAGE                  STATUS
daemon-defense    daemon-defense:latest  Up 10 seconds
falco             falcosecurity/falco    Up 10 seconds
```

### Step 3: Start React UI (Development Server)

```bash
yarn dev:ui
```

**Expected output:**

```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 4: Access the Application

Open your web browser and go to:

```
http://localhost:5173
```

You should see the Docker Defense Daemon UI! 🎉

---

## 🧪 Testing the System

### Test 1: View Container Logs

```bash
docker compose logs -f daemon-defense
```

Press `Ctrl + C` to stop viewing logs.

### Test 2: Trigger a Security Alert

Run a simple container that spawns a shell (Falco will detect this):

```bash
docker run --rm -it alpine sh
# Type 'exit' to close
```

**Check the daemon logs** - you should see a Falco alert!

### Test 3: Test High-Risk Container

<details>
<summary><b>Windows (PowerShell)</b></summary>

```powershell
docker run -d `
  --name test_all_risks `
  --privileged `
  --user 0 `
  --cap-add=SYS_ADMIN `
  --cap-add=SYS_PTRACE `
  -v /var/run/docker.sock:/var/run/docker.sock `
  -v /:/hostroot:ro `
  alpine sleep 3600
```

</details>

<details>
<summary><b>macOS/Linux (Bash)</b></summary>

```bash
docker run -d \
  --name test_all_risks \
  --privileged \
  --user 0 \
  --cap-add=SYS_ADMIN \
  --cap-add=SYS_PTRACE \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /:/hostroot:ro \
  alpine sleep 3600
```

</details>

**Check the UI** - you should see alerts for:

- ✅ Privileged container
- ✅ Docker socket mount
- ✅ Host filesystem access
- ✅ Root user
- ✅ Dangerous capabilities

### Clean Up Test Container

```bash
docker rm -f test_all_risks
```

---

## 🛑 Stopping the Project

### Stop the React UI

In the terminal running `yarn dev:ui`, press: `Ctrl + C`

### Stop Docker Containers

```bash
docker compose down
```

---

## 🔄 Daily Development Workflow

Once everything is installed, this is your daily workflow:

```bash
# 1. Navigate to project
cd /path/to/Docker-Defense-Daemon

# 2. Start Docker containers
docker compose up -d

# 3. Start React dev server
yarn dev:ui

# 4. Open browser to http://localhost:5173
```

### Stopping Work

```bash
# 1. Stop React (Ctrl + C in the terminal running it)

# 2. Stop Docker containers
docker compose down
```

---

## 🐛 Common Issues (All Platforms)

### Issue: "Docker command not recognized"

**Solution:**

1. Ensure Docker is installed and running
2. Restart your terminal
3. Check Docker is in PATH

### Issue: "Cannot connect to Docker daemon"

**Solution:**

1. **Windows/Mac:** Ensure Docker Desktop is running
2. **Linux:** Run `sudo systemctl start docker`

### Issue: Port 5173 already in use

<details>
<summary><b>Windows (PowerShell)</b></summary>

```powershell
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

</details>

<details>
<summary><b>macOS/Linux</b></summary>

```bash
lsof -i :5173
kill -9 <PID>
```

</details>

### Issue: Falco container not working properly

**Note:** Falco has limited functionality on Windows/Mac due to kernel differences. This is expected and won't prevent you from completing the project.

---

## ✅ Setup Checklist

Before working on the project, ensure:

- [ ] Docker installed and running
- [ ] Node.js installed (`node --version` works)
- [ ] Yarn installed (`yarn --version` works)
- [ ] In correct directory (project root with `docker-compose.yml`)
- [ ] Dependencies installed (`yarn install` completed)
- [ ] Backend running (`docker compose ps` shows containers)
- [ ] UI running (`yarn dev:ui` and browser shows UI)

---

## 📞 Getting Help

If you're stuck:

1. **Check Docker is running** - This is the #1 issue
2. **Restart everything:**

   ```bash
   docker compose down
   docker compose up -d
   yarn dev:ui
   ```

3. **Ask your team members** (Abdoul, Gureet)
4. **Check the main README.md** for more technical details

---

## 🎯 Next Steps

Now that your environment is set up, you can:

1. **Explore the UI code** in `packages/ui/src/`
2. **Start building React components** for the security dashboard
3. **Test the backend APIs** using the browser console or Postman
4. **Read the project documentation** in the main README.md
