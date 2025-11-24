# Deployment

## 1. Overview

The DevCell Platform is dockerized. You can run the entire stack (backend + frontend) with `docker compose up -d`.

## 2. Backend Image

File: `backend/Dockerfile`

- Base: `python:3.10-slim`
- Copies `backend/` into `/app`.
- Installs deps from `requirements.txt`.
- Runs:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 9000
```

- Exposes port `9000`.

SQLite DB (`devcell.db`) is commonly mounted as a volume by docker-compose for persistence.

## 3. Frontend Image

File: `frontend/Dockerfile`

- Stage 1: build with Node

  - Base: `node:22-alpine`
  - `npm install`
  - `npm run build`
  - Uses `VITE_BACKEND_BASE_URL=http://backend:9000` inside the container.

- Stage 2: serve with nginx

  - Base: `nginx:stable-alpine`
  - Copies Vite `dist/` → `/usr/share/nginx/html`
  - Uses `frontend/nginx.conf` for SPA routing.
  - Exposes port `80`.

## 4. docker-compose.yml

File: `docker-compose.yml` (repo root)

- Services:

  - `backend`:

    - Builds from `backend/Dockerfile`.
    - Exposes `9000:9000`.
    - (Optionally) Mounts `./devcell.db:/app/devcell.db` for persistence.
  - `frontend`:

    - Builds from `frontend/Dockerfile`.
    - Exposes `8080:80`.
    - Depends on `backend`.

### Commands

From repo root:

```bash
# Build images
docker compose build

# Start
docker compose up -d

# Stop
docker compose down

# View logs
docker compose logs -f
```

## 5. Environment Configuration

Frontend code uses:

```ts
const backendBase =
  (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";
```

- Local dev: `frontend/.env`

  - `VITE_BACKEND_BASE_URL=http://localhost:9000`
- Docker: set via `ENV VITE_BACKEND_BASE_URL=http://backend:9000` in the frontend Dockerfile or via compose.

## 6. Access

- Backend (for debugging/docs): `http://<server-ip>:9000/docs`
- Frontend main UI: `http://<server-ip>:8080`

