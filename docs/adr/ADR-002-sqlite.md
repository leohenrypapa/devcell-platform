# ADR-002: SQLite as Primary Database

## Status
Accepted

## Context
DevCell requires a simple, portable, dependency-free database suitable for air‑gapped environments. Developers must be able to run DevCell easily on laptops or tactical servers without provisioning managed database services.

## Decision
SQLite is used as the primary data store for all backend modules.

## Alternatives Considered
- **PostgreSQL** — Powerful but requires external service.
- **MySQL/MariaDB** — Similar downside; unnecessary operational overhead.
- **In-memory DB** — Insufficient persistence.

## Consequences
### Positive
- Zero configuration.
- Portable database file.
- Ideal for local/offline deployment.
- Minimal ops overhead.

### Negative
- Limited concurrency.
- Not ideal for large-scale installations (future upgrades possible).
