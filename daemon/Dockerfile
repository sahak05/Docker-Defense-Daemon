# Runtime image (expects a prebuilt UI in `packages/ui/build` in the build context)
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
# Copy backend source code
COPY daemon/ .

# Copy prebuilt UI from the repository build output into the Flask static folder.
# Team workflow: run `yarn build` in `packages/ui` (or pull committed build files) so
# this directory exists in the build context. If you prefer the Dockerfile to build
# the UI inside the image, we can restore a multi-stage build later.
COPY packages/ui/build ./static

# Optional non-root setup (commented out for now)
# RUN useradd -m daemonuser
# RUN chown -R daemonuser:daemonuser /app
# USER daemonuser 

EXPOSE 8080

CMD ["python", "app.py"]
