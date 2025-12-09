from typing import Optional, List
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
)
from pydantic import BaseModel

from app.schemas.user import UserPublic
from app.services.auth_service import get_current_user
from app.schemas.knowledge import (
    KnowledgeQueryRequest,
    KnowledgeQueryResponse,
    AddTextRequest,
    KnowledgeSourceChunk,
    KnowledgeDocument,
)
from app.services.knowledge import (
    query_knowledge,
    add_text_document,
    index_single_file,
    list_documents,
    delete_document,
    KNOWLEDGE_DIR,
)
from app.core.llm_client import llm_chat

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


def build_fallback_answer(sources: List[KnowledgeSourceChunk]) -> str:
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

    Pipeline:
    1) Use app.services.knowledge.query_knowledge(...) to retrieve top-k chunks.
    2) Build a RAG-style prompt with those chunks as context.
    3) Call the shared llm_chat() helper.
    4) If the LLM call fails or returns empty, fall back to stitched snippets.
    """
    # 1) Retrieve relevant chunks from Chroma
    sources: List[KnowledgeSourceChunk] = query_knowledge(
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

    # 3) Build a single user prompt that includes context + question
    user_prompt = f"""
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

    messages = [
        {
            "role": "system",
            "content": (
                "You are an assistant for an internal developer knowledgebase "
                "in a military unit. Use only the given context; do not invent facts."
            ),
        },
        {
            "role": "user",
            "content": user_prompt,
        },
    ]

    # 4) Call the same LLM client as /api/chat, with safe fallback
    try:
        llm_answer = await llm_chat(messages)
        answer = (llm_answer or "").strip()
        if not answer:
            answer = build_fallback_answer(sources)
    except Exception as e:  # pragma: no cover - defensive
        print(f"[knowledge] LLM call via llm_chat failed, using fallback: {e}")
        answer = build_fallback_answer(sources)

    return KnowledgeQueryResponse(answer=answer, sources=sources)


@router.post("/add_text")
async def add_text_document_endpoint(
    payload: AddTextRequest,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Add a free-text note into the knowledgebase and index it into Chroma.
    """
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Title is required.")
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text is required.")

    add_text_document(
        title=payload.title.strip(),
        text=payload.text,
    )
    return {"status": "ok"}


@router.post("/upload_file")
async def upload_file_to_knowledgebase(
    file: UploadFile = File(...),
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Upload a document (pdf/txt/md) into the knowledgebase folder and index it.

    Uses the same KNOWLEDGE_DIR as the knowledge service so the vector store
    and filesystem are always in sync.
    """
    allowed_ext = {".pdf", ".txt", ".md"}
    suffix = Path(file.filename).suffix.lower()

    if suffix not in allowed_ext:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Allowed: .pdf, .txt, .md",
        )

    KNOWLEDGE_DIR.mkdir(parents=True, exist_ok=True)
    save_path = KNOWLEDGE_DIR / file.filename

    try:
        with save_path.open("wb") as f:
            content = await file.read()
            f.write(content)
    except Exception as e:  # pragma: no cover - filesystem failure
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {e}",
        )

    # Index just this file
    try:
        index_single_file(save_path)
    except Exception as e:  # pragma: no cover - indexing failure
        raise HTTPException(
            status_code=500,
            detail=f"Failed to index file: {e}",
        )

    return {"status": "ok", "filename": file.filename}


@router.get("/documents", response_model=list[KnowledgeDocument])
async def list_knowledge_documents(
    current_user: UserPublic = Depends(get_current_user),
):
    """
    List documents currently indexed in the knowledgebase (from Chroma metadata).
    """
    docs = list_documents()
    return docs


class DeleteDocumentRequest(BaseModel):
    title: str
    path: Optional[str] = None


@router.post("/delete_document")
async def delete_knowledge_document(
    payload: DeleteDocumentRequest,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Delete a knowledge document (and its vectors) by title/path.
    If path is present and points to a file in Knowledgebase/, remove the file, too.
    """
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Title is required.")

    delete_document(title=title, path=payload.path)
    return {"status": "ok"}
