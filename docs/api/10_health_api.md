# Health API

The Health API exposes lightweight endpoints for:

- Backend liveness  
- Readiness  
- Knowledgebase subsystem health  
- Diagnostics (optional)  

Used by load balancers, monitoring agents, and internal tools.

---

# 🧩 Base URL

```

/api/health

````

---

# 1. Liveness  
### `GET /api/health`

Process is alive.

```json
{ "status": "ok" }
````

---

# 2. Readiness

### `GET /api/health/ready`

Optional. Checks dependencies (DB, LLM, KB system, etc.).

---

# 3. Knowledgebase Health

### `GET /api/knowledge/health`

Reports status of the Knowledge/RAG subsystem:

* `knowledge_dir_exists`
* `chroma_dir_exists`
* `manifest_exists`
* number of files
* number of manifest entries
* vector count
* explanatory notes

Example:

```json
{
  "status": "ok",
  "knowledge_dir_exists": true,
  "chroma_dir_exists": true,
  "manifest_exists": true,
  "documents_in_manifest": 12,
  "files_in_knowledge_dir": 14,
  "vector_count": 430,
  "notes": []
}
```

---

# 4. Reindex

### `POST /api/knowledge/reindex`

Runs full **incremental** reindex.

Useful when:

* new files added manually
* manifest corrupted
* diagnostics suggests inconsistencies

Returns same payload as `/knowledge/health`.

---

# 5. Diagnostics

### `GET /api/knowledge/diagnostics?limit_files=500`

Detects:

* files with unreadable/no text
* missing manifest entries
* missing vectors
* orphaned manifest references
* general KB inconsistencies

Used during development and debugging.

---

# 6. Debug Single Document

### `GET /api/knowledge/debug_document?path=...`

Deep inspection:

* file exists?
* extractable text length
* manifest entry
* chunk count
* vector count
* sample snippet
* status classification

---

# Authentication

* `/api/health` → usually **unauthenticated**
* Knowledge health endpoints → require authentication

---

# Related Docs

* Knowledge API → `../api/07_knowledge_api.md`
* Knowledge Module → `../modules/06_knowledge.md`
* RAG Pipeline → `../developer/04_rag_pipeline.md`

```
© DevCell Platform Documentation
```