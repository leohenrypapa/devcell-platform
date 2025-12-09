# filename: backend/app/api/routes/dashboard.py
from fastapi import APIRouter, Query

from app.schemas.dashboard import DashboardSummary
from app.services.dashboard_service import summarize_dashboard

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/status")
def status():
  return {"detail": "Dashboard service is available."}


@router.get("/summary", response_model=DashboardSummary)
async def get_summary(
  use_rag: bool = Query(
    False,
    description="If true, enrich the dashboard summary using Knowledgebase (RAG).",
  ),
):
  """
  High-level summary of today's activity (standups, projects, knowledgebase).

  - When use_rag = false (default): use the original summary prompt only.
  - When use_rag = true: call the unified chat/RAG pipeline to optionally
    pull in KB context as well.
  """
  summary, standup_count, project_count, knowledge_docs = await summarize_dashboard(
    use_rag=use_rag
  )
  return DashboardSummary(
    summary=summary,
    standup_count=standup_count,
    project_count=project_count,
    knowledge_docs=knowledge_docs,
  )
