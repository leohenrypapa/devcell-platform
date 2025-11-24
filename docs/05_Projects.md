# DevCell Platform – Projects

## 1. Purpose

The Projects module provides a way to track work at a higher level than individual standups. It lets you:

- Define projects with owner and status.
- Attach standups to projects.
- Generate project-level AI summaries of progress and blockers.

---

## 2. Data Model

### 2.1 Table: projects

Columns (conceptual):

- `id` – integer primary key
- `name` – project name
- `description` – short description
- `owner` – username of the project owner
- `status` – one of `"planned"`, `"active"`, `"blocked"`, `"done"`
- `created_at` – timestamp

### 2.2 Schemas

Pydantic models (simplified):

- `ProjectCreate`
  - `name: str`
  - `description: Optional[str]`
  - `owner: Optional[str]` (ignored by backend and set from current user)
  - `status: str` (with validation)
- `Project`
  - Represents a DB row.
- `ProjectList`
  - `items: List[Project]`
- `ProjectUpdate`
  - `name`, `description`, and `status` all optional.

---

## 3. Backend API

Base path: `/api/projects`

### 3.1 List Projects

`GET /api/projects`

- Returns all projects in the system.
- Anyone authenticated can see all projects.

### 3.2 Create Project

`POST /api/projects`

- Auth required.
- Body: `ProjectCreate`.
- Backend overrides `owner` with `current_user.username` regardless of what client sends.
- Typically sets status to `"planned"` by default if not provided.

### 3.3 Update Project

`PUT /api/projects/{id}`

- Auth required.
- Body: `ProjectUpdate`.
- Allowed if:
  - `current_user.username == project.owner`, or
  - `current_user.role == "admin"`.

### 3.4 Delete Project

`DELETE /api/projects/{id}`

- Same permission as Update.

### 3.5 Project AI Summary

`GET /api/projects/{id}/summary`

- Uses AI to summarize **today’s standups** associated with that project.
- Response includes:

```json
{
  "project_id": 1,
  "project_name": "Dev Portal",
  "summary": "Text from LLM",
  "count": 4
}
```

- The list of standups is determined by `project_id` and date filter (today).

---

## 4. Frontend Behavior

Page: `ProjectsPage.tsx`

### 4.1 Form for Creating & Editing Projects

Form fields:

- Name (required)
- Description (optional)
- Status:
  - Planned
  - Active
  - Blocked
  - Done

Owner is not entered manually; it is determined by the logged-in user.

The form supports both **create** and **edit**:

- No project selected → `Create Project` button appears.
- Click “Edit” on a row → form is populated, button changes to `Save Changes`, and a “Cancel Edit” button shows up.

### 4.2 Project List

The page shows a table of projects with:

- Name and description
- Owner
- Status
- Created timestamp
- Actions: AI Summary, Edit, Delete (where allowed)

There is a “Show only my projects” checkbox:

- Filters list to `project.owner === current_user.username` on the client side.

### 4.3 Actions

- **AI Summary**
  - Calls `GET /api/projects/{id}/summary`.
  - Displays result in a summary panel at the bottom.
  - Allows copying the text to clipboard (for project-level SITREP).

- **Edit**
  - Only visible if you are the owner or an admin.
  - Loads project into the form for editing and changes the button label.

- **Delete**
  - Only visible if you are the owner or an admin.
  - Confirms with the user.
  - Calls `DELETE /api/projects/{id}` and reloads list.

---

## 5. Project Status Semantics

Suggested usage:

- **planned**
  - Idea or project defined but not actively being worked on yet.

- **active**
  - Work is currently being done; standups will usually reference this.

- **blocked**
  - Project is stuck due to some dependency, missing access, or decision.
  - Standups should name the blockers clearly.

- **done**
  - Project is completed; might still appear in history but not in daily focus.

These semantics are flexible and can be refined by the unit.

---

## 6. Integration with Standups

Standups can optionally reference a `project_id`. When they do:

- The standup UI shows the project name.
- Project AI summary endpoint groups today’s standups by project.
- Leadership can see progress and blockers per project.

Typical flow:

1. A dev creates a project “Dev Portal” with status “active”.
2. Daily standups reference that project.
3. At any time, an admin or dev clicks “AI Summary” for that project to get a summary of current progress.

---

## 7. Permissions Summary

| Action                                   | User | Admin |
|------------------------------------------|:----:|:-----:|
| Create project                           |  ✔   |   ✔   |
| View all projects                        |  ✔   |   ✔   |
| Edit own projects                        |  ✔   |   ✔   |
| Delete own projects                      |  ✔   |   ✔   |
| Edit/delete any project                  |      |   ✔   |
| Generate AI summary for any project      |  ✔   |   ✔   |

---

## 8. Operational Notes

- Projects are lightweight records; they can be created for experiments or internal efforts without heavy process.
- If you accumulate many old/done projects, you may add filters on the frontend (e.g., show only active/blocked).
- If something looks wrong in AI summaries:
  - Check that standups are correctly linked via `project_id`.
  - Check that the LLM server is reachable and configured.

This document should give enough detail to understand how projects work and how they tie into standups and AI summaries.
