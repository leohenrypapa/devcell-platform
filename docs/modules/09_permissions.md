# Permissions Module

DevCell’s permission system controls visibility and actions across all major
modules (Tasks, Projects, Standups, Training, Dashboard, Knowledgebase). It is
designed to be **simple**, **predictable**, and **flexible**, with strong
guarantees that unauthorized users cannot access or modify resources.

Permissions are enforced at the **backend service layer**, with optional
frontend UI restrictions for better user experience.

This document describes the full permission architecture.

---

# 🧱 Permission Philosophy

DevCell is intended for small technical teams or units where:

- different users own different projects,
- some information should remain private,
- users should not freely browse others’ work,
- training tasks should be isolated per project/team,
- and admins should maintain control without micromanaging.

Therefore, DevCell uses a **two-tier permission model**:

1. **Global Roles**  
2. **Project-Level Permissions** (fine-grained access)

---

# 🔐 Tier 1 — Global Roles

Users have one of two global roles:

| Role | Capabilities |
|------|--------------|
| `user` | Standard platform user |
| `admin` | Can manage users, reset passwords, view all projects, override restrictions |

Stored in the `users.role` column.

### Admin Privileges
Admins can:
- list all users  
- create/disable accounts  
- update profiles  
- assign roles  
- reset passwords  
- view all projects (backend only; UI may hide them)  

Admins **cannot** bypass project-level permissions when performing user-level actions (e.g., creating a task), ensuring consistent data boundaries.

---

# 🔐 Tier 2 — Project-Level Permissions

Implemented via:

```

project_members

```

Schema:

```

project_id INTEGER
username TEXT
role TEXT  -- 'owner' or 'member'

```

### Roles within a project:
- **Owner** — full control over project metadata, membership, and tasks  
- **Member** — standard contributor, full task CRUD, limited project access  

Project membership is the foundation for all permission validation in Tasks,
Standups, Dashboard, and future Knowledgebase scoping.

---

# 👥 Project Ownership Rules

- A project must always have **one owner**.
- Project creators automatically become owners.
- Only owners may:
  - update project metadata  
  - add or remove members  
  - manage ownership (future feature)  

Members cannot modify project metadata or membership.

---

# 🧠 Permission Enforcement by Module

Permissions are enforced in services (`services/*.py`) and checked in routers.

---

# 📁 1. Projects

| Action | Required Permission |
|--------|----------------------|
| View project | Member or Owner |
| List all my projects | Member or Owner |
| Edit project | Owner only |
| Delete project (future) | Owner only |
| Add/remove members | Owner only |

Backend rejects unauthorized edits with `HTTP 403`.

---

# 📝 2. Tasks

Tasks inherit project permissions.

| Action | Required Permission |
|--------|----------------------|
| View tasks for a project | Member or Owner |
| Create task under project | Member or Owner |
| Update or archive task | Member or Owner |
| Create personal task | Anyone |
| View personal task | Owner only |
| Update personal task | Owner only |

Additional logic:
- If `project_id` is null → task is personal  
- If task belongs to project → enforce project membership  

---

# 📅 3. Standups

Standups are **always private** to the user.

| Action | Required Permission |
|--------|----------------------|
| Submit standup | User |
| View own standups | User |
| Convert standup → tasks | User |
| Admin viewing others’ standups | Not allowed (unless future override added) |

No user may view another user’s standups.

---

# 📚 4. Knowledgebase (Current Behavior)

Knowledgebase is currently **global** and not project-scoped.

| Action | Required Permission |
|--------|----------------------|
| Upload doc | User |
| Delete doc | User (uploads only) / Admin |
| Search | User |

Future roadmap includes project-scoped KB namespaces.

---

# 📊 5. Dashboard

Dashboard aggregates only **data the user is permitted to see**, including:

- user’s own standup  
- tasks in projects they belong to  
- tasks they own  
- project summaries for their memberships  

SITREP generation uses only permitted data.

---

# 🤖 6. Training Module

Training tasks are seeded into a selected project.

| Action | Required Permission |
|--------|----------------------|
| Import roadmap | Member or Owner |
| Seed tasks | Member or Owner |
| View training tasks | Member or Owner |

Training tasks inherit project-level rules once seeded.

---

# 🔍 Backend Enforcement Locations

Permissions are validated centrally in the service layer:

```

services/task_service.py
services/project_service.py
services/dashboard_service.py
services/training_service.py

````

Example patterns:

```python
if not project_members_store.user_in_project(user, project_id):
    raise HTTPException(status_code=403, detail="Access denied")
````

Validation occurs before reading or modifying data.

---

# 🎨 Frontend Permission Awareness

Frontend uses two mechanisms:

### 1. Global Role Awareness

From `AuthContext.user.role`
Used to conditionally render Admin pages.

### 2. Project Membership Awareness

Fetched via:

```
GET /api/projects/mine
GET /api/projects/{id}/members
```

Used to:

* hide edit buttons when user is not owner
* display member list
* disable project selection for unauthorized users
* filter task lists

Frontend NEVER assumes permission — backend is authoritative.

---

# 🚫 Common Permission Errors

Service layer returns:

| Error                | Meaning                    |
| -------------------- | -------------------------- |
| `403 Access denied`  | User is not a member/owner |
| `403 Owner required` | Only owners may modify     |
| `404 Not found`      | Resource is out of scope   |
| `409 Conflict`       | Invalid membership change  |

These are surfaced cleanly to the frontend.

---

# 🔒 Security Guarantees

1. Users cannot see tasks from projects they are not part of.
2. Users cannot modify projects they do not own.
3. Personal tasks remain fully private.
4. Standups are fully private.
5. KB documents are global (temporary state), but ownership is respected.
6. Dashboard displays only permitted aggregated data.
7. Admin operations do not override project-level data rules.

Backend validation ensures correctness regardless of frontend behavior.

---

# 🔮 Future Permission Enhancements

Based on roadmap:

### **1. Granular RBAC**

Roles such as:

* viewer
* contributor
* manager
* owner
* admin

### **2. Module-Level Permission Flags**

E.g., “Can create tasks,” “Can edit standups,” “Can manage training.”

### **3. Project-Scoped Knowledgebase**

Documents attached to projects.

### **4. Multi-owner Projects**

Allow multiple project managers.

### **5. Policy Engine**

Configurable access policy YAML (long-term vision).

---

# 📚 Related Documents

* Projects Module → `projects.md`
* Tasks Module → `tasks.md`
* Dashboard Module → `dashboard.md`
* Training Module → `training.md`
* API Reference → `../api/projects_api.md`
* Design Decision: Project Permissions → `../adr/002_project_permissions.md`

---

```
© DevCell Platform Documentation — GitHub OSS Style
```