# Projects

## 1. Purpose

The Projects module tracks higher-level work items that devs can attach standups to, and gives you per-project AI summaries.

## 2. Data Model

**Table**: `projects`

- `id` (int, PK)
- `name` (text, required)
- `description` (text, nullable)
- `owner` (text, required) – set to `current_user.username`
- `status` (text: "planned" | "active" | "blocked" | "done")
- `created_at` (datetime)

Pydantic:

- `ProjectCreate`
- `Project`
- `ProjectList`
- `ProjectUpdate`

## 3. Backend API

Base path: `/api/projects`

- `GET /api/projects`
  - Lists all projects.
- `POST /api/projects`
  - Auth required.
  - Owner is forced to `current_user.username` on backend.
- `PUT /api/projects/{id}`
  - Auth required.
  - Allowed if `current_user.username == project.owner` or `role == "admin"`.
- `DELETE /api/projects/{id}`
  - Same permission rules as PUT.
- `GET /api/projects/{id}/summary`
  - Uses AI to summarize today's standups linked to that project.
  - Returns `{ project_id, project_name, summary, count }`.

## 4. Frontend Behavior

Page: `src/pages/ProjectsPage.tsx`

### 4.1 Create / Edit

- Form:
  - Name (required).
  - Description.
  - Status (planned/active/blocked/done).
- Owner is not user-entered; it’s `user.username`.
- Behavior:
  - New project → `POST /api/projects`.
  - Edit project → `PUT /api/projects/{id}`:
    - Clicking “Edit” in the table fills the form.
    - Button text changes to “Save Changes”.
    - “Cancel Edit” resets state.

### 4.2 Listing & Filters

- Table shows:
  - Name + description.
  - Owner.
  - Status.
  - Created timestamp.
  - Actions: AI Summary, Edit, Delete (only when permitted).
- “Show only my projects” toggle:
  - Filters to `p.owner === current_user.username`.

### 4.3 AI Summary

- Button `AI Summary` (per row):
  - Calls `GET /api/projects/{id}/summary`.
  - Displays result in a summary panel at bottom.
- Button `Copy Summary`:
  - Copies a brief SITREP for that project to clipboard.

## 5. Permissions Summary

- Dev user:
  - Can create new projects they own.
  - Can edit/delete only their own projects.
- Admin:
  - Can see all projects.
  - Can edit/delete any project.
