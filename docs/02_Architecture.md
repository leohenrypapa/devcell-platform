# 02_Architecture – DevCell Platform

## Overview
This document provides a detailed architectural breakdown of the DevCell Platform. It explains how the backend, frontend, database, authentication system, and RAG/knowledgebase integrate to deliver a unified developer coordination environment.

---

# 1. System Architecture Diagram (Conceptual)

```text
 ┌─────────────────────────────┐
 │         Frontend            │
 │  React + TypeScript         │
 │  Pages / Contexts / UI      │
 └───────────────┬─────────────┘
                 │ API Calls (REST)
 ┌───────────────▼─────────────┐
 │          Backend             │
 │         FastAPI              │
 │  Auth / Tasks / Standup      │
 │  Projects / Dashboard        │
 │  Knowledgebase (RAG)         │
 └───────────────┬─────────────┘
                 │ SQL + Vectors
 ┌───────────────▼─────────────┐
 │         Storage Layer        │
 │  SQLite (relational data)    │
 │  Chroma (vector embeddings)  │
 └─────────────────────────────┘
````

---

# 2. Backend Architecture (FastAPI)

## Directory Structure

```text
backend/app/
│
├── api/
│   ├── routes/             # Route definitions (per module)
│   │   ├── auth.py
│   │   ├── tasks.py
│   │   ├── standup.py
│   │   ├── projects.py
│   │   ├── dashboard.py
│   │   ├── knowledge.py
│   │   ├── chat.py
│   │   ├── review.py
│   │   └── health.py
│   └── __init__.py
│
├── schemas/                # Pydantic models (API / DB shapes)
│   ├── user.py
│   ├── task.py
│   ├── standup.py
│   ├── project.py
│   ├── dashboard.py
│   ├── knowledge.py
│   └── review.py
│
├── services/               # LLMs, knowledge, helpers, business logic
│   ├── auth_service.py
│   ├── task_store.py
│   ├── standup_store.py
│   ├── project_store.py
│   ├── dashboard_store.py
│   ├── knowledge_store.py
│   ├── standup_summary.py
│   └── llm_client.py
│
├── db.py                   # DB connection + init_db()
├── Knowledgebase/          # Uploaded files for RAG
├── main.py                 # FastAPI app entry point
└── __init__.py
```

Key ideas:

* **Routes** are very thin: they validate inputs, apply auth, and call the store layer.
* **Stores** encapsulate all direct DB access (SQL).
* **Schemas** define the contract between DB, backend, and frontend.
* **Services** hold orchestration logic (LLM calls, summaries, cross-module workflows).

---

# 3. Backend Modules

## 3.1 Authentication

* Username/password with salted SHA256 (demo only; swap for bcrypt/argon2 in production).
* JWT access tokens with a simple `role` model:

  * `admin`
  * `standard`
* `get_current_user()` dependency used across all routers.

### Endpoints (high level)

* `POST /auth/login` – Obtain JWT.
* `GET /auth/me` – Get current user profile.
* `PUT /auth/me` – Update own profile metadata.
* `PUT /auth/change_password` – Change own password.
* Admin-only user management endpoints under `/auth/admin/...`.

---

## 3.2 Tasks Module

The Tasks module tracks individual units of work and links them to users and projects.
It is designed to support both **simple personal to-dos** and **project-scoped tasks**.

### Responsibilities

* CRUD operations for tasks
* Progress tracking (0–100%)
* Inline updates from the Tasks page
* Status pill styling (`todo`, `in_progress`, `blocked`, `done`)
* Archive/deactivate tasks via `is_active`
* Search & filtering:

  * By owner (with role-aware semantics)
  * By project
  * By status
  * Active-only filter (default)
* Power-user UX features on the frontend:

  * Bulk selection → archive / delete
  * Quick due-date presets (Today / Tomorrow / Next week / Clear)

### Data Model

The simplified logical model:

```text
Task {
  id: int
  owner: str             # username of the owner (from auth)
  title: str
  description: str
  project_id: int?       # optional FK → Project
  status: "todo" | "in_progress" | "blocked" | "done"
  progress: int          # 0–100
  due_date: date?        # optional
  is_active: bool        # false ≈ archived/deactivated
  created_at: datetime
  updated_at: datetime
}
```

Implementation details:

* Owner is **never** provided by the client; it is derived from the authenticated user.
* Soft-delete / archiving is done by toggling `is_active` (not by deleting rows).
* The list endpoint supports:

  * `mine` flag
  * explicit `owner` for admins
  * `project_id`, `status`, `active_only`

---

## 3.3 Standups Module

The Standup module captures daily reports in a **Yesterday / Today / Blockers** format and ties into AI summarization and tasks.

### Responsibilities

* Store daily standup entries keyed by `name` (username)
* Provide quick access for:

  * Today’s standups
  * Standups for a specific date
* Generate AI summaries (for today or a given date)
* Provide data to Dashboard widgets
* Drive the **Standups → Tasks** conversion flow in the frontend

### Data Model

```text
Standup {
  id: int
  name: str          # username of author
  created_at: datetime
  yesterday: str
  today: str
  blockers: str
}
```

Notes:

* There is no `ai_summary` column; summaries are generated on demand by the `standup_summary` service calling an LLM.
* The `name` field is always set from the authenticated user on write.

### Standups → Tasks Integration

The integration lives mostly in the **frontend**:

* The Standups page displays each user’s `yesterday`, `today`, and `blockers`.
* From that view, the user can convert lines or blocks into tasks:

  * The **task title** is derived from a concise part of the standup text.
  * The **task description** retains more full context.
  * Optional project selection lets you tie the new task to a project.
* Under the hood, this uses the standard Tasks API (`POST /tasks`) rather than a special “convert” endpoint.
* The Dashboard then surfaces these tasks in:

  * **My Active Tasks** (status breakdown and totals)
  * **Recent Tasks**
  * “My Today” widgets that mix standups and tasks.

This keeps the backend simple while giving a rich UX loop:

> Standup text → Convert → Task → Show up on Tasks page & Dashboard.

---

## 3.4 Dashboard Module

The Dashboard module aggregates data from tasks, standups, projects, and the knowledgebase.

Provides:

* "My Today" overview:

  * Today’s standups
  * My active tasks
  * My projects
* Recent tasks (time-boxed, e.g., 5 most recently updated)
* Recent standups (e.g., last 3 days)
* Quick Actions:

  * Go to Tasks
  * Go to Standups
  * Open Knowledgebase
* AI SITREP generator combining:

  * Standup summaries
  * Task progress
  * Knowledgebase context (optional)

---

## 3.5 Projects Module

Projects provide a lightweight grouping mechanism:

* Track active projects (name, description, owner, status)
* Link tasks to projects via `project_id`
* Link standup context to projects (via text and optional references)
* Used heavily by Dashboard and Tasks filters

---

## 3.6 Knowledgebase / RAG Module

Responsible for document ingestion and semantic search.

### File Pipeline

```text
Upload → Extract → Normalize → Embed → Store → Query
```

### Chroma

Stores:

* Vector embeddings
* Metadata (filename, chunk index, etc.)

---

# 4. Frontend Architecture (React + TypeScript)

## Directory Structure

```text
frontend/src/
│
├── pages/                # Top-level routed views
│   ├── DashboardPage.tsx
│   ├── TasksPage.tsx
│   ├── StandupsPage.tsx
│   ├── ProjectsPage.tsx
│   ├── KnowledgePage.tsx
│   └── Auth/
│
├── components/           # Shared UI elements
│   ├── TaskCard.tsx
│   ├── StandupCard.tsx
│   ├── ProjectCard.tsx
│   ├── StandupTaskConvertModal.tsx
│   └── layout/          # Sidebar, Topbar, Theme
│
├── contexts/             # Global state providers
│   ├── UserContext.tsx
│   ├── ThemeContext.tsx
│   └── ToastContext.tsx
│
├── hooks/                # Custom hooks
└── utils/                # Fetch helpers, date utils
```

Key notes:

* Each backend module has a corresponding **page** and (optionally) supporting components.
* Global contexts handle:

  * Authentication (user + JWT)
  * Theme (light/dark)
  * Toast notifications

---

# 5. Frontend Modules

## 5.1 Global State (Contexts)

### `UserContext`

* Stores JWT and user info
* Provides `login()` / `logout()`
* Injects `Authorization` headers via a central API helper

### `ThemeContext`

* Light/dark mode persistence in `localStorage`
* Updates CSS variables on `<html>` and `<body>`

### `ToastContext`

* Global toast notifications (success/error/info)
* Replaces `alert()`
* Stack-based UI with fade transitions

---

## 5.2 UI Theme System

* Global CSS variables for colors, spacing, typography
* Sidebar & Topbar auto-adapt to theme
* Consistent buttons/cards/forms
* Designed for desktop-first dashboards

---

# 6. Data Flow Example: Creating a Task

```text
[Frontend] TasksPage.tsx / TaskModal
        ↓ POST /tasks
[Backend] routes/tasks.py → services/task_store.py
        ↓ SQLite (tasks table)
[Frontend] re-fetch /tasks (with filters such as mine=true)
        ↓ Dashboard shows updated “My Active Tasks” & “Recent Tasks”
```

---

# 7. Database Architecture

## SQLite

* File-based
* Zero-maintenance
* Perfect for lightweight deployments / dev environments

### Tables (simplified)

* `users`
* `tasks`
* `standups`
* `projects`
* `kb_documents`
* `kb_chunks`

Tasks and standups tables are intentionally simple so they can be extended later (e.g., tags, links, attachments) without disrupting early adopters.

---

# 8. RAG Architecture

### Embedding Model

Configured via environment:

```text
EMBEDDER_MODEL=your_model
```

### Steps

1. Chunk document text
2. Generate vector embeddings
3. Store in Chroma with metadata
4. Query using semantic similarity
5. Return top chunks as context to the LLM

---

# 9. Design Patterns

### Backend

* CRUD store pattern (`*_store.py`)
* Pydantic schemas for validation
* FastAPI routers grouped by domain module
* LLM logic isolated in `services/` (e.g., `standup_summary.py`, `llm_client.py`)

### Frontend

* Context-driven global state
* Components → Pages → Layout hierarchy
* Thin API helper for all fetches
* Toast-driven notifications instead of blocking alerts

---

# 10. System-Level Principles

1. **Minimal dependencies**
2. **Readable folder structure**
3. **API-first design**
4. **AI-native workflows**
5. **Small, modular components**
6. **Vertical slices**: backend + frontend + docs per feature

---

# 11. Future Architecture Expansion

### Planned

* Permission/role-based project access
* Notification service
* Background jobs (Celery/RQ) for heavy tasks
* Remote storage for KB files
* Multi-node Chroma setup
* Plugin framework (page/module injection)
* Richer Task/Standup linking (e.g., comments, attachments)

---

# 12. Related Docs

* `01_Getting_Started.md`
* `03_Developer_Guide.md`
* `04_Operations.md`
* `05_API_Reference.md`
* `99_Design_Decisions.md`
