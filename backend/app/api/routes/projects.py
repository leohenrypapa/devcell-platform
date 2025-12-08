# backend/app/api/routes/projects.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.schemas.project import (
    Project,
    ProjectList,
    ProjectCreate,
    ProjectUpdate,
    ProjectMember,
    ProjectMemberList,
    ProjectMemberCreate,
)
from app.services.projects import (
    add_project,
    list_projects,
    get_project_by_id,
    delete_project,
    update_project,
)
from app.services.projects.members import (
    add_project_member,
    list_project_members,
    remove_project_member,
    list_projects_for_user,
    get_user_role_for_project,
)
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
    """
    List all projects (no filtering).

    This is mainly for admin / global views.
    For per-user views, use /projects/mine.
    """
    items = list_projects()
    return ProjectList(items=items)


@router.get("/mine", response_model=ProjectList)
def get_my_projects(current_user: UserPublic = Depends(get_current_user)):
    """
    List projects for the current user.

    Includes projects where:
    - the user is the project.owner, OR
    - the user is present in project_members with any role.
    """
    items = list_projects_for_user(current_user.username)
    return ProjectList(items=items)


@router.post("", response_model=Project)
def create_project(
    payload: ProjectCreate,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Create a project. Owner is always the authenticated user.

    Additionally, a project_members row is created with role='owner'
    so that project-level permissions have a consistent source of truth.
    """
    payload.owner = current_user.username
    project = add_project(payload)

    # Ensure membership row for the owner
    add_project_member(
        project_id=project.id,
        username=current_user.username,
        role="owner",
    )

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


@router.get("/{project_id}/members", response_model=ProjectMemberList)
def get_project_members(
    project_id: int,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    List members for a project.

    Allowed if:
    - current user is admin, OR
    - current user is project.owner, OR
    - current user has any membership row on this project.
    """
    project = get_project_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    role = get_user_role_for_project(project_id, current_user.username)

    if (
        current_user.role != "admin"
        and current_user.username != project.owner
        and role is None
    ):
        raise HTTPException(
            status_code=403,
            detail="Not allowed to view members for this project",
        )

    items = list_project_members(project_id)
    return ProjectMemberList(items=items)


@router.post("/{project_id}/members", response_model=ProjectMember)
def add_project_member_route(
    project_id: int,
    payload: ProjectMemberCreate,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Add or update a member for a project.

    Allowed if:
    - current user is admin, OR
    - current user is project.owner
    """
    project = get_project_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.role != "admin" and current_user.username != project.owner:
        raise HTTPException(
            status_code=403,
            detail="Not allowed to modify members for this project",
        )

    member = add_project_member(
        project_id=project_id,
        username=payload.username,
        role=payload.role,
    )
    return member


@router.delete("/{project_id}/members/{username}", status_code=204)
def remove_project_member_route(
    project_id: int,
    username: str,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Remove a member from a project.

    Allowed if:
    - current user is admin, OR
    - current user is project.owner
    """
    project = get_project_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.role != "admin" and current_user.username != project.owner:
        raise HTTPException(
            status_code=403,
            detail="Not allowed to modify members for this project",
        )

    remove_project_member(project_id, username)
    return


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
