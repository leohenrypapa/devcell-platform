# backend/app/api/routes/tasks.py

from __future__ import annotations

from datetime import date
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.schemas.task import (
    TaskBulkUpdateRequest,
    TaskCreate,
    TaskEntry,
    TaskList,
    TaskUpdate,
)
from app.schemas.user import UserPublic
from app.services.auth_service import get_current_user
from app.services.project_permissions import (
    require_project_view,
    require_project_edit,
)
from app.services.task_store import (
    add_task,
    get_task_by_id,
    list_tasks,
    update_task,
    delete_task,
)

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=TaskList)
def list_tasks_endpoint(
    mine: bool = Query(False, description="If true, limit to current user's tasks"),
    owner: Optional[str] = Query(
        None,
        description="Explicit owner username; only admins may query other users.",
    ),
    project_id: Optional[int] = Query(None, description="Filter by project_id"),
    status: Optional[str] = Query(None, description="Filter by status"),
    # New, normalized filters
    search: Optional[str] = Query(
        None,
        description="Full-text search over title/description",
    ),
    start_date: Optional[date] = Query(
        None,
        description="Filter tasks with created_at on/after this date (YYYY-MM-DD)",
    ),
    end_date: Optional[date] = Query(
        None,
        description="Filter tasks with created_at on/before this date (YYYY-MM-DD)",
    ),
    is_active: Optional[bool] = Query(
        True,
        description="If true, only active tasks; if false, include archived",
    ),
    # Backwards-compat shim for legacy clients using ?active_only=
    active_only: Optional[bool] = Query(
        None,
        include_in_schema=False,
        description="Deprecated; use is_active instead.",
    ),
    current_user: UserPublic = Depends(get_current_user),
) -> TaskList:
    """
    List tasks.

    Semantics:

    - For non-admin users:
      - If `mine` is true, only their own tasks are returned.
      - If `owner` is provided and is not themselves, 403.
      - If neither `mine` nor `owner` is provided, default to their own tasks.
      - If `project_id` is provided, they must be able to *view* that project.

    - For admins:
      - If `mine` is true, only their tasks are returned.
      - If `owner` is provided, that user's tasks are returned.
      - If neither is provided, all tasks are returned.
      - Admins may query any `project_id`.
    """
    effective_owner: Optional[str] = None
    is_admin = current_user.role == "admin"

    if mine:
        # Always force to current user when mine=true
        effective_owner = current_user.username
    elif owner is not None:
        # Owner explicitly requested
        if not is_admin and owner != current_user.username:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not allowed to list tasks for other users.",
            )
        effective_owner = owner
    else:
        # No mine/owner hints:
        #  - non-admins see only their own tasks
        #  - admins see all tasks
        if not is_admin:
            effective_owner = current_user.username
        else:
            effective_owner = None  # all owners

    # Project-scoped queries must respect project membership.
    if project_id is not None:
        require_project_view(project_id, current_user)

    # Normalize active-only semantics:
    # - is_active takes precedence if provided
    # - active_only is a deprecated alias for legacy callers
    if is_active is not None:
        effective_active_only = is_active
    elif active_only is not None:
        effective_active_only = active_only
    else:
        effective_active_only = True

    items = list_tasks(
        owner=effective_owner,
        project_id=project_id,
        status=status,
        active_only=effective_active_only,
        origin_standup_id=None,
        search=search,
        start_date=start_date,
        end_date=end_date,
    )
    return TaskList(items=items)


@router.get("/{task_id}", response_model=TaskEntry)
def get_task_endpoint(
    task_id: int,
    current_user: UserPublic = Depends(get_current_user),
) -> TaskEntry:
    """
    Retrieve a single task, enforcing project-scoped permissions.

    - Personal tasks (no project_id): only owner or admin may view.
    - Project tasks: require project view permission.
    """
    task = get_task_by_id(task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    is_admin = current_user.role == "admin"

    if task.project_id is not None:
        require_project_view(task.project_id, current_user)
    else:
        if not is_admin and task.owner != current_user.username:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not allowed to view this task.",
            )

    return task


@router.post("", response_model=TaskEntry, status_code=status.HTTP_201_CREATED)
def create_task_endpoint(
    payload: TaskCreate,
    current_user: UserPublic = Depends(get_current_user),
) -> TaskEntry:
    """
    Create a task owned by the current user.

    If a project_id is provided, the user must be allowed to *edit* that project
    (owner/member or admin).
    """
    if payload.project_id is not None:
        require_project_edit(payload.project_id, current_user)

    return add_task(current_user.username, payload)


@router.put("/{task_id}", response_model=TaskEntry)
def update_task_endpoint(
    task_id: int,
    payload: TaskUpdate,
    current_user: UserPublic = Depends(get_current_user),
) -> TaskEntry:
    """
    Update a task.

    Allowed if:
    - current user is the task owner (for personal tasks), OR
    - current user is admin, OR
    - current user has project edit permission for project-scoped tasks.

    Additionally, for project-scoped tasks:
    - the user must be allowed to *edit* the existing project, and
    - if changing project_id, must also be allowed to *edit* the target project.
    """
    existing = get_task_by_id(task_id)
    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    is_admin = current_user.role == "admin"

    # Enforce project-level permissions for project-scoped tasks, or
    # personal-task ownership/admin.
    if existing.project_id is not None:
        # Must be able to edit the existing project
        require_project_edit(existing.project_id, current_user)
    else:
        # Personal task: only owner or admin
        if not is_admin and existing.owner != current_user.username:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not allowed to update this task.",
            )

    # Determine the resulting project_id after this update.
    if payload.project_id is not None:
        new_project_id = payload.project_id
    else:
        new_project_id = existing.project_id

    # If moving into a different project, enforce permission there as well.
    if new_project_id is not None and new_project_id != existing.project_id:
        require_project_edit(new_project_id, current_user)

    updated = update_task(task_id, payload)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update task",
        )

    return updated


@router.patch("/{task_id}", response_model=TaskEntry)
def patch_task_endpoint(
    task_id: int,
    payload: TaskUpdate,
    current_user: UserPublic = Depends(get_current_user),
) -> TaskEntry:
    """
    PATCH variant of task update, for API compatibility with docs.

    Delegates to the same logic as PUT /tasks/{task_id}.
    """
    return update_task_endpoint(task_id=task_id, payload=payload, current_user=current_user)


@router.delete("/{task_id}", response_model=dict, status_code=status.HTTP_200_OK)
def delete_task_endpoint(
    task_id: int,
    current_user: UserPublic = Depends(get_current_user),
) -> dict:
    """
    Archive (soft-delete) a task.

    Allowed if:
    - current user is the task owner (for personal tasks), OR
    - current user is admin, OR
    - current user has project edit permission.

    Behavior:
    - Sets is_active = false
    - Does NOT remove from DB
    """
    existing = get_task_by_id(task_id)
    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    is_admin = current_user.role == "admin"

    if existing.project_id is not None:
        require_project_edit(existing.project_id, current_user)
    else:
        if not is_admin and existing.owner != current_user.username:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not allowed to delete this task.",
            )

    # Soft-delete by marking inactive
    updated = update_task(task_id, TaskUpdate(is_active=False))
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to archive task",
        )

    return {"success": True}


@router.post("/bulk_update", response_model=dict)
def bulk_update_tasks_endpoint(
    payload: TaskBulkUpdateRequest,
    current_user: UserPublic = Depends(get_current_user),
) -> dict:
    """
    Bulk update multiple tasks with a single TaskUpdate payload.

    - Only tasks the user can edit are modified.
    - Tasks the user cannot edit are silently skipped.
    """
    is_admin = current_user.role == "admin"
    updated_count = 0

    for task_id in payload.task_ids:
        existing = get_task_by_id(task_id)
        if existing is None:
            continue

        # Permission checks per task
        try:
            if existing.project_id is not None:
                # Project-scoped task: must be able to edit the project
                require_project_edit(existing.project_id, current_user)
            else:
                # Personal task: only owner or admin
                if not is_admin and existing.owner != current_user.username:
                    continue
        except HTTPException:
            # Not allowed to edit this task; skip silently
            continue

        updated = update_task(task_id, payload.update)
        if updated is not None:
            updated_count += 1

    return {"updated": updated_count}
