# Installation Guide

## Requirements
- Python 3.10+
- Node 18+
- Local LLM runtime (Ollama / LM Studio / vLLM)
- Git

## Backend Setup
```
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## Frontend Setup
```
cd frontend
npm install
```

## Environment Variables
- `LLM_ENDPOINT=http://localhost:11434`
- `JWT_SECRET=your-secret`
- `DB_PATH=devcell.db`

