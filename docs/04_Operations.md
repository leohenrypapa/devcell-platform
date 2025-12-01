# 04_Operations – DevCell Platform

## Purpose
This guide covers **deployment**, **server operations**, **system maintenance**, **monitoring**, and **backup strategies** for running the DevCell Platform in production or semi-production environments (local server, VM, on-prem lab machine).

It is designed to help both administrators and developers maintain a stable, reliable instance.

---

# 1. Supported Deployment Environments

DevCell is intentionally lightweight and runs on:

- Local Linux server (recommended)
- Ubuntu VM
- Raspberry Pi 4/5 (with swap + cooling)
- On-prem bare metal
- Windows (WSL2)

For production use, Linux (Ubuntu 22+) is strongly recommended.

---

# 2. Backend Deployment (FastAPI)

## 2.1 Install System Packages
```bash
sudo apt update
sudo apt install python3 python3-venv python3-pip -y
```

## 2.2 Create App Directory
```bash
sudo mkdir -p /opt/devcell/backend
sudo chown $USER:$USER /opt/devcell -R
```

## 2.3 Install App
```bash
cd /opt/devcell/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 2.4 Environment Variables
Create:
```
/opt/devcell/backend/.env
```

Example:
```
JWT_SECRET=your_secret
JWT_ALGORITHM=HS256
LLM_ENDPOINT=http://localhost:8001/api/v1/query
KNOWLEDGEBASE_DIR=/opt/devcell/Knowledgebase
```

---

# 3. Running Backend via systemd (Recommended)

Create service:
```
sudo nano /etc/systemd/system/devcell-backend.service
```

Paste:
```
[Unit]
Description=DevCell Backend Service
After=network.target

[Service]
User=llm
WorkingDirectory=/opt/devcell/backend
ExecStart=/opt/devcell/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 9000
Restart=always

[Install]
WantedBy=multi-user.target
```

Apply:
```bash
sudo systemctl daemon-reload
sudo systemctl enable devcell-backend
sudo systemctl start devcell-backend
```

Check:
```bash
systemctl status devcell-backend
```

---

# 4. Frontend Deployment (Vite Build)

## 4.1 Build Frontend
```bash
cd frontend
npm install
npm run build
```

Output is generated in:
```
frontend/dist/
```

## 4.2 Serve With NGINX
Install NGINX:
```bash
sudo apt install nginx -y
```

Replace default site:
```
sudo nano /etc/nginx/sites-available/devcell.conf
```

Config:
```
server {
    listen 80;
    server_name _;

    root /opt/devcell/frontend/dist;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:9000/;
    }

    location / {
        try_files $uri /index.html;
    }
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/devcell.conf /etc/nginx/sites-enabled/devcell.conf
sudo systemctl restart nginx
```

---

# 5. Logging & Monitoring

### Journalctl (backend)
```bash
journalctl -u devcell-backend -f
```

### NGINX logs
```
/var/log/nginx/access.log
/var/log/nginx/error.log
```

### RAG logs
Found in:
```
backend/logs/rag.log    # or wherever configured
```

---

# 6. Knowledgebase Storage

Default:
```
backend/Knowledgebase/
```

For production:
```
/opt/devcell/Knowledgebase/
```

Ensure:
```bash
sudo chown -R devcell:devcell /opt/devcell/Knowledgebase/
```

---

# 7. Backups

### SQLite backup:
```bash
cp backend/app/db/devcell.db devcell_backup_$(date +%F).db
```

### Knowledgebase backup:
```bash
rsync -av /opt/devcell/Knowledgebase/ backups/knowledgebase/
```

Schedule via cron:
```bash
crontab -e
```

---

# 8. Updates & Migrations

### Pull new code:
```bash
git pull
```

### Reinstall deps (if changed):
```bash
pip install -r requirements.txt
npm install
```

### Restart services:
```bash
systemctl restart devcell-backend
systemctl restart nginx
```

### Database migrations
Since SQLite → drop columns manually if needed  
Document changes in `CHANGELOG.md`

---

# 9. Security Checklist

- Use strong JWT secret
- Enable HTTPS (reverse proxy with Certbot)
- Limit server login to SSH keys only
- Regular log review (`journalctl`)
- Keep OS packages updated

---

# 10. Performance Tuning

### SQLite
- Place DB on SSD
- Vacuum occasionally:
```bash
sqlite3 devcell.db "VACUUM;"
```

### FastAPI
Use async endpoints only when necessary  
Improve concurrency with:
```bash
uvicorn --workers 4
```

### NGINX
Enable gzip:
```
gzip on;
```

---

# 11. Disaster Recovery

If backend crashes:
```bash
systemctl restart devcell-backend
```

If frontend breaks:
```bash
npm run build
systemctl restart nginx
```

If DB corrupts:
- Use `.db` backups
- Verify file permissions

If RAG index corrupts:
- Delete Chroma directory → re-index knowledge docs

---

# 12. Maintenance Schedule

### Daily
- Check service health
- Quick scan of logs  
- Ensure disk space > 10%

### Weekly
- Backup DB  
- Check NGINX errors  
- Update dependency lockfiles  

### Monthly
- OS updates  
- Review global configs  
- Vacuum database  

---

# 13. Related Documents
- `01_Getting_Started.md`
- `02_Architecture.md`
- `03_Developer_Guide.md`