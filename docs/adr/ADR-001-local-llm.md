# ADR-001: Local LLM Instead of Cloud Providers

## Status
Accepted

## Context
DevCell Platform must operate in secure, offline, or classified environments where cloud LLMs (OpenAI, Anthropic, Azure, AWS) cannot be used due to OPSEC, compliance, and network isolation constraints. The platform must support LLM-powered workflows without transmitting data externally.

## Decision
DevCell uses *only local LLM inference* through providers such as Ollama, LM Studio, or vLLM running on isolated hardware.

## Alternatives Considered
- **Cloud LLMs** — Rejected for security and offline constraints.
- **Hybrid mode** — Rejected to avoid configuration complexity and inconsistent behavior.

## Consequences
### Positive
- Full offline capability.
- No risk of data exfiltration.
- Predictable cost structure.
- High customization of model behavior.

### Negative
- Higher hardware requirements.
- Local models may be weaker than cloud frontier models.
- Need to manage model updates manually.
