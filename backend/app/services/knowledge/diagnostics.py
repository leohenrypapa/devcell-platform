# backend/app/services/knowledge/diagnostics.py

from __future__ import annotations

from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from .config import KNOWLEDGE_DIR
from .client import get_collection
from .manifest import load_manifest, get_doc_entry
from .paths import classify_doc_path
from .indexer import _extract_text_from_file  # type: ignore


def _count_docs_from_chroma_docs(docs_field: Any) -> int:
    """
    Count how many document chunks are represented by the 'documents' field
    returned from Chroma .get(...).

    Handles both:
    - flat lists: ["...", "..."]
    - nested lists: [["...", ...], ["...", ...]]
    """
    if docs_field is None:
        return 0

    if isinstance(docs_field, list):
        if docs_field and isinstance(docs_field[0], list):
            return sum(len(lst) for lst in docs_field)
        return len(docs_field)

    # Single string or unknown shape
    return 1


def debug_document_by_path(path_str: str) -> Dict[str, Any]:
    """
    Collect detailed debug information for a single document identified by its path.

    Returns a dict suitable for turning into a Pydantic model in the API layer.
    """
    collection = get_collection()
    path = Path(path_str)
    notes: List[str] = []

    exists_on_disk = path.is_file()
    size_bytes: Optional[int] = None
    text_chars: Optional[int] = None
    sample_snippet: Optional[str] = None
    title: Optional[str] = None

    if exists_on_disk:
        try:
            stat = path.stat()
            size_bytes = stat.st_size
        except Exception as e:
            notes.append(f"Failed to stat file: {e}")

        try:
            text = _extract_text_from_file(path) or ""
            text_chars = len(text)
            if text:
                sample_snippet = text[:400]
        except Exception as e:
            notes.append(f"Failed to extract text: {e}")
    else:
        notes.append("File does not exist on disk.")

    # Manifest info
    manifest = load_manifest()
    entry = get_doc_entry(manifest, path)
    in_manifest = entry is not None
    manifest_chunks = 0
    manifest_mtime: Optional[float] = None

    if entry:
        manifest_chunks = len(entry.get("chunks", []))
        manifest_mtime = entry.get("mtime")
        if not title:
            title = entry.get("title")
    else:
        notes.append("No manifest entry found for this path.")

    # Vector store info
    vector_chunks = 0
    try:
        per_file = collection.get(
            where={"path": str(path)},
            include=["metadatas", "documents"],
            limit=1000,
        )
        docs_field = per_file.get("documents")
        vector_chunks = _count_docs_from_chroma_docs(docs_field)
        if vector_chunks == 0:
            notes.append("No vectors found in Chroma for this path.")
    except Exception as e:
        notes.append(f"Failed to query Chroma for this path: {e}")

    doc_type, loc_label = classify_doc_path(str(path))

    # Status heuristic
    if not exists_on_disk and (in_manifest or vector_chunks > 0):
        status = "orphaned_vectors_or_manifest"
        notes.append(
            "Manifest and/or vectors exist for a file that is missing on disk."
        )
    elif exists_on_disk and not in_manifest and vector_chunks == 0:
        status = "unindexed_file"
        notes.append(
            "File exists on disk but has no manifest entry and no vectors. Reindex recommended."
        )
    elif exists_on_disk and in_manifest and vector_chunks == 0:
        status = "manifest_but_no_vectors"
        notes.append(
            "File + manifest entry exist, but no vectors in Chroma. Reindex recommended."
        )
    elif exists_on_disk and not in_manifest and vector_chunks > 0:
        status = "vectors_without_manifest"
        notes.append(
            "File + vectors exist but no manifest entry. Consider reindex to repair manifest."
        )
    else:
        status = "ok"

    return {
        "status": status,
        "path": str(path),
        "title": title,
        "doc_type": doc_type,
        "location_label": loc_label,
        "exists_on_disk": exists_on_disk,
        "size_bytes": size_bytes,
        "text_chars": text_chars,
        "in_manifest": in_manifest,
        "manifest_chunks": manifest_chunks,
        "manifest_mtime": manifest_mtime,
        "vector_chunks": vector_chunks,
        "sample_snippet": sample_snippet,
        "notes": notes,
    }


def run_diagnostics(limit_files: int = 500) -> Dict[str, Any]:
    """
    Run a lightweight diagnostics pass over the knowledgebase directory and manifest.

    Returns:
        {
            "status": str,
            "total_files": int,
            "checked_files": int,
            "issues": [...],
        }

    Each issue is a dict with:
        {
            "status": str,
            "path": str | None,
            "title": str | None,
            "details": [str, ...],
        }
    """
    KNOWLEDGE_DIR.mkdir(parents=True, exist_ok=True)

    # Load manifest once
    manifest = load_manifest()
    manifest_docs = manifest.get("documents", {})
    manifest_paths = set(manifest_docs.keys())

    issues: List[Dict[str, Any]] = []

    # 1) Scan files on disk (limited)
    all_files: List[Path] = []
    for path in KNOWLEDGE_DIR.rglob("*"):
        if path.is_file():
            all_files.append(path)

    total_files = len(all_files)
    checked_files = 0

    for path in all_files[:limit_files]:
        checked_files += 1
        path_str = str(path)

        entry = manifest_docs.get(path_str)
        exists_on_disk = True
        in_manifest = entry is not None

        details: List[str] = []
        status: Optional[str] = None

        try:
            text = _extract_text_from_file(path) or ""
            text_chars = len(text)
        except Exception:
            text = ""
            text_chars = 0
            details.append("Failed to extract text (exception).")

        if text_chars == 0:
            status = "no_text"
            details.append("File produced no extractable text.")

        # Quick vector check
        vector_chunks = 0
        try:
            collection = get_collection()
            per_file = collection.get(
                where={"path": path_str},
                include=["documents"],
                limit=10,
            )
            vector_chunks = _count_docs_from_chroma_docs(per_file.get("documents"))
        except Exception:
            details.append("Failed to query Chroma for this file.")

        if not in_manifest:
            status = status or "not_in_manifest"
            details.append("No manifest entry for this file.")

        if vector_chunks == 0:
            status = status or "no_vectors"
            details.append("No vectors found in Chroma for this file.")

        if status:
            title = entry.get("title") if entry else path.stem
            issues.append(
                {
                    "status": status,
                    "path": path_str,
                    "title": title,
                    "details": details,
                }
            )

    # 2) Scan manifest entries whose files no longer exist
    for path_str, entry in manifest_docs.items():
        p = Path(path_str)
        if not p.is_file():
            issues.append(
                {
                    "status": "manifest_path_missing",
                    "path": path_str,
                    "title": entry.get("title"),
                    "details": ["Manifest entry points to a file that does not exist."],
                }
            )

    if not issues:
        overall_status = "ok"
    else:
        # If we have any 'manifest_path_missing' or 'no_vectors', consider degraded
        severe = any(
            i["status"] in {"manifest_path_missing", "no_vectors"} for i in issues
        )
        overall_status = "degraded" if severe else "warn"

    return {
        "status": overall_status,
        "total_files": total_files,
        "checked_files": checked_files,
        "issues": issues,
    }
