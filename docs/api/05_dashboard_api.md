# Dashboard API

The Dashboard API aggregates standups, tasks, projects, and optional LLM-based
SITREP generation into a single unified interface for the authenticated user.

All routes require authentication. Dashboard output respects **all project-level
permissions** and **standup privacy rules**.

---

## 🧩 Base URL

```
/api/dashboard
```

---

# 📚 Endpoints

---

## 1. Get Dashboard Data

### `GET /api/dashboard`

Returns all dashboard sections in a single payload.

### Response

```json
{
  "standup": {
    "id": 13,
    "yesterday": "- Investigated incident 42",
    "today": "- Continue module work",
    "blockers": "- Waiting on access",
    "summary": "Short LLM summary...",
    "created_at": "2025-12-08T09:30:00Z"
  },
  "active_tasks": [
    {
      "id": 21,
      "title": "Implement dashboard SITREP button",
      "project_id": 1,
      "status": "in_progress",
      "progress": 40,
      "due_date": "2025-12-12"
    }
  ],
  "recent_tasks": [
    {
      "id": 15,
      "title": "Fix API routes",
      "status": "done",
      "updated_at": "2025-12-07T15:00:00Z"
    }
  ],
  "projects": [
    {
      "id": 1,
      "name": "Malware Dev Pipeline",
      "total_tasks": 12,
      "active_tasks": 5,
      "completed_tasks": 7,
      "member_count": 3,
      "last_updated": "2025-12-07T14:00:00Z"
    }
  ]
}
```

### Notes
- If the user has **no standup for today**, `"standup"` may be `null`.
- Only tasks and projects the user has permission to see are returned.

---

## 2. Generate SITREP (LLM)

### `POST /api/dashboard/sitrep`

Generates a structured SITREP (Situation Report) using LLM and optional
Knowledgebase RAG context.

### Request Body

```json
{
  "notes": "Focus on blockers and mission impact",
  "use_rag": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `notes` | string | Optional additional instructions |
| `use_rag` | boolean | Whether to retrieve KB context |

---

### SITREP Generation Includes:

- today’s standup summary  
- recent standups  
- active tasks  
- blockers  
- project summaries  
- optional RAG search results  

---

### Example Response

```json
{
  "sitrep": "## SITREP — 2025-12-08

### Key Activities
- Completed API routing module...

### Blockers
- Waiting on access...

### Next Steps
- Continue dashboard implementation...
",
  "sources": [
    {
      "filename": "Week4_RE_Notes.md",
      "score": 0.82,
      "excerpt": "Key concepts: dynamic unpacking, loader behavior..."
    }
  ]
}
```

If `use_rag=false`, `"sources"` will be empty.

---

# 🔐 Permissions

Dashboard output respects:

| Area | Permission |
|------|------------|
| Standup | User's own only |
| Tasks | Only tasks belonging to user or user’s projects |
| Projects | Only user membership projects |
| SITREP | Based on permitted data only |

Admins do **not** automatically gain additional visibility through this API.

---

# ⚠️ Error Responses

| Code | Meaning |
|------|---------|
| `503` | LLM unavailable (SITREP route only) |
| `422` | Invalid payload |
| `403` | Authentication failed |

SITREP generation gracefully degrades if:
- LLM offline → returns error
- KB unavailable → continues without RAG context

---

# 🧪 Example SITREP Workflow

1. User writes daily standup.
2. User updates task statuses.
3. User runs:

```
POST /api/dashboard/sitrep
{
  "notes": "Include project-level risks."
}
```

4. Dashboard displays formatted SITREP.

---

# 📚 Related Documents

- Dashboard Module → `../modules/dashboard.md`
- Standups API → `standups_api.md`
- Tasks API → `tasks_api.md`
- LLM Integration → `../architecture/llm_integration.md`

---

© DevCell Platform Documentation — GitHub OSS Style