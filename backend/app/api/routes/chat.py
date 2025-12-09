# filename: backend/app/api/routes/chat.py
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.llm_client import llm_chat  # kept for any future direct usage
from app.schemas.user import UserPublic
from app.services.auth_service import get_current_user
from app.services.chat_service import chat_with_optional_rag

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    use_rag: bool = False
    mode: Optional[str] = None  # "assistant" | "developer" | "analyst" | "docs"
    notes: Optional[str] = None


class ChatSource(BaseModel):
    document_id: str
    filename: str
    score: float
    excerpt: str


class ChatResponse(BaseModel):
    reply: str
    mode_used: str
    used_rag: bool
    sources: List[ChatSource]


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Unified chat endpoint.

    - Wraps the local LLM via llm_chat(...)
    - Optionally uses RAG (knowledgebase retrieval) when use_rag = true
    - Supports lightweight personas (mode)
    - Returns sources when RAG is used
    """
    result = await chat_with_optional_rag(
        message=request.message,
        use_rag=request.use_rag,
        mode=request.mode,
        notes=request.notes,
    )

    return ChatResponse(
        reply=result["reply"],
        mode_used=result["mode_used"],
        used_rag=result["used_rag"],
        sources=[
            ChatSource(
                document_id=s["document_id"],
                filename=s["filename"],
                score=s["score"],
                excerpt=s["excerpt"],
            )
            for s in result["sources"]
        ],
    )
