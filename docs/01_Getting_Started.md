# Getting Started – DevCell Platform

## Introduction
This guide helps you set up the full DevCell development environment, including backend, frontend, and optional local LLM/RAG services. It is optimized for fast onboarding and minimal dependencies.

---

# 1. Prerequisites

## System Requirements
- Linux, macOS, or WSL2
- Python 3.10+
- Node.js 18+
- Git

## Optional (for AI/RAG)
- Local LLM server (FastAPI, Oobabooga, LM Studio, Ollama, or custom)
- ChromaDB (embedded — no separate install needed)

---

# 2. Repository Structure

```
devcell-platform/
│
├── backend/
│   ├── app/
│   ├── tests/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
└── docs/
```

---

# 3. Backend Setup (FastAPI)

## 3.1 Create Virtual Environment
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 3.2 Environment Variables
Create a `.env` file inside `backend/`:

```
JWT_SECRET=your_secret
JWT_ALGORITHM=HS256
LLM_ENDPOINT=http://localhost:8001/api/v1/query    # optional
KNOWLEDGEBASE_DIR=Knowledgebase
```

## 3.3 Run Backend
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 9000
```

## 3.4 API Docs
- Swagger UI → `http://localhost:9000/docs`
- ReDoc → `http://localhost:9000/redoc`

---

# 4. Frontend Setup (React + TypeScript)

## 4.1 Install Dependencies
```bash
cd frontend
npm install
```

## 4.2 Environment Variables
Create `.env`:

```
VITE_API_URL=http://localhost:9000
```

## 4.3 Run Frontend
```bash
npm run dev
```

Frontend is available at:
```
http://localhost:5173
```

---

# 5. Logging In

Initial default users (example):
```
username: admin
password: admin123
role: admin
```

You can modify or seed users in:
```
backend/app/db/init.py
backend/app/stores/user_store.py
```

---

# 6. Knowledgebase / RAG Setup

## 6.1 Enable Document Upload
Ensure this folder exists:
```
backend/Knowledgebase/
```

## 6.2 Uploading Docs
Available file types:
- PDF
- TXT
- MD

Uploaded files:
- Extracted into plain text
- Embedded via Chroma
- Listed in UI under **Knowledge**

## 6.3 Querying the RAG System
You can test via API:
```bash
curl -X POST http://localhost:9000/rag/query   -H "Content-Type: application/json"   -d '{"question": "How does tasks module work?"}'
```

---

# 7. Running Full Stack Together

### Option A — Two terminals
```
Terminal 1 → backend
Terminal 2 → frontend
```

### Option B — tmux
Recommended for servers.

### Option C — systemd (server mode)
Install system service for backend:
```
sudo nano /etc/systemd/system/devcell.service
```

---

# 8. Recommended Development Workflow

1. Run backend (`uvicorn`)
2. Run frontend (`npm run dev`)
3. Make changes
4. Use Swagger to verify API
5. Commit with conventional commits
6. Update docs when adding endpoints
7. Use AI tools (SITREP, Standup AI, RAG)

---

# 9. Troubleshooting

### Backend Won’t Start
- Missing `.env`
- Wrong Python version
- Port 9000 already in use

### Frontend Errors
- Delete `node_modules` → reinstall
- Check `.env` variable format
- Vite requires restart after env changes

### Database Issues
SQLite file is stored in:
```
backend/app/db/devcell.db
```
Delete to reset:
```
rm backend/app/db/devcell.db
```

---

# 10. Next Steps
Once environment is running, read:

- `02_Architecture.md` → deeper architecture
- `03_Developer_Guide.md` → how to implement features
- `04_Operations.md` → deployment & maintenance
