
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