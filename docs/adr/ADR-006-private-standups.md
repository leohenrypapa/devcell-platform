# ADR-006: Standups Are Private to the User

## Status
Accepted

## Context
Standup entries may include personal blockers, mental workload notes, or sensitive work descriptions. Exposure to team leads or peers can negatively affect reporting accuracy.

## Decision
Standups are visible only to the user who created them. Not even admins may read them.

## Alternatives Considered
- **Team-visible standups** — Violates privacy.
- **Project-scoped standups** — Encourages self-censorship.

## Consequences
### Positive
- Honest reporting.
- No privacy concerns.
- Simple permission model.

### Negative
- Leaders cannot view team standups (by design).
