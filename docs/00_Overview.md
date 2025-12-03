# DevCell Platform – Overview

## Purpose
DevCell is a lightweight, full-stack developer coordination platform designed to help small engineering teams operate with the clarity and efficiency of modern industry engineering organizations. It centralizes daily workflows—tasks, standups, knowledge, dashboards, AI assistance—into a single cohesive system.

This document provides a high-level overview of the platform, its vision, and how major components fit together.

---

## Core Goals
- **Unify developer workflows** in one browser-based environment  
- **Enable fast planning & execution** through Tasks, Projects, and Standups  
- **Provide operational awareness** through dashboard widgets and automated AI summaries  
- **Support knowledge management** using document ingestion and RAG  
- **Remain fully self-hosted** and deployable on lightweight hardware  
- **Keep architecture simple and maintainable** (React + FastAPI + SQLite + Chroma)

---

## High-Level Architecture

### Frontend (React + TypeScript)
- Modular pages for Tasks, Standups, Projects, Dashboard, Knowledge
- Global contexts:
  - `UserContext`
  - `ThemeContext`
  - `ToastContext`
- Shared UI components for consistency and rapid iteration
- Responsive layout with Sidebar + Topbar
- Theme-aware (light/dark) styling

### Backend (FastAPI)
- REST API for tasks, standups, projects, auth, knowledgebase, dashboard
- SQLite as the primary relational database
- Chroma as the vector storage for RAG
- JWT-based authentication and simple role model (`admin`, `standard`)
- Store layer (`*_store.py`) as the DB boundary

### RAG / Knowledge System
- Upload PDFs/TXT/MD
- Automatic text extraction + vector indexing
- Query endpoint returning context-aware snippets
- AI summaries connected to Standups and Dashboard (SITREP, daily summaries, etc.)

---

## Key Platform Modules

### Tasks
- Create, edit, and update status for personal and project-linked tasks
- **Owner-based model** (tasks are owned by the authenticated user; admins can view all)
- Statuses: `todo`, `in_progress`, `blocked`, `done`
- Progress tracking (0–100%) and due dates
- Archive / deactivate tasks via `is_active` flag
- **Power-user filters & presets:**
  - Mine vs all tasks (with role-aware owner filters)
  - Filter by project, status, and active state
  - Search by title, description, and project
- **Quick workflow helpers:**
  - Bulk selection (archive / delete)
  - Quick due-date shortcuts (Today / Tomorrow / Next week / Clear)
- Dashboard integration (“My Active Tasks”, Recent Tasks widgets)

### Standups
- Daily **Yesterday / Today / Blockers** workflow
- Per-user entries keyed by `name` (username)
- AI-generated daily summary (for today or a given date)
- Export standups as Markdown for sharing or reporting
- **Standups → Tasks integration:**
  - From the Standups page, you can convert standup items into tasks
  - Tasks created from standups preserve the original text and can be tied to a project
  - Tight loop between daily reporting and actionable work

### Dashboard
- “My Today” overview
  - Today’s standups
  - My active tasks
  - My projects
- Recent tasks & standups (time-boxed lists)
- Unit snapshot / situation awareness block
- AI SITREP generator using RAG + standup/task context
- Quick actions to jump into Tasks / Standups pages

### Projects
- Project list and ownership
- Lightweight metadata (name, description)
- Links tasks & standups back to larger units of work
- Used as a primary way to group tasks and to scope standup work

### Knowledgebase
- Upload → extract → embed → query pipeline
- Supports PDF, TXT, MD
- Index management (list, delete, preview)
- Integrated with RAG API used by Dashboard and Chat

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
- `docs/...` for platform documentation

### 3. **API-First**
All features are built on top of clean REST endpoints → easy to integrate with CLI tools, automations, or scripting.

### 4. **AI-Native Workflow**
The system assumes an LLM is part of daily workflow:
- Standup summaries
- Knowledge search
- SITREP dashboard summaries
- Future automations (e.g., task suggestions, code review helpers)

---

## Current Feature Maturity

| Module        | Status                              |
|---------------|-------------------------------------|
| Auth          | Complete                            |
| Tasks         | Complete + Phase 2 power-user UX    |
| Standups      | Complete + Tasks integration        |
| Dashboard     | Phase 1 complete, Phase 2 ongoing   |
| Knowledgebase | Complete (upload/index/query)       |
| Projects      | Core functions complete             |
| RAG           | Operational                         |

---

## Roadmap (High Level)

### Short Term (0.6.x)
- Dashboard Phase 2 widgets (deeper task/standup integration)
- RAG improvements (metadata, search filters)
- Permissions/role model expansion

### Mid Term (0.7.x)
- Unit-level analytics dashboard
- Enhanced project reports
- Notification / alerting system

### Long Term (1.x)
- Plugin system for custom modules/pages
- Enterprise features (SSO, audit logging)
- Multi-tenant deployment options

---

## Who This Platform Is For
- Small developer teams (military, research, startup)
- Units needing structured workflow without heavy enterprise tooling
- Teams with access to a local LLM server
- Environments requiring self-hosted, offline-capable solutions

---

## Related Documents
- `01_Getting_Started.md`
- `02_Architecture.md`
- `03_Developer_Guide.md`
- `04_Operations.md`
- `05_API_Reference.md`
- `99_Design_Decisions.md`
