# Backend Structure (FastAPI)

The backend follows a **service-oriented architecture** defined in ADR-003.

````

backend/app/
├── api/          # Route handlers (thin)
│   └── routes/
├── core/         # Shared utilities (LLM client, RAG utils, security)
├── services/     # Business logic
├── schemas/      # Pydantic models
├── db.py         # SQLite initialization
└── main.py       # FastAPI entrypoint

````

---

# 1. Startup

Activate environment:
```bash
cd backend
source .venv/bin/activate
````

Run server:

```bash
uvicorn app.main:app --reload --port 9000
```

Health check:

```
GET /health
```

---

# 2. Database (ADR-002 SQLite Only)

Initialize:

```bash
python -c "import sys; sys.path.insert(0, 'backend'); \
  from app.db import init_db; init_db()"
```

SQLite lives under:

```
backend/devcell.db
```

No migrations required.

---

# 3. API Layer

### Routes (`api/routes`)

* Very thin
* Only validate inputs
* Delegate to service layer

Example pattern:

```python
@router.post("/tasks")
def create_task(payload: TaskCreate):
    return task_service.create(payload)
```

---

# 4. Services Layer

Services contain:

* business logic
* DB operations
* LLM calls
* RAG retrieval workflows

This keeps routes clean.

---

# 5. Schemas (Pydantic)

Schemas define:

* request validation
* response models

---

# 6. Core

Contains:

* `llm_client.py`
* `rag.py`
* security helpers
* configuration

This ensures shared utilities remain consistent across services.

---

# 7. RAG Integration (ADR-008)

Backend chooses between:

* **LLM direct mode**
* **RAG mode (retrieval + LLM)**

RAG operations:

```
query → retrieve embeddings → merge context → LLM
```

---

# 8. Testing

Run tests:

```bash
pytest
```

---

# 9. Troubleshooting

### “SQLite is locked”

Restart backend; avoid parallel writes.

### LLM call fails

Check:

* vLLM server is running
* API key/URL in env variables

---

# Backend Diagram

```
      Request
         |
         v
+------------------+
|     Routes       |
+------------------+
         |
         v
+------------------+
|     Services     |----> LLM Client ----> vLLM
+------------------+----> RAG Retrieval --> VectorStore
         |
         v
+------------------+
|     SQLite       |
+------------------+
```