from pathlib import Path
from typing import List, Dict, Any

import chromadb
from chromadb.utils import embedding_functions
from app.core.config import settings
from app.core.llm_client import llm_chat

# Base paths
# This resolves to the root of your repo: devcell-platform/
BASE_DIR = Path(__file__).resolve().parents[3]
KNOWLEDGE_BASE_DIR = BASE_DIR / "knowledgebase"
VECTOR_DB_DIR = BASE_DIR / "chroma_db"

# Global objects
_client = None
_collection = None
_initialized = False


def _get_client_and_collection():
    global _client, _collection
    if _client is None:
        VECTOR_DB_DIR.mkdir(parents=True, exist_ok=True)
        _client = chromadb.PersistentClient(path=str(VECTOR_DB_DIR))
    if _collection is None:
        _collection = _client.get_or_create_collection(
            name="knowledge",
        )
    return _client, _collection


def _get_embedding_function():
    # SentenceTransformers embedding function
    return embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )


def _load_documents() -> List[Dict[str, Any]]:
    """
    Load all .txt and .md files from the knowledgebase folder.
    Each file is stored as a single document for now (no chunking).
    """
    docs: List[Dict[str, Any]] = []

    if not KNOWLEDGE_BASE_DIR.exists():
        return docs

    for ext in ("*.txt", "*.md"):
        for path in KNOWLEDGE_BASE_DIR.rglob(ext):
            try:
                text = path.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue

            text = text.strip()
            if not text:
                continue

            docs.append(
                {
                    "id": f"{path.relative_to(KNOWLEDGE_BASE_DIR)}",
                    "text": text,
                    "source": str(path.relative_to(BASE_DIR)),
                }
            )
    return docs


def _build_index_if_needed():
    global _initialized
    if _initialized:
        return

    _, collection = _get_client_and_collection()
    embed_fn = _get_embedding_function()

    # If collection already has data, assume indexed
    if collection.count() > 0:
        _initialized = True
        return

    docs = _load_documents()
    if not docs:
        _initialized = True
        return

    texts = [d["text"] for d in docs]
    ids = [d["id"] for d in docs]
    metadatas = [{"source": d["source"]} for d in docs]

    embeddings = embed_fn(texts)

    collection.add(
        ids=ids,
        documents=texts,
        metadatas=metadatas,
        embeddings=embeddings,
    )

    _initialized = True


async def query_knowledge(question: str, n_results: int = 3) -> Dict[str, Any]:
    """
    Retrieve relevant documents and ask the LLM to answer using them.
    """
    _build_index_if_needed()
    _, collection = _get_client_and_collection()
    embed_fn = _get_embedding_function()

    # If no docs indexed, just fallback to normal chat
    if collection.count() == 0:
        messages = [
            {
                "role": "system",
                "content": "You are an internal assistant helping developers in a military unit. Be concise and practical.",
            },
            {"role": "user", "content": question},
        ]
        answer = await llm_chat(messages)
        return {"answer": answer, "sources": []}

    query_embedding = embed_fn([question])

    result = collection.query(
        query_embeddings=query_embedding,
        n_results=n_results,
    )

    docs = result.get("documents", [[]])[0]
    metas = result.get("metadatas", [[]])[0]

    sources = [m.get("source", "unknown") for m in metas]
    context = "\n\n---\n\n".join(docs)

    messages = [
        {
            "role": "system",
            "content": (
                "You are an internal assistant helping developers in a military unit.\n"
                "Use the following knowledge base context to answer the user's question.\n"
                "If the answer cannot be found in the context, say so clearly.\n\n"
                f"CONTEXT:\n{context}"
            ),
        },
        {"role": "user", "content": question},
    ]

    answer = await llm_chat(messages)
    return {"answer": answer, "sources": sources}
