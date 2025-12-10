# Knowledgebase (KB) & RAG Subsystem

The Knowledgebase provides DevCell’s local-first document ingestion, indexing,
semantic search, and RAG augmentation used across:

- Chat  
- Dashboard SITREPs  
- Training automation  
- Knowledge page UI  

All logic is consolidated in:

````

backend/app/services/knowledge/

```

---

# 🧩 Directory Layout

```

knowledgebase/           → raw documents
knowledgebase/notes/     → free-text note .md files
chroma_store/            → vector DB (persistent)
backend/app/services/knowledge/
config.py
client.py
indexer.py
manifest.py
documents.py
query.py
paths.py
diagnostics.py

```

---

# 📄 Document Types

| Type  | Meaning | Storage | Description |
|-------|---------|---------|-------------|
| file  | Uploaded via `/upload_file` | `knowledgebase/` | Long-form documents |
| note  | Created via `/add_text` | `knowledgebase/notes/` | Quick notes |
| virtual | Legacy notes | none | Stored only in vector store |

Document list automatically prefixes titles:

- `[knowledgebase] Title`
- `[notes] Title`

---

# 🔧 Ingestion Pipeline

1. File saved under `knowledgebase/…`
2. Text extracted (`md/txt/pdf`)
3. Split into overlapping chunks
4. Compute file hash + chunk hashes
5. Compare to manifest  
6. Only changed chunks re-embedded  
7. Chroma upsert  
8. Manifest updated

This makes reindexing extremely fast.

---

# 🔍 Retrieval Pipeline

1. Semantic search in Chroma  
2. For each hit:
   - load all chunks of the same file  
   - build multi-chunk window (±1 neighbor)  
3. Re-rank by doc type  
4. Return `KnowledgeSourceChunk` objects  
5. RAG uses these snippets to build context  
6. Local LLM generates final answer  

---

# 🧠 RAG Integration

Used by:

- `/api/knowledge/query`
- Chat (`use_rag: true`)
- Dashboard summary (`use_rag: true`)

Unified embedding and retrieval ensures consistent results.

---

# 🩺 Health & Diagnostics

New endpoints:

- `/knowledge/health`  
- `/knowledge/reindex`  
- `/knowledge/debug_document`  
- `/knowledge/diagnostics`

Useful for:

- detecting missing manifest entries  
- verifying chunk counts  
- identifying orphaned vectors  
- confirming indexing consistency  

---

# 🚀 Future Extensions

- project-scoped knowledge areas  
- document versioning  
- inline viewer  
- background watcher for auto-indexing  
- KB agents for tagging & summarization  

---

# 📚 Related Docs

- API: `../api/07_knowledge_api.md`
- Pipeline: `../developer/04_rag_pipeline.md`
- ADR-010: KB Model

```

© DevCell Platform Documentation

```