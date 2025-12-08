# Backend Structure

## Overview
The backend is built with FastAPI, following a modular service architecture.

## Directory Layout
```
backend/app/
├── api/
│   └── routes/
├── core/
├── services/
├── schemas/
├── db.py
└── main.py
```

## Key Concepts
- Routes: thin controllers
- Services: business logic
- Schemas: Pydantic models
- Core: shared utilities (LLM client, security)
