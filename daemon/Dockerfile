# Stage 1: Build the UI
FROM node:20-alpine AS ui-builder

# Enable Corepack for Yarn
RUN corepack enable

WORKDIR /build

# Copy package files for dependency installation
COPY packages/ui/package.json ./packages/ui/
COPY yarn.lock ./
COPY packages/ui/tsconfig*.json ./packages/ui/
COPY packages/ui/vite.config.ts ./packages/ui/
COPY packages/ui/tailwind.config.js ./packages/ui/
COPY postcss.config.cjs ./
COPY packages/ui/index.html ./packages/ui/

# Install dependencies
WORKDIR /build/packages/ui
RUN yarn install --frozen-lockfile

# Copy UI source code
COPY packages/ui/src ./src
COPY packages/ui/public ./public

# Build the UI
RUN yarn build

# Stage 2: Python backend with built UI
FROM python:3.12-slim

LABEL maintainer="INSE6130" \
    project="Docker Defense Daemon" \
    description="Security daemon monitoring Docker containers for risky configurations" \
    version="1.0"

WORKDIR /app

# Copy and install Python dependencies
COPY daemon/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Trivy (security scanner)
RUN apt-get update && apt-get install -y curl ca-certificates tar && \
    TRIVY_VER=0.55.0 && \
    curl -fsSL "https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VER}/trivy_${TRIVY_VER}_Linux-64bit.tar.gz" \
    | tar -xz -C /usr/local/bin trivy && \
    chmod +x /usr/local/bin/trivy && \
    rm -rf /var/lib/apt/lists/*

# Copy backend source code
COPY daemon/ .

# Copy built UI from the first stage
COPY --from=ui-builder /build/packages/ui/build ./static

# Optional non-root setup (commented out for now)
# RUN useradd -m daemonuser
# RUN chown -R daemonuser:daemonuser /app
# USER daemonuser 

EXPOSE 8080

CMD ["python", "app.py"]
