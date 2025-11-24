# DevCell Platform – Deployment

## 1. Overview

The DevCell Platform is designed to be easy to run locally and to deploy on a server using Docker. This document covers:

- Local development
- Docker-based deployment
- Environment variables
- Basic production hardening ideas

---

## 2. Local Development

### 2.1 Prerequisites

- Python 3.10+
- Node.js (recent LTS, e.g., 20+)
- npm
- SQLite (usually included with Python / OS)

### 2.2 Backend (FastAPI)

From repo root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 9000
```

This starts the API at `http://localhost:9000`.

### 2.3 Frontend (React + Vite)

From repo root:

```bash
cd frontend
npm install

# For local dev
npm run dev
```

By default Vite runs on port 5173, so the app will be at `http://localhost:5173`.

Make sure the frontend knows where the backend is via `VITE_BACKEND_BASE_URL` (see next section).

---

## 3. Environment Variables

### 3.1 Frontend

Frontend uses Vite env variables prefixed with `VITE_`.

- `VITE_BACKEND_BASE_URL`
  - URL of the backend API.
  - Example (local): `http://localhost:9000`
  - Example (Docker): `http://backend:9000` (inside container)

You can set this in `frontend/.env` for local dev:

```env
VITE_BACKEND_BASE_URL=http://localhost:9000
```

### 3.2 Backend

Typical backend env variables (names may vary by implementation):

- `LLM_BASE_URL`
  - Base URL for your LLM server (e.g., `http://localhost:8000`).
- `LLM_API_KEY` (if required)
  - API key for cloud or proxied models.
- `LLM_MODEL_NAME`
  - Model identifier used in API calls.
- `RAG_DATA_DIR` (if used)
  - Directory path for stored knowledge / embeddings.
- `DEV_CELL_ENV`
  - Optional string to distinguish environments (`dev`, `test`, `prod`).

These are usually set via the shell, systemd, or Docker `environment` entries.

---

## 4. Docker Deployment

### 4.1 Dockerfiles

There are two Dockerfiles:

- `backend/Dockerfile`
  - Python 3.10-slim base
  - Installs requirements
  - Runs `uvicorn app.main:app --host 0.0.0.0 --port 9000`
  - Exposes port 9000

- `frontend/Dockerfile`
  - Stage 1: Node image builds the React app (`npm run build`)
  - Stage 2: nginx serves the static files from `/usr/share/nginx/html`
  - Sets `VITE_BACKEND_BASE_URL=http://backend:9000` during build
  - Exposes port 80 inside container

### 4.2 docker-compose.yml

Example `docker-compose.yml` at repo root:

```yaml
version: "3.9"

services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: devcell-backend
    restart: unless-stopped
    ports:
      - "9000:9000"
    environment:
      - PYTHONUNBUFFERED=1
      # - LLM_BASE_URL=http://your-llm-server:8000
      # - LLM_API_KEY=your-key
    working_dir: /app
    volumes:
      - ./devcell.db:/app/devcell.db

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    container_name: devcell-frontend
    restart: unless-stopped
    ports:
      - "8080:80"
    depends_on:
      - backend
```

### 4.3 Running with Docker Compose

From repo root:

```bash
# Build images
docker compose build

# Start in background
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

Access:

- Frontend UI: `http://<server-ip>:8080`
- Backend docs: `http://<server-ip>:9000/docs`

Stop everything:

```bash
docker compose down
```

---

## 5. Production Hardening (Basic)

### 5.1 HTTPS

For production use, you should front the `frontend` service with a reverse proxy that terminates TLS:

- Nginx, Caddy, or Apache on the host.
- Or an upstream load balancer that provides HTTPS.

Example (very simplified) Nginx reverse proxy snippet:

```nginx
server {
    listen 443 ssl;
    server_name your.domain.local;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
    }
}
```

### 5.2 Access Control / Firewall

- Restrict external access to only the ports you need (e.g. 443 for frontend).
- Limit direct access to backend port 9000 to internal network or localhost.
- Ensure the LLM server is also protected appropriately.

### 5.3 Resource Limits

For heavier use, consider:

- Running uvicorn with multiple workers behind a process manager (gunicorn or similar).
- Adding monitoring and log rotation.

---

## 6. Database Considerations

- SQLite is simple and reliable for small-to-medium usage.
- The `devcell.db` file is mounted as a volume in Docker for persistence.
- Backup is as simple as copying that file (preferably when the app is stopped or under low write load).

Future options:

- Migrate to PostgreSQL or another DB if you outgrow SQLite.
- Add migrations using Alembic if schema becomes more complex.

---

## 7. Troubleshooting Deployment

- **Frontend can’t reach backend**
  - Check `VITE_BACKEND_BASE_URL` in build and configuration.
  - Check browser dev tools for CORS or network errors.

- **Backend can’t reach LLM**
  - Check `LLM_BASE_URL` and any required keys.
  - Test curl from backend container to LLM server.

- **Auth not working as expected**
  - Confirm that the backend is writing to `devcell.db` and that the `users` table contains accounts.
  - Check backend logs for auth-related errors.

- **Docker won’t start**
  - Run `docker compose logs` to see service-specific errors.
  - Ensure ports 8080 and 9000 are not already in use by other processes.

This document should provide enough guidance to get the DevCell Platform running in a local or small production environment.
