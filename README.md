# DevCell Platform

DevCell is a lightweight internal developer coordination platform designed for small engineering teams (military, research, startup) that want structured workflow tools without heavy enterprise systems.  
It runs fully self-hosted and integrates directly with **your own LLM server**.

The platform provides:

- Shared task tracking  
- Daily standups  
- Dashboard morning brief  
- Knowledgebase with RAG search  
- AI-assisted summaries and SITREPs  
- Local role-based authentication  
- Clean, modern React UI  

---

## 🚀 Features

### **Developer Workflow**
- **Tasks Module**
  - Create/edit tasks
  - Inline status & progress updates
  - Search bar (title, description, owner, project)
  - Archive / unarchive
  - Status pills (`todo`, `in_progress`, `blocked`, `done`)
  - Dashboard integration (My Tasks, Recent Tasks)

- **Projects**
  - Track objectives by project
  - Filter tasks by project
  - Project-level summaries (future)

- **Daily Standups**
  - Yesterday / Today / Blockers
  - Markdown export
  - AI-generated standup summary
  - Convert standup items → tasks

### **AI-Integrated Modules**
- **LLM Chat Assistant**
  - Chat with your self-hosted LLM
  - Great for reasoning, explanations, debugging

- **AI Code Review**
  - Paste code + instructions
  - Your LLM returns improvements, optimizations, security notes

- **AI SITREP**
  - Dashboard button generates a unit Situation Report
  - Based on tasks, standups, and recent activity

- **Knowledgebase / RAG**
  - Upload PDF / TXT / MD
  - Automatic text extraction
  - Vector embedding + Chroma indexing
  - Query documents using RAG

### **Dashboard**
- Morning Brief (My Today + My Tasks)
- Recent Tasks (last 5)
- Recent Standups (last 3 days)
- Quick Actions
- Unit Snapshot
- AI Unit SITREP generator

### **Identity & Access**
- Local users (SQLite-based)
- Username/password login
- `admin` vs `standard` roles
- Admin user management page

---

## 🏗 High-Level Architecture

### **Frontend**
- React + TypeScript + Vite
- Pages:
  - Login
  - Dashboard
  - Tasks
  - Standups
  - Projects
  - Knowledgebase
  - LLM Chat
  - Code Review
  - Admin
- Global contexts:
  - `UserContext`  
  - `ThemeContext` (light/dark)  
  - `ToastContext`  
- Clean UI layout (Sidebar + Topbar)

### **Backend**
- FastAPI + Python 3
- Modules:
  - Auth
  - Tasks
  - Standups
  - Dashboard
  - Projects
  - Knowledgebase / RAG
  - LLM proxy tools
- SQLite for relational data
- Chroma for vector embeddings
- JWT-based authentication

### **LLM Server**
- External model you run locally:
  - OpenAI API-compatible  
  - Qwen  
  - LM Studio  
  - Ollama  
  - vLLM  
  - Custom endpoints  
- Configurable via environment variables.

---

## ⚡ Quick Start (Local Development)

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 9000
```

Environment variables (`backend/.env`):

```env
JWT_SECRET=your_secret
JWT_ALGORITHM=HS256
LLM_ENDPOINT=http://localhost:8001/api/v1/query
KNOWLEDGEBASE_DIR=Knowledgebase
```

---

### 2. Frontend

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

## 📁 Project Structure

```
devcell-platform/
  backend/
  frontend/
  docs/
  Knowledgebase/
  README.md
```

---

## 📚 Documentation

Full documentation is in the `docs/` directory:

- `00_Overview.md`
- `01_Getting_Started.md`
- `02_Architecture.md`
- `03_Developer_Guide.md`
- `04_Operations.md`
- `05_API_Reference.md`
- `99_Design_Decisions.md`

---

## 🧭 Roadmap (Summary)

- Dashboard Phase 2 widgets  
- RAG metadata + filters  
- Notification system  
- Permissions model  
- Plugin framework  
- Multi-tenant support (future)

---

## ⚠️ Disclaimer
DevCell is designed for internal use within secure environments and is not a public SaaS platform.  
External security hardening (TLS, reverse proxy, SSH policy) is recommended for production.