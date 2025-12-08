# Data Model Architecture

DevCell uses a lightweight but expressive data model built on **SQLite**.  
The schema is optimized for:

- local-first operation  
- low maintenance  
- simple migrations  
- clear module boundaries  
- predictable performance  

All business logic is handled in the **service layer**, while the **store layer**
executes raw SQL queries using Python's built-in `sqlite3` module.

This document provides a complete view of all tables, relationships, and
constraints in the DevCell backend.

---

# 🧱 Design Principles

1. **SQLite-first**  
   No external DB is required; works in air-gapped environments.

2. **Loose coupling**  
   Services own business rules; the DB stores data without enforcing complex FK constraints.

3. **Predictable schema**  
   Tables are human-readable and easy to inspect manually.

4. **Modular growth**  
   Each subsystem (Tasks, Standups, Projects, KB, Training) has isolated tables.

---

# 🗂️ Full Schema Overview

Below is a high-level map of the database tables:

```

users
projects
project_members     ← project-level permissions
tasks
standups
knowledge_docs
training_tasks

```

Each table corresponds to a major DevCell feature.

---

# 👤 users

Stores authentication + profile metadata.

```

id (INTEGER PRIMARY KEY)
username (TEXT UNIQUE)
password_hash (TEXT)

display_name (TEXT)
job_title (TEXT)
team_name (TEXT)
rank (TEXT)
skills (TEXT)

role (TEXT)         -- 'user' or 'admin'
is_active (INTEGER) -- boolean
created_at (TEXT)
updated_at (TEXT)

```

### Notes
- Authentication uses hashed passwords (PBKDF2).
- Profile fields are optional and editable through admin UI.
- `is_active` disables login without deletion.

---

# 📁 projects

Represents a logical grouping of tasks and training pipelines.

```

id (INTEGER PRIMARY KEY)
name (TEXT)
description (TEXT)
created_by (TEXT)     -- username of project owner
created_at (TEXT)
updated_at (TEXT)

```

### Notes
- A new project automatically assigns the creator as `owner` in `project_members`.
- Projects organize tasks, training tasks, and dashboard data.

---

# 👥 project_members  
**Introduced in v0.6.x (CHANGELOG)**  
Implements project-level permissions.

```

id (INTEGER PRIMARY KEY)
project_id (INTEGER)
username (TEXT)
role (TEXT)          -- 'owner' or 'member'
added_at (TEXT)

```

### Usage
- Determines which projects a user can see or modify.
- Enforced in:
  - `/api/projects/*`
  - `/api/projects/mine`
  - `/api/tasks` filters
- Service-layer validation prevents unauthorized project access.

---

# 📝 tasks

Core table for task tracking.

```

id (INTEGER PRIMARY KEY)
title (TEXT)
description (TEXT)
owner (TEXT)
status (TEXT)            -- 'todo', 'in_progress', 'blocked', 'done'
progress (INTEGER)       -- 0–100

project_id (INTEGER)
is_active (INTEGER)      -- soft delete for historical reporting

due_date (TEXT)

origin_standup_id (INTEGER)   -- lineage link
created_at (TEXT)
updated_at (TEXT)

```

### Notes
- `origin_standup_id` ties tasks back to auto-generated standup entries.
- `is_active` allows archiving without deletion.
- Tasks are filtered on frontend by:
  - owner
  - project
  - status
  - activity
  - search

---

# 📅 standups

Stores daily standup entries per user.

```

id (INTEGER PRIMARY KEY)
username (TEXT)
yesterday (TEXT)
today (TEXT)
blockers (TEXT)

summary (TEXT)      -- LLM-generated
created_at (TEXT)

```

### Notes
- Only one standup per user per day is allowed (enforced in service).
- LLM summary optionally generated and cached.
- Integrated with:
  - Dashboard
  - SITREP generator
  - Standup → Task conversion modal

---

# 📚 knowledge_docs

Metadata for stored documents used in RAG search.

```

id (INTEGER PRIMARY KEY)
filename (TEXT)
original_name (TEXT)

source_type (TEXT)         -- e.g., 'upload'
file_path (TEXT)
embedding_status (TEXT)    -- 'pending', 'embedded', 'failed'

created_at (TEXT)
updated_at (TEXT)

```

### Notes
- Raw files stored in filesystem: `/knowledgebase/docs/`
- ChromaDB stores embeddings separately.
- Safe deletion ensures:
  - DB metadata removed
  - file removed
  - vector removed

---

# 🎓 training_tasks

Represents training tasks generated from training roadmaps.

```

id (INTEGER PRIMARY KEY)
project_id (INTEGER)
title (TEXT)
description (TEXT)
priority (INTEGER)
created_at (TEXT)

```

### Notes
- Created automatically from training roadmap import.
- Inserted into Projects and Tasks for onboarding.
- LLM can rephrase, expand, or clarify training objectives.

---

# 🔌 Relationships (Conceptual)

```

users ─────────────┐
│
projects ────────┐ │
│ │
project_members ◄┘ │
│
tasks ─────────────┘
↑
└── standups (origin_standup_id)

knowledge_docs → embeddings in ChromaDB

training_tasks → tasks (seeded into task list)

```

No foreign key constraints → flexible and portable.

---

# 📊 Entity Interaction Summary

| Entity | Reads | Writes | Connected Modules |
|--------|-------|--------|-------------------|
| users | auth, admin | admin | Auth |
| projects | tasks, dashboard | admin/owner | Tasks, Dashboard |
| project_members | tasks, projects | owner/admin | Permissions |
| tasks | tasks, dashboard | tasks, standups, training | Standups, Dashboard |
| standups | dashboard, standups | standups | SITREP, Tasks |
| knowledge_docs | chat, kb, dashboard | kb | RAG |
| training_tasks | training, tasks | training | Tasks, Projects |

---

# 🔒 Permission Model Representation

Project-level access is enforced in the service layer:

```

User can:

* view project if member OR owner
* edit project only if owner
* list tasks only from owned/member projects

```

This is represented in queries:

```

SELECT * FROM projects
WHERE id IN (
SELECT project_id FROM project_members WHERE username = ?
)

```

Frontend also filters UI interactions based on membership status.

---

# 🛠️ Schema Evolution Strategy

DevCell uses “versioned migrations” in code:

- On startup, DB is checked for required tables.
- Missing tables are created.
- Existing tables are *not* altered without explicit migration blocks.
- No destructive migrations automatically run.

Future enhancements:
- version table  
- migration files  
- reversible schema changes  

---

# 📚 Related Documents

- Backend Architecture → `architecture/backend.md`
- LLM Integration → `architecture/llm_integration.md`
- Knowledgebase Module → `modules/knowledge.md`
- Permissions Module → `modules/permissions.md`
- Training Module → `modules/training.md`

---

```

© DevCell Platform Documentation — GitHub OSS Style

```