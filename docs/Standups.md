# Standups

## 1. Purpose

The Standups module is a lightweight way to:

- Capture daily updates from each dev.
- Link updates to projects.
- Generate AI summaries (unit SITREP).
- Support reporting and historical review.

## 2. Data Model

**Table**: `standups`

- `id` (int, PK)
- `name` (text) – automatically set to `current_user.username`
- `yesterday` (text, nullable)
- `today` (text, required)
- `blockers` (text, nullable)
- `project_id` (int, nullable, FK → projects.id)
- `created_at` (datetime)

Pydantic:

- `StandupCreate`
- `StandupEntry`
- `StandupList`
- `StandupUpdate`

## 3. Backend API

Base path: `/api/standup`

- `POST /api/standup`
  - Auth required.
  - Body: `StandupCreate` (backend overrides `name`).
  - Automatically timestamps `created_at`.
- `GET /api/standup/today`
  - Returns today's standups.
- `GET /api/standup/by-date?date=YYYY-MM-DD`
  - Returns standups for a given date.
- `GET /api/standup/summary`
  - Uses LLM to summarize **today's** standups.
  - Returns `{ summary, count }`.
- `PUT /api/standup/{id}`
  - Auth required.
  - Body: `StandupUpdate`.
  - Allowed if:
    - current user is admin, OR
    - current user name matches `standup.name`.
- `DELETE /api/standup/{id}`
  - Same permission rules as update.

## 4. Frontend Behavior

Page: `src/pages/StandupPage.tsx`

### 4.1 Submit / Edit Standup

- Form fields:
  - Project selector (optional).
  - Yesterday (text).
  - Today (required).
  - Blockers (text).
- `name` is never user-entered; it’s inferred from logged-in user.
- Supports:
  - Creating new standup (POST).
  - Editing existing standup (PUT):
    - Click “Edit” on a standup row → form is pre-filled.
    - Button label changes to “Update Standup”.
    - “Cancel Edit” resets form.

### 4.2 Browsing Standups

- Date filter:
  - `input type="date"` at top.
  - Calls `GET /api/standup/by-date?date=...`.
- “Show only my standups” toggle:
  - Filters the list client-side to `entry.name === current_user.username`.

### 4.3 AI Summary

- Button: `Generate AI Summary`.
  - Calls `GET /api/standup/summary`.
  - Displays summary text and number of entries used.
- Button: `Copy Summary`.
  - Copies a SITREP-style text to clipboard for easy reporting.

## 5. Permissions

- Any authenticated user can:
  - Create their own standups.
  - Edit/delete standups they own.
- Admin can:
  - View all standups.
  - Edit/delete any standup.
  - Dashboard reuses these standups to generate a unit SITREP.
