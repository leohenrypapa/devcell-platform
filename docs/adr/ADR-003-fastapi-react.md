# ADR-003: FastAPI Backend + React Frontend

## Status
Accepted

## Context
DevCell requires a modern, maintainable, modular stack. The system must be easy for cyber developers to extend while supporting async operations for LLMs and RAG workflows.

## Decision
- Backend: **FastAPI**
- Frontend: **React + TypeScript**

## Alternatives Considered
- **Flask** — Limited async support.
- **Django** — Heavy and not ideal for API-first.
- **Svelte/Vue** — Good options but less common in internal DoD developer workflows.

## Consequences
### Positive
- FastAPI’s async model handles LLM calls efficiently.
- React ecosystem allows rapid UI iteration.
- Clear separation of concerns.

### Negative
- Two-language stack increases onboarding time.
