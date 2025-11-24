# DevCell Platform – Standups

## 1. Purpose

The Standups module captures what each developer is working on, what they did, and what’s blocking them. It’s designed to replace messy chats or ad-hoc notes with a simple, structured, persistent system.

It also powers the AI-generated daily SITREP used on the Standups page and the Dashboard.

---

## 2. Data Model

### 2.1 Table: standups

Columns (conceptual):

- `id` – integer primary key
- `name` – text, the username of the person who created the standup
- `yesterday` – text (optional)
- `today` – text (required)
- `blockers` – text (optional)
- `project_id` – integer (nullable), references `projects.id` if linked
- `created_at` – timestamp (when the entry was created)

The standups are stored in **SQLite** as part of `devcell.db`, so they survive restarts.

### 2.2 Schemas

Pydantic models (simplified):

- `StandupCreate`
  - `yesterday: Optional[str]`
  - `today: str`
  - `blockers: Optional[str]`
  - `project_id: Optional[int]`
- `StandupEntry`
  - Matches DB row, with `id`, `name`, `created_at`, `project_name` (when joined)
- `StandupList`
  - `items: List[StandupEntry]`
- `StandupUpdate`
  - Same fields as `StandupCreate` but all optional

---

## 3. Backend API

Base path: `/api/standup`

### 3.1 Create Standup

`POST /api/standup`

- Auth required.
- Body: `StandupCreate`.
- Backend sets `name = current_user.username` (ignores any client `name` field).
- `created_at` is set to now.

### 3.2 List Today’s Standups

`GET /api/standup/today`

- Returns `StandupList` of all standups created “today” (based on server date).

### 3.3 List Standups by Date

`GET /api/standup/by-date?date=YYYY-MM-DD`

- Returns `StandupList` for that calendar date.
- Anyone logged in can see all standups for that date.

### 3.4 Update Standup

`PUT /api/standup/{id}`

- Auth required.
- Body: `StandupUpdate` (partial update).
- Allowed if:
  - `current_user.username == standup.name`, or
  - `current_user.role == "admin"`.

### 3.5 Delete Standup

`DELETE /api/standup/{id}`

- Same permission rules as Update.

### 3.6 AI Summary

`GET /api/standup/summary`

- Returns an AI-generated summary of **today’s** standups.
- Response contains (simplified):

```json
{
  "summary": "Text summary from LLM",
  "count": 7
}
```

- Used by both Standups page and Dashboard.

---

## 4. Frontend Behavior

Page: `StandupPage.tsx`

### 4.1 Submitting Standups

The form includes:

- Project selection (optional)
- Yesterday
- Today (required)
- Blockers

On submit:

1. If not logged in, user is asked to log in.
2. `POST /api/standup` with the fields above.
3. Backend sets `name` from the current user and saves it.
4. Page reloads standups for the selected date (usually today).

If you click “Edit” on an entry you own (or as admin):

- The form is filled with that entry’s data.
- Submit button changes to “Update Standup”.
- On submission, a `PUT` request is sent instead of `POST`.
- There is also a “Cancel Edit” button to reset the form.

### 4.2 Browsing Standups

The page has:

- A **date picker** to choose which day’s standups to view.
- A **list** showing standups for that date.

List entries show:

- Name (user who submitted)
- Time (from `created_at`)
- Optional project name
- Yesterday / Today / Blockers

There is also a “Show only my standups” checkbox:

- When checked, the list is filtered client-side to only entries where `entry.name === current_user.username`.

### 4.3 Editing & Deleting

For each standup entry:

- If you are the owner or an admin, you see **Edit** and **Delete** buttons.
- Edit:
  - Loads that entry into the form.
  - Switches the form into “Update Standup” mode.
- Delete:
  - Confirms with the user.
  - Sends `DELETE /api/standup/{id}`.
  - Reloads standups for the current date.

---

## 5. AI Summary & SITREP

There are two primary usages:

1. **Standups Page**
   - Button: “Generate AI Summary”
   - Calls `GET /api/standup/summary`
   - Shows output and the number of entries used.
   - Provides “Copy Summary” button to copy a block of text such as:

     ```text
     Daily Standup Summary (today)
     Based on 7 standup entries.

     - Team focused on finishing feature X and debugging Y.
     - Two developers are blocked on environment configuration.
     - One project is nearing completion and ready for testing.
     ```

2. **Dashboard (Unit SITREP)**
   - Uses same endpoint but presents it as a **Unit Daily SITREP**.
   - Also provides “Copy SITREP” button for briefs/emails.

---

## 6. Permissions Summary

| Action                                | User | Admin |
|---------------------------------------|:----:|:-----:|
| Submit new standup                    |  ✔   |   ✔   |
| View standups for any date            |  ✔   |   ✔   |
| Edit own standups                     |  ✔   |   ✔   |
| Delete own standups                   |  ✔   |   ✔   |
| Edit/delete others’ standups          |      |   ✔   |
| Generate daily AI summary             |  ✔   |   ✔   |

---

## 7. Operational Notes

- Timezone: by default, “today” is based on the server’s local time. If you have strict timezone needs, adjust both the backend and frontend to use a fixed timezone (e.g. UTC).
- Volume: for very high volume of standups, you may want indexes on date fields or migration to a heavier DB, but for typical unit use SQLite is sufficient.
- LLM: if the AI summary stops working, check:
  - LLM server connectivity
  - LLM API key / URL in environment
  - Backend logs for errors in the summary service

This document should allow developers and operators to understand how standups are stored, manipulated, and summarized in the DevCell Platform.
