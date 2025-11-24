from pydantic import BaseModel
from typing import Optional


class CodeReviewRequest(BaseModel):
    code: str
    description: Optional[str] = None
    language: Optional[str] = None
    focus: Optional[str] = None  # e.g., "general", "security", "performance", etc.


class CodeReviewResponse(BaseModel):
    review: str
