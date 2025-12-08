# DevCell Platform – Overview

DevCell is a full-stack, self-hosted developer operations platform designed for
small technical teams, cyber units, and internal research groups who need to:

- coordinate tasks & projects
- run structured daily standups
- maintain a searchable knowledgebase with embeddings + RAG
- integrate local LLMs for chat, SITREPs, and code review
- manage training pipelines and seed tasks
- operate in air-gapped or restricted environments

DevCell combines a **FastAPI backend**, **React + TypeScript frontend**, and a
modular architecture built for extensibility and clarity.

---

## 🎯 Purpose

DevCell solves the problem of fragmented developer communication by unifying:

- task tracking  
- standup reporting  
- project metadata  
- knowledge storage  
- local LLM workflows  
- developer dashboards  
- role-based permissions  
- training and skill-pipeline management  

The platform is optimized for:

- **On-prem / offline / secure networks**  
- **Small, cross-functional teams**  
- **Developer autonomy**  
- **Rapid internal tooling development**  

No external SaaS dependencies are required when running with a local LLM.

---

## 🧩 Core Features

### **1. Task & Project Management**
- CRUD for tasks and projects  
- Bulk updates, filters, presets, and due-date shortcuts  
- Project membership and roles (owner, member)  
- Task lineage via Standup → Task conversion  
- Deep integration with Dashboard and SITREP  

### **2. Daily Standups**
- Classic *Yesterday / Today / Blockers* workflow  
- Per-user daily entries  
- LLM-powered summary generation  
- Standup → Task conversion assistant  

### **3. Knowledgebase + RAG Search**
- Local storage of documents  
- Embedding pipeline using the configured LLM  
- Chroma vector store  
- RAG-powered question answering  
- Safe deletion and validation logic  

### **4. Local LLM Integration**
- Unified `/chat` API  
- System-prompted personas for SITREP, review, or analysis  
- Code review assistance via `review_service.py`  

### **5. Dashboard (My Today)**
- Standup status  
- Active tasks  
- Recent work items  
- One-click SITREP generation  

### **6. Training Module**
- Import or generate structured training roadmaps  
- Seed tasks for automated onboarding  
- Alignment with DevCell standups + knowledgebase  

### **7. Authentication & Permissions**
- JWT-based authentication  
- Global roles: `user`, `admin`  
- **Project-level permissions** via `project_members` table  
- Admin UI for user management  

### **8. Simple Deployment**
- Single-node FastAPI service  
- Vite React frontend  
- SQLite + ChromaDB  
- No external dependency required for core features  

---

## 🏗️ High-Level Architecture

```

┌──────────────────────────┐
│        Frontend          │
│  React + TypeScript      │
│  Pages / Components      │
└───────────────▲──────────┘
│ REST + WebSocket (future)
┌───────────────┴──────────┐
│         Backend           │
│ FastAPI + Services Layer │
│ Auth / Tasks / Projects  │
│ Standups / KB / LLM      │
└───────────────▲──────────┘
│
┌───────────────┴──────────┐
│   Storage + Embeddings    │
│ SQLite • ChromaDB • FS    │
└───────────────────────────┘

```

---

## 🌐 Deployment Models

DevCell supports multiple deployment environments:

### **Local Development**
- Runs via `uvicorn` + Vite dev server  
- Hot reload for frontend and backend  

### **On-Prem Production**
- Backend served behind NGINX  
- Frontend served as static bundle  
- Optional local LLM (Ollama, LM Studio, or custom endpoint)  

### **Air-gapped Environments**
- All features continue to work offline  
- LLM endpoint can be a local container or standalone model server  

---

## 📦 Repository Structure Summary

```

devcell-platform/
│
├── backend/app/
│   ├── api/routes/
│   ├── services/
│   ├── schemas/
│   ├── core/
│   ├── knowledgebase/
│   └── main.py
│
├── frontend/src/
│   ├── pages/
│   ├── components/
│   ├── context/
│   └── lib/
│
└── docs/

```

---

## 🔄 How DevCell Modules Work Together

| Module | Primary Functions | Integrations |
|--------|-------------------|--------------|
| Tasks | CRUD, filters, bulk ops | Dashboard, Projects, Standups |
| Projects | Metadata, membership | Tasks, Permissions |
| Standups | Y/T/B reports, summaries | Dashboard, Tasks |
| Knowledgebase | RAG storage & search | Chat, SITREP |
| Chat | LLM interface | Review, Dashboard |
| Review | LLM code review | Chat, Tasks |
| Training | Roadmaps, seed tasks | Tasks, Knowledgebase |
| Permissions | Project-level access | Projects, Dashboard |

---

## 🔮 Future Enhancements (from CHANGELOG & roadmap)

- Plugin system for custom internal modules  
- Multi-tenant support for multiple units/divisions  
- Expanded analytics dashboards  
- Fine-grained permission rules per module  
- Optional WebSocket/real-time sync layer  

---

## 📚 Related Documentation

- **Features** → `overview/features.md`  
- **Roadmap** → `overview/roadmap.md`  
- **Backend Architecture** → `architecture/backend.md`  
- **Frontend Architecture** → `architecture/frontend.md`  
- **Modules** → `modules/*`  
- **API Reference** → `api/*`  
- **Developer Guide** → `developer/*`  
- **Operations** → `operations/*`  

---

```

© DevCell Platform Documentation — GitHub OSS Style

```