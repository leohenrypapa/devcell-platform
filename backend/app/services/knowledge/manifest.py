# backend/app/services/knowledge/manifest.py

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

from .config import KNOWLEDGE_DIR


MANIFEST_VERSION = 1
MANIFEST_PATH = KNOWLEDGE_DIR / ".manifest.json"


def _empty_manifest() -> Dict[str, Any]:
    return {
        "version": MANIFEST_VERSION,
        "documents": {},
    }


def load_manifest() -> Dict[str, Any]:
    """
    Load the knowledgebase manifest from disk.
    If it doesn't exist or is invalid, return an empty manifest.
    """
    try:
        if not MANIFEST_PATH.exists():
            return _empty_manifest()
        data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        if not isinstance(data, dict) or "documents" not in data:
            return _empty_manifest()
        # simple forward-compat
        if data.get("version") != MANIFEST_VERSION:
            data["version"] = MANIFEST_VERSION
        if "documents" not in data:
            data["documents"] = {}
        return data
    except Exception:
        # Defensive: never let manifest corruption break ingestion
        return _empty_manifest()


def save_manifest(manifest: Dict[str, Any]) -> None:
    """
    Persist the manifest atomically to disk.
    """
    KNOWLEDGE_DIR.mkdir(parents=True, exist_ok=True)
    tmp_path = MANIFEST_PATH.with_suffix(".tmp")
    tmp_path.write_text(json.dumps(manifest, indent=2, sort_keys=True), encoding="utf-8")
    tmp_path.replace(MANIFEST_PATH)


def get_doc_entry(manifest: Dict[str, Any], path: Path) -> Dict[str, Any] | None:
    return manifest.get("documents", {}).get(str(path))


def set_doc_entry(
    manifest: Dict[str, Any],
    path: Path,
    *,
    title: str,
    file_hash: str,
    mtime: float,
    chunks: List[Dict[str, Any]],
) -> None:
    docs = manifest.setdefault("documents", {})
    docs[str(path)] = {
        "title": title,
        "file_hash": file_hash,
        "mtime": mtime,
        "chunks": chunks,
    }
