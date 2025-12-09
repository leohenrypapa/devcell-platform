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
