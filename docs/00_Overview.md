# 00_Overview – DevCell Platform

## Purpose

The DevCell Platform is an internal developer coordination and communication system built for small technical teams or military unit dev cells. It centralizes daily standups, project tracking, knowledge management, and AI-assisted workflows into one lightweight and deployable platform.

This file provides a **short, executive-level overview** of what the platform is, why it exists, and how it is structured.  
For detailed documentation, see the other markdown files in the `docs/` folder.

---

## What the Platform Provides

### ✔ Unified Work Coordination
The platform consolidates the essential tools a developer team needs:

- Daily standups (yesterday, today, blockers)
- Project tracking with statuses
- Dashboard morning brief
- Knowledgebase + RAG search
- AI-powered chat and code review
- Simple user login + admin management

### ✔ AI-Enhanced Operations
The system uses your local LLM server to provide:

- Daily SITREP summaries of standups
- Per-project progress summaries
- Knowledge-based answers (RAG)
- Chat + code review capabilities

This transforms raw activity into actionable information.

### ✔ Lightweight & Local
Designed to run **entirely on your own infrastructure**:

- Frontend: React + Vite  
- Backend: FastAPI + Python  
- DB: SQLite  
- LLM: Your internal model (OpenAI-compatible)  
- Deployment: Docker or local  

No external cloud dependencies.

---

## Architecture (High Level)

```
+-------------------+           +---------------------+
|     Frontend      | <-------> |       Backend       |
| React + TypeScript|  REST API |   FastAPI (Python)  |
+-------------------+           +---------------------+
                                       |
                                       | calls
                                       v
                              +------------------+
                              |     LLM Server   |
                              | (local / OpenAI) |
                              +------------------+

                              +------------------+
                              |     SQLite DB    |
                              +------------------+
```

### Modules

- **Standups** – daily entries, CRUD, AI summary  
- **Projects** – task grouping, statuses, summary  
- **Dashboard** – unit & personal snapshot + SITREP  
- **Knowledge/RAG** – document search with context  
- **Chat** – LLM conversation  
- **Code Review** – AI code critique  
- **Auth/Admin** – users + roles  

---

## Why This Was Built

Military/technical units often struggle with:

- Scattered communication  
- No central record of work  
- Leadership lacking visibility  
- No automated summaries  
- Inconsistent standup processes  
- No shared reference knowledge  

The DevCell Platform solves this by providing:

- A simple daily workflow  
- Clear project ownership  
- Automatic summaries  
- Searchable internal knowledge  
- A lightweight system that runs anywhere  

---

## Who This Is For

- Small development teams  
- Cyber/IT sections  
- Military unit dev cells  
- Research groups  
- Any team using internal LLMs  

---

## How to Use This Document

This file is the **entry point** for anyone onboarding.

After reading this Overview, continue with:

1. **01_Architecture.md** – how the system is built  
2. **02_Auth.md** – login + roles  
3. **03_Features.md** – what everything does  
4. **04–06** – standups, projects, dashboard details  
5. **07_Deployment.md** – for deployers/admins  
6. **08_Operations.md** – for day-to-day ops  

---

## Summary

The DevCell Platform is a self-contained workflow hub that:

- Keeps your developers aligned  
- Gives leadership instant visibility  
- Enhances operations with AI  
- Runs fully on your own hardware  
- Scales with your unit’s needs  

It’s the foundation for an organized, efficient internal development environment.
