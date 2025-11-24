from fastapi import APIRouter
from app.schemas.review import CodeReviewRequest, CodeReviewResponse
from app.services.review_service import generate_code_review

router = APIRouter(prefix="/review", tags=["review"])


@router.get("/status")
def status():
    return {"detail": "Code review service is available."}


@router.post("", response_model=CodeReviewResponse)
async def review_code(payload: CodeReviewRequest):
    """
    Perform an AI-assisted code review of the provided code or diff.
    """
    review_text = await generate_code_review(payload)
    return CodeReviewResponse(review=review_text)
