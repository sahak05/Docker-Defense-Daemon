FROM python:3.12-slim
LABEL maintainer="INSE6130" \
      project="Docker Defense Daemon" \
      description="Security daemon monitoring Docker containers for risky configurations" \
      version="1.0"
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# RUN useradd -m daemonuser
# RUN chown -R daemonuser:daemonuser /app

# USER daemonuser

EXPOSE 8080

CMD [ "python", "app.py" ]