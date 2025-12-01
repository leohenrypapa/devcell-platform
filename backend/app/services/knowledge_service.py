import os
from pathlib import Path
from typing import List, Optional

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from pypdf import PdfReader

from app.schemas.knowledge import KnowledgeSourceChunk, KnowledgeDocument

# Repo root (../.. from this file)
BASE_DIR = Path(__file__).resolve().parents[2]
KNOWLEDGE_DIR = BASE_DIR / "Knowledgebase"
CHROMA_DIR = BASE_DIR / "chroma_store"

EMBED_MODEL_NAME = os.getenv(
    "KNOWLEDGE_EMBED_MODEL",
    "sentence-transformers/all-MiniLM-L6-v2",
)

_client = None
_collection = None
_embedder = None


def _get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(EMBED_MODEL_NAME)
    return _embedder


def _get_collection():
    global _client, _collection

    if _client is None:
        CHROMA_DIR.mkdir(parents=True, exist_ok=True)
        _client = chromadb.PersistentClient(
            path=str(CHROMA_DIR),
            settings=Settings(allow_reset=False),
        )

    if _collection is None:
        _collection = _client.get_or_create_collection("devcell_knowledge")

    return _collection


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
            # unsupported type
            return None
    except Exception:
        return None


def _index_path(path: Path) -> None:
    """
    Index a single file at 'path' into Chroma.
    Overwrites previous entries for this path.
    """
    collection = _get_collection()
    _get_embedder()  # ensure model is loaded

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
    Scan Knowledgebase/ for supported files and index them in Chroma.
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


def add_text_document(title: str, text: str) -> None:
    """
    Add a text note as its own virtual document and index it.
    """
    collection = _get_collection()
    _get_embedder()

    chunks = _chunk_text(text)
    ids = []
    metadatas = []
    documents = []

    for idx, chunk in enumerate(chunks):
        doc_id = f"{title}-{idx}"
        ids.append(doc_id)
        metadatas.append(
            {
                "title": title,
                "path": None,
            }
        )
        documents.append(chunk)

    collection.upsert(
        ids=ids,
        metadatas=metadatas,
        documents=documents,
    )


def query_knowledge(query: str, top_k: int = 4) -> List[KnowledgeSourceChunk]:
    """
    Query semantically similar chunks from the knowledgebase.
    """
    collection = _get_collection()

    results = collection.query(
        query_texts=[query],
        n_results=top_k,
    )

    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    scores = results.get("distances", [[]])[0]

    sources: List[KnowledgeSourceChunk] = []

    for doc, meta, score in zip(docs, metas, scores):
        title = meta.get("title", "Untitled")
        path = meta.get("path")
        doc_id = f"{title}:{path}" if path else title

        sources.append(
            KnowledgeSourceChunk(
                document_id=doc_id,
                title=title,
                snippet=doc[:400],
                score=float(score),
            )
        )

    return sources

def list_documents(limit: int = 1000) -> List[KnowledgeDocument]:
    """
    Return a deduplicated list of documents (title + path) based on
    what's stored in the Chroma collection metadata.
    """
    collection = _get_collection()

    # Get all items (up to 'limit') from Chroma
    res = collection.get(
        include=["metadatas", "documents"],
        limit=limit,
    )

    metadatas = res.get("metadatas", [])
    documents = res.get("documents", [])

    seen = set()
    docs: List[KnowledgeDocument] = []

    for midx, (meta_list, doc_list) in enumerate(zip(metadatas, documents)):
        # In newer Chroma, get() returns a flat list; in older, nested.
        if isinstance(meta_list, dict):
            meta = meta_list
            content = doc_list
            title = meta.get("title", "Untitled")
            path = meta.get("path")
            key = (title, path)
            if key in seen:
                continue
            seen.add(key)

            preview = (content or "")[:400]
            docs.append(
                KnowledgeDocument(
                    id=f"{title}:{path}" if path else title,
                    title=title,
                    path=path,
                    content_preview=preview,
                )
            )
        else:
            # Handle older shape: list of dicts
            for meta, content in zip(meta_list, doc_list):
                title = meta.get("title", "Untitled")
                path = meta.get("path")
                key = (title, path)
                if key in seen:
                    continue
                seen.add(key)

                preview = (content or "")[:400]
                docs.append(
                    KnowledgeDocument(
                        id=f"{title}:{path}" if path else title,
                        title=title,
                        path=path,
                        content_preview=preview,
                    )
                )

    return docs


def delete_document(title: str, path: Optional[str]) -> None:
    """
    Delete a document from Chroma by its title/path metadata.
    If path points to a file in Knowledgebase/, also remove the file.
    """
    collection = _get_collection()

    where_filter = {"title": title}
    if path:
        where_filter["path"] = path

    # Delete from vector store
    collection.delete(where=where_filter)

    # Optionally delete physical file if it lives under Knowledgebase/
    if path:
        file_path = Path(path)
        try:
            # Only remove if inside KNOWLEDGE_DIR (safety)
            if KNOWLEDGE_DIR in file_path.resolve().parents:
                if file_path.exists():
                    file_path.unlink()
        except Exception as e:
            # Just log; don't crash API
            print(f"[knowledge] Failed to remove file {path}: {e}")
