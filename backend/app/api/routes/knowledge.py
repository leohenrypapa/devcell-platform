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
    CHROMA_DIR,
    index_files_in_knowledgebase,
)
from app.services.knowledge.client import get_collection
from app.services.knowledge.manifest import load_manifest, MANIFEST_PATH
from app.services.knowledge.diagnostics import (
    debug_document_by_path,
    run_diagnostics,
)
from app.services.knowledge.paths import classify_doc_path
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
            f"[Source {idx}]\n"
            f"Title: {s.title}\n"
            f"Content:\n{s.snippet}\n"
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
- Base your answer strictly on the context blocks above.
- If the answer is not clearly in the context, say you are unsure.
- When relevant, cite which Source number(s) you used (e.g., "From Source 2").
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


class KnowledgeHealth(BaseModel):
    status: str
    knowledge_dir_exists: bool
    chroma_dir_exists: bool
    manifest_exists: bool
    documents_in_manifest: int
    files_in_knowledge_dir: int
    vector_count: Optional[int] = None
    notes: List[str] = []


class DocumentDebug(BaseModel):
    status: str
    path: Optional[str]
    title: Optional[str]
    doc_type: Optional[str]
    location_label: Optional[str]
    exists_on_disk: bool
    size_bytes: Optional[int]
    text_chars: Optional[int]
    in_manifest: bool
    manifest_chunks: int
    manifest_mtime: Optional[float]
    vector_chunks: int
    sample_snippet: Optional[str]
    notes: List[str]


class DiagnosticsIssue(BaseModel):
    status: str
    path: Optional[str]
    title: Optional[str]
    details: List[str]


class DiagnosticsReport(BaseModel):
    status: str
    total_files: int
    checked_files: int
    issues: List[DiagnosticsIssue]


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


def _compute_knowledge_health() -> KnowledgeHealth:
    """
    Internal helper to compute knowledge/RAG backend health.

    This does not hit the LLM; it only inspects:
    - knowledgebase/ folder
    - chroma_store/
    - manifest file
    - Chroma collection vector count
    """
    notes: List[str] = []

    knowledge_dir_exists = KNOWLEDGE_DIR.exists()
    chroma_dir_exists = CHROMA_DIR.exists()

    manifest_exists = MANIFEST_PATH.exists()
    documents_in_manifest = 0
    if manifest_exists:
        try:
            manifest = load_manifest()
            documents_in_manifest = len(manifest.get("documents", {}))
        except Exception as e:
            notes.append(f"Failed to load manifest: {e}")
            manifest_exists = False

    files_in_knowledge_dir = 0
    if knowledge_dir_exists:
        try:
            for path in KNOWLEDGE_DIR.rglob("*"):
                if path.is_file():
                    files_in_knowledge_dir += 1
        except Exception as e:
            notes.append(f"Failed to scan knowledge dir: {e}")

    vector_count: Optional[int] = None
    try:
        collection = get_collection()
        vector_count = collection.count()
    except Exception as e:
        notes.append(f"Failed to query Chroma collection: {e}")

    # Basic status heuristic
    if not knowledge_dir_exists:
        status = "empty"
        notes.append("Knowledgebase directory does not exist yet.")
    elif files_in_knowledge_dir == 0 and (vector_count or 0) == 0:
        status = "empty"
        notes.append("No knowledge files and no vectors present.")
    elif manifest_exists and documents_in_manifest == 0 and (vector_count or 0) > 0:
        status = "degraded"
        notes.append(
            "Manifest exists but tracks 0 documents while vector store has entries."
        )
    elif manifest_exists and documents_in_manifest > 0:
        status = "ok"
    else:
        status = "degraded"
        notes.append("Manifest missing or empty; reindex recommended.")

    return KnowledgeHealth(
        status=status,
        knowledge_dir_exists=knowledge_dir_exists,
        chroma_dir_exists=chroma_dir_exists,
        manifest_exists=manifest_exists,
        documents_in_manifest=documents_in_manifest,
        files_in_knowledge_dir=files_in_knowledge_dir,
        vector_count=vector_count,
        notes=notes,
    )


@router.get("/health", response_model=KnowledgeHealth)
async def get_knowledge_health(
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Return an operational health summary of the Knowledge/RAG backend.

    This is intended for internal dev/admin use:
    - Is the knowledgebase directory present?
    - Is the Chroma store reachable?
    - Is the manifest present and populated?
    - How many files & vectors are present?
    """
    return _compute_knowledge_health()


@router.post("/reindex", response_model=KnowledgeHealth)
async def reindex_knowledge(
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Trigger a full knowledgebase reindex.

    This:
    - walks knowledgebase/ and calls the incremental indexer
    - updates the manifest
    - returns updated health info

    Safe to run multiple times due to manifest-based incremental behavior.
    """
    # In the future you can add RBAC checks here, e.g. only admins:
    # if not current_user.is_admin: raise HTTPException(...)
    index_files_in_knowledgebase()
    return _compute_knowledge_health()


@router.get("/debug_document", response_model=DocumentDebug)
async def debug_knowledge_document(
    path: str,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Return detailed debug information for a single knowledge document,
    identified by its full filesystem path.

    This is intended for internal developer use when investigating RAG issues.
    """
    raw = debug_document_by_path(path)

    return DocumentDebug(
        status=raw.get("status", "unknown"),
        path=raw.get("path"),
        title=raw.get("title"),
        doc_type=raw.get("doc_type"),
        location_label=raw.get("location_label"),
        exists_on_disk=raw.get("exists_on_disk", False),
        size_bytes=raw.get("size_bytes"),
        text_chars=raw.get("text_chars"),
        in_manifest=raw.get("in_manifest", False),
        manifest_chunks=raw.get("manifest_chunks", 0),
        manifest_mtime=raw.get("manifest_mtime"),
        vector_chunks=raw.get("vector_chunks", 0),
        sample_snippet=raw.get("sample_snippet"),
        notes=raw.get("notes", []),
    )


@router.get("/diagnostics", response_model=DiagnosticsReport)
async def diagnostics_knowledge(
    limit_files: int = 500,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Run a lightweight diagnostics pass over the knowledgebase.

    Checks:
    - Files with no extractable text
    - Files missing from manifest
    - Files with no vectors in Chroma
    - Manifest entries pointing to missing files

    'limit_files' bounds the number of files scanned on disk for performance.
    """
    raw = run_diagnostics(limit_files=limit_files)

    issues = [
        DiagnosticsIssue(
            status=i.get("status", "unknown"),
            path=i.get("path"),
            title=i.get("title"),
            details=i.get("details", []),
        )
        for i in raw.get("issues", [])
    ]

    return DiagnosticsReport(
        status=raw.get("status", "unknown"),
        total_files=raw.get("total_files", 0),
        checked_files=raw.get("checked_files", 0),
        issues=issues,
    )
