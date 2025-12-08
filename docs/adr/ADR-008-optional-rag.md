# ADR-008: Optional RAG Instead of Mandatory RAG

## Status
Accepted

## Context
RAG improves accuracy but increases latency and may be unnecessary for simple tasks. Users should control when RAG is used.

## Decision
All LLM endpoints include `use_rag: boolean` flag. Default: **false**.

## Alternatives Considered
- **Always-on RAG** — Slow and resource-heavy.
- **Never use RAG** — Bad for contextual accuracy.

## Consequences
### Positive
- Lower latency for simple queries.
- Flexible behavior per user preference.

### Negative
- Users may forget to enable RAG for context-heavy queries.
