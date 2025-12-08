# Deployment Guide

## Systemd Deployment

### Backend
```
[Unit]
Description=DevCell Backend
After=network.target

[Service]
WorkingDirectory=/opt/devcell/backend
ExecStart=/opt/devcell/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

### Frontend
Serve using nginx:
```
/var/www/devcell-frontend/
```

## Docker Compose (Optional)
Define backend, frontend, LLM in one stack.

