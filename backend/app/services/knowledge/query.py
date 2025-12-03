from typing import List

from .client import get_collection
from app.schemas.knowledge import KnowledgeSourceChunk


def query_knowledge(query: str, top_k: int = 4) -> List[KnowledgeSourceChunk]:
    """
    Query semantically similar chunks from the knowledgebase.
    """
    collection = get_collection()

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
