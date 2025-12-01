# 99_Design_Decisions – DevCell Platform (ADR Summary)

This document contains high‑level Architecture Decision Records (ADRs) that describe *why* core technical decisions were made for the DevCell Platform.  
These are concise and practical, not long-form ADR templates.

---

# 1. Programming Languages & Frameworks

## 1.1 **FastAPI for Backend**
**Decision:** Use FastAPI instead of Django/Flask.  
**Why:**
- Extremely fast for prototyping and production  
- Automatic OpenAPI / Swagger generation  
- Clean async architecture  
- Works well with lightweight deployments (SQLite)  
- Strong typing + pydantic models fit our data patterns

---

## 1.2 **React + TypeScript for Frontend**
**Decision:** Use React instead of Vue/Angular.  
**Why:**
- Best ecosystem for enterprise‑style dashboards  
- TypeScript ensures safe refactoring  
- Vite makes build/dev extremely fast  
- Large library ecosystem for UI components  

---

# 2. Storage Layer Decisions

## 2.1 **SQLite for primary database**
**Decision:** Avoid Postgres/MySQL initially.  
**Why:**
- Zero admin overhead  
- Fast local development  
- Ideal for lightweight VM or on‑prem servers  
- Transactions safe enough for planned workload  
- Easy backup/restore (just a file)

**Risk:**  
Scaling to >50k tasks or >10 active teams may require moving to Postgres.

---

## 2.2 **Chroma for vector storage**
**Decision:** Use Chroma as embedded vector DB.  
**Why:**
- Extremely simple to initialize and maintain  
- No extra services needed  
- Works offline  
- Straightforward metadata storage  

---

# 3. Authentication Decisions

## 3.1 **JWT-based auth with simple roles**
**Decision:** Use stateless tokens + role field.  
**Why:**
- Lightweight  
- Works with reverse proxies  
- No session storage  
- Easy future upgrade to permissions model  

---

## 3.2 **Simple salted SHA256 password hashing (demo)**
**Decision:** Use simple hashing, NOT for production.  
**Why:**
- Internal MVP  
- Easy to replace with argon2/bcrypt later  

---

# 4. Architecture Principles

## 4.1 **Vertical slice architecture**
**Decision:** Each feature is a vertical module:  
- router → store → schema → frontend page → UI components  
**Why:**  
Keeps code modular, easier to onboard new developers.

---

## 4.2 **Store Layer as DB boundary**
**Decision:** All DB logic is contained in `stores/`.  
**Why:**  
- Keeps API thin  
- Makes testing easier  
- Clear separation of concerns  

---

## 4.3 **Context‑based global state in frontend**
**Decision:** Use React Context for user, theme, and toasts.  
**Why:**  
- Avoids Redux complexity  
- Keeps small state surface  
- Fits app size (single‑team dashboard)

---

# 5. RAG / Knowledge Pipeline Decisions

## 5.1 **Chunk-based ingestion with embedding**
**Decision:** Split text → embed → store as vectors.  
**Why:**  
- Works with any LLM backend  
- Flexible upgrades  
- Easier to extract context for Dashboard / Standups  

---

## 5.2 **Store original files on disk, not DB**
**Decision:** Save PDF/TXT/MD files in a directory.  
**Why:**  
- Simpler backups  
- Avoid DB bloat  
- Prevent long base64 columns  

---

# 6. Deployment Decisions

## 6.1 **systemd for backend runtime**
**Decision:** Use systemd for production.  
**Why:**  
- Auto-restart  
- Logging via journalctl  
- Secure, resource‑controlled  

---

## 6.2 **NGINX as reverse proxy**
**Decision:** Use NGINX instead of Caddy/Traefik.  
**Why:**  
- Battle tested  
- Easy static hosting for Vite frontend  
- Simple proxy rules for API  

---

# 7. UI/UX Decisions

## 7.1 **Sidebar + Topbar layout**
**Why:**  
- Standard developer-dashboard pattern  
- Works on desktop-first experience, which is expected  

---

## 7.2 **Toast system instead of alerts**
**Why:**  
- Non-blocking UX  
- Consistent message types (success/error/info)  

---

# 8. Future Decisions (Planned)

## 8.1 Permissions Model  
Move from simple `role` → granular permission policies.

## 8.2 Plugin System  
Allow external modules/pages to plug into DevCell.

## 8.3 Multi-tenant Support  
Support multiple units/teams in one backend.

---

# 9. Related Docs
- `02_Aɾchitecture.md`
- `03_Developer_Guide.md`
- `04_Operations.md`