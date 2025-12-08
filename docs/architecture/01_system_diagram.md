# System Architecture Diagrams

This document provides a visual overview of DevCell’s system architecture,
including backend modules, frontend views, data flow, and LLM/RAG pipelines.
Diagrams use Mermaid syntax for readability and maintainability.

---

# 🏗️ 1. High-Level System Overview

```mermaid
flowchart TD
    A[Frontend<br>React + TS] -->|REST API| B[Backend<br>FastAPI Services]
    B --> C[SQLite<br>Local Database]
    B --> D[ChromaDB<br>Embeddings]
    B --> E[LLM Server<br>(Ollama / LM Studio)]
    B --> F[Filesystem<br>Knowledgebase Docs]

    C --- G[(projects, tasks, standups, users, project_members, training_tasks)]
````

**Key points:**

* All backend logic flows through FastAPI services.
* LLM integrations are isolated but shared across modules.
* Knowledgebase uses both filesystem + ChromaDB.
* SQLite is the single source of truth for relational data.

---

# 🧩 2. Backend Module Interaction Diagram

```mermaid
flowchart LR

    subgraph API Routes
        AR1[/tasks/]
        AR2[/projects/]
        AR3[/standups/]
        AR4[/knowledge/]
        AR5[/dashboard/]
        AR6[/auth/]
        AR7[/review/]
        AR8[/training/]
    end

    subgraph Services
        S1[Task Service]
        S2[Project Service]
        S3[Standup Service]
        S4[Knowledge Service]
        S5[Dashboard Service]
        S6[Auth Service]
        S7[Review Service]
        S8[Training Service]
    end

    subgraph Stores
        ST1[(task_store)]
        ST2[(project_store)]
        ST3[(project_members_store)]
        ST4[(standup_store)]
        ST5[(knowledge_store)]
        ST6[(user_store)]
        ST7[(training_store)]
    end

    AR1 --> S1 --> ST1
    AR2 --> S2 --> ST2 & ST3
    AR3 --> S3 --> ST4
    AR4 --> S4 --> ST5
    AR5 --> S5
    AR6 --> S6 --> ST6
    AR7 --> S7
    AR8 --> S8 --> ST7
```

**Notes:**

* Services always sit between API routes and stores.
* The Dashboard service aggregates from multiple stores.
* Knowledgebase service interacts with Chroma + filesystem instead of a store.

---

# 🤖 3. LLM Usage Diagram

```mermaid
flowchart TD
    S3[Standup Service] --> LLM1[(Summary Prompt)]
    S5[Dashboard Service] --> LLM2[(SITREP Prompt)]
    S4[Knowledge Service] --> LLM3[(Embedding/Query)]
    S7[Review Service] --> LLM4[(Code Review Prompt)]
    S8[Training Service] --> LLM5[(Training Task Transform)]

    LLM1 --> L[LLM Server]
    LLM2 --> L
    LLM3 --> L
    LLM4 --> L
    LLM5 --> L
```

LLM Server may be:

* LM Studio
* Ollama
* vLLM container
* Remote (if allowed)

---

# 📚 4. Knowledgebase RAG Pipeline Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant KB as Knowledge Service
    participant FS as Local Filesystem
    participant CH as ChromaDB
    participant L as LLM Server

    U->>KB: Upload Document
    KB->>FS: Store raw file
    KB->>L: Generate Embedding
    L-->>KB: Embedding vector
    KB->>CH: Insert into index

    U->>KB: Search Query
    KB->>L: Embed query text
    L-->>KB: Query embedding
    KB->>CH: Vector similarity search
    CH-->>KB: Top relevant chunks
    KB->>L: RAG prompt with context
    L-->>U: Answer + references
```

---

# 📂 5. Project Permissions Model Diagram

```mermaid
flowchart TD
    U[User] --> PM[project_members<br>(project_id, username, role)]
    PM --> P[Projects]
    PM --> T[Tasks]

    P --> T

    style PM fill:#ffd,stroke:#333
```

**Interpretation:**

* A user’s project membership controls visibility/edit permissions.
* Tasks always inherit project-level access.
* Project owners can modify membership; members cannot.

---

# 📊 6. Dashboard Data Flow Diagram

```mermaid
flowchart TD
    A[/DashboardPage.tsx/] --> B[/GET /dashboard/]
    B --> C[Dashboard Service]
    C --> ST1[(task_store)]
    C --> ST4[(standup_store)]
    C --> ST2[(project_store)]
    C --> S3[Standup Service]
    S3 --> L[(LLM Server)]:::llm
    C --> R[RAG / Knowledge Service]

    style llm fill:#eef,stroke:#66f
```

Dashboard aggregates:

* Today’s standup
* Active tasks
* Recent tasks
* Recent standups
* Project summaries
* Optional SITREP (LLM)

---

# 🧭 7. Frontend Data Flow Diagram (React)

```mermaid
flowchart TD

    P[Page Component] -->|uses| C[Context Providers]
    P --> S[Shared Components]
    P --> API[API Helper Layer]

    API --> BE[(Backend Routes)]
    BE --> DB[(SQLite)]
    BE --> LLM[(LLM)]
    BE --> CH[(ChromaDB)]

    C --> LS[(LocalStorage)]
```

---

# 🗃️ 8. Training Pipeline Diagram

```mermaid
flowchart TD
    U[User Uploads Training Roadmap] --> T1[Training Service]
    T1 --> L[LLM Transform]
    L --> T2[Parsed Training Tasks]
    T2 --> TS[(training_tasks table)]
    T2 --> PRJ[(project_tasks)]
    TS --> Tasks[(Main Tasks Table)]
```

Used when onboarding new operators or building structured programs.

---

# 🔮 9. Full System Overview (Compressed Mermaid)

```mermaid
flowchart LR

    subgraph Frontend
        F1[Tasks Page]
        F2[Standups Page]
        F3[Projects Page]
        F4[Dashboard]
        F5[Knowledge]
        F6[Chat]
        F7[Review]
        F8[Training]
    end

    subgraph Backend
        B1[Task Routes]
        B2[Standup Routes]
        B3[Project Routes]
        B4[Dashboard Route]
        B5[KB Routes]
        B6[Chat Route]
        B7[Review Route]
        B8[Training Route]
    end

    subgraph Services
        S1[Task Service]
        S2[Standup Service]
        S3[Project Service]
        S4[Dashboard Service]
        S5[Knowledge Service]
        S6[Chat Handler]
        S7[Review Service]
        S8[Training Service]
    end

    subgraph Storage
        SQL[(SQLite)]
        FS[(Filesystem)]
        CH[(ChromaDB)]
    end

    L[(LLM Server)]:::llm

    %% Connections
    F1 --> B1 --> S1 --> SQL
    F2 --> B2 --> S2 --> SQL
    F3 --> B3 --> S3 --> SQL
    F4 --> B4 --> S4
    F5 --> B5 --> S5
    F6 --> B6 --> S6 --> L
    F7 --> B7 --> S7 --> L
    F8 --> B8 --> S8 --> SQL

    S4 --> SQL
    S5 --> FS
    S5 --> CH
    S5 --> L
    S4 --> CH
    S4 --> L

    classDef llm fill:#eef,stroke:#77f
```

---

# 📚 Related Documents

* Backend Architecture → `backend.md`
* Frontend Architecture → `frontend.md`
* LLM Integration → `llm_integration.md`
* Modules → `../modules/*`
* API Reference → `../api/*`

---

```
© DevCell Platform Documentation — GitHub OSS Style
```