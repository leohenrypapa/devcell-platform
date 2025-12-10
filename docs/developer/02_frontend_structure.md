# Frontend Structure (React + TypeScript)

The frontend is a modern Vite-based SPA with modular page/component layout.

````

frontend/src/
├── pages/          # Full pages (Tasks, Standups, Training, Knowledge)
├── components/     # Shared UI components
├── lib/            # API helpers, utilities
├── hooks/          # React hooks (state, data fetching)
└── context/        # Global state providers

````

---

# 1. Startup

Install dependencies:
```bash
cd frontend
pnpm install
````

Start dev server:

```bash
pnpm dev
```

Open UI:

```
http://localhost:5173
```

---

# 2. API Communication

All API requests go through `lib/apiClient.ts` and hit:

```
http://localhost:9000
```

Example:

```ts
const tasks = await api.get("/tasks");
```

---

# 3. Pages

Each page:

* fetches its own data
* uses domain hooks
* uses shared UI components

Examples:

* `TasksPage`
* `StandupsPage`
* `TrainingPage`
* `KnowledgePage`

---

# 4. Components

Contains reusable UI primitives:

* Cards
* Buttons
* Dialogs
* Markdown renderer
* Tables

---

# 5. Hooks

Hooks abstract domain logic.

Example:

```ts
const { tasks, reload } = useTasks();
```

---

# 6. Context

Global providers:

* User context
* Theme
* App settings

---

# 7. LLM UI Integration

Frontend interacts with LLM through backend:

```
Frontend → FastAPI → LLM (vLLM)
```

---

# 8. RAG Integration (Default Enabled)

Documents can be embedded and retrieved via backend.

UI pattern:

* user query → backend retrieves context → LLM completes → response displayed

---

# 9. Troubleshooting

### Frontend won't start

Check Node version:

```bash
node -v
```

### API calls fail

Backend must be running at port 9000.

---

# Frontend Diagram

```
User → React UI → API Client → FastAPI → LLM / RAG
```