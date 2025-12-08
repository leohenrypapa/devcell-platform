# Tasks API

The Tasks API provides CRUD operations for task management, bulk updates,
standup-derived task creation, and project-scoped task filtering.

All routes require authentication via bearer token.

---

# 🧩 Base URL

```

/api/tasks

```

---

# 📌 Authentication & Permissions

Tasks are protected with **project-level permissions**:

- If a task belongs to a project → only project members (or owner) may view/edit.
- If `project_id` is null → task is personal → only owner may view/edit.

Back-end service validates all project membership rules before continuing.

---

# 📚 Endpoints

## 1. **List Tasks**
### `GET /api/tasks`

Retrieve tasks with optional filters.

### Query Parameters:
| Name | Type | Description |
|------|------|-------------|
| `status` | string | Filter by `todo`, `in_progress`, `blocked`, `done` |
| `project_id` | int | Filter by project membership |
| `owner` | string | Filter by username |
| `is_active` | bool | Active only or all |
| `search` | string | Title/description text search |

### Example Request
```

GET /api/tasks?status=in_progress&project_id=3

````

### Response
```json
{
  "items": [
    {
      "id": 1,
      "title": "Fix API routing",
      "description": "...",
      "owner": "alice",
      "status": "in_progress",
      "progress": 20,
      "project_id": 3,
      "is_active": true,
      "due_date": "2025-12-10",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
````

---

## 2. **Create Task**

### `POST /api/tasks`

### Payload

```json
{
  "title": "Implement login",
  "description": "Add auth layer",
  "status": "todo",
  "progress": 0,
  "project_id": 2,
  "due_date": null
}
```

### Notes

* `project_id` requires project membership.
* Non-members attempting to create tasks → `403 Access denied`.

### Response

```json
{
  "id": 9,
  "title": "Implement login",
  "owner": "alice",
  "status": "todo",
  "project_id": 2,
  ...
}
```

---

## 3. **Retrieve Single Task**

### `GET /api/tasks/{id}`

### Response

```json
{
  "id": 3,
  "title": "Write SITREP module",
  "description": "Draft API routes",
  ...
}
```

Permission rules enforced based on project.

---

## 4. **Update Task**

### `PATCH /api/tasks/{id}`

### Payload (Partial Allowed)

```json
{
  "status": "in_progress",
  "progress": 40,
  "project_id": 1
}
```

### Validation Rules

* Changing `project_id` requires membership in destination project.
* If setting `status = done` → forces `progress = 100`.
* If setting `progress < 100` and `status = done` → status downgraded to `in_progress`.

### Response

Updated task JSON.

---

## 5. **Archive Task (Soft Delete)**

### `DELETE /api/tasks/{id}`

### Behavior

* Sets `is_active = false`
* Does NOT remove from DB
* Tasks remain available for SITREP historical queries

### Response

```json
{"success": true}
```

---

## 6. **Bulk Update**

### `POST /api/tasks/bulk_update`

Apply field updates to multiple tasks the user has permission to modify.

### Payload Example

```json
{
  "task_ids": [3, 4, 5],
  "update": {
    "status": "done",
    "progress": 100
  }
}
```

### Response

```json
{
  "updated": 3
}
```

Backend silently skips tasks the user cannot edit.

---

## 7. **Convert Standup → Tasks**

(via Standups API but creates tasks)

### `POST /api/standups/{id}/convert_to_tasks`

Payload example:

```json
{
  "lines": [
    "Review reverse engineering notes",
    "Implement config parser prototype"
  ],
  "project_id": 2,
  "due_date": null
}
```

Tasks created using `origin_standup_id`.

---

# 🔐 Permission Summary

| Operation    | Permission                                   |
| ------------ | -------------------------------------------- |
| List tasks   | Member of project OR owner of personal tasks |
| Create task  | Member of target project OR personal task    |
| Update task  | Member of project                            |
| Archive task | Member of project OR owner of personal task  |
| Bulk update  | Member of each affected task's project       |

Backend validates **every** request through `task_service.py`.

---

# ⚠️ Error Responses

| Status              | When                                      |
| ------------------- | ----------------------------------------- |
| `403 Access denied` | User not in project                       |
| `404 Not found`     | Task does not exist or out of scope       |
| `409 Conflict`      | Invalid status/progress transition (rare) |
| `422 Unprocessable` | Invalid payload                           |

---

# 🧪 Example Workflow: Create → Update → Archive

### 1. Create

```
POST /api/tasks
{
  "title": "Write FastAPI router",
  "project_id": 1
}
```

### 2. Update

```
PATCH /api/tasks/10
{
  "progress": 60
}
```

### 3. Archive

```
DELETE /api/tasks/10
```

---

# 🔮 Future API Enhancements

* Bulk archive endpoint
* Query by `due_soon=true`
* Task comments API
* Task attachments API
* Task dependency graph queries

---

# 📚 Related Documents

* Tasks Module → `../modules/tasks.md`
* Projects API → `projects_api.md`
* Standups API → `standups_api.md`
* Dashboard API → `dashboard_api.md`
* Training API → `training_api.md`

---

```
© DevCell Platform Documentation — GitHub OSS Style
```