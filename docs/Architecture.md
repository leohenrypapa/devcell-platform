# DevCell Platform – Architecture Overview

## 1. High-Level Overview

The DevCell Platform is a lightweight internal web app that organizes developer work in a unit-style environment (similar to “dev cells” at big tech).

It provides:

- Authentication & roles (user / admin)
- Daily standups tied to real users
- Project tracking with AI summaries
- Knowledge base / RAG hooks (backend ready)
- Chat & code review surfaces
- Dashboard SITREP view
- Dockerized deployment (frontend + backend)

## 2. Components

### 2.1 Backend (FastAPI)

- **Tech stack**: Python 3.10+, FastAPI, SQLite, uvicorn
- **Location**: `backend/app`
- **Main entry**: `app/main.py`

Key modules:

- `app/api/routes/`
  - `auth.py`: login, register, admin user management
  - `standup.py`: CRUD + summaries for standups
  - `projects.py`: CRUD + AI summaries per project
  - `knowledge.py`: RAG / document endpoints (stub or implemented)
  - `chat.py`: LLM chat proxy
  - `review.py`: code review via LLM

- `app/schemas/`
  - Pydantic models for users, standups, projects, etc.

- `app/services/`
  - `auth_service.py`: token/session handling, `get_current_user`, `require_admin`
  - `user_store.py`: user CRUD, password hashing, session creation
  - `standup_store.py`: standup CRUD, per-date queries, update/delete
  - `project_store.py`: project CRUD, update/delete
  - `standup_summary.py`: calls LLM to summarize today’s standups
  - `project_summary.py`: calls LLM for project-specific summaries
  - `knowledge_service.py`: hooks into your LLM/RAG backend

- Data store: `devcell.db` (SQLite), usually persisted at repo root.

### 2.2 Frontend (React + TypeScript + Vite)

- **Tech stack**: React, TypeScript, Vite
- **Location**: `frontend/`
- **Routing**: `react-router-dom`

Key parts:

- `src/App.tsx`
  - Handles routing + login routing.
  - Uses `Layout` for all authenticated routes.
  - Skips `Layout` for `/login`.

- `src/components/Layout.tsx`
  - Topbar + sidebar shell.
  - Shows navigation for: Dashboard, Chat, Knowledge, Standups, Projects, Admin, Code Review.

- `src/context/UserContext.tsx`
  - Manages `user`, `token`, `isAuthenticated`.
  - Persists auth in `localStorage`.
  - Provides login/logout helpers.

- `src/pages/`
  - `LoginPage.tsx`: username/password login; stores token + user.
  - `DashboardPage.tsx`:
    - “My Today”: my standups + my projects.
    - “Unit Snapshot”: standup count + projects by status.
    - AI Unit SITREP (today) with copy-to-clipboard.
  - `StandupPage.tsx`:
    - Submit/edit/delete standups.
    - Standups auto-tied to logged-in user.
    - Per-date browsing, project linking, AI summary.
  - `ProjectsPage.tsx`:
    - Create/edit/delete projects.
    - Owner auto-tied to logged-in user.
    - Per-status display, per-project AI summary (copyable).
  - `AdminPage.tsx`:
    - Admin-only view.
    - List all users.
    - Create new users with role (user/admin).
  - `KnowledgePage.tsx`:
    - Knowledge/RAG UI (upload/search/etc., depending on current implementation).
  - `ChatPage.tsx`: LLM chat surface.
  - `CodeReviewPage.tsx`: LLM-assisted code review.

### 2.3 Deployment

- **Dockerized backend**:
  - `backend/Dockerfile` → `uvicorn app.main:app --host 0.0.0.0 --port 9000`
- **Dockerized frontend**:
  - `frontend/Dockerfile` → build with Vite → serve via nginx.
- **Compose**:
  - `docker-compose.yml`:
    - `backend` service on `9000`
    - `frontend` service on `8080`
    - Frontend built with `VITE_BACKEND_BASE_URL=http://backend:9000`

## 3. Auth & Roles

- JWT-like session token issued on login.
- Stored in backend `sessions` table + frontend `localStorage`.
- `User` has at least:
  - `id`, `username`, `role`, `created_at`.
- Roles:
  - `user`: normal dev.
  - `admin`: can manage users and see everything.

See `Auth.md` for full details.
