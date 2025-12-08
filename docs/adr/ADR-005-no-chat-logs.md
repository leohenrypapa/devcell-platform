# ADR-005: No Server-Side Chat Logging

## Status
Accepted

## Context
Chat history may contain sensitive mission-related data, malware code, incident details, or classified content. Persisting it server-side poses risk.

## Decision
Do **not** store chat messages server-side. All conversation state is client-side only.

## Alternatives Considered
- **Persist chat logs** — High OPSEC risk.
- **Encrypted storage** — Increases complexity without need.

## Consequences
### Positive
- Zero retention → maximum security.
- Reduced database footprint.

### Negative
- No long-term conversation continuity.
