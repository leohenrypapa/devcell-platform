# backend/app/services/project_permissions.py

from typing import Optional

from fastapi import HTTPException, status

from app.schemas.user import UserPublic
from app.services.projects import get_project_by_id
from app.services.projects.members import get_user_role_for_project


def _ensure_project_exists(project_id: int):
    """
    Load a project by id or raise 404.
    """
    project = get_project_by_id(project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project


def _is_admin(user: UserPublic) -> bool:
    return getattr(user, "role", None) == "admin"


def _get_membership_role(project_id: int, username: str) -> Optional[str]:
    return get_user_role_for_project(project_id, username)


def require_project_view(project_id: int, user: UserPublic):
    """
    Ensure that the given user is allowed to *view* the project.

    Allowed if:
    - user is admin, OR
    - user is the canonical project.owner, OR
    - user has any membership (owner/member/viewer) for this project.
    """
    project = _ensure_project_exists(project_id)

    if _is_admin(user):
        return project

    if user.username == getattr(project, "owner", None):
        return project

    role = _get_membership_role(project_id, user.username)
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to view this project",
        )

    return project


def require_project_membership(project_id: int, user: UserPublic):
    """
    Ensure that the user is at least a member of the project (any role).

    Allowed if:
    - user is admin, OR
    - user is the canonical project.owner, OR
    - user has any membership row for this project.
    """
    project = _ensure_project_exists(project_id)

    if _is_admin(user):
        return project

    if user.username == getattr(project, "owner", None):
        return project

    role = _get_membership_role(project_id, user.username)
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this project",
        )

    return project


def require_project_edit(project_id: int, user: UserPublic):
    """
    Ensure that the user can *modify* project-scoped content (e.g., tasks).

    Allowed if:
    - user is admin, OR
    - user is the canonical project.owner, OR
    - user has role in ('owner', 'member') on this project.

    NOTE: 'viewer' is not sufficient for edits.
    """
    project = _ensure_project_exists(project_id)

    if _is_admin(user):
        return project

    if user.username == getattr(project, "owner", None):
        return project

    role = _get_membership_role(project_id, user.username)
    if role not in ("owner", "member"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to modify project-scoped content",
        )

    return project


def require_project_owner(project_id: int, user: UserPublic):
    """
    Ensure that the user is the effective project owner.

    Allowed if:
    - user is admin, OR
    - user.username == project.owner
    """
    project = _ensure_project_exists(project_id)

    if _is_admin(user):
        return project

    if user.username != getattr(project, "owner", None):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to manage this project; owner or admin required",
        )

    return project
