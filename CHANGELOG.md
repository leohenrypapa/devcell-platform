## [Unreleased]

### Added
-

### Changed
-

### Fixed
-

---

## [0.5.1] - 2025-12-03

### Added
- **Standups → Tasks Workflow**
  - Added `origin_standup_id` field to tasks schema and database, linking tasks back to the standup entry that created them.
  - New backend endpoints:
    - `GET /api/standup/{id}/tasks` — list tasks created from a given standup (admins see all; users see their own).
    - `POST /api/standup/{id}/convert` — structured conversion of a standup into one or more tasks via a rich payload.
  - `task_store.py` now supports filtering by `origin_standup_id` and provides `list_tasks_for_standup()`.
  - Standup → Tasks conversion modal on the Standups page:
    - Parses Yesterday / Today / Blockers lines.
    - Per-line checkboxes and editable task titles.
    - Shared settings: default project, default due date (none/today/tomorrow).
    - Optional “Remember defaults” using `localStorage`.
  - Standups page shows a **Linked Tasks** panel per standup, displaying tasks created from that standup.
  - Tasks page now surfaces `origin_standup_id` in task metadata (“From Standup #ID”).

### Changed
- Updated tasks schema and store to persist and surface the `origin_standup_id` link.
- Standups page now preloads linked tasks for the visible date when authenticated.

### Fixed
-

---

## [0.5.0] - 2025-12-01

### Added
- **Global Toast System**
  - Introduced `ToastContext` with `showToast(message, type)` for all pages.
  - Replaced most `alert()` calls with non-blocking toasts (success, error, info).
  - Styled bottom-right stack, auto-dismiss, smooth fade transitions.

- **Global Light/Dark Theme**
  - Added `ThemeContext` with persistence in `localStorage`.
  - Topbar toggle button (🌙/☀) updates `<html>` and `<body>` theme variables.
  - Sidebar, Topbar, Buttons, Cards auto-adapt to theme.

- **Tasks Enhancements**
  - Search bar (title, description, owner, project name).
  - Status pill styling (`todo`, `in_progress`, `done`, `blocked`).
  - Progress bar visualization.
  - Task edit modal (title, description, project, due date).
  - Inline status/progress updater.
  - Task archiving + Unarchive.
  - Bulk actions (select all, archive selected, delete selected).
  - Project filter/dropdown integration.
  - Error/success toasts for all operations.

- **Dashboard Enhancements (Phase 1 + Phase 2)**
  - **My Active Tasks** metrics block:
    - Total active tasks
    - Status breakdown (todo/in_progress/done/blocked)
    - Quick link to Tasks page
  - **New Sections Added:**
    - **Recent Tasks** (5 most recently updated tasks)
    - **Recent Standups** (last 3 days, grouped by date)
    - **Quick Actions** panel (Go to Tasks / Go to Standups)
  - **My Today panel** expanded to include:
    - My Standups (today)
    - My Projects
    - My Active Tasks
    - Recent Tasks
    - Quick Actions
  - **Unit Snapshot** panel improved for theme support and readability.

- **Standups Enhancements**
  - “Create Task From Today” integration.
  - Improved AI Summary section.
  - “Export Standups as Markdown” button.
  - Theme-aware styles and minor UX polish.

### Changed
- Updated Layout shell to wrap app with:
  - `ThemeProvider`
  - `ToastProvider`
- Updated Sidebar + Topbar for theme-safe colors and better active-state styles.
- Improved filtering logic in TasksPage.
- Dashboard now loads all user-specific data with correct Authorization headers.
- Dashboard layout upgraded to a cleaner 2-column structure with stacked cards.
- General UI/UX cleanup across multiple components.

### Fixed
- Tasks search previously not matching project names (fixed).
- Dashboard tasks panel not updating due to missing auth header.
- Standup summary error states not rendering correctly.
- Multiple light/dark theme color inconsistencies.
- Minor layout alignment and spacing issues across Tasks, Standups, and Dashboard.

---

## [0.4.0] - 2025-12-01

### Added
- New **Tasks module**:
  - Backend CRUD API at `/api/tasks` (list, create, update, deactivate).
  - Tasks linked to the authenticated user and optionally tied to a project.
  - Task fields include: `title`, `description`, `status`, `progress`, `project_id`, `due_date`, `is_active`.
  - Added `task_store.py` service layer for DB operations.
  - Standup summary now incorporates active tasks for richer AI summaries.

- Frontend tasks UI:
  - **"My Tasks"** panel integrated into the Standups page.
  - Create-task modal with project assignment.
  - Inline editing for status, progress %, and description.
  - Task filtering by project.

- Database:
  - Automatic creation of the `tasks` table during startup (`init_db()`).
  - Added foreign key linking `project_id → projects(id)`.

- Admin initialization:
  - Added `ensure_default_admin()` to always create a fallback admin account  
    (`admin` / `password`) when no admin exists.

### Changed
- `main.py` startup flow updated:
  - `init_db()` now also creates the tasks table.
  - Calls `ensure_default_admin()` on startup.
  - Loads tasks router automatically.

- Standup summary:
  - Updated summarizer to include per-user active tasks.
  - LLM prompt improved for merging standups + task progress.

---

## [0.3.0] - 2025-12-01

### Added
- Expanded user profile system:
  - New profile fields: `display_name`, `job_title`, `team_name`, `rank`, `skills`, `is_active`.
  - User profile update endpoint (`PUT /api/auth/me`) for editing own profile fields.
  - Password change endpoint (`PUT /api/auth/change_password`).
- Admin create-user endpoint now supports full profile input.
- Admin user-management capabilities:
  - Toggle user role (`user`/`admin`).
  - Activate/disable user accounts (`is_active` flag).
  - Display all profile fields in the admin user table.

### Changed
- Registration & admin-create routes now fully validate and accept extended profile fields.
- Updated `UserPublic` and related Pydantic models to include profile metadata.
- AdminPage frontend upgraded:
  - Full create-user form with profile fields.
  - Improved user table with badges, role toggle, and active state indicators.
- Updated backend `create_user` logic to properly store new profile fields.

---

## [0.2.0] - 2025-12-01

### Added
- Knowledgebase document upload endpoint for PDF/TXT/MD including text extraction and vector indexing using Chroma.
- Endpoint to list all indexed knowledge documents with metadata and preview.
- Endpoint to delete documents (removes vectors and optionally removes files in Knowledgebase/).
- Frontend Knowledge page updates:
  - Upload & index documents
  - List indexed docs with previews
  - Delete documents
  - Improved note-adding UI
- Added automatic refresh of document list after upload or delete.

### Changed
- Refactored `knowledge_service.py` to use unified file extraction and indexing utilities.
- Improved RAG query prompt and fallback logic for more reliable responses.
- Cleaned `DeleteDocumentRequest` model to remove inherited `text` field, preventing 422 errors.

---

## [0.1.0] - Initial Release

### Added
- Initial DevCell Platform skeleton: FastAPI backend, React/TS frontend.
- Authentication system (JWT), Admin dashboard, User management.
- Standups module (create, list, summarize via LLM).
- Projects module (CRUD, progress tracking).
- Knowledgebase (initial version) with text-based notes.
- Chat module with API passthrough/LLM support.
- Basic Dashboard with mission overview stats.
