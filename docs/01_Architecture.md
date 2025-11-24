# DevCell Platform – Architecture

## 1. Purpose

The DevCell Platform is a lightweight internal web application for organizing “dev cells” in a unit: tracking work, standups, projects, knowledge, and AI-assisted workflows on top of your existing LLM server.

This document gives a high-level view of how the pieces fit together so new developers can get oriented quickly.

---

## 2. High-Level System Overview

### 2.1 Components

- **Frontend**
  - React + TypeScript + Vite
  - Runs in the browser (or served via nginx in Docker)
  - Handles pages: Login, Dashboard, Standups, Projects, Knowledge, Chat, Admin, Code Review

- **Backend**
  - Python 3 + FastAPI
  - Exposes REST APIs under `/api/...`
  - Handles auth, users, standups, projects, knowledge and LLM integration
  - Uses a SQLite database (`devcell.db`) for persistence

- **Database**
  - SQLite file (`devcell.db`) stored on disk
  - Tables for users, sessions, standups, projects, and any future modules

- **LLM / RAG Services**
  - An external LLM server you control (e.g. Qwen, local OpenAI-compatible server)
  - Optional RAG/vector store (e.g. Chroma or similar) for knowledge search

### 2.2 Data Flow (High-Level)

1. User opens the frontend in a browser.
2. User logs in via username/password (sent to `/api/auth/login`).
3. Backend verifies credentials, creates a session token, returns it to the frontend.
4. Frontend stores the token and attaches it as `Authorization: Bearer <token>` to all authenticated requests.
5. Pages use backend APIs for standups, projects, knowledge, etc.
6. Backend may call your LLM server for summaries, chat, or code review.
7. All persistent data is stored in SQLite.

---

## 3. Backend Architecture

### 3.1 Tech Stack

- **Language**: Python 3.10+
- **Framework**: FastAPI
- **Server**: uvicorn
- **Database**: SQLite
- **Auth**: Session tokens stored in DB, sent as Bearer tokens

### 3.2 Package Layout (Backend)

- `app/main.py`
  - Creates FastAPI app
  - Includes routers under `/api/...`
  - Sets up CORS and base configuration

- `app/api/routes/`
  - `auth.py` – login, register, list users, admin create user
  - `standup.py` – CRUD for standups, date filters, AI summary
  - `projects.py` – CRUD for projects, project AI summary
  - `knowledge.py` – document upload/search (RAG integration point)
  - `chat.py` – chat endpoint proxying to your LLM server
  - `review.py` – code review endpoint via LLM

- `app/schemas/`
  - Pydantic models for requests/responses:
    - Users, sessions
    - Standups
    - Projects
    - Knowledge items
    - Chat / review payloads

- `app/services/`
  - `auth_service.py`
    - `get_current_user` – validates token and loads user
    - `require_admin` – ensures user has admin role
  - `user_store.py`
    - CRUD for users
    - Password hashing/verification
    - Session creation and lookup
  - `standup_store.py`
    - CRUD for standups
    - Queries by date
    - Update/delete operations
  - `project_store.py`
    - CRUD for projects
    - Update/delete operations
  - `standup_summary.py`
    - Uses LLM to summarize today’s standups
  - `project_summary.py`
    - Uses LLM to summarize standups related to a specific project
  - `knowledge_service.py`
    - Hooks for RAG indexing/search (implementation may vary)

### 3.3 Database

**SQLite file**: `devcell.db`

Core tables (conceptual):

- `users`
  - `id`, `username`, `password_hash`, `role`, `created_at`
- `sessions`
  - `id`, `user_id`, `token`, `expires_at`, `created_at`
- `standups`
  - `id`, `name`, `yesterday`, `today`, `blockers`, `project_id`, `created_at`
- `projects`
  - `id`, `name`, `description`, `owner`, `status`, `created_at`
- (Optional) `knowledge_items`, etc.

---

## 4. Frontend Architecture

### 4.1 Tech Stack

- React + TypeScript
- Vite for dev server and build
- React Router for navigation

### 4.2 Package Layout (Frontend)

- `src/App.tsx`
  - Sets up routing
  - Protects routes with auth (redirects to `/login` when needed)
  - Wraps main routes with `Layout`

- `src/components/Layout.tsx`
  - Topbar and sidebar shell
  - Navigation links: Dashboard, Chat, Knowledge, Standups, Projects, Admin, Review

- `src/context/UserContext.tsx`
  - Stores:
    - `user` (id, username, role, created_at)
    - `token`
    - `isAuthenticated`
  - Persists auth to `localStorage`
  - Provides `login()` and `logout()`

- `src/pages/`
  - `LoginPage.tsx` – login form
  - `DashboardPage.tsx` – “morning brief” view (my today + unit snapshot + AI SITREP)
  - `StandupPage.tsx` – submit/browse/edit/delete standups, AI summary
  - `ProjectsPage.tsx` – manage projects, AI project summaries
  - `AdminPage.tsx` – user list, admin create-user form
  - `KnowledgePage.tsx` – knowledge base / RAG UI
  - `ChatPage.tsx` – LLM chat interface
  - `CodeReviewPage.tsx` – code review interface via LLM

---

## 5. Authentication & Roles (Short Summary)

For full details see `02_Auth.md`. High-level:

- **Users** authenticate via `/api/auth/login` with username + password.
- Backend issues a **session token**, stored in DB and returned to frontend.
- Frontend stores token in `localStorage` and sends it as `Authorization: Bearer <token>` on API calls.
- `get_current_user` ensures only valid tokens can access protected endpoints.
- `require_admin` ensures only admins can access admin endpoints.

**Roles**:

- `user`
  - Can submit/edit/delete own standups
  - Can create/edit/delete own projects
  - Can use chat, knowledge, review features
- `admin`
  - All of the above
  - Can list all users
  - Can create new users with roles
  - Can see and manage all standups/projects

---

## 6. LLM & RAG Integration

### 6.1 LLM Server

The backend assumes an external LLM server (local or remote), typically exposed via an OpenAI-compatible API. It is used for:

- Standup summaries (unit daily SITREP)
- Project summaries
- Free-form chat
- Code review

Configuration (URL, keys, model name) is done via environment variables described in `07_Deployment.md`.

### 6.2 Knowledge / RAG

The knowledge module is the integration point for:

- Uploading documents or notes
- Indexing them in a vector store (e.g., Chroma, FAISS, etc.)
- Running retrieval-augmented generation (RAG) queries via the LLM

The exact implementation can be swapped out later without changing the overall architecture.

---

## 7. Request Flows (Examples)

### 7.1 User Login

1. User submits login form in `LoginPage.tsx`.
2. Frontend calls `POST /api/auth/login` with `{ username, password }`.
3. Backend:
   - Verifies password
   - Creates session token in `sessions` table
   - Returns `{ access_token, user }`
4. Frontend:
   - Stores token + user in `UserContext` and `localStorage`
   - Redirects to `/` (Dashboard)

### 7.2 Standup Submission

1. User fills standup form in `StandupPage.tsx` (yesterday, today, blockers, project).
2. Frontend calls `POST /api/standup` with this data and `Authorization: Bearer <token>`.
3. Backend:
   - Uses `get_current_user` to identify the user
   - Forces `name = current_user.username`
   - Saves standup in `standups` table
4. Frontend reloads standups for that date and updates the list.

### 7.3 AI Daily Summary

1. User clicks “Generate AI Summary” or opens Dashboard SITREP section.
2. Frontend calls `GET /api/standup/summary`.
3. Backend:
   - Loads today’s standups
   - Formats them as LLM input
   - Calls the LLM
   - Returns `{ summary, count }`
4. Frontend displays the summary and allows copying to clipboard.

---

## 8. Future Extensions

The architecture is designed to be extendable:

- New modules (e.g., Incident reports, Training tracker) can follow the same pattern:
  - Table in DB
  - `schemas/*` models
  - `services/*` store
  - `api/routes/*` endpoints
  - React page + components
- LLM model can be changed via config without changing most code.
- RAG implementation can be swapped out behind `knowledge_service.py`.

This document should give enough context for any new developer in the unit to open the repo, understand the moving parts, and begin working on features or fixes.
