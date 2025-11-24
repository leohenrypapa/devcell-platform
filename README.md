# DevCell Platform

Internal developer communication and coordination portal for your unit.

## Features
- LLM Chat Assistant
- Knowledgebase RAG search
- Daily Standups + AI Summary
- Projects tracking
- Code Review helper
- Dashboard SITREP summary
- Local user identity

## Quick Start

### Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 9000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

LLM server must be running and reachable at `LLM_BASE_URL` configured in `config.py`.

See ARCHITECTURE.md for more.