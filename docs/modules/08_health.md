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