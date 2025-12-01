# 03_Developer_Guide – DevCell Platform

## Purpose
This guide explains how developers should work inside the DevCell codebase, including coding conventions, folder structure, feature development workflow, testing, and best practices for maintaining a clean and scalable system.

It is the primary reference for contributing to the platform.

---

# 1. Development Philosophy

### ✔ Simple > Clever  
Favor clarity and maintainability over abstraction.

### ✔ Predictable folder structure  
Frontend and backend follow stable patterns so new developers onboard fast.

### ✔ Features are vertical slices  
Each new feature updates:
- Backend router  
- Backend store  
- Pydantic schemas  
- Frontend page  
- UI components  
- Documentation  

### ✔ AI-native workflow  
Use integrated RAG + Standup summaries during development.

---

# 2. Backend Development Guide (FastAPI)

## 2.1 Adding a New API Module

Example: `notes` module

1. **Create router**
```
backend/app/api/notes.py
```

2. **Add store**
```
backend/app/stores/notes_store.py
```

3. **Add Pydantic schemas**
```
backend/app/schemas/notes.py
```

4. **Register router in `main.py`**
```python
app.include_router(notes_router, prefix="/notes", tags=["notes"])
```

5. **Update documentation**
- Add entry in `05_API_Reference.md`

---

## 2.2 Store Layer Pattern

Every store file implements the same pattern:

```python
def get(db): ...
def list(): ...
def create(): ...
def update(): ...
def delete(): ...
```

This keeps all DB logic separate from route logic.

---

## 2.3 Schema Pattern

Schemas always include:
- Input model (e.g., `TaskCreate`)
- Output model (`TaskPublic`)
- Shared base model (`TaskBase`)

Example:
```python
class TaskCreate(BaseModel):
    title: str
    description: Optional[str]
```

---

## 2.4 Database Migrations

SQLite is lightweight → no Alembic required.

If schema changes:
1. Add new columns in `db/init.py`
2. Add fallback handling in `_row_to_*()` functions
3. Document change in `CHANGELOG.md`

---

# 3. Frontend Development Guide (React + TypeScript)

## 3.1 Folder Structure

```
frontend/src/
│
├── pages/          # Routed pages
├── components/     # Reusable UI
├── contexts/       # Global state
├── hooks/          # Custom hooks
└── utils/          # API helpers
```

---

## 3.2 Adding a New Page

Example: `NotesPage`

1. Create file:
```
frontend/src/pages/NotesPage.tsx
```

2. Add route in `App.tsx`:
```tsx
<Route path="/notes" element={<NotesPage />} />
```

3. Add link in `Sidebar.tsx`

4. Add page-specific components if needed:
```
frontend/src/components/notes/
```

---

## 3.3 Adding a New UI Component

Example: `StatusPill.tsx`

1. Create component
2. Add props interface
3. Keep styles local using Tailwind or CSS vars
4. Document usage inside component header

---

## 3.4 Using Contexts

### UserContext
- Handles login/logout
- Persists token in `localStorage`

### ThemeContext
- Switch light/dark modes
- Wrap root: `<ThemeProvider>`

### ToastContext
- Trigger feedback from anywhere:
```tsx
showToast("Task saved!", "success")
```

---

# 4. API Requests From Frontend

Use a unified fetch helper:

```ts
import { api } from "../utils/api";

api.get("/tasks");
api.post("/tasks", payload);
```

Automatically injects:
- `Authorization` header
- JSON parsing
- Error normalization

---

# 5. Coding Conventions

## 5.1 Backend
- Use snake_case
- Small, focused functions
- Database access only in stores
- 1 router per module

## 5.2 Frontend
- Use PascalCase for components
- Prefer functional components + hooks
- Keep components < 150 lines
- Reuse UI primitives

## 5.3 Commits
Follow **Conventional Commits**:
```
feat: add task archiving
fix: dashboard date bug
docs: update architecture
refactor: simplify user store
```

---

# 6. Adding a New Feature (Full Walkthrough)

Example: "Task Comments"

### Step 1 — Backend Store
- Create table
- Add store functions

### Step 2 — Backend API
- Add CRUD endpoints
- Write schemas

### Step 3 — Frontend Components
- `CommentList`
- `CommentForm`

### Step 4 — Page Integration
- Display on `TaskDetail`

### Step 5 — Test locally
- Use Swagger for API
- Validate UI states

### Step 6 — Commit & update docs
- Always update docs when endpoints change

---

# 7. Testing

## Backend Testing
Run:
```bash
pytest
```

Use lightweight tests:
- Store operations
- API responses
- RAG pipeline basics

## Frontend Testing (optional)
- Vitest + React Testing Library
- Snapshot tests for components

---

# 8. Performance Best Practices

- Use indexes only if necessary on SQLite  
- Avoid over-fetching on frontend  
- Cache API responses where appropriate  
- Reuse vector embeddings; avoid recomputing  

---

# 9. Deployment Checklist

- `.env` files updated  
- RAG folder permissions correct  
- Systemd running backend  
- Reverse proxy configured  
- SSL (optional)  

---

# 10. Contributing Workflow

1. Create feature branch
2. Implement backend
3. Implement frontend
4. Update docs
5. Open PR
6. Approve → merge

---

# 11. Related Documents
- `02_Architecture.md`
- `04_Operations.md`
- `05_API_Reference.md`