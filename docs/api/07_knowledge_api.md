# Knowledgebase API

The Knowledgebase API manages DevCell’s local-first document ingestion, indexing,
semantic retrieval, and RAG-assisted question answering.

It supports:

- Uploading files  
- Adding markdown text notes  
- Incremental indexing into the vector store  
- Listing and deleting documents  
- Semantic search + RAG  
- Health, reindex, and diagnostics

All endpoints require authentication.

---

# 🧩 Base URL

```

/api/knowledge

````

---

# 🔐 Permissions

| Operation              | Permission                    |
|-----------------------|-------------------------------|
| List documents        | Any authenticated user        |
| Upload file           | Any authenticated user        |
| Add text note         | Any authenticated user        |
| Delete document       | Admin or uploader (TBD)       |
| RAG query             | Any authenticated user        |
| Health / Diagnostics  | Authenticated (internal use)  |

---

# 📚 Endpoints

---

## 1. List Documents  
### `GET /api/knowledge/documents`

Returns a deduplicated, **type-aware** (notes, files) list of documents.

Document titles include a prefix:

- `[knowledgebase] Title` → physical file in `knowledgebase/`
- `[notes] Title` → note created via `/add_text`

#### Example

```json
[
  {
    "id": "Week4_RE_Notes:/abs/path/Week4_RE_Notes.md",
    "title": "[knowledgebase] Week4_RE_Notes",
    "path": "/abs/path/Week4_RE_Notes.md",
    "content_preview": "First 400 chars..."
  }
]
````

Documents are sorted by type (`file` → `note` → `virtual`).

---

## 2. Upload File

### `POST /api/knowledge/upload_file`

Uploads a file into the local `knowledgebase/` folder and performs **incremental indexing**:

* Extract text
* Chunk with overlapping sentence-aware splitting
* Compute file hash + chunk hashes
* Reuse existing chunk IDs when unchanged
* Only re-embed changed chunks
* Delete removed chunks

Supports: **.md**, **.txt**, **.pdf**

#### Example Response

```json
{ "status": "ok", "filename": "Windows_Internals_Notes.md" }
```

---

## 3. Add Text Note

### `POST /api/knowledge/add_text`

Creates a `.md` file under:

```
knowledgebase/notes/<slug>.md
```

Then runs the same **incremental indexer** as file uploads.

#### Request

```json
{
  "title": "Dynamic Unpacking Notes",
  "text": "Dynamic unpacking involves..."
}
```

---

## 4. Delete Document

### `POST /api/knowledge/delete_document`

Deletes:

* Vectors from Chroma
* Manifest entry
* File if in `knowledgebase/`

#### Request

```json
{ "title": "Week4_RE_Notes", "path": "/abs/path/Week4_RE_Notes.md" }
```

---

## 5. RAG Query

### `POST /api/knowledge/query`

Semantic retrieval + multi-chunk RAG pipeline.

#### Request

```json
{ "query": "dynamic unpacking techniques", "top_k": 4 }
```

#### Response

```json
{
  "answer": "...",
  "sources": [
    {
      "document_id": "Week4_RE_Notes:/path/file.md",
      "title": "Week4_RE_Notes",
      "snippet": "Multi-chunk stitched context window…",
      "score": 0.82
    }
  ]
}
```

**Important updates (Slice 2–3):**

* Retrieval uses **multi-chunk context windows (±1 neighbor)**
* Results re-ranked so `file` docs > `notes` when relevance ties
* Snippets are longer and higher quality

---

## 6. Knowledge Health

### `GET /api/knowledge/health`

Returns operational status of the Knowledge/RAG subsystem.

Includes:

* `knowledge_dir_exists`
* `chroma_dir_exists`
* `manifest_exists`
* file count
* manifest document count
* vector count
* notes/messages

#### Example

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

## 7. Reindex Knowledgebase

### `POST /api/knowledge/reindex`

Runs **incremental reindex** across all files.

Always safe — unchanged chunks are skipped.

Returns the same payload as `/health`.

---

## 8. Debug Single Document

### `GET /api/knowledge/debug_document?path=...`

Deep inspection of one document:

* exists on disk?
* extractable text?
* manifest entry?
* chunk count?
* vector count?
* sample snippet
* mismatch patterns (e.g., “manifest entry exists but file missing”)

---

## 9. Diagnostics

### `GET /api/knowledge/diagnostics?limit_files=500`

Runs a KB-wide diagnostic scan.

Identifies issues such as:

* no extractable text
* missing manifest entry
* no vectors
* orphaned manifest entries

#### Example Issue

```json
{
  "status": "no_vectors",
  "path": "/abs/path/file.md",
  "title": "file",
  "details": ["No vectors found in Chroma for this file."]
}
```

---

# 🧠 RAG Workflow Summary

Pipeline:

1. Query embedding
2. Chroma retrieval
3. Multi-chunk stitching
4. Path-aware ranking
5. RAG prompt (LLM constrained to provided context)
6. Answer + sources

---

# 📚 Related Docs

* `modules/06_knowledge.md`
* `developer/04_rag_pipeline.md`
* ADR-010 KB Model
* Health API

```
© DevCell Platform Documentation
```