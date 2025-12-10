from typing import List, Dict, Any, Tuple, Optional

from .client import get_collection
from .paths import classify_doc_path
from app.schemas.knowledge import KnowledgeSourceChunk


def _flatten_metadatas_and_docs(
    metadatas: Any,
    documents: Any,
) -> List[Tuple[Dict[str, Any], str]]:
    """
    Chroma can return either:
    - flat lists: [meta, meta, ...] / [doc, doc, ...]
    - nested lists: [[meta, meta], [meta, ...]] / [[doc, doc], ...]
    This helper normalizes both into a flat list of (meta, doc) pairs.
    """
    pairs: List[Tuple[Dict[str, Any], str]] = []

    if isinstance(metadatas, dict):
        # Single document
        pairs.append((metadatas, documents))
        return pairs

    # Otherwise assume list-like containers
    if not isinstance(metadatas, list) or not isinstance(documents, list):
        return pairs

    # If nested, zip outer first
    if metadatas and isinstance(metadatas[0], list):
        for meta_list, doc_list in zip(metadatas, documents):
            for m, d in zip(meta_list, doc_list):
                pairs.append((m or {}, d or ""))
    else:
        for m, d in zip(metadatas, documents):
            pairs.append((m or {}, d or ""))

    return pairs


def _build_context_window_for_hit(
    path: str,
    center_index: Optional[int],
    all_chunks_for_path: List[Tuple[Dict[str, Any], str]],
    window_size: int = 1,
    max_chars: int = 1200,
) -> str:
    """
    Given a 'hit' at (path, center_index) and all chunks for that path,
    build a small context window around it (neighbors +/- window_size).
    """
    if center_index is None:
        # Some older entries won't have chunk_index; just use the best doc we saw.
        # In that case, caller should pass an all_chunks_for_path list with only that doc.
        # Concatenate everything but cap by max_chars.
        combined = "\n\n".join(d for _, d in all_chunks_for_path)
        return combined[:max_chars]

    # Map chunk_index -> doc text
    by_index: Dict[int, str] = {}
    for meta, doc in all_chunks_for_path:
        idx = meta.get("chunk_index")
        if isinstance(idx, int):
            by_index[idx] = doc

    if not by_index:
        combined = "\n\n".join(d for _, d in all_chunks_for_path)
        return combined[:max_chars]

    start = center_index - window_size
    end = center_index + window_size

    parts: List[str] = []
    for idx in range(start, end + 1):
        if idx in by_index:
            parts.append(by_index[idx])

    if not parts:
        # Fallback: just the center index, if present at all
        if center_index in by_index:
            return by_index[center_index][:max_chars]
        combined = "\n\n".join(by_index.values())
        return combined[:max_chars]

    combined = "\n\n".join(parts)
    return combined[:max_chars]


def query_knowledge(query: str, top_k: int = 4) -> List[KnowledgeSourceChunk]:
    """
    Query semantically similar chunks from the knowledgebase, but upgrade
    the returned 'snippet' to include neighboring chunks from the same file
    (multi-chunk context windows).

    The public API remains the same (KnowledgeSourceChunk), but:
    - snippet now often spans multiple chunks
    - we deduplicate by (path, center_chunk_index) to avoid noisy repeats
    """
    collection = get_collection()

    # First: seed query for top_k hits
    results = collection.query(
        query_texts=[query],
        n_results=top_k,
    )

    docs_list = results.get("documents", [[]])
    metas_list = results.get("metadatas", [[]])
    scores_list = results.get("distances", [[]])

    if not docs_list or not metas_list:
        return []

    docs = docs_list[0] or []
    metas = metas_list[0] or []
    scores = scores_list[0] or []

    if not docs:
        return []

    # Collect seed hits with enough metadata to build windows
    hits: List[Dict[str, Any]] = []

    for doc, meta, score in zip(docs, metas, scores):
        meta = meta or {}
        title = meta.get("title", "Untitled")
        path = meta.get("path")
        chunk_index = meta.get("chunk_index") if isinstance(meta.get("chunk_index"), int) else None

        hits.append(
            {
                "title": title,
                "path": path,
                "chunk_index": chunk_index,
                "score": float(score),
                "doc": doc or "",
                "meta": meta,
            }
        )

    # Group hits by path so we can fetch neighbors per file
    paths = {h["path"] for h in hits if h["path"]}
    all_chunks_by_path: Dict[str, List[Tuple[Dict[str, Any], str]]] = {}

    for path in paths:
        # For each file path, retrieve all its chunks
        per_file = collection.get(
            where={"path": path},
            include=["metadatas", "documents"],
            limit=1000,
        )
        file_metas = per_file.get("metadatas", [])
        file_docs = per_file.get("documents", [])
        all_chunks_by_path[path] = _flatten_metadatas_and_docs(file_metas, file_docs)

    # For hits without path (legacy text entries), we treat the single doc as a 1-chunk context
    # when we build the final snippet.

    sources: List[KnowledgeSourceChunk] = []
    seen_context_keys = set()

    enriched_hits: List[Dict[str, Any]] = []

    for h in hits:
        title: str = h["title"]
        path = h["path"]
        chunk_index = h["chunk_index"]
        score = h["score"]
        doc_text = h["doc"]

        if path:
            context_key = (path, chunk_index)
        else:
            # For path-less docs, use title + doc hash as a coarse key
            context_key = (title, hash(doc_text))

        if context_key in seen_context_keys:
            continue
        seen_context_keys.add(context_key)

        doc_type, _ = classify_doc_path(path)

        enriched_hits.append(
            {
                "title": title,
                "path": path,
                "chunk_index": chunk_index,
                "score": score,
                "doc_text": doc_text,
                "doc_type": doc_type,
            }
        )

    # Path-aware reranking:
    #   1) doc_type priority
    #   2) original vector distance (lower is better)
    type_priority = {
        "file": 0,
        "note": 1,
        "virtual": 2,
        "unknown": 3,
    }

    enriched_hits.sort(
        key=lambda h: (
            type_priority.get(h["doc_type"], 3),
            h["score"],  # smaller distance = closer semantic match
        )
    )

    for h in enriched_hits:
        title = h["title"]
        path = h["path"]
        chunk_index = h["chunk_index"]
        score = h["score"]
        doc_text = h["doc_text"]

        if path and path in all_chunks_by_path:
            window_text = _build_context_window_for_hit(
                path=path,
                center_index=chunk_index,
                all_chunks_for_path=all_chunks_by_path[path],
                window_size=1,       # +/- 1 neighbor
                max_chars=1200,      # cap snippet size for RAG
            )
        else:
            # No path or we failed to resolve chunks; fallback to original doc
            window_text = doc_text[:1200]

        doc_id = f"{title}:{path}" if path else title

        sources.append(
            KnowledgeSourceChunk(
                document_id=doc_id,
                title=title,
                snippet=window_text,
                score=score,
            )
        )

        if len(sources) >= top_k:
            break

    return sources
