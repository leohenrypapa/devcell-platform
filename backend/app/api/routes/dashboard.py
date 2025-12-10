# filename: backend/app/api/routes/dashboard.py
from fastapi import APIRouter, Query, Depends

from app.schemas.dashboard import DashboardSummary
from app.schemas.user import UserPublic
from app.services.auth_service import get_current_user
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
  current_user: UserPublic = Depends(get_current_user),
):
  """
  High-level summary of today's activity (standups, projects, knowledgebase).

  Permission model:
  - Normal users: dashboard considers only projects they can see (membership).
  - Admins: dashboard may consider all projects.

  - When use_rag = false (default): use the original summary prompt only.
  - When use_rag = true: call the unified chat/RAG pipeline to optionally
    pull in KB context as well.
  """
  summary, standup_count, project_count, knowledge_docs = await summarize_dashboard(
    current_user=current_user,
    use_rag=use_rag,
  )
  return DashboardSummary(
    summary=summary,
    standup_count=standup_count,
    project_count=project_count,
    knowledge_docs=knowledge_docs,
  )
