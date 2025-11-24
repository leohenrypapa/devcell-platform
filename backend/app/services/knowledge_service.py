import os
from pathlib import Path
from typing import List, Tuple

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

from app.schemas.knowledge import KnowledgeSourceChunk


BASE_DIR = Path(__file__).resolve().parents[2]  # repo root
KNOWLEDGE_DIR = BASE_DIR / "Knowledgebase"
CHROMA_DIR = BASE_DIR / "chroma_store"

# Small, fast embedding model
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
    # Simple chunker: split on double newlines, then merge chunks if small
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


def index_files_in_knowledgebase() -> None:
    """
    Scan Knowledgebase/ for .txt / .md files and index them in Chroma.
    This can be called at startup.
    """
    collection = _get_collection()
    embedder = _get_embedder()

    KNOWLEDGE_DIR.mkdir(parents=True, exist_ok=True)

    for path in KNOWLEDGE_DIR.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".txt", ".md"}:
            continue

        title = path.stem
        text = path.read_text(encoding="utf-8", errors="ignore")
        chunks = _chunk_text(text)

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
            continue

        # Upsert into Chroma
        collection.upsert(
            ids=ids,
            metadatas=metadatas,
            documents=documents,
        )


def add_text_document(title: str, text: str) -> None:
    """
    Add a text note as its own 'virtual' file and index it.
    """
    collection = _get_collection()
    embedder = _get_embedder()

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
    collection = _get_collection()

    # Let Chroma handle embeddings internally (default)
    results = collection.query(
        query_texts=[query],
        n_results=top_k,
    )

    sources: List[KnowledgeSourceChunk] = []

    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    scores = results.get("distances", [[]])[0]

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
