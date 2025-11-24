from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.schemas.project import Project, ProjectList, ProjectCreate, ProjectUpdate
from app.services.project_store import add_project, list_projects, get_project_by_id, delete_project, update_project
from app.services.project_summary import summarize_project_today
from app.services.auth_service import get_current_user
from app.schemas.user import UserPublic

router = APIRouter(prefix="/projects", tags=["projects"])


class ProjectSummary(BaseModel):
    project_id: int
    project_name: str
    summary: str
    count: int


@router.get("/status")
def status():
    return {"detail": "Projects service is available."}


@router.get("", response_model=ProjectList)
def get_projects():
    items = list_projects()
    return ProjectList(items=items)


@router.post("", response_model=Project)
def create_project(
    payload: ProjectCreate,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Create a project. Owner is always the authenticated user.
    """
    payload.owner = current_user.username
    project = add_project(payload)
    return project




@router.get("/{project_id}/summary", response_model=ProjectSummary)
async def project_summary(project_id: int):
    proj = get_project_by_id(project_id)
    if proj is None:
        raise HTTPException(status_code=404, detail="Project not found")

    summary, count, project_name = await summarize_project_today(project_id)
    return ProjectSummary(
        project_id=project_id,
        project_name=project_name,
        summary=summary,
        count=count,
    )


@router.delete("/{project_id}", status_code=204)
def remove_project(
    project_id: int,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Delete a project.
    Allowed if:
    - current user is admin, or
    - current user username matches project.owner
    """
    project = get_project_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.role != "admin" and current_user.username != project.owner:
        raise HTTPException(
            status_code=403,
            detail="Not allowed to delete this project",
        )

    delete_project(project_id)
    return


@router.put("/{project_id}", response_model=Project)
def edit_project(
    project_id: int,
    payload: ProjectUpdate,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Edit a project.
    Allowed if:
    - current user is admin, or
    - current user username matches project.owner
    """
    project = get_project_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.role != "admin" and current_user.username != project.owner:
        raise HTTPException(
            status_code=403,
            detail="Not allowed to edit this project",
        )

    updated = update_project(project_id, payload)
    if updated is None:
        raise HTTPException(status_code=500, detail="Failed to update project")

    return updated
