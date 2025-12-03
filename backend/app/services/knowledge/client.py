from typing import Optional

import chromadb
from chromadb.config import Settings

from .config import CHROMA_DIR

_client: Optional[chromadb.Client] = None
_collection: Optional[chromadb.Collection] = None


def get_collection() -> chromadb.Collection:
    """
    Return the singleton Chroma collection for DevCell knowledge.
    """
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
