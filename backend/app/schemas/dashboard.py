from pydantic import BaseModel


class DashboardSummary(BaseModel):
    summary: str
    standup_count: int
    project_count: int
    knowledge_docs: int
