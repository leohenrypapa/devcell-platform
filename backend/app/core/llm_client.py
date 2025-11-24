import httpx
from .config import settings


async def llm_chat(messages: list[dict], model: str | None = None):
    """
    Wrapper around your LLM server (OpenAI-compatible).

    - Uses /v1/chat/completions
    - Uses the default model from settings if none is provided
    - Returns a readable error string if the LLM call fails
    """
    url = f"{settings.LLM_BASE_URL}/v1/chat/completions"
    model_name = model or settings.LLM_DEFAULT_MODEL

    payload = {
        "model": model_name,
        "messages": messages,
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            # vLLM / OpenAI-style response
            return data["choices"][0]["message"]["content"]
    except httpx.HTTPError as e:
        return f"[LLM server error: {e}]"
