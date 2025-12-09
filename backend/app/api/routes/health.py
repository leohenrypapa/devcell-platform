# filename: backend/app/api/routes/health.py
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.llm_client import llm_chat
from app.services.knowledge import list_documents

router = APIRouter(prefix="/health", tags=["health"])


class LLMHealth(BaseModel):
    status: Literal["ok", "error"]
    detail: str | None = None


class KnowledgeHealth(BaseModel):
    status: Literal["ok", "empty", "error"]
    document_count: int
    detail: str | None = None


@router.get("/llm", response_model=LLMHealth)
async def llm_health() -> LLMHealth:
    """
    Lightweight health check for the local LLM server.
    Calls llm_chat() with a tiny prompt and reports success/failure.
    """
    messages = [
        {
            "role": "system",
            "content": "You are a health check. Reply with a very short confirmation.",
        },
        {
            "role": "user",
            "content": "Health check.",
        },
    ]

    try:
        reply = await llm_chat(messages)
        if reply:
            # Do not leak full reply; we just care that it responded.
            return LLMHealth(status="ok", detail=None)
        return LLMHealth(status="error", detail="Empty reply from LLM.")
    except Exception as e:  # pragma: no cover - defensive
        return LLMHealth(status="error", detail=str(e))


@router.get("/knowledge", response_model=KnowledgeHealth)
def knowledge_health() -> KnowledgeHealth:
    """
    Health check for the Knowledgebase subsystem.
    Uses list_documents() to measure how many docs are indexed.
    """
    try:
        docs = list_documents()
        count = len(docs)
        if count == 0:
            return KnowledgeHealth(
                status="empty",
                document_count=0,
                detail="Knowledgebase has no indexed documents.",
            )
        return KnowledgeHealth(
            status="ok",
            document_count=count,
            detail=None,
        )
    except Exception as e:  # pragma: no cover - defensive
        return KnowledgeHealth(
            status="error",
            document_count=0,
            detail=str(e),
        )
