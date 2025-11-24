from typing import List
import os

import httpx
from fastapi import APIRouter, Depends, HTTPException

from app.schemas.user import UserPublic
from app.services.auth_service import get_current_user
from app.schemas.knowledge import (
    KnowledgeQueryRequest,
    KnowledgeQueryResponse,
    AddTextRequest,
    KnowledgeSourceChunk,
)
from app.services import knowledge_service

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


async def call_llm_with_rag(prompt: str) -> str:
    """
    Call the LLM server with a simple OpenAI-compatible chat API.

    Configure via env vars:
      - LLM_BASE_URL   (e.g. http://127.0.0.1:8000)
      - LLM_MODEL_NAME (e.g. qwen2.5-coder, gpt-4.1-mini, etc.)
      - LLM_API_KEY    (optional, for remote providers)
    """
    base_url = os.getenv("LLM_BASE_URL", "http://localhost:8000")
    model = os.getenv("LLM_MODEL_NAME", "gpt-4.1-mini")
    api_key = os.getenv("LLM_API_KEY")

    url = f"{base_url.rstrip('/')}/v1/chat/completions"

    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            url,
            headers=headers,
            json={
                "model": model,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are an assistant for an internal developer "
                            "knowledgebase. Use ONLY the provided context when possible."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                "temperature": 0.2,
            },
        )

        resp.raise_for_status()
        data = resp.json()
        # Expect OpenAI-style response
        return data["choices"][0]["message"]["content"]


def build_fallback_answer(sources: List[KnowledgeSourceChunk]) -> str:
    """
    Old behavior: just stitch together snippets so we always have *something*
    even if LLM is down.
    """
    if not sources:
        return (
            "No relevant documents were found in the knowledgebase for this question. "
            "Try adding notes or files to the Knowledgebase folder and asking again."
        )

    lines: List[str] = ["Here are relevant notes from the knowledgebase:\n"]
    for idx, s in enumerate(sources, start=1):
        lines.append(f"[{idx}] {s.title}")
        lines.append(s.snippet.strip())
        lines.append("")
    return "\n".join(lines).strip()


@router.post("/query", response_model=KnowledgeQueryResponse)
async def query_knowledge_endpoint(
    payload: KnowledgeQueryRequest,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Query the knowledgebase using semantic search + LLM answer.
    Falls back to stitched snippets if the LLM call fails.
    """
    # 1) Retrieve relevant chunks from Chroma
    sources: List[KnowledgeSourceChunk] = knowledge_service.query_knowledge(
        query=payload.query,
        top_k=payload.top_k,
    )

    # If no docs at all, just return fallback (no need to call LLM)
    if not sources:
        answer = build_fallback_answer(sources)
        return KnowledgeQueryResponse(answer=answer, sources=sources)

    # 2) Build context text for RAG prompt
    context_blocks = []
    for idx, s in enumerate(sources, start=1):
        context_blocks.append(
            f"[Source {idx} - {s.title}]\n{s.snippet}\n"
        )
    context_text = "\n\n".join(context_blocks)

    rag_prompt = f"""
You are an assistant for an internal developer knowledgebase.
Use ONLY the following context to answer the question.

Context:
{context_text}

Question:
{payload.query}

Instructions:
- Base your answer strictly on the context.
- If the answer is not clearly in the context, say you are unsure.
- Be concise, clear, and actionable for engineers in a unit.
"""

    # 3) Try LLM call; if it fails, fall back to stitched snippets
    try:
        llm_answer = await call_llm_with_rag(rag_prompt)
        answer = llm_answer.strip()
        if not answer:
            answer = build_fallback_answer(sources)
    except Exception as e:
        # Log server-side; don’t break UI
        print(f"[knowledge] LLM call failed, using fallback: {e}")
        answer = build_fallback_answer(sources)

    return KnowledgeQueryResponse(answer=answer, sources=sources)


@router.post("/add_text")
async def add_text_document_endpoint(
    payload: AddTextRequest,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Add a small text note into the knowledgebase and index it.
    """
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Title is required.")
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text is required.")

    knowledge_service.add_text_document(
        title=payload.title.strip(),
        text=payload.text,
    )
    return {"status": "ok"}
