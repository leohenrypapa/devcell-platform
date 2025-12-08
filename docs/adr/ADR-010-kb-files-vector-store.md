# ADR-010: KB as Markdown Files + Vector Store

## Status
Accepted

## Context
Knowledgebase documents must be human-readable, easy to audit, and searchable via embeddings.

## Decision
Store documents as **raw text/markdown files** and embed them into a vector store (FAISS or similar).

## Alternatives Considered
- **Database blob storage** — Removes transparency.
- **Document DB (e.g., Mongo)** — Overkill for local deployments.

## Consequences
### Positive
- Easy manual editing.
- Works offline.
- Transparent and simple.

### Negative
- Requires embedding regeneration if files change.
