# Operations Guide
# Operations Guide

## Requirements
- Python 3.10+
- Node 18+
- Running LLM server (vLLM/Qwen)

## Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 9000
```

## Frontend
```bash
cd frontend
npm install
npm run dev
```

## Knowledgebase
Put `.txt` / `.md` files into:
```
Knowledgebase/
```
Restart backend to reindex.

## Troubleshooting
- LLM connection errors → check `LLM_BASE_URL`
- 404 on frontend → verify React router paths
- Standups/projects lost → backend restart clears memory
