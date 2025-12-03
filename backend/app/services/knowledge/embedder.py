import os
from functools import lru_cache

from sentence_transformers import SentenceTransformer


EMBED_MODEL_NAME = os.getenv(
    "KNOWLEDGE_EMBED_MODEL",
    "sentence-transformers/all-MiniLM-L6-v2",
)


@lru_cache(maxsize=1)
def get_embedder() -> SentenceTransformer:
    """
    Lazily load and cache the embedding model.

    Using lru_cache avoids global mutable state and ensures the model
    is only instantiated once per process.
    """
    return SentenceTransformer(EMBED_MODEL_NAME)
