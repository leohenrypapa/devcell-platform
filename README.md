# DevCell Platform

Internal developer communication and coordination portal for your unit.

This platform sits on top of your own LLM server and gives your dev cell:

- A shared place to track work
- Daily standups and project status
- Knowledge / RAG search
- AI-assisted chat and code review
- A dashboard-style daily SITREP view

---

## Features

- **LLM Chat Assistant** – talk to your own LLM server from a simple web UI
- **Knowledgebase / RAG** – upload or connect docs and query them with retrieval-augmented generation
- **Daily Standups** – structured yesterday/today/blockers entries per dev
- **AI Standup Summary (SITREP)** – auto-summarize today’s standups for quick briefs
- **Projects Tracking** – track work by project with statuses (planned/active/blocked/done)
- **Project AI Summaries** – per-project progress summaries based on standups
- **Dashboard** – “morning brief” showing my today, unit snapshot, and AI Unit SITREP
- **Code Review Helper** – send code + instructions to your LLM server for feedback
- **Local User Identity & Roles** – username/password login, `user` vs `admin` roles, Admin page for user management

---

## Architecture (High Level)

- **Frontend**
  - React + TypeScript + Vite
  - Talks to the backend via REST (`VITE_BACKEND_BASE_URL`)
  - Pages: Login, Dashboard, Standups, Projects, Knowledge, Chat, Admin, Code Review

- **Backend**
  - Python 3 + FastAPI + uvicorn
  - REST API under `/api/...`
  - Handles:
    - Auth + sessions (users, roles)
    - Standups CRUD + AI summaries
    - Projects CRUD + AI summaries
    - Knowledge / RAG endpoints
    - Chat & code review proxy to LLM

- **Database**
  - SQLite (`devcell.db`) at repo root (or mounted volume in Docker)
  - Tables for users, sessions, standups, projects, etc.

- **LLM Server**
  - External server you run (e.g. OpenAI-compatible, Qwen, etc.)
  - Configured via environment variables (e.g. `LLM_BASE_URL`, `LLM_MODEL_NAME`)

---

## Quick Start (Local Development)

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

# run the API
uvicorn app.main:app --reload --host 0.0.0.0 --port 9000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Add in `frontend/.env`:

```env
VITE_BACKEND_BASE_URL=http://localhost:9000
```

---

## Running with Docker

```bash
docker compose build
docker compose up -d
docker compose ps
docker compose down
```

---

## Project Structure

```
devcell-platform/
  backend/
  frontend/
  docs/
  devcell.db
  docker-compose.yml
  README.md
```

---

## Documentation

See `docs/` for detailed modules.