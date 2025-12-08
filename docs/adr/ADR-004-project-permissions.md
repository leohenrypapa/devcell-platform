# ADR-004: Per-Project Permission Model

## Status
Accepted

## Context
DevCell teams require fine-grained access control. Tasks, training, and
dashboards must be visible only to relevant members, while the system remains
simple.

## Decision

Implement permission enforcement at the **project** level with three roles:

- **Owner**
  - Full control over the project
  - Can update/delete the project
  - Can add/remove members
  - Canonical owner stored in `projects.owner` and mirrored in `project_members`
- **Member**
  - Normal contributor
  - Can see and work on project-scoped tasks/training/etc.
- **Viewer**
  - Read-only access to project artifacts (where supported)
  - Cannot modify project metadata or membership

Core principles:

- Access to project-scoped data (tasks, training, dashboard views, etc.) is
  granted only if the caller is **admin**, **project owner**, or has a
  membership row in `project_members`.
- The canonical owner cannot be silently removed from membership; ownership
  must be explicitly transferred (future) or the project deleted.

## Alternatives Considered

- **Row-level permissions per task**
  - Too granular and hard to reason about.
- **Global visibility**
  - Violates compartmentalization between mission teams.

## Consequences

### Positive

- Simple mental model (owner/member/viewer).
- Supports multiple mission teams with compartmentalization.
- Easy enforcement in backend via shared membership checks.
- Clear path for future extensions (e.g. per-module capabilities).

### Negative

- No deep role hierarchy beyond owner/member/viewer.
- Some advanced workflows (per-task overrides, temporary access) require
  additional design or a separate feature.