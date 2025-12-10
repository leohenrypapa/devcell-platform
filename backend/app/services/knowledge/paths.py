# backend/app/services/knowledge/paths.py

from __future__ import annotations

from pathlib import Path
from typing import Tuple


def classify_doc_path(path: str | None) -> Tuple[str, str]:
    """
    Classify a document path into a doc_type and a human-friendly location label.

    Returns:
        (doc_type, location_label)

    doc_type is one of:
        - "note"     : note created via /knowledge/add_text (under knowledgebase/notes/)
        - "file"     : regular file-based document in knowledgebase/
        - "virtual"  : entries without a path (legacy / in-memory)
        - "unknown"  : fallback if we can't parse

    location_label is a short string suitable for UI hints like:
        "[notes]" or "[knowledgebase]"
    """
    if path is None:
        return "virtual", "[virtual]"

    p = Path(path)

    # Normalize for substring checks
    path_str = str(p).replace("\\", "/").lower()

    if "/notes/" in path_str:
        return "note", "[notes]"

    # Future: you can special-case other subfolders here, e.g. /docs/, /adr/, etc.
    if "knowledgebase" in path_str:
        return "file", "[knowledgebase]"

    return "unknown", "[other]"
