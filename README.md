# DevCell Platform

DevCell is a lightweight, self-hosted developer coordination platform for small engineering teams (military, research, startup) who want structured workflow tools **without heavy enterprise systems** — and who prefer running everything on their **own LLM servers**.

It provides a unified place for:

* Task management
* Daily standups
* Dashboard morning briefs
* Knowledgebase + RAG search
* Local LLM chat, SITREP, and code review
* Role-based access control
* Clean React UI + FastAPI backend

---

# 🚀 Features

## **Developer Workflow**

### **Tasks**

* Create / edit / archive tasks
* Status pills (`todo`, `in_progress`, `blocked`, `done`)
* Full-text search (title, description, owner, project)
* Dashboard widgets: My Tasks, Recent Tasks

### **Projects**

* Group tasks by project
* Future: project-level summaries, objectives

### **Daily Standups**

* Yesterday / Today / Blockers
* Markdown export
* Convert standup items → tasks
* AI-generated daily summary

---

## **AI-Integrated Modules**

### **Chat Assistant**

* Chat with your **local** LLM (Ollama, LM Studio, Qwen, vLLM, OpenAI-compatible)
* Good for reasoning, debugging, and brainstorming

### **AI Code Review**

* Paste code + instructions
* Your LLM returns improvements, risks, refactoring suggestions

### **AI SITREP**

* Dashboard “Generate SITREP” button
* Produces a unit / team snapshot from tasks + standups + recent activity

### **Knowledgebase + RAG**

* Upload PDF / TXT / MD
* Automatic extraction + embedding
* Chroma vector DB
* Semantic search across all docs

---

## **Dashboard**

* Morning Brief
* My Tasks
* Recent Tasks
* Recent Standups
* Unit Snapshot
* Quick Actions
* Generate AI SITREP

---

## **Identity & Access Management**

* Local SQLite users
* Username/password auth
* JWT
* `admin` vs `standard` roles
* Admin user management page

---

# 🏗 High-Level Architecture

```
[ React Frontend ]  <----->  [ FastAPI Backend ]  <----->  [ LLM Server ]
        │                            │                          │
        │                            │                          └── OpenAI-compatible endpoint
        │                            ├── SQLite DB (relational)
        │                            └── Chroma DB (vector store)
```

---

## **Frontend**

* React + TypeScript + Vite
* Pages:

  * Login, Dashboard, Tasks, Projects, Standups
  * Knowledgebase, Chat, Code Review
  * Admin
* Contexts:

  * `UserContext`, `ThemeContext`, `ToastContext`
* Modern layout (Sidebar + Topbar)

## **Backend**

* FastAPI + Python 3
* Modules:

  * Auth, Tasks, Standups, Dashboard, Projects
  * Knowledgebase / RAG
  * LLM proxy utilities
* SQLite for relational data
* Chroma for embeddings
* JWT authentication

## **LLM Server**

Compatible servers:

* Qwen Coder 7B
* OpenAI-compatible endpoints
* LM Studio
* Ollama
* vLLM
* Custom self-hosted inference servers

Configurable via env:

```
LLM_ENDPOINT=http://localhost:8001/api/v1/query
```

---

# ⚡ Quick Start (Local Development)

## 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 9000
```

Environment file (`backend/.env`):

```env
JWT_SECRET=your_secret_here
JWT_ALGORITHM=HS256
LLM_ENDPOINT=http://localhost:8001/api/v1/query
KNOWLEDGEBASE_DIR=../knowledgebase
```

---

## 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Environment file (`frontend/.env`):

```env
VITE_API_URL=http://localhost:9000
```

Frontend runs at:

```
http://localhost:5173
```

---

# 📁 Final Project Structure

(Reflects the cleaned, recommended layout)

```
devcell-platform/
│
├── backend/
│   ├── app/
│   │   ├── api/           # Routes
│   │   ├── core/          # Settings, LLM client
│   │   ├── schemas/       # Pydantic models
│   │   ├── services/      # Business logic
│   │   ├── knowledgebase/ # RAG documents (canonical location)
│   │   ├── main.py
│   │   └── db.py
│   ├── tests/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── api/
│   │   └── App.tsx
│   └── __tests__/
│
├── scripts/
│   ├── structure.sh
│   ├── extract_feature_files.sh
│   └── README.md
│
├── knowledgebase/         # For RAG docs (root-level shared)
│
├── docs/                  # 00_Overview → 99_Design_Decisions
│
└── README.md
```

---

# 📚 Documentation (Full)

All docs live in `docs/`:

* `00_Overview.md`
* `01_Getting_Started.md`
* `02_Architecture.md`
* `03_Developer_Guide.md`
* `04_Operations.md`
* `05_API_Reference.md`
* `99_Design_Decisions.md`

---

# 🧭 Roadmap (Short Version)

* Dashboard Phase 2 widgets
* Knowledgebase metadata + source filters
* Notifications + email/webhooks
* Role-based permissions per module
* Plugin system
* Multi-tenant support

---

# ⚠️ Disclaimer

DevCell is intended for internal use within secure environments.
If deploying externally, add:

* TLS / HTTPS
* Reverse proxy (NGINX, Caddy)
* Firewall & Zero Trust network rules
* Strong password enforcement

---