# Standups Module

The Standups module provides DevCell’s structured daily reporting workflow.
Users submit their daily **Yesterday / Today / Blockers (Y/T/B)** entries, which
are recorded in the database, displayed in the Dashboard, and can be used to
generate tasks or SITREP summaries.

This document describes:
- data model
- backend routing & service logic
- LLM summary generation
- standup → task conversion
- frontend behavior
- module integrations

---

# 🎯 Purpose

Standups help teams maintain operational clarity by:

- recording daily work  
- highlighting blockers  
- aligning on goals  
- enabling automatic task extraction  
- feeding SITREP summaries  
- tracking progress historically  

Each user submits **one standup per day**, and entries remain private.

---

# 🧱 Data Model

Standup entries are stored in the `standups` table:

```

id INTEGER PRIMARY KEY
username TEXT
yesterday TEXT
today TEXT
blockers TEXT
summary TEXT       -- LLM-generated summary
created_at TEXT    -- timestamp (date-resolution used to enforce 1/day rule)

````

### Notes
- `summary` may be null if not generated.
- Standup lineage supports Tasks (via `origin_standup_id`).
- Only the owner of the entry may view/edit/convert it.

---

# 🧩 Backend Architecture

Standups backend functionality spans:

- Routes → `routes/standups.py`
- Service → `services/standup_service.py`
- Store → `services/standup_store.py`
- LLM summary → `standup_service.generate_summary()`

---

## 🗂️ 1. Routes (`standups.py`)

Endpoints include:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/standups/latest` | Get user’s most recent standup |
| GET | `/api/standups/history` | List recent standups |
| POST | `/api/standups` | Submit standup for current day |
| GET | `/api/standups/{id}` | Retrieve specific standup |
| POST | `/api/standups/{id}/summary` | Generate or regenerate LLM summary |
| POST | `/api/standups/{id}/convert_to_tasks` | Convert lines to tasks |

Routes use authentication dependencies to ensure standups remain private.

---

## 🧠 2. Service Layer (`standup_service.py`)

The service enforces all standup business rules.

### **Daily uniqueness rule**
```python
if store.has_standup_for_today(username):
    raise HTTPException(409, "Standup already submitted for today")
````

### **Summary generation (LLM)**

Service sends a structured prompt to LLM:

* yesterday section
* today section
* blockers section
* optional metadata (rank, job title, display name)

The LLM returns a succinct operational summary.

### **History retrieval**

Returns the last N standups (default: 7).

### **Standup → Task conversion**

Converts a list of bullet lines from standup into tasks:

* each line becomes a task title
* task owner = standup owner
* optional project association
* optional due-date presets
* `origin_standup_id` stored for lineage

Validation ensures:

* empty lines ignored
* tasks cannot be created for unauthorized projects

---

## 🗃️ 3. Store Layer (`standup_store.py`)

Provides:

* `insert_standup()`
* `get_latest()`
* `list_recent()`
* `get_by_id()`
* `summary update`
* `existence check (today)`

No foreign keys are involved, to maintain portability.

---

# 🖥️ Frontend Architecture

Frontend logic for standups lives in:

```
src/pages/StandupPage.tsx
src/components/StandupEntryEditor.tsx
src/components/StandupSummary.tsx
src/components/StandupTaskConvertModal.tsx
src/lib/standups.ts
```

### StandupPage

* Loads user’s latest standup
* Allows creation of today’s standup
* Displays summary if available
* Provides a button to:

  * generate summary
  * convert standup → tasks

### StandupEntryEditor

UI for entering Y/T/B fields:

* Markdown-like text areas
* Auto-save on submit
* Prevents duplicate entry per day

### StandupSummary

Displays AI-generated summary with:

* semantic formatting
* inline date references

### StandupTaskConvertModal

Core UI for task extraction:

* parses standup text into bullet lines
* user selects lines to convert
* user assigns:

  * project (optional)
  * due date (optional)
* confirmation creates multiple tasks at once

---

# 🔄 Standup → Task Conversion Workflow

Sequence:

1. User submits standup
2. User opens conversion modal
3. Modal extracts lines (client-side parsing)
4. User picks which lines should become tasks
5. Frontend sends POST:

   ```
   /api/standups/{id}/convert_to_tasks
   ```
6. Backend validates membership (for project-scoped tasks)
7. Backend creates tasks with:

   * title extracted
   * owner = user
   * origin_standup_id = standup.id
8. Newly created tasks appear in TasksPage and Dashboard

This workflow automates task creation from natural language daily reports.

---

# 🤖 LLM Summary Generation

Implemented in:

```
services/standup_service.py
```

### Prompt includes:

* Yesterday’s tasks
* Today’s goals
* Blockers
* User context (display name, optional metadata)
* Instruction set: concise, operational, actionable

### Characteristics:

* deterministic; low temperature
* summary cached in DB for future display
* re-generating summary overwrites old one

---

# 🔐 Permissions

### Standups are always private.

| Action                       | Allowed                   |
| ---------------------------- | ------------------------- |
| Submit standup               | User                      |
| View own standups            | User                      |
| View someone else’s standups | ❌ Not allowed             |
| Admin viewing                | ❌ Not allowed (by design) |
| Convert standup to tasks     | User                      |
| Generate summary             | User                      |

Backend enforces user identity in all standup operations.

---

# 📊 Integration With Other Modules

### Dashboard

Dashboard’s “Today” panel reads:

* today’s standup
* summary (if generated)
* tasks extracted from standup

### SITREP Generator

SITREP uses:

* today’s standup summary
* recent standups for narrative context
* user’s active tasks

### Tasks

Tasks generated from standups carry:

* `origin_standup_id`
* optional project association

### Training

Training does not directly integrate with standups (future possible).

---

# 🔮 Future Enhancements

From roadmap:

* team standups (multi-user standup feed)
* scheduled reminders
* "standup score" analytics (streaks, completeness)
* better NLP extraction of tasks
* auto-classification of standup lines (risk, success, blocker)
* inline editing of yesterday’s entries

---

# 📚 Related Documents

* Tasks Module → `tasks.md`
* Dashboard Module → `dashboard.md`
* Permissions Model → `permissions.md`
* API Reference → `../api/standups_api.md`

---

```
© DevCell Platform Documentation — GitHub OSS Style
```