# Dashboard Module

The Dashboard is the central operational view of DevCell.  
It aggregates data from Standups, Tasks, Projects, Knowledgebase, and LLM
pipelines to give each user a real-time picture of their current workload,
priorities, and mission context.

The Dashboard module integrates more subsystems than any other part of DevCell.

---

# 🎯 Purpose

The Dashboard provides:

- Today’s standup + summary  
- Active tasks overview  
- Recent tasks (last 7–14 days)  
- Project summary cards  
- Quick-launch actions (create task, write standup, run SITREP)  
- Optional SITREP generation using LLM  
- Optional contextual enrichment via Knowledgebase (RAG)

It is the starting page for most users.

---

# 🧱 Data Model Dependencies

The Dashboard does **not** have its own database table.  
Instead, it composes information from:

- `standups` (today’s + recent)
- `tasks` (active, recent, due)
- `projects` (membership + summaries)
- `knowledge_docs` (for RAG-based enrichment)
- LLM responses (SITREP)

---

# 🧩 Backend Architecture

The Dashboard logic lives in:

- `routes/dashboard.py`
- `services/dashboard_service.py`

---

## 📁 1. Routes (`dashboard.py`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Aggregated dashboard data |
| POST | `/api/dashboard/sitrep` | Generate SITREP (optional RAG) |

The route enforces authentication and passes the user to the service layer.

---

## 🧠 2. Service Layer (`dashboard_service.py`)

The service gathers all dashboard elements:

### 1. Today’s Standup
- Fetches most recent standup for date = today  
- Returns:
  - raw Y/T/B fields  
  - `summary` if present  
- If none submitted, returns `null`

### 2. Active Tasks
Queries tasks where:
- `owner = user`  
- `is_active = 1`  
- sorted by status + due date  

### 3. Recent Tasks
Queries tasks updated within last 7–14 days:
- includes completed tasks  
- sorted by most recently updated  

### 4. Project Summaries
For each project the user is a member of:
- total tasks  
- active tasks  
- completed tasks  
- latest activity timestamp  
- member count  

### 5. SITREP Generator
See below.

### 6. Knowledgebase Context (optional)
When generating a SITREP:
- Extracts keywords from standup + tasks  
- Performs KB search  
- Injects retrieved context into LLM prompt  

---

# 🧠 LLM-Based SITREP Generation

Route:  
```

POST /api/dashboard/sitrep

```

Service:  
```

dashboard_service.generate_sitrep()

```

### Input:
Optional user-provided instructions:
```

{
"notes": "Focus on blockers and mission impacts"
}

```

### Data included in SITREP prompt:

- Today’s standup summary  
- Last several standups  
- Active tasks  
- Blockers  
- Project summaries  
- Optional RAG context  
- Optional user notes  

### Output:
A structured report with sections like:

- Key Activities  
- Operational Summary  
- Blockers / Risks  
- Next Priorities  
- Optional: references if RAG is used  

### Model Behavior:
- deterministic output  
- concise operations-style drafting  
- no hallucinated tasks due to explicit grounding  

---

# 🖥️ Frontend Architecture

Dashboard UI lives in:

```

src/pages/DashboardPage.tsx
src/components/DashboardStandup.tsx
src/components/DashboardTasks.tsx
src/components/DashboardProjects.tsx
src/components/DashboardSITREP.tsx
src/lib/dashboard.ts

````

### DashboardPage
Loads all data on mount:

- `/api/dashboard`
- store in state slices: standup, tasks, projects

Buttons include:
- “Write Today’s Standup”
- “Create Task”
- “Generate SITREP”

### DashboardStandup
- shows Y/T/B fields  
- shows summary (if exists)  
- if no standup → display “Write standup now” button  

### DashboardTasks
- lists active tasks grouped by status  
- shows due dates and progress bars  
- links to full Tasks page  

### DashboardProjects
- shows project summary cards  
- each card shows:
  - task counts  
  - last update  
  - member count  

### DashboardSITREP
- textarea for optional notes  
- button: “Generate SITREP”  
- displays formatted SITREP with section headers  

---

# 🔄 Dashboard Data Flow

```mermaid
flowchart TD
    U[User] --> F[DashboardPage.tsx]
    F --> API[/GET /api/dashboard/]

    API --> S[Dashboard Service]
    S --> ST[Standups]
    S --> TS[Tasks]
    S --> PR[Projects]
    S --> KB[Knowledgebase (optional)]
    S --> LLM[(LLM Server)]:::llm

    S --> FRES[Aggregated Dashboard Data]
    FRES --> F

    classDef llm fill:#eef,stroke:#66f
````

---

# 🔐 Permissions

Dashboard respects all project-level permissions:

* only tasks from user’s projects are shown
* only user’s standups are shown
* only projects where user is member/owner appear

Admins cannot see restricted projects from dashboard (unless using admin-specific endpoints).

---

# 🔍 Dashboard Sections Explained

### **1. My Standup (Today)**

Shows:

* Yesterday
* Today
* Blockers
* AI Summary (optional)

If missing:

* show call to action
* disable SITREP button

---

### **2. Active Tasks**

Grouped by:

* `todo`
* `in_progress`
* `blocked`
* `done`

Supported features:

* inline status change
* quick progress update
* due date badges

---

### **3. Recent Activity**

Shows tasks updated recently:

* changed status
* created
* completed

Great for tracking operational tempo.

---

### **4. My Projects**

Summary cards with:

* total tasks
* active tasks
* completed tasks
* training tasks
* latest update timestamp
* member count

Clicking a project card → opens Tasks filtered by that project.

---

### **5. SITREP Generation**

Displays:

* notes input
* “Generate SITREP” button
* rendered SITREP with section headers

SITREP shows timestamp and included metadata.

---

# 🛑 Failure Handling

Dashboard gracefully handles missing components:

* If LLM offline → SITREP disabled
* If KB unavailable → RAG context skipped
* If no standup → SITREP disabled
* If no tasks → empty-state cards shown

API always returns predictable JSON shapes.

---

# 🔮 Future Enhancements

* Project-specific dashboards
* Team dashboards (aggregated standups)
* Activity heatmaps
* Burn-down charts (tasks over time)
* Alerts for overdue tasks
* Inline editing of standup fields
* Auto-SITREP scheduled generation

---

# 📚 Related Documents

* Standups Module → `standups.md`
* Tasks Module → `tasks.md`
* Knowledgebase Module → `knowledge.md`
* LLM Integration → `architecture/llm_integration.md`
* Permissions Model → `permissions.md`
* API documentation → `../api/dashboard_api.md`

---

```
© DevCell Platform Documentation — GitHub OSS Style
```