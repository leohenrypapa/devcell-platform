# Training Module

The Training module provides a structured pipeline for importing training
roadmaps, transforming them into actionable training tasks, and assigning them
to DevCell users or projects. It is built for technical teams (e.g., malware
dev, cyber analysis, reverse engineering) where curriculum-based progression
must be tracked systematically.

This module tightly integrates with Projects, Tasks, Standups, and LLM
processing.

---

# 🎯 Purpose

The Training module enables teams to:

- import a roadmap or syllabus (Markdown, text)
- let the LLM transform the curriculum into structured task units
- automatically seed tasks into a project
- store long-term training objectives
- track training progress like normal tasks
- onboard new operators consistently

It converts high-level training documents into executable phases.

---

# 🧱 Data Model

Training module uses the `training_tasks` table:

```

id INTEGER PRIMARY KEY
project_id INTEGER
title TEXT
description TEXT
priority INTEGER
created_at TEXT

```

Notes:

- tasks are grouped by project  
- `priority` may represent course sequence or difficulty  
- training tasks can be copied into the main Tasks list (`tasks` table)  

Training tasks are created during roadmap ingestion, not directly through UI.

---

# 🧩 Backend Architecture

Training backend logic exists in:

```

routes/training.py
services/training_service.py
services/task_service.py   -- used for seeding tasks
knowledgebase/rag.py       -- optional contextual assistance
core/llm_client.py

```

---

## 📁 1. Routes (`training.py`)

Endpoints include:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/training/import` | Upload roadmap document |
| POST | `/api/training/transform` | Convert roadmap text → structured units |
| POST | `/api/training/seed_tasks` | Insert training tasks into project |
| GET | `/api/projects/{id}/training` | Retrieve training tasks for project |

All routes require authentication and membership in the target project.

---

## 🧠 2. Service Layer (`training_service.py`)

Core responsibilities:

### (1) Roadmap Ingestion
Accepts:
- Markdown (`.md`)
- Plain text
- Copy/pasted text

Service normalizes and prepares content for LLM processing.

---

### (2) LLM Transformation → Task Units

LLM is called with instructions like:

```

Extract training phases, objectives, tasks, and milestones.
Return structured JSON items:
[
{ "title": "...", "description": "...", "priority": 1 },
...
]

```

Transformation rules:
- detect sections, weeks, phases, bullet lists  
- break down content into actionable items  
- reduce redundancy  
- ensure deterministic formatting  

Returned JSON is validated and converted to:

```

training_tasks

```

---

### (3) Storing Training Tasks
Each extracted unit is inserted into:

```

training_tasks table

```

with a linked `project_id`.

---

### (4) Seeding Main Tasks
Once training tasks exist, they can be inserted into the main `tasks` table.

This allows training objectives to appear in:
- Tasks Page  
- Dashboard  
- Standup-to-task workflows  

Seeding is controlled to avoid duplicates.

---

# 🖥️ Frontend Architecture

Frontend training UI lives in:

```

src/pages/TrainingPage.tsx
src/components/TrainingImport.tsx
src/components/TrainingTransformReview.tsx
src/components/TrainingTaskList.tsx
src/lib/training.ts

````

### TrainingPage
- central hub  
- shows available training tasks for selected project  
- links to import/transform views  

### TrainingImport
User uploads roadmap text/markdown.

### TrainingTransformReview
- shows AI-parsed units  
- allows user to edit before seeding  
- displays warnings for malformed items  

### TrainingTaskList
- lists stored training tasks  
- link to “seed tasks” button  
- training tasks grouped by phase (future enhancement)

### `lib/training.ts`
Implements:
- `importRoadmap()`
- `transformRoadmap()`
- `seedTrainingTasks()`
- `listTrainingTasks()`

---

# 🔄 Training Task Lifecycle

```mermaid
flowchart TD
    U[User uploads roadmap] --> N[Normalize Text]
    N --> L[LLM Transform]
    L --> V[Validate JSON]
    V --> ST[Insert into training_tasks table]
    ST --> SEED[Seed tasks into Task list]
````

---

# 🔐 Permissions

Training module respects project membership.

| Action                     | Permission      |
| -------------------------- | --------------- |
| Import training roadmap    | Member or Owner |
| Transform roadmap          | Member or Owner |
| Seed tasks                 | Member or Owner |
| View training tasks        | Member or Owner |
| Delete/edit training tasks | (future) Owner  |

No user outside the project can see or modify training tasks.

---

# 🧩 Integration With Other Modules

### Tasks

Training tasks may be cloned into the Tasks table for execution.

### Projects

Training tasks are grouped per project.

### Dashboard

Dashboard may display:

* number of training tasks
* active seeded units

### Knowledgebase (optional)

Roadmap or reference docs may also be stored in KB for RAG usage.

### Standups

Users can report training progress in standup → tasks can be linked.

---

# 🧪 Common Use Cases

### 1. Onboarding a new operator

Upload roadmap → LLM extracts units → seed tasks → operator completes tasks.

### 2. Converting malware dev course into tasks

Parsing multi-week syllabus into phases → tasks visible on dashboard.

### 3. Supporting quarterly development goals

Long-form training plans incorporated into task system.

---

# 🔮 Future Enhancements

* Phase/grouping UI for training tasks
* Training completion analytics
* Multi-user progress tracking
* Roadmap version control
* Linking training tasks to KB documents
* Automated prerequisite detection
* “Adaptive training paths” (LLM-driven)

---

# 📚 Related Documents

* Tasks Module → `tasks.md`
* Projects Module → `projects.md`
* Knowledgebase Module → `knowledge.md`
* LLM Integration → `../architecture/llm_integration.md`
* API Documentation → `../api/training_api.md`

---

```
© DevCell Platform Documentation — GitHub OSS Style
```