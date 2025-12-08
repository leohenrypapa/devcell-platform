# ADR-009: Training Pipeline Uses JSON Task Units

## Status
Accepted

## Context
Training roadmaps vary widely in format. The system needs a standardized internal representation to map syllabus → tasks.

## Decision
LLM transforms roadmap text into **normalized JSON task units**:
```
{ title, description, priority }
```

## Alternatives Considered
- **Raw markdown fragments** — Hard to store/query.
- **Direct tasks without review** — Reduces transparency.

## Consequences
### Positive
- Easy to store, edit, and seed into tasks table.
- Works well with UI preview.
- LLM can generate consistent units.

### Negative
- Requires validation logic.
