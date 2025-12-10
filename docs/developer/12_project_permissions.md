# DevCell Backend — Project Permission Model (Unified, ADR-004)

_Last updated: after introduction of `project_permissions.py` centralization._

---

## 0. Purpose

DevCell uses a **project-scoped security model** for all major data domains:

- Projects
- Tasks
- Dashboard summaries
- Training artifacts
- Reviews (when implemented)

Before this update, permission checks were implemented inline inside multiple routers, which led to inconsistent enforcement and security leaks.

This document defines the **canonical project permission model** and the **required backend pattern** for enforcing it.

---

## 1. Project Roles

Each project has:

- A canonical **owner** (`project.owner`)
- Zero or more **members**, each assigned a **role**:
  - `owner`
  - `member`
  - `viewer`

On top of project roles:

- **Admins** bypass all project restrictions.

---

## 2. Centralized Permission Logic

All project-related permission checks must route through:

```text
backend/app/services/project_permissions.py
````

This module exposes the following helpers:

```python
require_project_view(project_id, user)
require_project_membership(project_id, user)
require_project_edit(project_id, user)
require_project_owner(project_id, user)
```

Each helper:

* Ensures the project exists (otherwise raises HTTP 404).
* Enforces ADR-004 rules (otherwise raises HTTP 403).
* Returns the project object on success.

> **Rule:** Do **not** reimplement project permission checks inline in routers or services. Import and use these helpers instead.

---

## 3. Permission Rules

### 3.1 View Access

A user may **view** a project or project-scoped data if:

* They are **admin**, OR
* They are the **project.owner**, OR
* They have **any project_membership** row (`owner`, `member`, or `viewer`).

This applies to (examples, not exhaustive):

* `GET /projects/{id}/summary`
* `GET /projects/{id}/members`
* `GET /tasks?project_id={id}`
* Any new endpoint that exposes project-scoped data.

Use:

```python
from app.services.project_permissions import require_project_view

project = require_project_view(project_id, current_user)
```

---

### 3.2 Edit Access (Modify Project-scoped Content)

A user may **edit** project-scoped content if:

* They are **admin**, OR
* They are **project.owner**, OR
* They are a **member** (NOT viewer).

This applies to (examples):

* Creating tasks within a project.
* Updating tasks inside a project.
* Moving tasks between projects.
* Deleting project-scoped tasks.
* Writing to project-linked resources (e.g., reviews).

Use:

```python
from app.services.project_permissions import require_project_edit

require_project_edit(project_id, current_user)
```

> `viewer` is not sufficient for edits.

---

### 3.3 Owner-Only Access

Operations requiring **owner or admin**:

* Editing project metadata.
* Adding/removing project members.
* Deleting a project.
* Transferring ownership.

Use:

```python
from app.services.project_permissions import require_project_owner

require_project_owner(project_id, current_user)
```

---

## 4. Enforcement Pattern (MANDATORY)

Wherever backend code accepts a `project_id` or works with a project-scoped resource, follow this pattern:

1. **Do not** write ad-hoc permission checks like:

   ```python
   if user.role != "admin" and user.username != project.owner:
       ...
   ```

2. Instead, **always** call the appropriate helper:

   ```python
   project = require_project_view(project_id, current_user)        # read/list
   require_project_edit(project_id, current_user)                  # modify
   require_project_owner(project_id, current_user)                 # admin/owner only
   ```

3. If you are operating on an existing resource that already has a `project_id`, always enforce permissions against that `project_id` **before** mutating it.

---

## 5. Task Permissions (Post-Update)

Tasks can belong to projects via `task.project_id`.

All task operations must apply project permissions when `project_id` is set:

### 5.1 Listing Tasks

```python
def list_tasks_endpoint(..., project_id: Optional[int] = None, current_user: UserPublic = Depends(get_current_user)):
    if project_id is not None:
        require_project_view(project_id, current_user)
    items = list_tasks(..., project_id=project_id, ...)
    return TaskList(items=items)
```

### 5.2 Creating a Task

```python
def create_task_endpoint(payload: TaskCreate, current_user: UserPublic = Depends(get_current_user)):
    if payload.project_id is not None:
        require_project_edit(payload.project_id, current_user)
    return add_task(current_user.username, payload)
```

### 5.3 Updating a Task

```python
existing = get_task_by_id(task_id)
# Task-level ownership/admin check already performed

if existing.project_id is not None:
    require_project_edit(existing.project_id, current_user)

new_project_id = payload.project_id if payload.project_id is not None else existing.project_id

if new_project_id is not None and new_project_id != existing.project_id:
    require_project_edit(new_project_id, current_user)
```

### 5.4 Deleting a Task

```python
existing = get_task_by_id(task_id)
if existing.project_id is not None:
    require_project_edit(existing.project_id, current_user)
delete_task(task_id)
```

This ensures that project membership governs access to project-scoped tasks, even if the task owner changes or was removed from the project.

---

## 6. Dashboard Permissions (Post-Update)

Dashboard summaries must **not** leak projects outside a user's membership.

Enforcement pattern:

* Router requires auth and passes the current user into the service:

  ```python
  summary, standup_count, project_count, knowledge_docs = await summarize_dashboard(
      current_user=current_user,
      use_rag=use_rag,
  )
  ```

* Service decides which projects to include:

  ```python
  if current_user.role == "admin":
      projects = list_projects()                # all projects
  else:
      projects = list_projects_for_user(current_user.username)
  ```

Non-admin users only see projects where they are owner/member/viewer; admins see everything.

---

## 7. API Developer Checklist

When adding any new project-scoped feature (e.g., reviews, notebooks, specialized training modules), answer:

> **Does this resource belong to a project?**

If **yes**, then:

1. Ensure the resource carries a `project_id` field.
2. In the router, call the appropriate helper **before** reading/writing:

   * `require_project_view` for read/list operations.
   * `require_project_edit` for modify/transition operations.
   * `require_project_owner` for admin/owner operations.
3. Do not allow users to bypass project membership solely by being a resource "owner".

---

## 8. Error Semantics

Standardized errors for project permissions:

* `404 Not Found` — project does not exist.
* `403 Forbidden` — user lacks required membership/role.
* `400 Bad Request` — invalid transitions (e.g., attempting to remove the canonical owner from membership).

Keep error messages clear and consistent:

* `"Not allowed to view this project"`
* `"Not allowed to modify project-scoped content"`
* `"Not allowed to manage this project; owner or admin required"`

---

## 9. Future Extensions (Optional)

* Promote a `ProjectRole` enum (e.g., `ProjectRole.OWNER`, `ProjectRole.MEMBER`, `ProjectRole.VIEWER`) to reduce string-based role checks.
* Add audit logging around project permission failures and admin operations.
* Extend permissions to cover RAG contexts if/when project-specific knowledge bases are introduced.

---

## 10. Summary

* Project permissions are now **centralized** in `project_permissions.py`.
* All project-scoped endpoints must use these helpers.
* Tasks and dashboard have been updated to respect ADR-004.
* New features must follow the same patterns to avoid regressions and data leaks.