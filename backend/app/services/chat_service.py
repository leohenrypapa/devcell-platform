# filename: backend/app/services/chat_service.py
from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional, TypedDict

from app.core.llm_client import llm_chat
from app.schemas.knowledge import KnowledgeSourceChunk
from app.services.knowledge import query_knowledge as kb_query_knowledge

ChatMode = Literal["assistant", "developer", "analyst", "docs"]


class ChatSource(TypedDict):
    document_id: str
    filename: str
    score: float
    excerpt: str


class ChatResult(TypedDict):
    reply: str
    mode_used: ChatMode
    used_rag: bool
    sources: List[ChatSource]


SUPPORTED_MODES: set[str] = {"assistant", "developer", "analyst", "docs"}


def _detect_mode(message: str, explicit_mode: Optional[str]) -> ChatMode:
    """
    Decide which persona/mode to use.

    Priority:
    1. Explicit mode if valid.
    2. Heuristics based on message content.
    3. Default to 'assistant'.
    """
    if explicit_mode and explicit_mode in SUPPORTED_MODES:
        return explicit_mode  # type: ignore[return-value]

    text = message.lower()

    # Developer heuristics
    if (
        "```" in text
        or "fastapi" in text
        or "react" in text
        or "typescript" in text
        or "python" in text
        or "error:" in text
        or "stack trace" in text
    ):
        return "developer"

    # Cyber analyst heuristics
    if (
        "malware" in text
        or "ttp" in text
        or "indicator" in text
        or "ioc" in text
        or "c2 " in text
        or "command and control" in text
    ):
        return "analyst"

    # Docs heuristics
    if (
        "write a doc" in text
        or "documentation" in text
        or "summarize" in text
        or "overview" in text
        or "explain" in text
        or "draft" in text
    ):
        return "docs"

    return "assistant"


def _system_prompt_for_mode(mode: ChatMode) -> str:
    if mode == "developer":
        return (
            "You are a senior software engineer supporting a small military "
            "developer unit. Provide practical, concise engineering help.\n"
            "- Prefer clear examples over theory.\n"
            "- Use idiomatic patterns for Python, FastAPI, and React/TypeScript.\n"
            "- When unsure, say you are unsure and suggest safe experiments."
        )
    if mode == "analyst":
        return (
            "You are a defensive cyber analyst supporting a military cyber team.\n"
            "- Focus on defensive analysis and detection.\n"
            "- Do NOT provide step-by-step exploit or weaponization guidance.\n"
            "- Emphasize logging, telemetry, and mitigation.\n"
            "- Keep answers operationally useful but safe."
        )
    if mode == "docs":
        return (
            "You are a technical documentation assistant.\n"
            "- Produce clear, structured markdown.\n"
            "- Use headings, bullet lists, and short paragraphs.\n"
            "- Assume the audience is an engineer in a military unit."
        )
    # assistant (default)
    return (
        "You are an internal assistant helping developers in a military unit.\n"
        "- Be concise and practical.\n"
        "- When helpful, use bullet points.\n"
        "- If you are unsure, say so."
    )


def _build_sources_for_response(
    chunks: List[KnowledgeSourceChunk],
) -> List[ChatSource]:
    sources: List[ChatSource] = []
    for c in chunks:
        sources.append(
            {
                "document_id": c.document_id,
                "filename": c.title,
                "score": c.score,
                "excerpt": c.snippet,
            }
        )
    return sources


async def chat_with_optional_rag(
    message: str,
    use_rag: bool = False,
    mode: Optional[str] = None,
    notes: Optional[str] = None,
) -> ChatResult:
    """
    Main entrypoint for /api/chat.

    - Normalizes mode/persona
    - Optionally performs KB retrieval
    - Calls local LLM via llm_chat(...)
    - Returns reply + mode_used + used_rag + KB sources (if any)
    """
    text = message.strip()
    if not text:
        raise ValueError("message must not be empty")

    mode_used: ChatMode = _detect_mode(text, mode)
    system_prompt = _system_prompt_for_mode(mode_used)

    # -------------------------------------------------------------------------
    # RAG path
    # -------------------------------------------------------------------------
    kb_chunks: List[KnowledgeSourceChunk] = []
    actually_used_rag = False

    if use_rag:
        kb_chunks = kb_query_knowledge(query=text, top_k=4)
        if kb_chunks:
            actually_used_rag = True

    # Build context if we have KB chunks
    context_block = ""
    if actually_used_rag and kb_chunks:
        lines: List[str] = []
        for idx, c in enumerate(kb_chunks, start=1):
            lines.append(f"[Source {idx} - {c.title}]")
            lines.append(c.snippet.strip())
            lines.append("")
        context_block = "\n".join(lines).strip()

    # -------------------------------------------------------------------------
    # Messages to LLM
    # -------------------------------------------------------------------------
    if actually_used_rag and context_block:
        user_parts: List[str] = []

        user_parts.append(
            "Use the following knowledgebase context to answer the question.\n"
            "If the answer is not clearly supported by the context, say so."
        )
        user_parts.append("\nCONTEXT:\n")
        user_parts.append(context_block)
        user_parts.append("\nQUESTION:\n")
        user_parts.append(text)

        if notes and notes.strip():
            user_parts.append(
                "\nADDITIONAL INSTRUCTIONS FROM USER:\n" + notes.strip()
            )

        user_content = "\n".join(user_parts)
    else:
        # No RAG context – plain chat
        if notes and notes.strip():
            user_content = (
                f"QUESTION:\n{text}\n\n"
                f"ADDITIONAL INSTRUCTIONS FROM USER:\n{notes.strip()}"
            )
        else:
            user_content = text

    messages: List[Dict[str, Any]] = [
        {
            "role": "system",
            "content": system_prompt,
        },
        {
            "role": "user",
            "content": user_content,
        },
    ]

    reply_text = await llm_chat(messages)

    sources: List[ChatSource] = []
    if actually_used_rag and kb_chunks:
        sources = _build_sources_for_response(kb_chunks)

    return ChatResult(
        reply=reply_text,
        mode_used=mode_used,
        used_rag=actually_used_rag,
        sources=sources,
    )
