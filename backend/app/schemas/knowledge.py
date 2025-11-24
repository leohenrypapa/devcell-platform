from typing import List, Optional
from pydantic import BaseModel


class KnowledgeDocument(BaseModel):
    id: str
    title: str
    path: Optional[str] = None
    content_preview: str


class KnowledgeSourceChunk(BaseModel):
    document_id: str
    title: str
    snippet: str
    score: float


class KnowledgeQueryRequest(BaseModel):
    query: str
    top_k: int = 4


class KnowledgeQueryResponse(BaseModel):
    answer: str
    sources: List[KnowledgeSourceChunk]


class AddTextRequest(BaseModel):
    title: str
    text: str
