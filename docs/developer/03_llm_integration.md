# LLM Integration

Describes LLM client, persona modes, structured prompting, error handling.

## Architecture
- `core/llm_client.py` handles endpoint communication.
- Supports local providers (Ollama, LM Studio, vLLM).

## Persona Modes
- assistant
- developer
- analyst
- docs
