# Knowledgebase API

The Knowledgebase API manages documents used for contextual assistance, reference
material, and Retrieval-Augmented Generation (RAG). It supports uploading,
listing, retrieving, and deleting documents, as well as performing RAG searches
for LLM workflows (e.g., SITREP generation).

All endpoints require authentication.

---

# 🧩 Base URL

```
/api/knowledge
```

---

# 🔐 Permissions Overview

The Knowledgebase is **workspace-wide**, not project-scoped.

| Operation | Permission |
|----------|------------|
| List documents | Any authenticated user |
| Upload document | Any authenticated user |
| Delete document | Admin only (or uploader, if enabled) |
| RAG search | Any authenticated user |

Documents are globally visible unless future project scoping is introduced.

---

# 📚 Endpoints

---

## 1. List Documents

### `GET /api/knowledge`

Returns metadata for stored KB documents.

#### Example Response

```json
{
  "items": [
    {
      "id": 4,
      "filename": "Week4_RE_Notes.md",
      "size": 18234,
      "uploaded_by": "alice",
      "created_at": "2025-12-05T13:20:00Z"
    }
  ]
}
```

---

## 2. Upload Document

### `POST /api/knowledge/upload`

Uploads text or markdown content to the knowledgebase.

#### Request (Form Data)

```
file: <uploaded file>
```

Allowed types:
- `.md`
- `.txt`
- `.pdf` (converted to text if supported)
- `.json` (stored verbatim)

#### Response

```json
{
  "id": 7,
  "filename": "Windows_Internals_Notes.md",
  "created_at": "2025-12-08T14:20:00Z"
}
```

---

## 3. Get Document Contents

### `GET /api/knowledge/{id}`

Fetches full document contents.

#### Example Response

```json
{
  "id": 7,
  "filename": "Windows_Internals_Notes.md",
  "content": "# Windows Internals\nKernel components..."
}
```

Permissions:
- Any authenticated user may view.

---

## 4. Delete Document

### `DELETE /api/knowledge/{id}`

Removes a document from the knowledgebase.

#### Response

```json
{"success": true}
```

**Only admins** may perform deletion (to prevent accidental KB loss).

---

## 5. RAG Search

### `POST /api/knowledge/search`

Searches the knowledgebase and returns semantic matches for use in LLM prompts.

#### Request

```json
{
  "query": "dynamic unpacking techniques",
  "limit": 5
}
```

#### Response

```json
{
  "results": [
    {
      "id": 4,
      "filename": "Week4_RE_Notes.md",
      "score": 0.82,
      "excerpt": "Dynamic unpacking involves..."
    }
  ]
}
```

This endpoint is used by:
- SITREP generation
- Chat contextual Q&A
- Training module assistance

---

# 🧠 RAG Workflow

Internally, RAG search uses:

```
knowledgebase/rag.py
```

Pipeline:
1. Load all KB embeddings.
2. Compute vector similarity.
3. Return top results with excerpts.

Embeddings stored in local vector store (e.g., FAISS or sentence-transformer cache).

---

# ⚠️ Error Responses

| Code | Meaning |
|------|---------|
| `404` | Document not found |
| `422` | Invalid file or query |
| `403` | Delete attempt without admin permissions |

---

# 🧪 Example Use Cases

### 1. SITREP Generation With RAG
Dashboard SITREP endpoint may call:

```
POST /api/knowledge/search
```

to enrich the LLM context.

### 2. Developer Notes Storage
KB stores:
- training docs  
- malware analysis notes  
- architecture guides  
- subsystem theories  

### 3. Chat Module with RAG
Chat requests:
- retrieve KB matches
- feed excerpts to LLM

---

# 📚 Related Documents

- Knowledgebase Module → `../modules/knowledge.md`
- Dashboard API → `dashboard_api.md`
- Training API → `training_api.md`
- LLM Integration → `../architecture/llm_integration.md`

---

© DevCell Platform Documentation — GitHub OSS Style