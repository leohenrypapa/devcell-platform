# Knowledgebase (KB) & RAG Subsystem

## Overview
The Knowledgebase subsystem provides a unified document ingestion, embedding, indexing, and retrieval pipeline used by:

- `/api/knowledge/*`
- RAG-enabled Chat (`/api/chat`)
- RAG-enabled Dashboard Summary (`/api/dashboard/summary?use_rag=true`)

All RAG logic is now centralized in:
```

backend/app/services/knowledge/
backend/app/services/chat_service.py

```

A single Chroma store and a single embedding model are used across the platform.

---

## Directory Structure

```

knowledgebase/           # Raw user documents
chroma_store/            # Vector DB store
backend/app/services/knowledge/*
backend/app/services/chat_service.py

```

---

## Document Handling

### Supported input formats
- `.md`, `.txt` (native)
- `.pdf` (via PDF text extractor)

### Indexing
Each document is:
1. Loaded
2. Split into semantic chunks (≈300–500 tokens)
3. Embedded using the system SentenceTransformer model
4. Stored in the unified Chroma collection: `devcell_knowledge`

Re-indexing occurs:
- Automatically on upload
- Automatically on delete
- On backend startup (optional job)
- Whenever `/api/knowledge/upload_file` completes successfully

### Query / Retrieval
Retrieval is handled by:
```

services/knowledge/query_knowledge(query, top_k)

````

Returns:
```json
[
  {
    "document_id": "...",
    "title": "...",
    "snippet": "...",
    "score": 0.88
  }
]
````

---

## API Summary

### `POST /api/knowledge/upload_file`

Upload + index a file.

### `DELETE /api/knowledge/delete_document`

Deletes a file and its vector entries.

### `POST /api/knowledge/query`

Semantic search only (no LLM):

```json
{ "query": "..." }
```

### RAG usage

The Knowledgebase is integrated into:

* Chat (`/api/chat` with `"use_rag": true`)
* Dashboard Summary (`/api/dashboard/summary?use_rag=true`)
* Health check (`/api/health/knowledge`)

---

## Notes

* Only one unified KB pipeline exists; legacy RAG code has been removed.
* All LLM + RAG flows use the same embedding store & same metadata format.