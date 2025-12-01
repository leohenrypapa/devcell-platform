# 02_Architecture – DevCell Platform

## Overview
This document provides a detailed architectural breakdown of the DevCell Platform. It explains how the backend, frontend, database, authentication system, and RAG/knowledgebase integrate to deliver a unified developer coordination environment.

---

# 1. System Architecture Diagram (Conceptual)

```
 ┌─────────────────────────────┐
 │         Frontend            │
 │  React + TypeScript         │
 │  Pages / Contexts / UI      │
 └───────────────┬─────────────┘
                 │ API Calls (REST)
 ┌───────────────▼─────────────┐
 │          Backend             │
 │         FastAPI              │
 │  Auth / Tasks / Standups     │
 │  Projects / Dashboard        │
 │  Knowledgebase (RAG)         │
 └───────────────┬─────────────┘
                 │ SQL + Vectors
 ┌───────────────▼─────────────┐
 │         Storage Layer        │
 │  SQLite (relational data)    │
 │  Chroma (vector embeddings)  │
 └─────────────────────────────┘
```

---

# 2. Backend Architecture (FastAPI)

## Directory Structure
```
backend/app/
│
├── api/                 # Route definitions
│   ├── auth.py
│   ├── tasks.py
│   ├── standups.py
│   ├── projects.py
│   ├── dashboard.py
│   └── rag.py
│
├── stores/              # DB interaction layer
│   ├── user_store.py
│   ├── task_store.py
│   ├── standup_store.py
│   ├── project_store.py
│   ├── dashboard_store.py
│   └── knowledge_store.py
│
├── schemas/             # Pydantic models
├── db/                  # SQLite connection + init
├── services/            # LLM, embedders, utilities
└── main.py              # FastAPI app entry point
```

---

# 3. Backend Modules

## 3.1 Authentication
- Username/password with salted SHA256 (demo)
- JWT access tokens
- `UserContext` on frontend to persist login
- Roles:
  - `admin`
  - `standard`

### Endpoints
- `POST /auth/login`
- `GET /auth/me`

---

## 3.2 Tasks Module
Handles:
- CRUD operations
- Progress tracking
- Inline updates
- Status pill styling (`todo`, `in_progress`, `blocked`, `done`)
- Archive/unarchive
- Search by title, owner, description, project

### Data Model
```
Task {
  id
  title
  description
  project_id
  assignee
  status
  progress
  created_at
  updated_at
  is_archived
}
```

---

## 3.3 Standups Module
- Daily entries for Yesterday / Today / Blockers
- AI-generated summary
- Export to Markdown
- Convert standup entries → tasks

### Data Model
```
Standup {
  id
  user_id
  created_at
  yesterday
  today
  blockers
  ai_summary (optional)
}
```

---

## 3.4 Dashboard Module
Provides:
- "My Today" overview
- Recent tasks (last 5)
- Recent standups (last 3)
- Quick Actions
- AI SITREP generator

---

## 3.5 Projects Module
- Track active projects
- Project metadata
- Link tasks and standups to project context

---

## 3.6 Knowledgebase / RAG Module
- Upload: PDF/TXT/MD
- Text extraction
- Split into chunks
- Embed with vector model
- Store embeddings in Chroma
- Query with semantic search

### File Pipeline
```
Upload → Extract → Normalize → Embed → Store → Query
```

### Chroma
Stores:
- Vector embeddings
- Metadata (filename, chunk index)

---

# 4. Frontend Architecture (React + TypeScript)

## Directory Structure
```
frontend/src/
│
├── pages/          # Top-level routed views
│   ├── DashboardPage.tsx
│   ├── TasksPage.tsx
│   ├── StandupsPage.tsx
│   ├── ProjectsPage.tsx
│   ├── KnowledgePage.tsx
│   └── Auth/
│
├── components/     # Shared UI elements
│   ├── TaskCard.tsx
│   ├── ProjectCard.tsx
│   ├── StandupCard.tsx
│   └── layout/     # Sidebar, Topbar, Theme
│
├── contexts/       # Global state providers
│   ├── UserContext.tsx
│   ├── ThemeContext.tsx
│   └── ToastContext.tsx
│
├── hooks/          # Custom hooks
└── utils/          # Fetch helpers, date utils
```

---

# 5. Frontend Modules

## 5.1 Global State (Contexts)
### `UserContext`
- Stores JWT and user info
- Provides `login()` / `logout()`
- Injects Authorization headers

### `ThemeContext`
- Light/dark mode persistence
- Updates CSS variables on `<html>` and `<body>`

### `ToastContext`
- Global toast notifications
- Replaces `alert()`
- Stack-based UI with fade transitions

---

## 5.2 UI Theme System
- Global CSS variables
- Sidebar & Topbar auto-adapt
- Consistent buttons/cards/forms

---

# 6. Data Flow Example: Creating a Task

```
[Frontend] TaskForm.tsx
        ↓ POST /tasks
[Backend] tasks.py → task_store.py
        ↓ SQLite
[Frontend] fetches updated list
        ↓ Dashboard shows new task
```

---

# 7. Database Architecture

## SQLite
- File-based
- Zero-maintenance
- Perfect for lightweight deployments

### Tables (simplified)
- `users`
- `tasks`
- `standups`
- `projects`
- `kb_documents`
- `kb_chunks`

---

# 8. RAG Architecture

### Embedding Model
Configurable via env var:
```
EMBEDDER_MODEL=your_model
```

### Steps
1. Chunk document text
2. Generate vector embedding
3. Store in Chroma
4. Query using semantic similarity
5. Return top chunks as context

---

# 9. Design Patterns

### Backend
- CRUD store pattern (`*_store.py`)
- Pydantic schemas for validation
- FastAPI routers grouped by module

### Frontend
- Context-driven global state
- Components → Pages → Layout hierarchy
- Declarative API hooks
- Toast-driven notifications

---

# 10. System-Level Principles

1. **Minimal dependencies**
2. **Readable folder structure**
3. **API-first design**
4. **AI-native workflows**
5. **Small, modular components**

---

# 11. Future Architecture Expansion

### Planned
- Permission/role-based project access
- Notification service
- Background jobs (Celery or RQ)
- Remote storage for KB files
- Multi-node Chroma setup
- Plugin framework (Page injection)

---

# 12. Related Docs
- `01_Getting_Started.md`
- `03_Developer_Guide.md`
- `04_Operations.md`
- `05_API_Reference.md`
