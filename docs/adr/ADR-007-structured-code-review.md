# ADR-007: Structured Code Review Prompts

## Status
Accepted

## Context
LLMs can hallucinate or produce destructive suggestions if not guided properly. Code review must be deterministic, safe, and actionable.

## Decision
Use a **strict structured system prompt** defining:
- High-level summary
- Strengths
- Weaknesses
- Risks
- Improvements
- Optional refactoring

## Alternatives Considered
- **Open-ended chat** — Unsafe and unpredictable.
- **Pattern-only linting** — Too limited.

## Consequences
### Positive
- Predictable quality.
- Safer output.
- Easier UI rendering.

### Negative
- Less conversational flexibility.
