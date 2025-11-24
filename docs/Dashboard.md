# Dashboard

## 1. Purpose

The Dashboard (`/`) is the “morning brief” view:

- Shows **your** work today.
- Shows **unit-wide** status (standups and projects).
- Provides a **unit SITREP** AI summary with one-click copying.

## 2. Data Sources

The Dashboard pulls from:

- `/api/standup/by-date?date=TODAY`
- `/api/projects`
- `/api/standup/summary`

## 3. Layout

Page: `src/pages/DashboardPage.tsx`

### 3.1 My Today (left panel)

- Shows:
  - Date + current user (if logged in).
- **My Standups Today**:
  - Filters today’s standups to `name === current_user.username`.
  - Shows Today + Blockers + Project name.
- **My Projects**:
  - Filters projects to `owner === current_user.username`.
  - Shows name, status, and description.

### 3.2 Unit Snapshot (right panel)

- **Total standups today**:
  - Count of today’s standups (all users).
- **Projects by status**:
  - Number of projects in each status:
    - Planned
    - Active
    - Blocked
    - Done

### 3.3 AI Unit SITREP (bottom panel)

- Uses `GET /api/standup/summary`.
- Shows:
  - Number of standups used.
  - AI-generated summary text.
- Buttons:
  - `Refresh Summary` – re-call the endpoint.
  - `Copy SITREP` – copies formatted text:
    - `Unit Daily Standup SITREP (today)`
    - `Based on N standup entries.`
    - `<summary text>`

## 4. Permissions

- Auth is enforced at router level:
  - Dashboard is only visible when logged in (App-level routing).
- Data is aggregated at unit level:
  - Admin and regular users see the same snapshot, but “My Today” is obviously per-user.
