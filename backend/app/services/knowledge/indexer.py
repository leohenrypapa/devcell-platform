from pathlib import Path
from typing import List, Optional, Dict, Any
import hashlib
import os
import re

from pypdf import PdfReader

from .config import KNOWLEDGE_DIR
from .client import get_collection
from .embedder import get_embedder
from .manifest import load_manifest, save_manifest, get_doc_entry, set_doc_entry


def _chunk_text(text: str, max_chars: int = 800, overlap: int = 200) -> List[str]:
    """
    Chunk text into overlapping windows of ~max_chars, trying to cut on sentence boundaries.

    - First split into sentences using a lightweight regex.
    - Then pack sentences into windows with overlap between chunks.
    """
    # Normalize line breaks a bit first
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")

    # Very simple sentence segmentation: split on punctuation + space/newline
    # This is intentionally light to avoid extra dependencies.
    raw_sentences = re.split(r"(?<=[\.!?])\s+", normalized)
    sentences = [s.strip() for s in raw_sentences if s.strip()]

    if not sentences:
        return [normalized[:max_chars]]

    chunks: List[str] = []
    current: List[str] = []
    current_len = 0

    for sent in sentences:
        sent_len = len(sent)
        if current and current_len + sent_len + 1 > max_chars:
            # finalize current chunk
            chunk_text = " ".join(current).strip()
            if chunk_text:
                chunks.append(chunk_text)

            # start new chunk with overlap from the end of previous
            if overlap > 0 and chunks:
                # take last chunk and keep the last 'overlap' characters worth of sentences
                last_chunk = chunks[-1]
                # crude overlap: take tail substring
                tail = last_chunk[-overlap:]
                current = [tail, sent]
                current_len = len(tail) + 1 + sent_len
            else:
                current = [sent]
                current_len = sent_len
        else:
            current.append(sent)
            current_len += sent_len + (1 if current_len > 0 else 0)

    if current:
        chunk_text = " ".join(current).strip()
        if chunk_text:
            chunks.append(chunk_text)

    return chunks or [normalized[:max_chars]]


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


def _compute_file_hash(path: Path) -> str:
    """
    Hash the raw bytes of the file. This lets us detect file-level changes quickly.
    """
    sha = hashlib.sha1()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha.update(chunk)
    return sha.hexdigest()


def _compute_chunk_hash(chunk: str) -> str:
    """
    Hash a single chunk's text content.
    """
    sha = hashlib.sha1()
    sha.update(chunk.encode("utf-8", errors="ignore"))
    return sha.hexdigest()


def _make_chunk_id(path: Path, chunk_hash: str) -> str:
    """
    Create a stable chunk id based on file path + chunk hash.

    This ensures:
    - unchanged chunks keep the same id across re-indexes
    - moved files will generate a different id (because path is part of the id)
    """
    base = f"{path}:{chunk_hash}"
    return hashlib.sha1(base.encode("utf-8", errors="ignore")).hexdigest()


def _index_path(path: Path) -> None:
    """
    Index a single file at 'path' into Chroma with incremental updates.

    Behavior:
    - If the file hasn't changed (hash + chunk hashes), do nothing.
    - If some chunks changed:
        * new/changed chunks are upserted
        * removed chunks are deleted by id
    - Manifest is updated to reflect the latest state.
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

    if not chunks:
        return

    # Load manifest + previous entry
    manifest = load_manifest()
    prev_entry = get_doc_entry(manifest, path)

    file_hash = _compute_file_hash(path)
    mtime = path.stat().st_mtime

    # Compute hashes for current chunks
    new_chunks: List[Dict[str, Any]] = []
    new_chunk_hashes: List[str] = []
    for idx, chunk in enumerate(chunks):
        chash = _compute_chunk_hash(chunk)
        new_chunk_hashes.append(chash)
        new_chunks.append(
            {
                "index": idx,
                "chunk_hash": chash,
                # chunk_id will be filled in after we determine reuse / new
            }
        )

    # Fast-path: nothing changed (file hash + chunk hashes identical)
    if prev_entry:
        prev_file_hash = prev_entry.get("file_hash")
        prev_chunks = prev_entry.get("chunks", [])
        prev_chunk_hashes = [c.get("chunk_hash") for c in prev_chunks]

        if (
            prev_file_hash == file_hash
            and len(prev_chunk_hashes) == len(new_chunk_hashes)
            and all(a == b for a, b in zip(prev_chunk_hashes, new_chunk_hashes))
        ):
            # No content-level change; keep existing vectors
            return

    # Build maps for reuse
    old_chunks_by_hash: Dict[str, Dict[str, Any]] = {}
    old_ids: set[str] = set()

    if prev_entry:
        for c in prev_entry.get("chunks", []):
            chash = c.get("chunk_hash")
            cid = c.get("chunk_id")
            if chash and cid:
                old_chunks_by_hash[chash] = c
                old_ids.add(cid)

    # Decide IDs and which chunks need upsert
    upsert_ids: List[str] = []
    upsert_docs: List[str] = []
    upsert_metadatas: List[Dict[str, Any]] = []
    new_manifest_chunks: List[Dict[str, Any]] = []

    for chunk_meta, chunk_text in zip(new_chunks, chunks):
        chash = chunk_meta["chunk_hash"]
        old = old_chunks_by_hash.get(chash)

        if old:
            # Unchanged chunk; reuse id
            cid = old["chunk_id"]
            chunk_meta["chunk_id"] = cid
            new_manifest_chunks.append(
                {
                    "index": chunk_meta["index"],
                    "chunk_hash": chash,
                    "chunk_id": cid,
                }
            )
        else:
            # New or modified chunk; generate fresh id and mark for upsert
            cid = _make_chunk_id(path, chash)
            chunk_meta["chunk_id"] = cid
            new_manifest_chunks.append(
                {
                    "index": chunk_meta["index"],
                    "chunk_hash": chash,
                    "chunk_id": cid,
                }
            )
            upsert_ids.append(cid)
            upsert_docs.append(chunk_text)
            upsert_metadatas.append(
                {
                    "title": title,
                    "path": str(path),
                    "chunk_index": chunk_meta["index"],
                }
            )

    # Determine which old ids should be removed (chunks that no longer exist)
    new_ids_set = {c["chunk_id"] for c in new_manifest_chunks}
    to_delete_ids = list(old_ids - new_ids_set) if old_ids else []

    if to_delete_ids:
        # Remove only truly obsolete chunks for this file
        collection.delete(ids=to_delete_ids)

    if upsert_ids:
        collection.upsert(
            ids=upsert_ids,
            metadatas=upsert_metadatas,
            documents=upsert_docs,
        )

    # Update manifest entry
    set_doc_entry(
        manifest,
        path,
        title=title,
        file_hash=file_hash,
        mtime=mtime,
        chunks=new_manifest_chunks,
    )
    save_manifest(manifest)


def index_files_in_knowledgebase() -> None:
    """
    Scan knowledgebase/ for supported files and index them in Chroma.
    Uses incremental behavior via the manifest, so re-running this is cheap.
    """
    KNOWLEDGE_DIR.mkdir(parents=True, exist_ok=True)

    for path in KNOWLEDGE_DIR.rglob("*"):
        if not path.is_file():
            continue
        _index_path(path)


def index_single_file(path: Path) -> None:
    """
    Index a single newly uploaded or updated file.

    Uses the same incremental behavior as index_files_in_knowledgebase().
    """
    KNOWLEDGE_DIR.mkdir(parents=True, exist_ok=True)
    _index_path(path)
