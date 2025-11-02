FROM python:3.12-slim
LABEL maintainer="INSE6130" \
      project="Docker Defense Daemon" \
      description="Security daemon monitoring Docker containers for risky configurations" \
      version="1.0"
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN apt-get update && apt-get install -y curl ca-certificates tar && \
    TRIVY_VER=0.55.0 && \
    curl -fsSL "https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VER}/trivy_${TRIVY_VER}_Linux-64bit.tar.gz" \
    | tar -xz -C /usr/local/bin trivy && \
    chmod +x /usr/local/bin/trivy && \
    rm -rf /var/lib/apt/lists/*

COPY . .

# RUN useradd -m daemonuser
# RUN chown -R daemonuser:daemonuser /app
# USER daemonuser 

EXPOSE 8080

CMD [ "python", "app.py" ]