# Projects Module

The Projects module provides organizational structure and permission boundaries
for all work in DevCell. Tasks, training tasks, dashboard summaries, and
training pipelines are all grouped under projects. Project membership is the
foundation of DevCell's **project-level permissions model**, introduced in
v0.6.x.

This document explains the data model, backend/frontend implementation,
membership model, and how projects integrate with the entire platform.

---

# 🎯 Purpose

The Projects module allows teams to:

- organize tasks under meaningful units of work  
- assign project ownership  
- control read/write access to tasks via membership  
- support training pipelines and task seeding  
- display project summaries on the dashboard  
- restrict visibility across users  

DevCell is designed for small-unit environments (cyber, R&D, engineering teams)
where not all work should be visible to everyone. Projects make this possible.

---

# 🧱 Data Model

Projects are stored in the `projects` table:

```

id INTEGER PRIMARY KEY
name TEXT
description TEXT
created_by TEXT        -- username of the creator (project owner)
created_at TEXT
updated_at TEXT

```

### Key Concepts
- Each project has exactly **one owner** (creator by default).
- Additional users may join as **members**.
- Owners may add/remove members.
- Membership determines what a user can see or modify.

---

# 👥 Project Membership Model

Membership is stored in:

```

project_members

```

Schema:

```

id INTEGER PRIMARY KEY
project_id INTEGER
username TEXT
role TEXT          -- 'owner' or 'member'
added_at TEXT

```

### Ownership Rules
- A project must always have **exactly one owner**.
- Owners:
  - can edit project metadata  
  - can delete a project (future)  
  - can manage members  
  - have full access to all tasks in that project  

### Members:
- can read tasks in the project  
- can create tasks for that project  
- can update tasks they own or that belong to the project  
- cannot modify project metadata  
- cannot manage membership  

This model ensures logical separation between project authority and task-level responsibility.

---

# 🔐 Permission Enforcement

Permissions are implemented at the **service layer** in:

```

services/project_service.py
services/task_service.py
services/dashboard_service.py

```

### Enforcement Summary

| Action | Requirement |
|--------|-------------|
| View a project | Must be member or owner |
| Edit project | Must be owner |
| Add member | Must be owner |
| Remove member | Must be owner |
| List tasks for project | Must be member or owner |
| Create task under project | Must be member or owner |
| Update/remove a task | Member or owner |
| View project dashboard summary | Member or owner |

The frontend reflects permissions (disabling/hiding controls), but **backend remains the source of truth**.

---

# 🧩 Backend Architecture

### Routes (`routes/projects.py`)
Endpoints include:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/projects` | List all visible projects (admin-only for full list) |
| GET | `/api/projects/mine` | Projects where user is owner or member |
| POST | `/api/projects` | Create project (auto-assigns owner) |
| GET | `/api/projects/{id}` | Fetch project details |
| PATCH | `/api/projects/{id}` | Update project metadata |
| GET | `/api/projects/{id}/members` | List members |
| POST | `/api/projects/{id}/members` | Add member |
| DELETE | `/api/projects/{id}/members/{username}` | Remove member |

These routes call into:

### Services (`services/project_service.py`)
Responsibilities:
- validate membership
- auto-assign ownership
- check uniqueness of project names per org (optional)
- manage member addition/removal
- ensure project always maintains one owner
- enforce permissions on updates

### Stores
- `project_store.py`  
- `project_members_store.py`

Stores handle low-level SQL read/write operations.

---

# 🖥️ Frontend Architecture

Frontend components for Projects live in:

```

src/pages/ProjectsPage.tsx
src/components/ProjectCard.tsx
src/components/ProjectMemberList.tsx
src/components/ProjectMemberEditor.tsx
src/lib/projects.ts
src/lib/users.ts   -- used for admin-style username selection

```

### ProjectsPage
- Displays:
  - list of user-visible projects  
  - create-project dialog  
- Uses `/api/projects/mine` for membership awareness  
- Loads project summaries (task counts, activity)

### ProjectCard
- Shows project name + description  
- Shows counts for tasks and training items  
- Buttons:
  - open details  
  - manage members (owner only)  

### ProjectMemberList
- Displays members + roles  
- Owner sees remove actions  
- Non-owner sees read-only list  

### ProjectMemberEditor
- Autocomplete user input  
- Adds new project members  
- Enforces that only owners can modify membership  

### `lib/projects.ts`
Implements:
- listProjects()  
- getMyProjects()  
- createProject()  
- updateProject()  
- getMembers(projectId)  
- addMember()  
- removeMember()  

The frontend never hardcodes permission rules — it always relies on backend response codes.

---

# 🔄 Interaction With Other Modules

### 1. Tasks
Every task optionally belongs to a project.  
Permissions to create/edit tasks derive from project membership.

### 2. Dashboard
Dashboard loads:
- per-project summaries  
- task counts  
- recent work  
- active project statuses  

### 3. Standups
Tasks generated from standups may be assigned to a project.

### 4. Training
Training roadmap imports create seed tasks under a selected project.

### 5. Knowledgebase
Future roadmap: project-scoped documents.

---

# 🔨 Project Creation Workflow

When a user creates a project:

1. Backend inserts project row  
2. Backend inserts into `project_members`:
```

role = 'owner'
username = creator

```
3. Frontend updates project list  
4. Membership-based filtering takes effect immediately  

---

# 🔄 Membership Workflow (Owner Only)

1. User opens Project Member Editor  
2. Owner searches for a username  
3. Owner adds user → backend inserts member row  
4. Owner removes user → backend deletes member row  

Owner cannot remove themselves unless a new owner is designated (future behavior).

---

# 📊 Project Summary Calculations

Dashboard and Projects page show computed properties:

- total task count  
- active task count  
- completed tasks  
- last updated timestamp  
- member count  
- training tasks (if any)

These values come from `dashboard_service.py` and are not stored directly in the DB.

---

# 🛑 Failure Modes & Error Handling

### Common backend errors:
- 403: Not a project member  
- 403: Must be owner for this action  
- 404: Project not found  
- 409: Duplicate member add  
- 409: Cannot remove last owner  

Errors use consistent response messages to support frontend display.

---

# 🔮 Future Enhancements

Based on roadmap:

- Project categories / tags  
- Project archival  
- Project dashboards (burn-down charts, velocity)  
- Multi-owner projects  
- Project metadata: deadlines, priorities, mission fields  
- Project-scoped knowledgebase documents  
- Project-scoped standups (team standups)  

---

# 📚 Related Documents

- Permissions Module → `permissions.md`  
- Tasks Module → `tasks.md`  
- Dashboard Module → `dashboard.md`  
- Training Module → `training.md`  
- API Documentation → `../api/projects_api.md`  

---

```

© DevCell Platform Documentation — GitHub OSS Style

```