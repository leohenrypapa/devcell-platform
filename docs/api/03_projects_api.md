# Projects API

The Projects API manages:

- project creation
- project metadata updates
- project membership (owner/member/viewer)
- permission enforcement for Tasks, Training, and Dashboard

Every request requires authentication.

---

# 🧩 Base URL

```text
/api/projects
````

---

# 🔐 Permissions Overview

| Action                      | Permission                                    |
| --------------------------- | --------------------------------------------- |
| List visible projects       | Authenticated user (only own projects)        |
| List all projects           | Admin + `?all=true` query                     |
| Create project              | Authenticated user (auto-assigned as owner)   |
| Update project              | Owner or Admin                                |
| Delete project              | Owner or Admin                                |
| View members                | Project member (owner/member/viewer) or Admin |
| Add/remove members          | Owner or Admin                                |
| Access tasks for project    | Member/Owner (viewer rules may be stricter)   |
| Access training for project | Member/Owner (viewer rules may be stricter)   |

Project ownership is stored in the `projects.owner` column and mirrored in the
`project_members` table as `role="owner"`.

---

# 📚 Endpoints

## 1. List Projects

### `GET /api/projects`

List projects for the authenticated user, or all projects for admin.

#### Query

| Param      | Description                                |
| ---------- | ------------------------------------------ |
| `all=true` | If true, admin sees all projects globally. |

#### Behavior

* `all=false` (default): returns projects where the caller is owner or has
  a membership row in `project_members` (any role).
* `all=true`: requires admin; returns all projects.

#### Response

```json
{
  "items": [
    {
      "id": 1,
      "name": "Malware Dev Pipeline",
      "description": "Internal R&D project",
      "owner": "alice",
      "status": "active",
      "created_at": "..."
    }
  ]
}
```

---

## 2. List My Projects

### `GET /api/projects/mine`

Convenience view for “just my projects”.

* Returns the same result as `GET /api/projects` with `all=false` but does
  not support `all=true`.

---

## 3. Create Project

### `POST /api/projects`

#### Request

```json
{
  "name": "Ransomware Analysis",
  "description": "Deep-dive RE and detection engineering"
}
```

#### Behavior

* New row added to `projects` with `owner` set to the calling user.
* Creator added to `project_members` with `role="owner"`.

#### Response

```json
{
  "id": 4,
  "name": "Ransomware Analysis",
  "description": "Deep-dive RE and detection engineering",
  "owner": "alice",
  "status": "planned",
  "created_at": "..."
}
```

---

## 4. Project Summary

### `GET /api/projects/{project_id}/summary`

Return a simple daily summary (LLM-backed) for a project.

Permissions:

* Caller must be:

  * an admin, OR
  * `projects.owner`, OR
  * present in `project_members` for this project.

Response shape (example):

```json
{
  "project_id": 4,
  "project_name": "Ransomware Analysis",
  "summary": "Today: 2 new tasks, 1 task completed, ...",
  "count": 3
}
```

---

# 👥 Project Membership Endpoints

Membership is stored in `project_members`.

---

## 5. List Members

### `GET /api/projects/{project_id}/members`

Permission:

* Admin, OR
* project owner, OR
* any member of the project (roles owner/member/viewer).

#### Response

```json
{
  "items": [
    { "project_id": 4, "username": "alice", "role": "owner", "created_at": "..." },
    { "project_id": 4, "username": "charlie", "role": "member", "created_at": "..." }
  ]
}
```

---

## 6. Add/Update Member

### `POST /api/projects/{project_id}/members`

Owner or Admin only.

#### Request

```json
{
  "username": "dave",
  "role": "member"
}
```

* If the `(project_id, username)` pair doesn’t exist, a new row is created.
* If it exists, `role` is updated (e.g., `member` → `owner` or `viewer`).

#### Response

```json
{
  "project_id": 4,
  "username": "dave",
  "role": "member",
  "created_at": "..."
}
```

---

## 7. Remove Member

### `DELETE /api/projects/{project_id}/members/{username}`

Owner or Admin only.

**Additional rule:**

* The canonical owner (`projects.owner`) cannot be removed from membership;
  ownership must be transferred (future endpoint) or the project deleted.

#### Response

```json
{}
```

If you try to remove the owner:

```json
{
  "detail": "Cannot remove the current project owner from membership. Transfer ownership or delete the project instead."
}
```

---

## 8. Update Project Metadata

### `PUT /api/projects/{project_id}`

Owner or Admin.

#### Request

```json
{
  "name": "Advanced Malware Analysis",
  "description": "Updated scope",
  "status": "active"
}
```

#### Response

```json
{
  "id": 4,
  "name": "Advanced Malware Analysis",
  "description": "Updated scope",
  "owner": "alice",
  "status": "active",
  "created_at": "..."
}
```

---

## 9. Delete Project

### `DELETE /api/projects/{project_id}`

Owner or Admin.

Deletes the project and its associated data according to backend implementation.

---

# 🔐 Permission Enforcement Details

Backend patterns:

```python
# General membership check
role = get_user_role_for_project(project_id, current_user.username)
if (
    current_user.role != "admin"
    and current_user.username != project.owner
    and role is None
):
    raise HTTPException(403, "Not allowed")
```

This shared pattern is used across summary and membership views to ensure
only project members (or admins) can access project-specific data.

Tasks, Training, Dashboard, and Knowledge APIs will re-use the same project
membership primitives to enforce per-project visibility.

---

# 🔮 Future Enhancements

* API for transferring project ownership
* Archive/unarchive projects
* Project-scoped knowledgebase (`kb/projects/{id}`)
* Webhooks for task/project updates
* Project-level analytics feed

---

```text
© DevCell Platform Documentation — GitHub OSS Style
```