# Tasks Module

The Tasks module is one of the core functional areas of DevCell. It provides a
simple but powerful workflow for tracking individual work items, project tasks,
training objectives, and standup-derived tasks. The module integrates tightly
with Projects, Standups, Dashboard, and Permissions.

This document describes the architecture, workflows, backend + frontend
implementation details, and extension points.

---

# 🎯 Purpose

The Tasks module enables users to:

- create, update, and complete tasks
- associate tasks with projects
- convert standup items into tasks
- manage progress and due dates
- filter tasks efficiently
- bulk-edit tasks
- archive (soft-delete) items
- maintain consistent visibility via project-level permissions

Each user sees only the tasks they own or tasks that belong to projects they
have membership in.

---

# 🧱 Data Model

Tasks are stored in SQLite (`tasks` table).  
Full schema:

```

id INTEGER PRIMARY KEY
title TEXT
description TEXT
owner TEXT
status TEXT           -- 'todo' | 'in_progress' | 'blocked' | 'done'
progress INTEGER
project_id INTEGER
is_active INTEGER     -- soft delete flag
due_date TEXT
origin_standup_id INTEGER
created_at TEXT
updated_at TEXT

```

### Key relationships:

- **`project_id`** → connects tasks to the Projects module  
- **`origin_standup_id`** → links tasks generated from standup conversion  
- **`is_active`** → supports archiving  
- **`owner`** → username of responsible user  

### Permissions:

Tasks inherit permissions from the project they belong to:

- User must be **owner or member** of the project to read/write tasks.
- If `project_id` is null, task is personal and belongs only to its owner.

---

# 🧩 Backend Architecture

The backend logic for Tasks spans:

- **routes** → `api/routes/tasks.py`
- **service** → `services/task_service.py`
- **store** → `services/task_store.py`
- **schemas** → `schemas/task.py`

### 1. Routes (`tasks.py`)
Routes define the entrypoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks with filters |
| POST | `/api/tasks` | Create new task |
| GET | `/api/tasks/{id}` | Get single task |
| PATCH | `/api/tasks/{id}` | Update task |
| DELETE | `/api/tasks/{id}` | Archive task |
| POST | `/api/tasks/bulk_update` | Bulk update fields across many tasks |

Routes enforce:
- authentication
- project-level permission checks (via service)
- request body validation

---

### 2. Service Layer (`task_service.py`)

The service implements:

- permission validation (project membership)
- filtering logic
- task creation defaults
- timestamp handling
- due date helpers
- progress rules
- archive vs hard delete logic (archive only)
- parsing standup-derived metadata

**Important logic from fullstack dump:**

- If user filters by project, service ensures the user belongs to that project.
- If user creates a task under a project they don't belong to → reject.
- If updating status/progress, service also updates `updated_at`.
- If `origin_standup_id` is provided, validation ensures standup exists.
- Bulk update applies only to tasks the user is allowed to modify.

---

### 3. Store Layer (`task_store.py`)

Provides raw SQL CRUD operations:

- `insert_task()`
- `update_task()`
- `archive_task()`
- `get_task_by_id()`
- `list_tasks(filters)`
- bulk update methods
- date range queries (used by Dashboard + SITREP)

Design choices:

- store returns dictionaries, not models
- SQL queries parameterized for safety
- sorting by `created_at DESC` by default

---

### 4. Schemas (`schemas/task.py`)

Used for input/output validation:

- `TaskCreate`
- `TaskUpdate`
- `Task`
- `TaskListResponse`
- `TaskUpdatePayload`
- enums for status and progress ranges

These schemas define the contract between backend and frontend.

---

# 🖥️ Frontend Architecture

Frontend components for Tasks live in:

```

src/pages/TasksPage.tsx
src/components/TaskCard.tsx
src/components/TaskList.tsx
src/components/TaskFilters.tsx
src/components/TaskBulkActions.tsx
src/lib/tasks.ts

```

### Key behaviors:

### **TasksPage**
- fetches task list on load and whenever filters update
- manages local filter state: status, search query, project, owner
- handles modal for create/update

### **TaskCard**
- editable inline card view
- fields:
  - title
  - description
  - status
  - progress slider
  - due date selector
  - project association
  - archive button

### **TaskList**
- renders tasks grouped by status  
- supports drag-and-drop (future roadmap)

### **TaskFilters**
- string search  
- quick status tabs  
- “My tasks” filter  
- project filter sourced from `/projects/mine`  

### **TaskBulkActions**
- update status  
- set due date  
- set progress  
- archive tasks  

### **Lib Helpers: `lib/tasks.ts`**
Implements:

- `listTasks()`
- `createTask()`
- `updateTask()`
- `bulkUpdateTasks()`
- `/projects/mine` project-filter injection  
- TypeScript types: `Task`, `TaskUpdatePayload`, `TaskListResponse`

---

# 🔄 Standup → Task Conversion Workflow

This is a unique feature in DevCell.

### Flow:

1. User writes their daily standup  
2. Opens “Convert standup to tasks” modal  
3. Each bullet line is parsed  
4. User selects which lines should become tasks  
5. Tasks are created with:
   - `title` extracted from line
   - `owner = user`
   - `origin_standup_id` link
   - optional project selection
   - optional due date shortcut

This enables task generation from natural language standups.

---

# 🧪 Filtering Logic

Backend supports filters by:

- status  
- owner  
- project  
- active/not active  
- search query (title/description substring match)  

These filters are optionally combined.

Frontend presets include:

- “My Tasks Only”
- “In Progress”
- “Due Soon”
- “Blocked”
- “Recently Added”

---

# 📌 Progress & Status Workflow

Status values from schema:

```

todo → in_progress → blocked → done

```

Progress values: **0–100**, integer.

Rules enforced by service:

- Setting status to `done` forces progress to **100**  
- Setting progress < 100 and status = `done` → resets status to `in_progress`  
- Changing status always updates `updated_at`  

---

# 🔐 Permissions

Tasks enforce **project-level permissions**, based on `project_members` table.

### A user can:
- **View** tasks from projects they belong to  
- **Edit** tasks in those projects  
- **Create** tasks only within their membership  
- **Archive** tasks only if allowed to edit them  

### Personal tasks
If `project_id` is null:
- Only the owner may view/edit/delete the task

---

# 📊 Integration with Other Modules

### Dashboard

Dashboard queries tasks for:
- active tasks
- recent tasks
- due tasks
- SITREP summaries  

### Standups

- origin_standup_id → identify which standup generated a task  
- training tasks & standup tasks displayed together  

### Projects

- tasks appear in project detail views  
- project filter is keyed by membership  

### Training

Training roadmap tasks may be inserted into:
- `training_tasks`
- main `tasks` table (as seed tasks)

---

# 🔮 Future Enhancements

From roadmap:

- drag-and-drop task boards (Kanban view)
- recurring tasks
- checklist items
- task dependencies
- project dashboards showing task burndown
- better bulk operations
- AI task suggestions based on standup + KB context

---

# 📚 Related Documents

- Projects Module → `projects.md`
- Standups Module → `standups.md`
- Dashboard Module → `dashboard.md`
- Training Module → `training.md`
- API Documentation → `../api/tasks_api.md`
- Permissions → `permissions.md`

---

```

© DevCell Platform Documentation — GitHub OSS Style

```