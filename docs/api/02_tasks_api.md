# Tasks API

The Tasks API provides CRUD operations for task management, bulk updates,
standup-derived task creation, and project-scoped task filtering.

All routes require authentication via bearer token.

---

# 🧩 Base URL

```text
/api/tasks
````

---

# 📌 Authentication & Permissions

Tasks are protected by **project-level permissions** plus **per-owner rules**:

* If a task has a `project_id`:

  * Access is controlled by the project permission model (ADR-004).
  * Only users with *edit* (or higher) permission on that project (or admins) may create/update/archive project tasks.
  * Only users with *view* (or higher) permission on that project (or admins) may read project tasks.
* If `project_id` is `null`:

  * Task is personal.
  * Only the owner (or admin) may view/update/archive it.

All project checks are done through shared permission helpers (e.g. `require_project_view` / `require_project_edit`) before the task operation continues.

---

# 📚 Endpoints

## 1. **List Tasks**

### `GET /api/tasks`

Retrieve tasks with optional filters. This endpoint is **owner-focused**:

* For **non-admin users**:

  * If `mine=true`, you get *your own* tasks.
  * If `owner` is not set and `mine` is false, you still get *your own* tasks.
  * You **cannot** list tasks for other users.
* For **admins**:

  * If `owner` is set, you get that user’s tasks.
  * If `mine=true`, you get your own tasks.
  * If neither is provided, you get tasks for all owners.

If `project_id` is provided, project view permission is enforced.

### Query Parameters

| Name         | Type   | Description                                                                                 |
| ------------ | ------ | ------------------------------------------------------------------------------------------- |
| `mine`       | bool   | If `true`, restrict to the current user’s tasks.                                            |
| `owner`      | string | Explicit owner username. Non-admins may only use their own username.                        |
| `project_id` | int    | Filter by project. Requires project *view* permission.                                      |
| `status`     | string | Filter by status: `todo`, `in_progress`, `blocked`, `done`.                                 |
| `is_active`  | bool   | If `true` (default), only active tasks. If `false`, include both active and archived tasks. |
| `search`     | string | Case-insensitive title/description text search (simple SQL `LIKE` search).                  |
| `start_date` | date   | Inclusive lower bound on `created_at` (by date only; `YYYY-MM-DD`).                         |
| `end_date`   | date   | Inclusive upper bound on `created_at` (by date only; `YYYY-MM-DD`).                         |

> Legacy parameter `active_only` is still accepted internally as a deprecated alias for `is_active` but is hidden from the public schema.

### Example Request

```http
GET /api/tasks?mine=true&status=in_progress&project_id=3&search=API
```

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
      "project_name": "DevCell Backend",
      "is_active": true,
      "due_date": "2025-12-10",
      "origin_standup_id": 42,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

---

## 2. **Create Task**

### `POST /api/tasks`

Create a new task for the authenticated user.

### Payload

```json
{
  "title": "Implement login",
  "description": "Add auth layer",
  "status": "todo",
  "progress": 0,
  "project_id": 2,
  "due_date": null,
  "is_active": true,
  "origin_standup_id": null
}
```

**Notes**

* `owner` is **always** taken from the authenticated user; clients cannot set it.
* `project_id`:

  * If provided, the caller must have *edit* permission on that project (or be admin).
  * If omitted/null, the task is personal.
* Status/progress coupling on create:

  * If `status = "done"` and `progress < 100` → backend automatically forces `progress = 100`.

### Response

```json
{
  "id": 9,
  "title": "Implement login",
  "description": "Add auth layer",
  "owner": "alice",
  "status": "todo",
  "progress": 0,
  "project_id": 2,
  "project_name": "DevCell Auth",
  "is_active": true,
  "due_date": null,
  "origin_standup_id": null,
  "created_at": "...",
  "updated_at": "..."
}
```

---

## 3. **Retrieve Single Task**

### `GET /api/tasks/{task_id}`

Retrieve a single task by id.

* For tasks with `project_id != null`, the caller must have project *view* permission.
* For personal tasks (`project_id = null`), only the owner or admin may view.

```http
GET /api/tasks/3
```

### Response

```json
{
  "id": 3,
  "title": "Write SITREP module",
  "description": "Draft API routes",
  "owner": "alice",
  "status": "in_progress",
  "progress": 40,
  "project_id": 1,
  "project_name": "CPB Dashboard",
  "is_active": true,
  "due_date": null,
  "origin_standup_id": 12,
  "created_at": "...",
  "updated_at": "..."
}
```

---

## 4. **Update Task**

The backend supports both PUT and PATCH with the **same semantics**:

* `PUT /api/tasks/{task_id}`
* `PATCH /api/tasks/{task_id}`

Both expect a **partial** update body (fields are optional).

### `PATCH /api/tasks/{task_id}`

### Payload (Partial Allowed)

```json
{
  "status": "in_progress",
  "progress": 40,
  "project_id": 1,
  "title": "Refine SITREP module"
}
```

### Permissions

* **Project tasks (`project_id != null`)**

  * Caller must have *edit* permission on the current project.
  * If moving the task to a different project (`project_id` changes), caller must also have *edit* permission on the destination project.
  * Admins bypass these checks.
* **Personal tasks (`project_id = null`)**

  * Only owner or admin may update.

### Status / Progress Normalization

The backend enforces the following rules on **update**:

1. **Status explicitly set to `"done"`:**

   * If request also sets `progress < 100` →
     *Conflict* case → backend **downgrades** status to `"in_progress"` and preserves the provided progress.

   * If request does not set `progress` and the resulting progress is `< 100` →
     backend automatically forces `progress = 100`.

2. **Progress lowered while status was `"done"`:**

   * If:

     * `status` is **not** provided (so it stays `"done"`), and
     * `progress` is explicitly set to `< 100`, and
     * current status is `"done"`,
   * then backend automatically **downgrades** status to `"in_progress"`.

### Response

Updated task JSON (same shape as single-task GET).

---

## 5. **Archive Task (Soft Delete)**

### `DELETE /api/tasks/{task_id}`

Archive a task by marking it inactive.

### Behavior

* Sets `is_active = false`.
* Does **not** remove the row from the DB.
* Archived tasks:

  * Are excluded when `is_active=true` (default).
  * Are included when `is_active=false` (along with active tasks).
* Useful for historical SITREP / standup queries.

### Permissions

* **Project tasks**:

  * Caller must have *edit* permission for the project (or be admin).
* **Personal tasks**:

  * Only owner or admin may archive.

### Response

```json
{
  "success": true
}
```

---

## 6. **Bulk Update**

### `POST /api/tasks/bulk_update`

Apply field updates to multiple tasks the caller has permission to modify.

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

* `task_ids`: list of task IDs to update.
* `update`: body that matches the **TaskUpdate** shape (same fields as `/api/tasks/{task_id}` update).

### Behavior

* For each `task_id`:

  * If caller has permission to update that task:

    * Update is applied with the same status/progress normalization rules as a normal update.
  * If caller **does not** have permission:

    * That task is silently skipped (no error).
* Tasks that do not exist are skipped.

### Response

```json
{
  "updated": 3
}
```

* `updated`: number of tasks that were successfully updated.

---

## 7. **Convert Standup → Tasks**

(via Standups API, but creates tasks in this Tasks module)

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

Behavior:

* Creates one task per `lines[]` entry.
* Each created task records `origin_standup_id = {id}`.
* `project_id` is optional:

  * If set → requires project edit permission.
  * If omitted → creates personal tasks.

---

# 🔐 Permission Summary

| Operation             | Permission                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| List tasks            | Non-admin: only own tasks (with optional project filter). Admin: any owner; project view enforced. |
| Create task           | Personal: owner always self. Project: project *edit* permission required.                          |
| Retrieve task         | Project: project *view* permission required. Personal: owner or admin.                             |
| Update task           | Project: project *edit* permission required. Personal: owner or admin.                             |
| Archive task (DELETE) | Project: project *edit* permission required. Personal: owner or admin.                             |
| Bulk update           | Per task: same as **Update task**; unauthorized tasks are silently skipped.                        |

Backend routes and task store functions enforce these rules consistently.

---

# ⚠️ Error Responses

| Status              | When                                         |
| ------------------- | -------------------------------------------- |
| `403 Forbidden`     | User lacks required project/owner permission |
| `404 Not Found`     | Task does not exist or is out of scope       |
| `422 Unprocessable` | Invalid payload (validation error)           |

> Note: The current implementation does **not** explicitly return `409 Conflict` for status/progress issues; those are resolved by normalization instead of hard errors.

---

# 🧪 Example Workflow: Create → Update → Archive

### 1. Create

```http
POST /api/tasks
{
  "title": "Write FastAPI router",
  "project_id": 1
}
```

### 2. Update

```http
PATCH /api/tasks/10
{
  "progress": 60
}
```

### 3. Archive

```http
DELETE /api/tasks/10
```

---

# 🔮 Future API Enhancements

* Bulk archive endpoint (archive many tasks at once).
* Query by `due_soon=true`.
* Task comments API.
* Task attachments API.
* Task dependency graph queries.

---

# 📚 Related Documents

* Tasks Module → `../modules/tasks.md`
* Projects API → `projects_api.md`
* Standups API → `standups_api.md`
* Dashboard API → `dashboard_api.md`
* Training API → `training_api.md`