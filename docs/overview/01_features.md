# DevCell Platform – Feature Overview

DevCell provides an integrated suite of tools for developer coordination,
knowledge management, training, and workflow automation — all designed to run
locally or in secure, air-gapped environments.  

This document summarizes the major features of the platform.

---

# 🚀 Core Functional Areas

DevCell is organized into eight major functional domains:

1. **Tasks & Projects**
2. **Standups**
3. **Knowledgebase & RAG**
4. **Local LLM Integration**
5. **Dashboard (My Today + SITREP)**
6. **Training & Seed Tasks**
7. **Authentication & Permissions**
8. **Administration / User Management**

Each module is a vertical slice with:

- backend API routes  
- service logic  
- database schemas  
- frontend pages + helpers  

---

# ✅ 1. Task & Project Management

### ✔ Tasks
- Full CRUD operations  
- Status workflow: `todo`, `in_progress`, `blocked`, `done`  
- Progress tracking (0–100%)  
- Due dates with quick shortcuts: **+1d / +3d / +7d / Clear**  
- Bulk actions:
  - update status  
  - update due date  
  - archive / deactivate  
- Text search + project filter + owner filter  
- Standup lineage via `origin_standup_id`  

### ✔ Projects
- Project metadata (`name`, `description`, `owner`)  
- Dashboard summaries per project  
- **Project-level permissions**  
- Members list, with per-project roles:
  - `owner`
  - `member`
- Fully integrated with Tasks and Dashboard

---

# ✅ 2. Standups (Daily Y/T/B Workflow)

### ✔ Classic format
Every user submits:
- **Yesterday**
- **Today**
- **Blockers**

### ✔ LLM-powered features
- Automatic standup summaries  
- SITREP integration  
- Line-by-line parsing for task generation  

### ✔ Standup → Task Conversion
- Per-line checkbox selection  
- Auto-extracted titles  
- Auto-fill owner (current user)  
- Optional due date presets  
- Saves tasks to the main task system  

---

# ✅ 3. Knowledgebase + RAG

A local-first knowledge system with embeddings and semantic search.

### ✔ Features
- Upload text documents  
- Embedded using LLM backend  
- Stored in:
  - filesystem (`knowledgebase/` directory)
  - Chroma vector DB
- Delete, overwrite, and re-index safely  
- Query using RAG pipeline via:
  - Dashboard SITREP  
  - Chat  
  - Knowledge search UI  

### ✔ RAG Pipeline Components
- `embedder.py`
- `indexer.py`
- `query.py`
- `knowledge/documents.py`
- `rag.py`

Supports full text retrieval with filters.

---

# ✅ 4. Local LLM Integration

DevCell is designed for **local 7B–13B models**, without relying on cloud APIs.

### ✔ LLM capabilities:
- General chat  
- Code review  
- SITREP generation  
- Standup summaries  
- RAG embedding + query  
- Training transformation tasks  

### ✔ API entrypoints:
- `/api/chat/*`
- `/api/review/*`
- `/api/training/*`
- `/api/standups/summary`

Uses:
- shared HTTP client (`llm_client.py`)
- configurable endpoint via `config.py`

---

# ✅ 5. Dashboard (My Today + SITREP)

### ✔ My Today
Shows:
- Today’s standup status  
- Active tasks  
- Recent tasks  
- Recent standups  
- Project summaries  

### ✔ SITREP
A structured operational report generated using:
- Recent standups  
- Active tasks  
- Knowledgebase context  
- Optional user instructions  

Useful for leadership updates or mission briefs.

---

# ✅ 6. Training Module

Supports structured skill development pipelines.

### ✔ Features:
- Import training roadmap files  
- Seed tasks into Projects  
- LLM transformations for training prompts  
- API endpoints:
  - `/api/training/seed_tasks`
  - `/api/training/import`

### ✔ Use Cases:
- Malware dev pipelines  
- Cyber operator onboarding  
- Internal engineering academy workflows  

Connected modules:
- Projects (training roadmap stored as project)
- Tasks (seed tasks)
- Knowledgebase (training docs)

---

# ✅ 7. Authentication & Permissions

### ✔ Authentication
- JWT-based login  
- Secure hashed passwords  
- Refresh-less short-lived tokens  
- Profile fields:
  - `display_name`
  - `job_title`
  - `team_name`
  - `rank`
  - `skills`
  - `is_active`

### ✔ Roles
- `user`
- `admin`

### ✔ Project-Level Permissions
- Fine-grained membership system  
- Implemented via `project_members` table  
- Roles per project:
  - `owner`
  - `member`  
- Enforced in:
  - `/api/projects/*`
  - `/api/projects/mine`
  - `/api/projects/{id}/members`

---

# ✅ 8. Administration

For `admin` role users only.

### ✔ Features:
- Create user  
- List users  
- Update:
  - profile fields
  - role
  - activation status  
- Reset passwords  
- Disable / enable accounts  

Backend-driven through:
- `auth_service.py`
- `user_store.py`
- `routes/auth.py`  

Frontend page:
- `AdminPage.tsx`

---

# 🧱 Optional & Advanced Features

### ✔ Dark/Light Theme System  
Via `ThemeContext`, persisted in `localStorage`.

### ✔ Toast/Notification System  
Global toast provider (`ToastContext`).

### ✔ API Helper Layer  
`lib/backend.ts` ensures JWT injection & unified API calls.

### ✔ Rich Dashboard Cards  
Project summaries, task widgets, and recents.

### ✔ Modular Service Architecture  
Each feature has:
- router  
- service  
- store  
- schema  

This reduces coupling and increases maintainability.

---

# 📚 Related Documents
- **Overview** → `overview/index.md`  
- **Roadmap** → `overview/roadmap.md`  
- **Architecture** → `architecture/*`  
- **Modules** → `modules/*`  
- **API Reference** → `api/*`  

---

```

© DevCell Platform Documentation — GitHub OSS Style

```