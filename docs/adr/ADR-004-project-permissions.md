# ADR-004: Per-Project Permission Model

## Status
Accepted

## Context
DevCell teams require fine-grained access control. Tasks, training, and dashboards must be visible only to relevant members, while the system remains simple.

## Decision
Implement permission enforcement at the **project** level:
- Owner
- Member

## Alternatives Considered
- **Row-level permissions per task** — Too granular.
- **Global visibility** — Violates compartmentalization.

## Consequences
### Positive
- Simple mental model.
- Supports multiple mission teams.
- Easy enforcement in backend.

### Negative
- No role hierarchy beyond owner/member.
