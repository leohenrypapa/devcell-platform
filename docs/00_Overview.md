# DevCell Platform – Overview

## Purpose
DevCell is a lightweight, full‑stack developer coordination platform designed to help small engineering teams operate with the clarity and efficiency of modern industry engineering organizations. It centralizes daily workflows—tasks, standups, knowledge, dashboards, AI assistance—into a single cohesive system.

This document provides a high‑level overview of the platform, its vision, and how major components fit together.

---

## Core Goals
- **Unify developer workflows** in one browser-based environment  
- **Enable fast planning & execution** through Tasks, Projects, and Standups  
- **Provide operational awareness** through dashboard widgets and automated AI summaries  
- **Support knowledge management** using document ingestion and RAG  
- **Remain fully self‑hosted** and deployable on lightweight hardware  
- **Keep architecture simple and maintainable** (React + FastAPI + SQLite + Chroma)

---

## High-Level Architecture

### Frontend (React + TypeScript)
- Modular pages for Tasks, Standups, Projects, Dashboard
- Global contexts:
  - `UserContext`
  - `ThemeContext`
  - `ToastContext`
- Shared UI components for consistency and rapid iteration
- Responsive layout with Sidebar + Topbar

### Backend (FastAPI)
- REST API for tasks, standups, projects, auth, and knowledgebase
- SQLite as the primary relational database
- Chroma as the vector storage for RAG
- JWT‑based authentication and simple role model

### RAG / Knowledge System
- Upload PDFs/TXT/MD
- Automatic text extraction + vector indexing
- Query endpoint returning context‑aware snippets
- AI summaries connected to Standups and Dashboard

---

## Key Platform Modules

### Tasks
- Create, edit, assign, update statuses
- Progress tracking & search
- Archive/unarchive
- Dashboard integration (My Tasks)

### Standups
- Yesterday/Today/Blockers workflow
- AI-generated daily summary
- Export to Markdown
- Convert standup items into tasks

### Dashboard
- My Today (tasks + schedule)
- Recent tasks & standups
- Unit snapshot
- AI SITREP generator
- Quick actions

### Projects
- Project list and ownership
- Ties tasks & standups back to larger units of work

### Knowledgebase
- Upload → extract → embed → query
- Index management (list, delete, preview)
- Backend + UI integration

---

## Design Principles

### 1. **Minimal Dependencies**
Backend uses FastAPI + SQLite + Chroma; frontend emphasizes clean React patterns with minimal external libraries.

### 2. **Clarity Over Abstraction**
Clear folder structures:
- `backend/app/...`
- `frontend/src/pages/...`
- `frontend/src/contexts/...`
- `frontend/src/components/...`

### 3. **API-First**
All features built on clean REST endpoints → easy to integrate with automation or CLI tools later.

### 4. **AI-Native Workflow**
The system assumes an LLM is part of daily workflow:
- Standup summaries
- Knowledge search
- SITREP dashboard summaries

---

## Current Feature Maturity

| Module        | Status                   |
|---------------|---------------------------|
| Auth          | Complete                  |
| Tasks         | Complete + Phase 2 in progress |
| Standups      | Complete                  |
| Dashboard     | Phase 1 done, Phase 2 upcoming |
| Knowledgebase | Complete (upload/index/query) |
| Projects      | Core functions complete   |
| RAG           | Operational                |

---

## Roadmap (High Level)

### Short Term (0.6.x)
- Dashboard Phase 2 widgets
- RAG improvements (metadata, search filters)
- Permissions model expansion

### Mid Term (0.7.x)
- Unit-level analytics dashboard
- Enhanced project reports
- Notification system

### Long Term (1.x)
- Plugin system
- Enterprise features
- Multi-tenant deployment

---

## Who This Platform Is For
- Small developer teams (military, research, startup)
- Units needing structured workflow without heavy enterprise tooling
- Teams with access to a local LLM server
- Environments requiring self‑hosted, offline‑capable solutions

---

## Related Documents
- `01_Getting_Started.md`
- `02_Architecture.md`
- `03_Developer_Guide.md`
- `04_Operations.md`
- `05_API_Reference.md`
