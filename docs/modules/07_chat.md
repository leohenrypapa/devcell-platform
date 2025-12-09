# Chat Module (LLM + Optional RAG)

## Overview
The Chat module provides a single-turn conversational interface backed by the local LLM.  
RAG is optional and disabled by default unless specified by the user.

All Chat logic is handled by:
````

backend/app/services/chat_service.py

````

---

## Request Schema

```json
POST /api/chat
{
  "message": "string",
  "use_rag": false,
  "mode": "assistant | developer | analyst | docs | null",
  "notes": "optional additional instructions"
}
````

### Modes (Personas)

| Mode      | Behavior                                     |
| --------- | -------------------------------------------- |
| assistant | Default general-purpose AI helper            |
| developer | Code-oriented reasoning, prefers examples    |
| analyst   | Defensive cyber focus, no offensive guidance |
| docs      | Structured, markdown-oriented responses      |

If `mode` is omitted → automatic detection based on message content.

---

## RAG Behavior

If `use_rag=true`:

1. System performs `query_knowledge(query, top_k=4)`
2. If chunks are found:

   * Context is injected into the prompt
   * Response includes `"sources": [...]` array
3. If no chunks:

   * Falls back to normal LLM response

RAG is safe by design:

* No hallucinated citations (sources only included on actual KB hits)
* KB snippets are shown under each chat message in UI

---

## Response Schema

```json
{
  "reply": "string",
  "mode_used": "assistant | developer | analyst | docs",
  "used_rag": true,
  "sources": [
    {
      "document_id": "...",
      "filename": "...",
      "score": 0.87,
      "excerpt": "..."
    }
  ]
}
```

---

## Frontend Behavior

* Multi-turn conversation UI (client-side only)
* RAG toggle button
* Mode selector
* Notes field
* Markdown-friendly display
* Source blocks shown under assistant messages when RAG is active

````

---

# ✅ **3. Update `docs/modules/02_dashboard.md`**

```md
# Dashboard Module

## Summary Endpoint

### `GET /api/dashboard/summary`
Returns a SITREP-style summary of the day’s:
- Standups
- Projects
- Knowledgebase size

### `GET /api/dashboard/summary?use_rag=true`
RAG-enhanced summary.

When enabled:
- Standup/project context is passed to the unified Chat pipeline (`chat_with_optional_rag`)
- KB context may be injected if relevant
- Output uses the `docs` persona (markdown-friendly)

---

## Returned Shape

```json
{
  "summary": "string",
  "standup_count": 3,
  "project_count": 2,
  "knowledge_docs": 14
}
````

---

## Frontend Integration

A RAG toggle button appears in the Dashboard UI:

* Off → classic LLM SITREP
* On → KB-enhanced SITREP

User experience:

* RAG may add relevant KB insights
* Summary generation remains concise & operational

````

---

# ✅ **4. Add `docs/modules/08_health.md`**

```md
# Platform Health Checks

## Purpose
Provide a simple, programmatically accessible way for the UI to determine:

- Is the LLM online?
- Is the Knowledgebase indexed?
- Can RAG be used?

Used by the frontend RAG Status Chip in the Topbar.

---

## Endpoints

### `GET /api/health/llm`

Returns:

```json
{
  "status": "ok",
  "detail": null
}
````

Or, if failing:

```json
{
  "status": "error",
  "detail": "connection refused"
}
```

---

### `GET /api/health/knowledge`

Returns:

```json
{
  "status": "ok",
  "document_count": 12
}
```

If KB empty:

```json
{
  "status": "empty",
  "document_count": 0
}
```

If error:

```json
{
  "status": "error",
  "document_count": 0,
  "detail": "..."
}
```

---

## Used by UI

### RagStatusChip

Displayed in the global Topbar:

* **RAG: OK** → LLM + KB both healthy
* **RAG: KB empty** → No indexed docs
* **RAG: LLM error** → Local LLM unreachable
* **RAG: KB error** → Chroma/FS issue

Updates every 60 seconds.