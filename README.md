# DevCell Platform

DevCell is a full-stack, self-hosted developer coordination platform optimized for **small technical teams**, **cyber units**, and **research groups** operating in **secure**, **on-prem**, or **air-gapped environments**.

It unifies:

* Task management
* Project coordination
* Daily standups
* Knowledgebase + RAG search
* Local LLM chat, SITREPs, and code review
* Training pipelines & seed-task generation
* Role-based access + project membership
* Dashboard morning briefs

DevCell runs entirely on your systems — **no cloud services required**.

---

# 🚀 Core Capabilities

(based on platform docs and current codebase)

## **1. Tasks & Projects**

### Tasks

* Full CRUD
* Status workflow: `todo`, `in_progress`, `blocked`, `done`
* Progress tracking
* Due dates with **quick helpers**: +1d / +3d / +7d / Clear
* **Bulk operations** (status & due dates)
* Search, filters, presets, and persistent view settings
* Standup → Task lineage integration

### Projects

* Project metadata (name, description, owner)
* **Project-level permissions** (owner, member, viewer)
* Summaries integrated into Dashboard
* Ties together tasks, training units, and activity feeds

---

## **2. Daily Standups**

* Classic Yesterday / Today / Blockers workflow
* Markdown export
* Standup → Task conversion
* LLM-powered standup summaries

---

## **3. Knowledgebase + RAG**

Local-first knowledge system (filesystem + Chroma).

* Document upload (txt, md, pdf)
* Automatic extraction + embedding
* Chroma vector index
* Semantic search
* Used by Dashboard, Chat, SITREP, and Review pipelines
* Safe deletion, reindexing, version-aware processing

---

## **4. Local LLM Integration**

Works with any **OpenAI-compatible endpoint**, including:

* Qwen
* vLLM
* Ollama
* LM Studio
* Custom local servers

LLM is used for:

* Chat assistant
* SITREP generation
* Standup summaries
* Code review
* RAG embedding/query
* Training transformations

Backend uses `llm_client.py` with configurable endpoint.


---

## **5. Dashboard (“My Today”)**

Includes:

* Standup status
* Active tasks
* Recent tasks & standups
* Project summaries
* Quick actions
* **Generate SITREP** (LLM-generated operational snapshot)

---

## **6. Training Module**

(From training docs + roadmap) 

* Import JSON-based training roadmaps
* Seed tasks into projects
* LLM transformations to generate or adjust training tasks
* Integrates with Knowledgebase & Tasks
* Supports structured skill-building pipelines (e.g., malware dev roadmap)

---

## **7. Authentication & Permissions**

Authentication:

* Username/password login
* Secure session token storage (Bearer token via DB)
* Admin-managed user lifecycle

Global roles:

* `admin`
* `user`

Project-level roles:

* `owner`
* `member`
* `viewer`

Permissions enforced in:

* Tasks
* Projects
* Standups
* Dashboard
* Training
* Knowledgebase

(Defined across modules and documented under permissions)


---

## **8. Administration**

Admin-only functionality:

* User creation
* Role assignment
* Activation/deactivation
* Password resets
* Profile updates

---

# 🏗 High-Level Architecture

Based on docs + structure.


```
[ React + TypeScript Frontend ]
        │  REST API
        ▼
[ FastAPI Backend ]
  Auth / Tasks / Projects / Standups
  Dashboard / RAG / LLM / Training
        │
        ├── SQLite  (relational data)
        └── Chroma  (vector embeddings)
```

Designed for:

* Local-first
* Modular architecture
* Predictable internal data flows
* Secure, offline-capable operation

---

# 🎨 Frontend (React + TypeScript)

(From tree structure)


Pages:

* Dashboard
* Tasks
* Projects
* Standups
* Knowledge
* Chat
* Code Review
* Training
* Admin
* Login / Register / Profile

Contexts:

* `UserContext`
* `ThemeContext`
* `ToastContext`

Shared components:

* Layout
* Sidebar
* Topbar
* StandupTaskConvertModal

---

# ⚙️ Backend (FastAPI)

Modules:

* Auth
* Projects + Membership
* Tasks
* Standups
* Dashboard
* Knowledgebase / RAG
* Training
* Review
* Health
* LLM integration

Services layer includes:

* Task store
* Standup store + summary
* Project membership
* Knowledge embed/query pipeline
* Training import + seed tasks
* Review service
* RAG service

Schemas align with API routes (see `docs/api/*`).


---

# 🤖 LLM Server Support

Compatible with **any endpoint supporting ChatCompletions**.

Configure:

```
LLM_ENDPOINT=http://localhost:8001/v1/chat/completions
```

Used by:

* `/api/chat`
* `/api/review`
* `/api/standups/summary`
* `/api/training/*`
* knowledgebase embedding

---

# ⚡ Quick Start (Local Development)

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 9000
```

Environment (`backend/.env`):

```env
SESSION_SECRET=your_secret_here
LLM_ENDPOINT=http://localhost:8001/v1/chat/completions
KNOWLEDGEBASE_DIR=../knowledgebase
```

*Note:*
Your backend uses **session tokens**, not JWT — updated to match current implementation.

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

`frontend/.env`:

```env
VITE_API_URL=http://localhost:9000
```

Frontend served at:

```
http://localhost:5173
```

---

# 📁 Repository Structure

(Synchronized with actual repo layout)


```
devcell-platform/
│
├── backend/
│   ├── app/
│   │   ├── api/routes
│   │   ├── core
│   │   ├── schemas
│   │   ├── services
│   │   ├── knowledgebase
│   │   ├── training
│   │   └── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── vite.config.ts
│
├── docs/
│   ├── overview/*          # index, features, roadmap
│   ├── api/*               # all API references
│   ├── architecture/*      # system, backend, frontend, LLM
│   ├── modules/*           # tasks, projects, standups, etc.
│   ├── developer/*         # structure, workflows, extensions
│   ├── operations/*        # install, run, deployment, backups
│   └── adr/*               # ADR-001 ... ADR-010
│
├── knowledgebase/          # RAG document store
└── README.md
```

---

# 📚 Documentation Overview

(from docs_structure.txt)


* **Overview:** Intro, features, roadmap
* **Architecture:** system diagram, backend, frontend, LLM integration
* **Modules:** tasks, projects, standups, dashboard, training, knowledge, chat, review, permissions
* **API Reference:** full REST documentation
* **Developer Guides:** code style, testing, extending modules
* **Operations:** installation, deployment, monitoring, troubleshooting
* **ADRs:** local LLM, SQLite, FastAPI/React, permissions, RAG design, training units

---

# 🧭 Roadmap (Short Summary)

(from 02_roadmap.md)


### Near Term

* Project permissions UI
* Real-time standup/task sync
* KB metadata + versioning
* Training preview interface

### Medium Term

* Plugin framework
* Analytics dashboards
* Advanced RBAC
* Inline document viewer

### Long Term

* Multi-tenant deployments
* Federated DevCell clusters
* Expanded AI agent workflows

---

# ⚠️ Security Note

DevCell is built for **internal secure networks**.
If deployed externally:

* Use TLS
* Add reverse proxy (NGINX/Caddy)
* Enforce password rules
* Limit exposure to LLM endpoints
* Consider zero-trust segmentation