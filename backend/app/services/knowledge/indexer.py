from pathlib import Path
from typing import List, Optional

from pypdf import PdfReader

from .config import KNOWLEDGE_DIR
from .client import get_collection
from .embedder import get_embedder
from app.schemas.knowledge import KnowledgeSourceChunk


def _chunk_text(text: str, max_chars: int = 800) -> List[str]:
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: List[str] = []
    current = ""

    for p in paragraphs:
        if len(current) + len(p) + 2 <= max_chars:
            current = f"{current}\n\n{p}".strip()
        else:
            if current:
                chunks.append(current)
            current = p
    if current:
        chunks.append(current)

    return chunks or [text[:max_chars]]


def _extract_text_from_file(path: Path) -> Optional[str]:
    suffix = path.suffix.lower()

    try:
        if suffix == ".pdf":
            reader = PdfReader(str(path))
            parts: List[str] = []
            for page in reader.pages:
                page_text = page.extract_text() or ""
                parts.append(page_text)
            return "\n\n".join(parts)
        elif suffix in {".txt", ".md"}:
            return path.read_text(encoding="utf-8", errors="ignore")
        else:
            return None
    except Exception:
        return None


def _index_path(path: Path) -> None:
    """
    Index a single file at 'path' into Chroma.
    Overwrites previous entries for this path.
    """
    collection = get_collection()
    _ = get_embedder()  # ensure model is loaded

    if not path.is_file():
        return

    if path.suffix.lower() not in {".txt", ".md", ".pdf"}:
        return

    text = _extract_text_from_file(path)
    if not text:
        return

    title = path.stem
    chunks = _chunk_text(text)

    # Remove any old entries for this path
    collection.delete(
        where={"path": str(path)},
    )

    ids = []
    metadatas = []
    documents = []

    for idx, chunk in enumerate(chunks):
        doc_id = f"{path.name}-{idx}"
        ids.append(doc_id)
        metadatas.append(
            {
                "title": title,
                "path": str(path),
            }
        )
        documents.append(chunk)

    if not ids:
        return

    collection.upsert(
        ids=ids,
        metadatas=metadatas,
        documents=documents,
    )


def index_files_in_knowledgebase() -> None:
    """
    Scan knowledgebase/ for supported files and index them in Chroma.
    Call this at startup.
    """
    KNOWLEDGE_DIR.mkdir(parents=True, exist_ok=True)

    for path in KNOWLEDGE_DIR.rglob("*"):
        if not path.is_file():
            continue
        _index_path(path)


def index_single_file(path: Path) -> None:
    """
    Index a single newly uploaded file without re-scanning everything.
    """
    KNOWLEDGE_DIR.mkdir(parents=True, exist_ok=True)
    _index_path(path)
