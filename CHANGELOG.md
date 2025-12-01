## [Unreleased]

### Added
-

### Changed
-

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
