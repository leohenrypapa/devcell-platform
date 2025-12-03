from pathlib import Path
from typing import List, Optional

from .config import KNOWLEDGE_DIR
from .client import get_collection
from app.schemas.knowledge import KnowledgeDocument


def add_text_document(title: str, text: str) -> None:
    """
    Add a text note as its own virtual document and index it.
    """
    collection = get_collection()

    # simple 1-chunk-per-400 chars strategy
    chunks = [text[i : i + 800] for i in range(0, len(text), 800)] or [text]

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


def list_documents(limit: int = 1000) -> List[KnowledgeDocument]:
    """
    Return a deduplicated list of documents (title + path) based on
    what's stored in the Chroma collection metadata.
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

    for midx, (meta_list, doc_list) in enumerate(zip(metadatas, documents)):
        # Handle both flat and nested shapes
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
