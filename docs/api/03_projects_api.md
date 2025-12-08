# Projects API

The Projects API manages:
- project creation
- project metadata updates
- project membership (owner/member)
- permission enforcement for Tasks, Training, and Dashboard

Every request requires authentication.

---

# 🧩 Base URL

```

/api/projects

````

---

# 🔐 Permissions Overview

| Action | Permission |
|--------|------------|
| List visible projects | User (returns only member/owner projects) |
| Create project | User (auto-assigned as owner) |
| Update project | Owner only |
| View members | Member or Owner |
| Add/remove members | Owner only |
| Access tasks for project | Member or Owner |
| Access training for project | Member or Owner |

Project Ownership is stored in `project_members` table (`role='owner'`).

---

# 📚 Endpoints

## 1. **List My Projects**
### `GET /api/projects/mine`

Returns only projects the user belongs to.

### Response
```json
{
  "items": [
    {
      "id": 1,
      "name": "Malware Dev Pipeline",
      "description": "Internal R&D project",
      "created_by": "alice",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
````

---

## 2. **List All Projects (Admin Only)**

### `GET /api/projects`

Admins see all projects; regular users see only theirs.

### Query:

| Param      | Description    |
| ---------- | -------------- |
| `all=true` | Admin override |

---

## 3. **Create Project**

### `POST /api/projects`

### Payload

```json
{
  "name": "Ransomware Analysis",
  "description": "Deep-dive RE and detection engineering"
}
```

### Behavior

* New row added to `projects` table
* Creator added to `project_members` as `owner`

### Response

```json
{
  "id": 4,
  "name": "Ransomware Analysis",
  "created_by": "alice",
  "owner": "alice"
}
```

---

## 4. **Get Project Details**

### `GET /api/projects/{project_id}`

### Response

```json
{
  "id": 4,
  "name": "Ransomware Analysis",
  "description": "Deep-dive RE",
  "created_by": "alice",
  "members": [
    { "username": "alice", "role": "owner" },
    { "username": "bob", "role": "member" }
  ]
}
```

Permission: user must be a member or owner.

---

## 5. **Update Project Metadata**

### `PATCH /api/projects/{project_id}`

Owner only.

### Payload

```json
{
  "name": "Advanced Malware Analysis",
  "description": "Updated scope"
}
```

### Response

```json
{
  "id": 4,
  "name": "Advanced Malware Analysis",
  "description": "Updated scope",
  "updated_at": "..."
}
```

---

# 👥 Project Membership Endpoints

Membership is stored in `project_members`.

---

## 6. **List Members**

### `GET /api/projects/{project_id}/members`

Permission: member or owner.

### Response

```json
{
  "items": [
    { "username": "alice", "role": "owner" },
    { "username": "charlie", "role": "member" }
  ]
}
```

---

## 7. **Add Member**

### `POST /api/projects/{project_id}/members`

Owner only.

### Payload

```json
{
  "username": "dave",
  "role": "member"
}
```

### Response

```json
{
  "username": "dave",
  "role": "member"
}
```

Validation prevents:

* adding duplicate members
* adding invalid usernames
* changing owner role incorrectly (future support)

---

## 8. **Remove Member**

### `DELETE /api/projects/{project_id}/members/{username}`

Owner only.

### Behavior:

* remove member row
* cannot remove the **only owner**

### Response

```json
{"success": true}
```

---

# 🔐 Permission Enforcement Details

Backend uses validation helpers:

```python
if not membership_store.user_in_project(user, project_id):
    raise HTTPException(403)
```

Changing metadata:

```python
if not membership_store.user_is_owner(user, project_id):
    raise HTTPException(403, "Owner required")
```

This ensures the entire platform (Tasks, Training, Dashboard) inherits consistent access rules.

---

# 🧪 Example Usage Workflow

### Create Project

```
POST /api/projects
{
  "name": "DevCell Platform",
  "description": "Main development effort"
}
```

### Add Member

```
POST /api/projects/1/members
{
  "username": "bob",
  "role": "member"
}
```

### Update

```
PATCH /api/projects/1
{
  "description": "Now includes dashboard module"
}
```

### Remove Member

```
DELETE /api/projects/1/members/bob
```

---

# ⚠️ Error Responses

| Code                 | Meaning                                     |
| -------------------- | ------------------------------------------- |
| `403 Access denied`  | User not member                             |
| `403 Owner required` | Only owner action                           |
| `409 Conflict`       | Duplicate member or owner removal violation |
| `404 Not found`      | Project not visible or does not exist       |
| `422`                | Invalid payload                             |

---

# 🔮 Future Enhancements

* API for transferring ownership
* Archive/unarchive projects
* Project-scoped knowledgebase (`kb/projects/{id}`)
* Webhooks for task/project updates
* Project-level analytics feed

---

# 📚 Related Documents

* Projects Module → `../modules/projects.md`
* Tasks API → `tasks_api.md`
* Permissions → `../modules/permissions.md`
* Dashboard API → `dashboard_api.md`
* Training API → `training_api.md`

---

```
© DevCell Platform Documentation — GitHub OSS Style
```