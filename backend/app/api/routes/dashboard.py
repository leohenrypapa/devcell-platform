from fastapi import APIRouter
from app.schemas.dashboard import DashboardSummary
from app.services.dashboard_service import summarize_dashboard

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/status")
def status():
    return {"detail": "Dashboard service is available."}


@router.get("/summary", response_model=DashboardSummary)
async def get_summary():
    summary, standup_count, project_count, knowledge_docs = await summarize_dashboard()
    return DashboardSummary(
        summary=summary,
        standup_count=standup_count,
        project_count=project_count,
        knowledge_docs=knowledge_docs,
    )
