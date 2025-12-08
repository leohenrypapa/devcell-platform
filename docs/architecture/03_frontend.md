# Frontend Architecture

The DevCell frontend is a modular **React + TypeScript** single-page application
built with Vite. It is structured using a clear separation between:

- Pages (top-level routes)
- Components (reusable UI pieces)
- Context providers (global state)
- Lib helpers (API + utilities)
- Feature-specific modules

The architecture emphasizes clarity, maintainability, and integration with the
backend’s vertical-slice structure.

---

# 🏗️ High-Level Structure

```

frontend/src/
│
├── pages/                ← Top-level screens bound to routes
├── components/           ← Reusable UI blocks
├── context/              ← Global state providers
├── lib/                  ← API helpers, types, utilities
├── styles/               ← CSS / Tailwind / overrides
└── main.tsx              ← App entry point

```

Routing is handled inside `main.tsx` (or `App.tsx` depending on version),
mapping URLs to Page components.

---

# 🌐 Routing & Pages

Each major backend module maps to a dedicated frontend page in `src/pages/`.

| Module | Page File | Route |
|--------|-----------|-------|
| Auth | `LoginPage.tsx` | `/login` |
| Dashboard | `DashboardPage.tsx` | `/dashboard` |
| Tasks | `TasksPage.tsx` | `/tasks` |
| Projects | `ProjectsPage.tsx` | `/projects` |
| Standups | `StandupPage.tsx` | `/standups` |
| Knowledgebase | `KnowledgePage.tsx` | `/knowledge` |
| Chat (LLM) | `ChatPage.tsx` | `/chat` |
| Review (LLM code review) | `ReviewPage.tsx` | `/review` |
| Training | `TrainingPage.tsx` | `/training` |
| Admin | `AdminPage.tsx` | `/admin` |

Each page is a container that:

- fetches backend data  
- manages local UI state  
- renders shared components  
- calls API helpers in `lib/`  

---

# 🔧 Components Architecture

Components follow a **feature-driven** structure. Common examples:

### **Task Components**
- `TaskCard.tsx`
- `TaskList.tsx`
- `TaskForm.tsx`
- `TaskFilters.tsx`
- `TaskBulkActions.tsx`

### **Project Components**
- `ProjectCard.tsx`
- `ProjectMemberList.tsx`
- `ProjectMemberEditor.tsx`

### **Standup Components**
- `StandupEntryEditor.tsx`
- `StandupSummary.tsx`
- `StandupTaskConvertModal.tsx`

### **Knowledge Components**
- `KnowledgeUpload.tsx`
- `KnowledgeSearch.tsx`
- `KnowledgeList.tsx`

### **Training Components**
- Training roadmap preview  
- Seed-task confirmation modal  

### **UI/Shared**
- `Navbar.tsx`
- `Sidebar.tsx`
- `ThemeToggle.tsx`
- `LoadingSpinner.tsx`
- Modal components
- Toast notifications

Components are designed to be:

- stateless when possible  
- reusable  
- lightweight wrappers around service calls  

---

# 🧠 Global State Management (Context)

DevCell uses React Context for lightweight global state.

### **AuthContext**
Located in:  
`src/context/AuthContext.tsx`

Provides:
- `user`
- `token`
- `login()`
- `logout()`
- auto-injects JWT into API calls

### **ThemeContext**
Manages light/dark mode, syncs with localStorage.

### **ToastContext**
Global notification system.

### **ProjectContext** *(optional depending on version)*  
Caches project list for quick filtering.

---

# 🔌 API Layer (`src/lib/`)

This folder contains all frontend-backend interaction logic.

### **`backend.ts`**
The unified API client.

Handles:
- base URL injection  
- attaching JWT token  
- standardizing errors  
- common GET/POST/PATCH wrappers  

### **`auth.ts`**
Login, logout, current user, admin user ops.

### **`tasks.ts`**
Type definitions:
- `Task`
- `TaskStatus`
- `TaskListResponse`
- `TaskUpdatePayload`

API methods:
- list tasks
- create task
- update task
- delete task
- bulk update
- filter presets

### **`projects.ts`**
Wrapper for:
- project CRUD  
- membership operations  
- `/projects/mine`  

### **`standups.ts`**
- submit daily standup  
- get recent  
- generate summaries  
- convert to tasks  

### **`knowledge.ts`**
- upload documents  
- delete  
- list  
- semantic search  

### **`chat.ts`**
- send message to LLM  
- structured personas  
- tokens + system prompts  

### **`review.ts`**
- code review request  
- inline feedback extraction  

### **`training.ts`**
- import roadmap  
- seed tasks  

### **`users.ts`** (added in CHANGELOG)
Admin operations (list/update/create/disable).

---

# 🎨 UI Architecture & Style System

DevCell uses:
- React + TypeScript  
- Tailwind CSS (or equivalent lightweight utility classes)  
- Condition-based className utilities  

UI philosophy:
- minimal  
- functional  
- readable  
- responsive for desktop + laptop  

---

# 🔄 Data Flow Example (Tasks Module)

```

TasksPage.tsx
↓ (loads tasks)
taskService.listTasks()
↓
GET /api/tasks
↓
task_store → SQLite
↓
TasksPage renders TaskList

```

Updating a task:

```

TaskCard → onSave()
↓
taskService.updateTask()
↓
PATCH /api/tasks/{id}
↓
task_service applies permissions
↓
Refresh state in TasksPage

```

---

# 🔐 Permissions Enforcement (Frontend Role Awareness)

Frontend reads two layers:

### **1. Global role**
From `AuthContext.user.role`  
Used to show/hide Admin panel.

### **2. Project-level permissions**
Fetched from:
- `/api/projects/mine`
- `/api/projects/{id}/members`

Used to:
- disable editing tasks in unowned projects  
- hide member-management UI  
- filter task lists  

All critical enforcement still occurs on the **backend**, but the frontend improves UX by hiding impossible actions.

---

# 📦 Build & Deployment

### **Development**
```

npm install
npm run dev

```

### **Production Build**
```

npm run build

```

Outputs static assets to:

```

frontend/dist/

```

Served by the backend (FastAPI static mount).

---

# 🛠️ Vite Configuration

Vite improves:
- build speed  
- HMR  
- TypeScript integration  
- asset pipeline clarity  

Config file:
```

vite.config.ts

```

---

# 🧪 Testing (Future)

Planned:
- component tests (Vitest)  
- integration tests for API helper layer  
- e2e tests with Playwright  

---

# 🔮 Future Frontend Enhancements

- Split-pane task + standup views  
- Drag-and-drop task workflow  
- KB inline preview viewer  
- Real-time updates via WebSockets  
- Offline-capable progressive caching  
- Code editor for training/LLM demos  

---

# 📚 Related Documents

- Backend Architecture → `architecture/backend.md`
- Data Model → `architecture/data_model.md`
- LLM Integration → `architecture/llm_integration.md`
- Modules → `modules/*`
- API Reference → `api/*`

---

```

© DevCell Platform Documentation — GitHub OSS Style

```