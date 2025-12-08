# Chat API

The Chat API provides a unified interface for sending messages to the local LLM
and (optionally) enriching responses with Knowledgebase (RAG) context. It powers
the **Chat** page in the DevCell frontend.

All routes require authentication.

---

## 🧩 Base URL

```text
/api/chat
```

---

## 🔐 Permissions Overview

Chat is **workspace-wide** and not project-scoped.

| Operation        | Permission             |
|------------------|------------------------|
| Send chat message| Any authenticated user |
| Use RAG          | Any authenticated user |

No chat history is persisted server-side in the current design; the client
manages visible conversation state.

---

## 📚 Endpoints

---

## 1. Send Chat Message

### `POST /api/chat`

Sends a single user message to the LLM and returns an assistant reply.  
Optionally uses RAG (Knowledgebase search) and persona modes.

### Request Body

```json
{
  "message": "Explain how the standup-to-task conversion works.",
  "use_rag": true,
  "mode": "assistant",
  "notes": "Be concise and use bullet points."
}
```

#### Fields

| Field     | Type    | Required | Description |
|-----------|---------|----------|-------------|
| `message` | string  | ✅       | User's message / question |
| `use_rag` | boolean | ❌       | Whether to perform KB retrieval (default: `false`) |
| `mode`    | string  | ❌       | Optional persona hint: e.g. `assistant`, `developer`, `analyst`, `docs` |
| `notes`   | string  | ❌       | Extra steering instructions for the LLM |

> Notes:
> - If `mode` is omitted, the backend infers a persona based on the content
>   (e.g., code → developer mode).
> - If `use_rag` is `true`, the backend performs a KB semantic search and
>   injects context into the prompt.

---

### Response

```json
{
  "reply": "Here is how standup-to-task conversion works: ...",
  "mode_used": "developer",
  "used_rag": true,
  "sources": [
    {
      "filename": "standups.md",
      "score": 0.83,
      "excerpt": "Standup lines can be converted into tasks..."
    }
  ]
}
```

#### Fields

| Field       | Type    | Description |
|------------|---------|-------------|
| `reply`    | string  | LLM-generated assistant message (markdown-compatible) |
| `mode_used`| string  | Persona actually used by backend (may differ from request hint) |
| `used_rag` | boolean | Indicates whether KB context was used |
| `sources`  | array   | If `used_rag=true`, a list of KB chunks that informed the answer |

When `use_rag = false`, `sources` will typically be an empty array and
`used_rag = false`.

---

## 🔐 Permission & Safety Behavior

- Any authenticated user may send messages.
- The backend:
  - enforces authentication,
  - filters out empty messages,
  - constrains LLM persona (no code execution, no privileged actions),
  - uses RAG only against the local Knowledgebase.

No chat messages are stored in the database; conversation history is maintained
client-side only.

---

## ⚠️ Error Responses

| Code | Description                    |
|------|--------------------------------|
| `401`| Missing/invalid auth token     |
| `422`| Invalid payload                |
| `503`| LLM unavailable or timed out   |

In case of `503`, the frontend should notify the user that AI features are
temporarily unavailable.

---

## 🧪 Example Workflows

### 1. General Q&A

```http
POST /api/chat
{
  "message": "Summarize what the DevCell Dashboard does.",
  "use_rag": false
}
```

### 2. RAG-Enhanced Answer

```http
POST /api/chat
{
  "message": "What does the malware developer training roadmap cover in the first 4 weeks?",
  "use_rag": true,
  "mode": "analyst"
}
```

### 3. Developer Mode

```http
POST /api/chat
{
  "message": "Refactor this FastAPI route for better structure: ```python ...```",
  "mode": "developer"
}
```

---

## 📚 Related Documents

- Chat Module → `../modules/chat.md`
- Knowledgebase API → `knowledge_api.md`
- LLM Integration → `../architecture/llm_integration.md`
- Dashboard API → `dashboard_api.md`

---

```text
© DevCell Platform Documentation — DevCell Platform
```