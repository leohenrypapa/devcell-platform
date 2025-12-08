# Backend Architecture

The DevCell backend is a modular, service-oriented FastAPI application designed
for clarity, extensibility, and local-first operation. Each functional area
(Tasks, Projects, Standups, Knowledgebase, Training, Dashboard, Auth, Review)
is implemented as an isolated vertical slice that includes:

- API routes (FastAPI routers)
- Service layer (business logic)
- Store layer (database access)
- Schemas (Pydantic models)
- Utilities shared across modules

This structure ensures predictable behavior, easy maintenance, and safe
evolution as modules grow over time.

---

# 🏗️ High-Level Structure

```

backend/app/
│
├── api/
│   └── routes/          ← All REST endpoints
│
├── core/                ← App config, security, exceptions, dependency injection
│
├── services/            ← Business logic for each module
│
├── schemas/             ← Pydantic models (request/response)
│
├── knowledgebase/       ← RAG pipeline, embedding, Chroma DB integration
│
├── db.py                ← SQLite connection and initialization
└── main.py              ← FastAPI app builder and router registration

```

The backend is intentionally small and dependency-light to support deployment in
isolated or air-gapped environments.

---

# ⚙️ App Lifecycle

## **1. Startup**
- SQLite database file opens (or initializes)
- Knowledgebase folder ensured
- Chroma embedding collections loaded
- All routers attached to `FastAPI()` instance
- CORS + middleware configured
- `configure_llm_client()` loads global LLM endpoint

## **2. Request Handling**
Each request flows through:

```

route → service → store → SQLite
↓
optional LLM

```

Services must **never** directly access the database; all persistence occurs
through the Store layer.

## **3. Shutdown**
- DB connection closes
- Long-running operations (future) can flush queues or workers

---

# 💾 Database Architecture (SQLite)

DevCell uses SQLite as a local, simple, reliable relational store. The DB is
initialized automatically via:

```

backend/app/db.py

```

## **Tables**

### **users**
Stores account + profile information.

### **projects**
High-level containers for tasks, training modules, and project metadata.

### **project_members**
Implements **project-level permissions**, added in v0.6.x.

Each row includes:
- project_id  
- username  
- role (`owner`, `member`)  

### **tasks**
Full task metadata:
- owner  
- project_id  
- progress  
- status  
- due_date  
- origin_standup_id  
- timestamps  

### **standups**
Daily reporting table:
- y / t / b text blocks  
- user linkage  
- LLM summary support  

### **knowledge_docs**
Metadata for uploaded documents (filename, embedding status, etc.)

### **training_tasks**
Training seed-task metadata and association with projects

The SQLite schema intentionally avoids foreign key constraints for maximum
portability and minimal config requirements.

---

# 🧱 Layered Architecture

DevCell backend follows a **strict 3-layer pattern**:

```

Routes → Services → Stores

```

## **1. Routes Layer (`api/routes/`)**
- Defines URL endpoints  
- Validates input via Pydantic request models  
- Injects services using dependency functions  
- Performs authentication and authorization  
- Returns JSON responses  

Each module has its own router, e.g.:

- `routes/tasks.py`
- `routes/projects.py`
- `routes/standups.py`
- `routes/knowledge.py`
- `routes/dashboard.py`
- `routes/auth.py`
- `routes/review.py`
- `routes/training.py`

Routers are imported and attached in:

```

backend/app/main.py

```

---

## **2. Service Layer (`services/`)**

Services contain the **business logic** and enforce rules such as:

- permission checks  
- workflow logic  
- validation beyond schema-level  
- calls to LLM subsystems  
- formatting data for response models  

Examples:

### **`task_service.py`**
- create/update/archive tasks  
- validate owner and project access  
- apply defaults (e.g., timestamps, active status)  

### **`project_service.py`**
- create projects  
- auto-assign owner membership  
- membership enforcement for all project-related queries  

### **`standup_service.py`**
- validate daily entry  
- generate summaries via LLM  
- transform Standup → Task suggestions  

### **`knowledge_service.py`**
- safe document upload/delete  
- embedding via Chroma  
- RAG query pipeline  
- ensure document consistency across DB + filesystem + vector DB  

### **`review_service.py`**
- send source code to LLM  
- structured improvement suggestions  
- optional inline feedback  

### **`training_service.py`**
- import training roadmap  
- generate seed tasks  
- LLM transformation for roadmap elements  

---

## **3. Store Layer (`services/*_store.py`)**

Stores provide **direct SQLite access**, using parameterized queries only.

They:
- accept primitive types  
- return dictionaries or simple objects  
- never make decisions about permissions or workflow  
- are side-effect free  

Examples:
- `task_store.py`
- `project_store.py`
- `project_members_store.py`
- `standup_store.py`
- `user_store.py`
- `knowledge_store.py`

The clear separation ensures:
- predictable logic  
- easy unit testing  
- simple refactoring  

---

# 🔐 Authentication & Security

### **Auth Method:** Username + Password  
Stored as PBKDF2 hashed password.

### **Token Type:** JWT  
Short-lived tokens, no refresh token layer.

### **Roles:**
- `user`
- `admin`

### **Project-Level Permissions**
Implemented by:
- `project_members` table  
- Service-level checks in project + task services  
- Frontend filtering using `/api/projects/mine`

### **Admin-Only Routes**
- List users  
- Update roles  
- Update user status  
- Reset passwords  

All admin access enforced via route dependency:

```

@require_admin

```

---

# 🤖 LLM Integration Architecture

Backend uses a unified LLM client:

```

core/llm_client.py

```

### **Responsibilities:**
- send messages to model endpoint  
- handle timeouts/retries  
- wrap model responses  
- used by:
  - Standup summaries  
  - SITREP generator  
  - Knowledgebase embedding/querying  
  - Code Review service  
  - Training pipeline  

### **Config**
Defined in:

```

core/config.py

```

Supports:
- Local server (e.g., Ollama, LM Studio)  
- Remote endpoints (if environment allows)

---

# 📦 Knowledgebase + RAG Architecture

Located in:

```

knowledgebase/

```

Components:

### **1. Document Storage**
`documents.py`  
Stores raw documents in local filesystem.

### **2. Embedding Pipeline**
`embedder.py`  
Uses LLM to generate embeddings.

### **3. Indexing Layer**
`indexer.py`  
Maintains Chroma vector DB.

### **4. Query Layer**
`query.py`  
Performs similarity and hybrid searches.

### **5. High-Level RAG Orchestration**
`rag.py`  
Used by Dashboard SITREP and Chat.

---

# 📊 Dashboard Aggregation Logic

Dashboard backend route:

```

/api/dashboard

```

Combines:
- today's standup  
- all active tasks  
- recent items  
- project summaries  
- SITREP generation (optional LLM)  

Service:  
`dashboard_service.py`

---

# 🧪 Testing Philosophy

Although not fully implemented yet, backend architecture supports:

- service-level unit tests (mock stores + LLM)
- store-level integration tests (SQLite in-memory)
- API-level tests via FastAPI TestClient

This will be expanded in future roadmap versions.

---

# 🛠️ Dependencies

Minimal set:
- FastAPI  
- Uvicorn  
- SQLite3  
- ChromaDB  
- Pydantic  
- Python standard library  

Optional:
- LLM client libs (requests / httpx)

No heavyweight frameworks are used.

---

# 🔮 Future Improvements

Planned areas from roadmap:
- background worker queue for training + embeddings  
- WebSocket notification layer  
- multi-tenant DB migration  
- fine-grained RBAC service  
- versioned knowledgebase storage  

---

# 📚 Related Documents

- Frontend Architecture → `architecture/frontend.md`
- Data Model → `architecture/data_model.md`
- LLM Integration → `architecture/llm_integration.md`
- Modules → `modules/*`
- API Reference → `api/*`
- Developer Guide → `developer/backend_guide.md`

---

```

© DevCell Platform Documentation — GitHub OSS Style

```