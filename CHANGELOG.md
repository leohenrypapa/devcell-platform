## [Unreleased]

### Added
-

### Changed
-

### Fixed
-
---

## [0.6.4] - 2025-12-08

### Added

* None

### Changed

* Updated `projects` API client (`lib/projects.ts`) to require a token argument and consistently attach `Authorization: Bearer <token>` headers.
* Updated `ProjectsPage.tsx` to load projects via `listProjects(token)` and handle authenticated fetch flow.
* Standardized header builder (`buildHeaders`) usage across project-related API calls for consistency and correctness.

### Fixed

* Fixed `401 Unauthorized` errors for `/api/projects` and `/api/auth/me` caused by missing `Authorization` headers in frontend requests.
* Resolved frontend auth state mismatch where users appeared logged in but protected endpoints failed due to missing token propagation.

---

## [0.6.3] - 2025-12-08

### Added
- Added `frontend/src/lib/users.ts` as a unified helper module for:
  - Listing users
  - Creating users (admin)
  - Updating users (admin)
  - Shared request typing (`AdminCreateUserPayload`, `AdminUpdateUserPayload`)
- Added backend **admin safety guardrail**:
  - Prevents demoting the *last active admin* (`admin → user`)
  - Prevents deactivating the *last active admin* (`is_active → False`)
  - Raises clear HTTP 400 with message `"Cannot remove the last active admin user."`

### Changed
- Refactored `AdminPage.tsx` to use centralized helper functions from `lib/users.ts`
  instead of calling `fetch` directly.
- All admin update routes now consistently return typed `User` responses.
- Improved error handling path for admin actions.

### Fixed
- Eliminated risk of locking the organization out of admin access by ensuring at
  least one active admin must always exist.
- Standardized request headers and JSON handling for admin-related API calls.

---

## [0.6.2] - 2025-12-08

### Added
- Inline profile editing on the Admin User Management page (display name, job title, team, rank, skills).
- Rich user table showing core auth fields plus profile metadata.

### Changed
- Admin page UX for user management: clearer layout, dedicated refresh, and better feedback messages for admin actions.

### Fixed
- Ensured admin actions (role/active/profile updates) consistently refresh the user list after successful changes.

---

## [0.6.1] - 2025-12-08

### **Added**

* Added **24-week Malware Developer Training syllabus API**
  (`GET /api/training/malware/syllabus`) returning structured week summaries.
* Added **LLM-powered seed-task generation API**
  (`POST /api/training/malware/seed_tasks`) creating benign, lab-only tasks directly into `/api/tasks`.
* Added **training schemas** (`MalwareTrainingWeek`, `MalwareTrainingSyllabus`, `SeedTasksRequest`).
* Added full backend service module:
  `backend/app/services/training/malware_seed_tasks.py`

  * Safe, defensive-only system prompt
  * JSON & bullet-list parsing
  * Deterministic fallback tasks
  * `[WNN]` week-prefix enforcement
* Added new frontend page:
  `TrainingPage.tsx`

  * Week selector
  * Syllabus viewer
  * Auto seed-task generator UI
  * Week progress calculation using existing Tasks API
  * Training-task panel with status pills and task grouping
* Added new frontend navigation link (Sidebar → **Training**).
* Added frontend route (`/training`) with auth guard.
* Added backend routing integration in:

  * `backend/app/main.py`
  * `backend/app/api/routes/__init__.py`

---

### **Changed**

* Updated `malware_seed_tasks.py` to include:

  * Robust JSON cleanup (strip fences, remove markdown, extract valid `{}` block)
  * Cleaner fallback if LLM output is malformed
  * Stronger safety guardrails (no operational behaviors)
* Updated training task creation to ensure:

  * All titles normalized to `[WNN]`
  * Task descriptions are defensive, benign, and lab-only
  * Due dates calculated consistently
* Updated frontend backend URL handling to support TrainingPage and token-authenticated requests.
* Improved LLM system prompts to produce predictable structured output for syllabus-based tasks.
* Aligned backend startup guidance (must run uvicorn from `/backend` root).

---

### **Fixed**

* Fixed seed-task garbage output (e.g., ````json`, `{`, `"tasks": [` lines becoming tasks) by implementing strict bullet validation and JSON sanity checks.
* Fixed malformed LLM responses causing fallback logic to misbehave.
* Fixed missing imports (`date`, `timedelta`) in training route.
* Fixed `ModuleNotFoundError: No module named 'app'` by correcting backend working directory during startup.
* Fixed 401/404 issues by ensuring TrainingPage uses correct backend base URL instead of LLM port 8000.
* Fixed TrainingPage token handling so authenticated users can load tasks and syllabus reliably.

---

## [0.6.0] - 2025-12-08

### Added
- Project-level permissions model:
  - New `project_members` table (project_id, username, role, created_at).
  - New schemas: `ProjectRole`, `ProjectMember`, `ProjectMemberList`, `ProjectMemberCreate`.
  - New service module `services/projects/members.py` for membership CRUD and helper queries.
- New API endpoints:
  - `GET /api/projects/mine` – list projects where the current user is owner or member.
  - `GET /api/projects/{project_id}/members` – list members for a project (owner/admin/members only).
  - `POST /api/projects/{project_id}/members` – add or update a project member (owner/admin only).
  - `DELETE /api/projects/{project_id}/members/{username}` – remove a project member (owner/admin only).

### Changed
- `POST /api/projects` now automatically creates a `project_members` row for the creator with role `owner`.
- Database initialization (`db.py`) now creates the `project_members` table on startup.

### Fixed
- N/A (backend behavior is backward-compatible for existing projects; membership is additive).

---

## **[0.5.4] - 2025-12-08**

### Added
- Added `setUserAndToken()` helper to `UserContext` for unified login/registration token handling.
- Added admin-only visibility for Sidebar navigation — "Admin" link now appears only for users with `role: "admin"`.

### Changed
- Updated `/auth/register` to correctly accept and persist extended profile fields (display_name, job_title, team_name, rank, skills).
- Updated `AdminPage` to use the correct admin-only user creation endpoint (`POST /auth/admin/create_user`).
- Standardized non-admin role handling internally as `role: "user"` (no behavioral change, just consistency).

### Fixed
- Fixed registration auto-login by adding the missing `setUserAndToken()` implementation in `UserContext`.
- Fixed Sidebar incorrectly showing the Admin menu for all users; now properly role-gated.


## **[0.5.3] - 2025-12-03**

### Added

* **Knowledgebase subsystem modularization**

  * New directory `services/knowledge/` containing:

    * `config.py` — central paths (`knowledgebase/`, Chroma dir)
    * `client.py` — lazy Chroma persistent client initialization
    * `embedder.py` — cached SentenceTransformer loader
    * `indexer.py` — file extraction, chunking, indexing, and single-file updates
    * `query.py` — semantic RAG lookup
    * `documents.py` — CRUD-style document list / delete / add-text APIs
  * Automatic knowledgebase indexing during `main.py` startup now uses `index_files_in_knowledgebase()`.

* **Standup → Task conversion service**

  * New `services/standup/conversion.py` containing all conversion logic previously in router.
  * Provides `convert_standup_to_tasks()` for route-level calls.

* **Projects service package**

  * Added `services/projects/` package with `crud.py` consolidating project CRUD operations.
  * Added `services/projects/__init__.py` exporting project functions.

### Changed

* Split monolithic `knowledge_service.py` into modular service components listed above.
* Refactored `routes/knowledge.py` to import from new modular knowledge services.
* Refactored `main.py` startup sequence to use new knowledge initialization function.
* Updated `routes/standup.py` to call service-layer conversion logic instead of inline processing.
* Updated import paths in:

  * `standup_store.py`
  * `dashboard_service.py`
  * `project_summary.py`
  * `routes/projects.py`
* Renamed and standardized `Knowledgebase/` directory to lowercase `knowledgebase/`.
* Updated Chroma vector deletion logic to use `$and` operator for valid filter syntax.

### Fixed

* **Knowledgebase document deletion bug**

  * Fixed Chroma filter validation error (`"Expected where to have exactly one operator"`).
  * New implementation uses:

    * `{"title": title}` when path missing
    * `{"$and": [{"title": title}, {"path": path}]}` when path provided
* Removed legacy `knowledge_service.py` and `project_store.py` to prevent accidental imports.
* Ensured all new service directories (`knowledge/`, `projects/`, `standup/`) are properly added to Git.

---

## [0.5.2] - 2025-12-03

### Added
- Quick per-task due date controls (+1d/+3d/+7d/Clear) on Tasks page.
- Bulk status actions (Todo / In Progress / Done / Blocked) for selected tasks.
- Bulk due date actions (+1d/+3d/+7d/Clear) for selected tasks.
- Task filter presets (My Active, Blocked Only, All Active) with localStorage persistence.

### Changed
- Tasks filter toolbar refactored to include preset buttons above detailed filters.

### Fixed
- N/A

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
