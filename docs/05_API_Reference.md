# 05_API_Reference – DevCell Platform

## Purpose
This document provides a consolidated, human-readable reference of all major API endpoints in the DevCell Platform.  
For full interactive documentation, always refer to:

**Swagger UI:**  
```
http://localhost:9000/docs
```

**ReDoc:**  
```
http://localhost:9000/redoc
```

This file is meant as a **quick developer reference**, not a replacement for auto-generated OpenAPI docs.

---

# 1. Authentication API

## POST `/auth/login`
Authenticate a user with username/password.

**Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Returns:**
- `access_token`
- `token_type`
- user profile

## GET `/auth/me`
Returns current user info from token.

---

# 2. Users API (Admin Only)

## GET `/users/`
List all users.

## POST `/users/`
Create a new user.

## PATCH `/users/{id}`
Update user fields.

## DELETE `/users/{id}`
Delete user.

---

# 3. Tasks API

## GET `/tasks/`
List tasks (optional filters: `project_id`, `search`)

## GET `/tasks/{id}`
Get task details.

## POST `/tasks/`
Create new task.
```json
{
  "title": "Fix API bug",
  "description": "Null return issue",
  "project_id": 2,
  "assignee": "you",
  "status": "todo",
  "progress": 0
}
```

## PATCH `/tasks/{id}`
Update task fields.

## POST `/tasks/{id}/archive`
Archive task.

## POST `/tasks/{id}/unarchive`
Unarchive task.

---

# 4. Standups API

## GET `/standups/`
List recent standups.

## POST `/standups/`
Create new standup entry.
```json
{
  "yesterday": "Worked on RAG.",
  "today": "Finish dashboard.",
  "blockers": "None"
}
```

## GET `/standups/{id}`
Fetch a specific standup.

## POST `/standups/{id}/summarize`
Generate AI summary for this standup.

## POST `/standups/{id}/convert_to_tasks`
Convert standup entries → tasks.

---

# 5. Dashboard API

## GET `/dashboard/my_today`
Returns:
- Tasks due today
- Recent standups
- Quick snapshot data

## POST `/dashboard/sitrep`
Generates AI Situation Report.

---

# 6. Projects API

## GET `/projects/`
List all projects.

## POST `/projects/`
Create project.
```json
{
  "name": "RAG Upgrade",
  "description": "Improve embeddings + metadata"
}
```

## GET `/projects/{id}`
Get project details.

## PATCH `/projects/{id}`
Update project.

## DELETE `/projects/{id}`
Delete project.

---

# 7. Knowledgebase / RAG API

## POST `/kb/upload`
Upload PDF/TXT/MD file.
Returns metadata + indexing result.

## GET `/kb/list`
List indexed documents.

## DELETE `/kb/{doc_id}`
Delete document + vectors.

## POST `/rag/query`
Query semantic search.
```json
{
  "question": "How does task progress work?"
}
```

**Returns:**
- matched chunks  
- metadata  
- recommended answer  

---

# 8. Health Check API

## GET `/health`
Returns:
```json
{ "status": "ok" }
```

---

# 9. API Conventions & Rules

### Authentication
Use:
```
Authorization: Bearer <token>
```

### Response Format
Uniform:
```json
{
  "data": {},
  "error": null
}
```

### Errors
Example:
```json
{
  "error": "Task not found"
}
```

### Pagination (future)
Planned for:
- tasks
- projects
- knowledgebase list

---

# 10. References
- `02_Architecture.md`
- `03_Developer_Guide.md`
- Swagger (`/docs`)