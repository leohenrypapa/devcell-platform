# Training API

The Training API manages ingestion of training roadmaps, LLM-driven transformation
into structured units, and optional seeding of training tasks into project task lists.
It powers the structured onboarding and curriculum automation pipeline.

All routes require authentication. Project-level permissions apply for storing or
seeding tasks.

---

# 🧩 Base URL

```
/api/training
```

---

# 🔐 Permissions Overview

| Operation | Required Permission |
|----------|---------------------|
| Import roadmap | Project member |
| Transform roadmap | Project member |
| Store training units | Project member |
| Seed tasks into tasks table | Project member |
| Fetch project training tasks | Project member |

Training data is always scoped to a project.

---

# 📚 Endpoints

---

## 1. Import Roadmap Text

### `POST /api/training/import`

Accepts long-form text or markdown for conversion into structured training units.

#### Request

```json
{
  "project_id": 3,
  "text": "# Malware Dev Roadmap\nWeek 1: Basics..."
}
```

#### Response

```json
{
  "project_id": 3,
  "text_length": 2450,
  "status": "imported"
}
```

This route does **not** perform LLM transformation — it simply accepts and normalizes the text.

---

## 2. Transform Roadmap (LLM → JSON Units)

### `POST /api/training/transform`

Runs the LLM on imported text to extract structured training units.

#### Request

```json
{
  "project_id": 3,
  "text": "...full roadmap text...",
  "notes": "Break into week-based tasks with descriptions"
}
```

#### LLM Output Format

```json
[
  {
    "title": "Week 1: Windows Internals Overview",
    "description": "Study OS architecture, kernel, memory layout...",
    "priority": 1
  },
  {
    "title": "Week 1: Build RE lab",
    "description": "Setup VM, install tools...",
    "priority": 2
  }
]
```

#### Response

```json
{
  "items": [
    { "title": "Week 1...", "description": "...", "priority": 1 },
    { "title": "Week 1...", "description": "...", "priority": 2 }
  ],
  "count": 2
}
```

---

## 3. Store Training Units

### `POST /api/training/store`

Stores the transformed units into the `training_tasks` table for the project.

#### Request

```json
{
  "project_id": 3,
  "items": [
    { "title": "Week 1...", "description": "...", "priority": 1 }
  ]
}
```

#### Response

```json
{
  "stored": 1,
  "project_id": 3
}
```

Stored tasks remain *training-only* until explicitly seeded into the main task table.

---

## 4. List Training Tasks

### `GET /api/training/{project_id}`

Returns stored training tasks for the project.

#### Response

```json
{
  "items": [
    {
      "id": 12,
      "title": "Week 1...",
      "description": "...",
      "priority": 1,
      "created_at": "2025-12-08T10:10:00Z"
    }
  ]
}
```

---

## 5. Seed Training Tasks → Main Tasks

### `POST /api/training/seed_tasks`

Converts training tasks into standard tasks in the main `tasks` table.

#### Request

```json
{
  "project_id": 3,
  "training_task_ids": [12, 13],
  "due_date": null
}
```

Each selected unit becomes a new task owned by the requester.

#### Response

```json
{
  "seeded": [
    { "id": 40, "title": "Week 1...", "project_id": 3 },
    { "id": 41, "title": "Week 1...", "project_id": 3 }
  ]
}
```

---

# 🔐 Validation & Permission Logic

- User must be a member of the project.
- Training units cannot be seeded into a project the user does not belong to.
- Duplicate seeding is prevented (either by task title match or explicit flags depending on configuration).

---

# ⚠️ Error Responses

| Code | Reason |
|------|--------|
| `403` | User not in project |
| `422` | Invalid training unit format |
| `503` | LLM offline or transformation error |
| `409` | Duplicate seeding attempt |

---

# 🧪 Example Workflow

1. Upload your malware dev roadmap.  
2. Call `/transform` to break it down into tasks.  
3. Review and adjust items.  
4. Store tasks with `/store`.  
5. Seed tasks into the main task table.  

This produces a full onboarding curriculum instantly.

---

# 📚 Related Documents

- Training Module → `../modules/training.md`
- Tasks API → `tasks_api.md`
- Projects API → `projects_api.md`
- LLM Integration → `../architecture/llm_integration.md`

---

© DevCell Platform Documentation — GitHub OSS Style