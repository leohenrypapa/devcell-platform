from pathlib import Path
from typing import List, Optional
import re
import time

from .config import KNOWLEDGE_DIR
from .client import get_collection
from .indexer import index_single_file
from .paths import classify_doc_path
from app.schemas.knowledge import KnowledgeDocument


def _slugify(title: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9_-]+", "-", title.strip().lower())
    slug = slug.strip("-")
    return slug or "note"


def add_text_document(title: str, text: str) -> None:
    """
    Add a text note as a real markdown file under knowledgebase/notes/
    and index it via the standard file ingestion pipeline.

    This unifies text notes and file-based documents so that all
    knowledge flows through the same chunking + manifest + indexing logic.
    """
    notes_dir = KNOWLEDGE_DIR / "notes"
    notes_dir.mkdir(parents=True, exist_ok=True)

    base_slug = _slugify(title)
    timestamp = int(time.time())
    filename = f"{base_slug}-{timestamp}.md"
    path = notes_dir / filename

    # Simple markdown wrapper for the note
    content = f"# {title}\n\n{text}\n"
    path.write_text(content, encoding="utf-8")

    # Use the same incremental indexing pipeline as other files
    index_single_file(path)


def list_documents(limit: int = 1000) -> List[KnowledgeDocument]:
    """
    Return a deduplicated list of documents (title + path) based on
    what's stored in the Chroma collection metadata.

    Upgrades:
    - Classify each document by path (file/note/virtual/unknown).
    - Sort documents by type, then title.
    - Optionally annotate the title with a short location label.
    """
    collection = get_collection()

    res = collection.get(
        include=["metadatas", "documents"],
        limit=limit,
    )

    metadatas = res.get("metadatas", [])
    documents = res.get("documents", [])

    seen = set()
    docs: List[KnowledgeDocument] = []

    def _append_doc(meta: dict, content: str) -> None:
        title = meta.get("title", "Untitled")
        path = meta.get("path")
        key = (title, path)
        if key in seen:
            return
        seen.add(key)

        preview = (content or "")[:400]

        doc_type, loc_label = classify_doc_path(path)

        # We keep the underlying title stable for logic, but we can
        # optionally prefix the display title with a location label.
        display_title = f"{loc_label} {title}"

        docs.append(
            KnowledgeDocument(
                id=f"{title}:{path}" if path else title,
                title=display_title,
                path=path,
                content_preview=preview,
            )
        )

    for meta_list, doc_list in zip(metadatas, documents):
        # Handle both flat and nested shapes
        if isinstance(meta_list, dict):
            meta = meta_list
            content = doc_list
            _append_doc(meta, content)
        else:
            for meta, content in zip(meta_list, doc_list):
                _append_doc(meta or {}, content or "")

    # Sort: file docs first, then notes, then virtual/unknown
    type_priority = {
        "file": 0,
        "note": 1,
        "virtual": 2,
        "unknown": 3,
    }

    def _sort_key(d: KnowledgeDocument):
        doc_type, _ = classify_doc_path(d.path)
        # Strip label from display_title for sorting by "real" title
        raw_title = d.title
        # titles are like "[notes] Something" or "[knowledgebase] Other"
        if raw_title.startswith("["):
            # Try to strip leading [xxx]
            closing = raw_title.find("]")
            if closing != -1 and closing + 1 < len(raw_title):
                raw_title = raw_title[closing + 1 :].strip()
        return (type_priority.get(doc_type, 3), raw_title.lower())

    docs.sort(key=_sort_key)

    return docs


def delete_document(title: str, path: Optional[str]) -> None:
    """
    Delete a document from Chroma by its title/path metadata.
    If path points to a file in knowledgebase/, also remove the file.
    """
    collection = get_collection()

    # Build a Chroma filter that matches newer typed API expectations:
    # - If path is provided: use $and with title + path
    # - If no path: filter only on title
    if path:
        where_filter = {
            "$and": [
                {"title": title},
                {"path": path},
            ]
        }
    else:
        where_filter = {"title": title}

    # Delete from vector store
    collection.delete(where=where_filter)

    # Optionally delete physical file if it lives under knowledgebase/
    if path:
        file_path = Path(path)
        try:
            if KNOWLEDGE_DIR in file_path.resolve().parents and file_path.exists():
                file_path.unlink()
        except Exception as e:
            print(f"[knowledge] Failed to remove file {path}: {e}")
