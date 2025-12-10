# RAG Pipeline

This page documents the DevCell Retrieval-Augmented Generation (RAG) subsystem.

It reflects the **new Knowledgebase architecture** with:

- manifest-based incremental indexing  
- multi-chunk retrieval windows  
- path-aware ranking  
- single unified Chroma collection  
- local LLM only  

---

# 📚 Overview

The pipeline:

```

knowledgebase/ → manifest → chunking → embeddings → chroma_store/ → semantic search → context windows → RAG prompt → LLM

```

All RAG retrieval is handled inside:

```

backend/app/services/knowledge/query.py

```

All LLM calls are handled by:

```

backend/app/core/llm_client.py

```

---

# 🧱 Components

### 1. Knowledgebase Files
Markdown, text, and PDFs stored under:

```

knowledgebase/
knowledgebase/notes/

```

### 2. Manifest
A JSON file tracking:

- file hash  
- mtime  
- chunk hashes  
- stable chunk IDs  

Used for incremental updates.

### 3. Embedding Model  
Local SentenceTransformers model cached in-process.

### 4. Vector Store  
Single persistent collection:

```

chroma_store/
collection: devcell_knowledge

```

### 5. Query Layer  
`query_knowledge(query, top_k)` performs:

- Chroma similarity search  
- Multi-chunk window building  
- Path-aware scoring  
- Deduplication  

### 6. RAG Assembly  
LLM prompt is:

```

SYSTEM: Domain-appropriate system prompt
Context:
[Source 1]
Title: ...
Content: <stitched multi-chunk snippet>

Question: <user query>

Instructions:

* Use only the above context.
* Cite source numbers when appropriate.

````

---

# 🔍 Detailed Pipeline

## Step 1 — Text Extraction
- `.md` / `.txt` read directly  
- `.pdf` processed via PDF extractor  

## Step 2 — Chunking
Chunks are sentence-aware and overlapping (±1 paragraph).

## Step 3 — Hashing
`file_hash` + `chunk_hash` for incremental detection.

## Step 4 — Embedding
Only *changed* chunks are re-embedded.

## Step 5 — Indexing
Upsert new chunks with metadata:

```json
{
  "title": "...",
  "path": "...",
  "chunk_index": 0
}
````

## Step 6 — Retrieval

Chroma search returns seed hits, then:

* group by path
* retrieve all chunks of that document
* build neighbor-aware windows (±1)
* join into stitched snippet

## Step 7 — Re-ranking

Tie-break rules:

1. `file` documents
2. `notes`
3. `virtual`
4. `unknown`

## Step 8 — RAG Prompt

Context is passed to local LLM (no external API).

## Step 9 — Output

The RAG API returns:

```json
{
  "answer": "...",
  "sources": [...]
}
```

---

# 🔧 Internal Use Cases

* Chat (`/api/chat?use_rag=true`)
* Dashboard summary (`/api/dashboard/summary?use_rag=true`)
* Developer utilities (debugging + KB exploration)

---

# 📚 Related Docs

* Knowledge API → `../api/07_knowledge_api.md`
* LLM Integration → `../architecture/llm_integration.md`
* Manifest design → ADR-010 KB Vector Model

```
© DevCell Platform Documentation
```