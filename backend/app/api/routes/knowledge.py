from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from app.services.rag import query_knowledge

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


class KnowledgeQuery(BaseModel):
    question: str


class KnowledgeAnswer(BaseModel):
    answer: str
    sources: List[str]


@router.get("/status")
def status():
    return {"detail": "Knowledge service is available. Use POST /query to ask questions."}


@router.post("/query", response_model=KnowledgeAnswer)
async def query(payload: KnowledgeQuery):
    result = await query_knowledge(payload.question)
    return KnowledgeAnswer(answer=result["answer"], sources=result["sources"])
