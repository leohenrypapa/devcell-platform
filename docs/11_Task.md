# DevCell Platform — Tasks Module Documentation (task.md)

## 1. Purpose of the Tasks Module
The Tasks Module provides a lightweight personal task tracking system deeply integrated into the Standups workflow.  
It is intentionally simple—no Jira, no complexity—just fast, focused execution tracking for developers.

Tasks are:
- Owned by a user
- Optionally linked to a project
- Displayed on the Standup page (“My Tasks”)
- Used automatically in AI standup summaries
- Editable inline for fast updates

---

## 2. Task Data Model (Database Schema)

```
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL, -- todo / in_progress / blocked / done
    project_id INTEGER,
    progress INTEGER DEFAULT 0, -- 0 to 100
    due_date TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

### Field Details
| Field        | Type | Description |
|--------------|------|-------------|
| `owner`      | text | Username who owns the task |
| `title`      | text | Short description |
| `description`| text | Longer notes |
| `status`     | text | `todo`, `in_progress`, `blocked`, `done` |
| `project_id` | int  | FK → projects.id (optional) |
| `progress`   | int  | Percent complete (0–100) |
| `due_date`   | text | Optional ISO date |
| `is_active`  | int  | Soft delete (1=active, 0=archived) |
| `created_at` | text | Timestamp |
| `updated_at` | text | Timestamp |

---

## 3. API Endpoints

### **GET /api/tasks?mine=true&active_only=true**
Returns all tasks owned by the current user.

### **POST /api/tasks/**
Create a new task.

Example:
```
{
  "title": "Refactor API layer",
  "description": "Split routes and service logic",
  "status": "todo",
  "project_id": 1
}
```

### **PUT /api/tasks/{id}**
Update any field of a task.

Payload example:
```
{
  "title": "Refactor API layer",
  "status": "in_progress",
  "progress": 20
}
```

### **DELETE /api/tasks/{id}**
Soft-delete (archive) a task by setting `is_active = 0`.

---

## 4. Frontend Integration (React)

### **My Tasks Panel**
Located directly under the Standup submission form.

Features:
- Inline editing of status
- Inline editing of progress percent
- Dropdown to filter by project
- “+ New Task” button
- Automatic refresh after edits
- Only active user tasks shown

### **Status Colors**
- **todo:** gray  
- **in_progress:** blue  
- **blocked:** red  
- **done:** green  

---

## 5. LLM Integration

Every morning, the standup summary generator includes:
1. All standups submitted today
2. All active tasks for the logged-in user

This allows the LLM to produce:
- More accurate summaries
- Better identification of blockers
- Clearer daily priorities

Example combined prompt snippet:
```
Tasks:
- [todo] API refactor (progress 20%)
- [in_progress] Replace standup summary logic
- [blocked] Waiting for design input
```

---

## 6. Adding a New Task (Workflow)

1. Click **+ New Task**
2. Enter:
   - Title (required)
   - Description
   - Project (optional)
   - Status (defaults to `todo`)
3. Save → Immediately appears in the list
4. Update progress during the day
5. Use in standups / summaries

---

## 7. Updating a Task

Each field can be edited inline:
- Click the status icon → change status
- Click the number → update progress
- Click title → edit text
- Use project dropdown → reassign project

Updated tasks instantly sync with the backend.

---

## 8. Recommended Usage

### For Developers
- Keep tasks updated throughout the day  
- Mark blockers early  
- Add tasks as soon as they come up  
- Review tasks before writing standups  

### For Team Leaders
- Look for:
  - Too many blocked tasks
  - Tasks that never progress
  - Tasks stuck in the same project
- Use system as an execution-tracking tool

---

## 9. Future Enhancements

- Comments per task  
- Task history timeline  
- Recurring tasks  
- Auto-generated tasks from standup text (LLM-based)  
- Subtasks  
- Attachments  
- Task mention system (@user)  

---

## 10. Summary

The Tasks Module is designed to enhance daily execution:
- Lightweight
- Fast
- Developer-first
- Integrated with standups and LLM summaries

It provides exactly what a small dev team or military dev cell needs:  
**Clear visibility, daily accountability, and structured progress tracking.**
