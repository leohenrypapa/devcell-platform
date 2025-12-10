# DevCell Developer Onboarding  
Modern FastAPI + React + Local LLM + RAG Workflow  
_Last Updated: 2025_

Welcome to the DevCell Platform.  
This guide delivers a complete, **big-tech-style onboarding flow** for new developers.  
It is designed to get you productive within **15–20 minutes**.

---

# 1. Quick Start (TL;DR)

### Prerequisites
| Tool | Required Version |
|------|------------------|
| Python | 3.10+ |
| Node.js | 18+ |
| pnpm | latest |
| vLLM | local server |
| Qwen 7B Coder | local model |
| SQLite | built-in |

### Run Everything
```bash
# Backend (FastAPI)
cd backend
uvicorn app.main:app --reload --port 9000

# Frontend (React + Vite)
cd frontend
pnpm install
pnpm dev

# Local vLLM server
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-Coder-7B \
  --port 8000
````

### Verify System Works

* Backend health: [http://localhost:9000/health](http://localhost:9000/health)
* Frontend UI: [http://localhost:5173](http://localhost:5173)
* LLM test: `curl http://localhost:8000/v1/models`

---

# 2. Repository Overview

```
devcell-platform/
├── backend/         # FastAPI app (services, schemas, routes)
├── frontend/        # React + TypeScript SPA
├── docs/            # Developer docs, architecture, ADRs
└── scripts/         # Dev helpers (db init, convenience scripts)
```

Development follows the architecture defined in ADR-003 (FastAPI + React) with:

* **Backend:** service-oriented modules
* **Frontend:** page/component architecture
* **LLM:** local-only per ADR-001
* **DB:** SQLite only per ADR-002
* **RAG:** optional but included in onboarding per ADR-008

---

# 3. First-Time Setup

## 3.1 Backend Environment (Python)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Initialize SQLite

```bash
python -c "import sys; sys.path.insert(0, 'backend'); \
  from app.db import init_db; init_db()"
```

---

## 3.2 Frontend Environment (React + TypeScript)

```bash
cd frontend
pnpm install
```

---

## 3.3 Local LLM Environment (vLLM)

Install vLLM:

```bash
pip install vllm
```

Download model:

```bash
# HuggingFace CLI example
huggingface-cli download Qwen/Qwen2.5-Coder-7B --local-dir models/qwen7b-coder
```

Start server:

```bash
python -m vllm.entrypoints.openai.api_server \
  --model models/qwen7b-coder \
  --port 8000
```

---

## 3.4 RAG Initialization (Default)

```bash
cd backend
python app/services/rag_init.py
```

This populates the SQLite vector store (Chroma-backed or local embedding approach depending on configuration).

---

# 4. Daily Development Workflow

The developer workflow is:

```
1. Start backend
2. Start frontend
3. Start local vLLM server
4. Work on a feature branch
5. Use bundle-based workflow for PRs
6. Run structured code reviews (ADR-007)
```

### 4.1 Start Backend

```bash
cd backend
uvicorn app.main:app --reload --port 9000
```

### 4.2 Start Frontend

```bash
cd frontend
pnpm dev
```

### 4.3 Start LLM

```bash
python -m vllm.entrypoints.openai.api_server \
  --model models/qwen7b-coder \
  --port 8000
```

---

# 5. Bundle-Based Development Workflow

*Required for all PRs*

ADR-007 + your platform rules require **small, isolated development bundles**.

### 5.1 Extract bundle before editing

Use provided scripts:

* `extract_backend_bundle.sh`
* `extract_frontend_bundle.sh`
* `extract_docs_bundle.sh`

Bundles enforce:

* minimal diffs
* scoped code review
* repeatable incremental development

### 5.2 Submit PR using slice-based structure

Example slice structure:

```
slice-1-backend-services-update
slice-2-frontend-ui-polish
slice-3-docs-review
```

Every slice must include:

* description
* what changed
* affected components
* test steps

---

# 6. Code Review Protocol (ADR-007)

Each PR must include:

### **1. Summary**

```
Module:
Purpose:
Changes:
```

### **2. Risk Assessment**

```
Impact:
Edge Cases:
Failure Modes:
```

### **3. Test Steps**

```
Backend tests
Frontend manual tests
LLM/RAG verification
```

### **4. Bundle Diff Verification**

Confirm:

* Only bundle files changed
* No cross-module leakage

---

# 7. Troubleshooting

### Backend port already in use

```bash
lsof -i :9000
kill <PID>
```

### vLLM fails to load

* Check VRAM usage
* Ensure model folder is correct

### “SQLite database is locked”

Avoid parallel writes; restart backend.

### Frontend fails to start

Verify node version:

```bash
node -v
```

---

# 8. Developer Architecture Diagram

```
+----------+         +-----------+        +----------------------+
| Frontend | <-----> | FastAPI   | <----> | Local vLLM (Qwen 7B) |
+----------+         +-----------+        +----------------------+
       ^                    |
       |                    v
       |            +-----------------+
       +----------> | RAG VectorStore |
                    +-----------------+
```

---

# 9. Completion Checklist

✔ Backend runs
✔ Frontend runs
✔ LLM responds
✔ RAG index built
✔ Feature branch created
✔ Bundle created
✔ PR uses structured review

You are now fully onboarded.