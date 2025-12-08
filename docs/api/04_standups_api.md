# Standups API

The Standups API provides endpoints for submitting, retrieving, summarizing, and
converting daily standup entries. Standups follow the classic **Yesterday /
Today / Blockers (Y/T/B)** structure and are always **private** to the
authenticated user.

All routes require authentication via bearer token.

---

## 🧩 Base URL

```text
/api/standups
```

---

## 🔐 Permissions Overview

Standups are **user-private**:

- Users may only view and modify **their own** standups.
- Admins do **not** have special access to other users’ standups via this API.
- Standups can be used to generate tasks, but only by the standup owner.

If a request references a standup that does not belong to the caller, the API
returns `403 Access denied`.

---

## 📚 Endpoints

### 1. Get Latest Standup

#### `GET /api/standups/latest`

Returns the most recent standup for the authenticated user (typically today’s
entry if submitted, otherwise the last one).

##### Response

```json
{
  "id": 12,
  "username": "alice",
  "yesterday": "- Worked on task X",
  "today": "- Implementing Y",
  "blockers": "- Waiting on access",
  "summary": "Short LLM-generated summary...",
  "created_at": "2025-12-08T09:30:00Z"
}
```

If no standup exists, returns `null` or `404` depending on implementation
detail (service typically normalizes to an empty payload for the dashboard).

---

### 2. Get Standup History

#### `GET /api/standups/history`

Returns a list of recent standups for the authenticated user.

##### Query Parameters

| Name   | Type | Description                      |
|--------|------|----------------------------------|
| `limit`| int  | Optional, number of entries (e.g. 7 or 30) |

##### Response

```json
{
  "items": [
    {
      "id": 10,
      "yesterday": "...",
      "today": "...",
      "blockers": "...",
      "summary": null,
      "created_at": "2025-12-06T09:30:00Z"
    },
    {
      "id": 11,
      "yesterday": "...",
      "today": "...",
      "blockers": "...",
      "summary": "Short summary...",
      "created_at": "2025-12-07T09:30:00Z"
    }
  ]
}
```

All entries are owned by the caller.

---

### 3. Submit Standup (Create Today’s Entry)

#### `POST /api/standups`

Creates a standup entry for the current day.

> Only **one** standup per user per day is allowed.  
> If a standup already exists for today, the API returns `409 Conflict`.

##### Request Body

```json
{
  "yesterday": "- Investigated incident 42\n- Wrote training doc",
  "today": "- Finish task A\n- Start task B",
  "blockers": "- Waiting on environment access"
}
```

##### Response

```json
{
  "id": 13,
  "username": "alice",
  "yesterday": "...",
  "today": "...",
  "blockers": "...",
  "summary": null,
  "created_at": "2025-12-08T09:35:00Z"
}
```

---

### 4. Get Specific Standup

#### `GET /api/standups/{id}`

Fetch a specific standup by its ID.

##### Path Parameters

| Name | Type | Description     |
|------|------|-----------------|
| `id` | int  | Standup entry ID |

##### Response

```json
{
  "id": 11,
  "username": "alice",
  "yesterday": "...",
  "today": "...",
  "blockers": "...",
  "summary": "Short summary...",
  "created_at": "2025-12-07T09:30:00Z"
}
```

If the standup does not belong to the authenticated user, the API returns:

- `403 Access denied` or
- `404 Not found` (depending on implementation policy to avoid leaking IDs).

---

### 5. Generate / Regenerate Standup Summary

#### `POST /api/standups/{id}/summary`

Triggers LLM-based summary generation for a specific standup.  
If a summary already exists, it may be overwritten with a new one.

##### Path Parameters

| Name | Type | Description     |
|------|------|-----------------|
| `id` | int  | Standup entry ID |

##### Request Body (optional)

```json
{
  "notes": "Focus the summary on blockers and mission impact"
}
```

`notes` is optional and can be used to influence the tone or focus of the
summary.

##### Response

```json
{
  "id": 11,
  "summary": "Yesterday focused on incident 42 triage. Today is dedicated to...",
  "updated_at": "2025-12-07T10:00:00Z"
}
```

---

### 6. Convert Standup to Tasks

Although task creation belongs to the Tasks module, the conversion workflow is
initiated through the Standups API.

#### `POST /api/standups/{id}/convert_to_tasks`

Converts standup lines into tasks. The frontend typically:

1. Parses `today` (and optionally `yesterday`) into bullet lines.
2. Lets the user select which lines to convert.
3. Sends the selected lines here.

##### Path Parameters

| Name | Type | Description     |
|------|------|-----------------|
| `id` | int  | Standup entry ID |

##### Request Body

```json
{
  "lines": [
    "Implement dashboard SITREP button",
    "Write unit tests for task service"
  ],
  "project_id": 3,
  "due_date": null
}
```

- `lines`: array of non-empty strings. Each becomes a new task title.
- `project_id`: optional project ID for scoping the tasks.
- `due_date`: optional due date applied to all generated tasks.

##### Response

```json
{
  "created_tasks": [
    {
      "id": 21,
      "title": "Implement dashboard SITREP button",
      "project_id": 3,
      "origin_standup_id": 11,
      "owner": "alice",
      "status": "todo",
      "progress": 0
    },
    {
      "id": 22,
      "title": "Write unit tests for task service",
      "project_id": 3,
      "origin_standup_id": 11,
      "owner": "alice",
      "status": "todo",
      "progress": 0
    }
  ]
}
```

If the user is not a member of `project_id`, the server responds with:
- `403 Access denied`.

---

## 🔐 Permission Summary

| Operation                     | Permission             |
|------------------------------|------------------------|
| Get latest standup           | Owner only             |
| Get standup history          | Owner only             |
| Submit standup               | Owner only (self)      |
| Get specific standup         | Owner only             |
| Generate summary             | Owner only             |
| Convert standup to tasks     | Owner only + project membership for created tasks |

There is intentionally **no cross-user read access** for standups.

---

## ⚠️ Error Responses

| Status | Description                                     |
|--------|-------------------------------------------------|
| `403`  | Standup does not belong to current user         |
| `404`  | Standup not found (or not visible)              |
| `409`  | Standup already exists for today                |
| `422`  | Validation error (missing Y/T/B fields, etc.)   |

---

## 🧪 Example Daily Workflow

1. **Morning:**  
   `POST /api/standups` with today’s Y/T/B.

2. **Midday:**  
   `POST /api/standups/{id}/summary` to generate LLM summary.

3. **End of day:**  
   `POST /api/standups/{id}/convert_to_tasks` for unfinished items → new tasks.

These tasks then appear in the Tasks page and Dashboard.

---

## 📚 Related Documents

- Standups Module → `../modules/standups.md`
- Tasks API → `tasks_api.md`
- Dashboard API → `dashboard_api.md`
- LLM Integration → `../architecture/llm_integration.md`
- Permissions → `../modules/permissions.md`

---

```text
© DevCell Platform Documentation — GitHub OSS Style
```