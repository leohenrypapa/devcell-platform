from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.schemas.task import TaskCreate, TaskEntry, TaskList, TaskUpdate
from app.schemas.user import UserPublic
from app.services.auth_service import get_current_user
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
    owner: Optional[str] = Query(None, description="Explicit owner username (admin-only)"),
    project_id: Optional[int] = Query(None, description="Filter by project_id"),
    status: Optional[str] = Query(None, description="Filter by status"),
    active_only: bool = Query(True, description="If true, only active tasks"),
    current_user: UserPublic = Depends(get_current_user),
) -> TaskList:
    """
    List tasks. By default, returns all active tasks.

    - If `mine` is true, owner is forced to the current user.
    - If `owner` is provided, only admins may use it to query other users.
    """
    effective_owner: Optional[str] = None

    if mine:
        effective_owner = current_user.username
    elif owner is not None:
        if current_user.role != "admin" and owner != current_user.username:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not allowed to list tasks for other users.",
            )
        effective_owner = owner

    items = list_tasks(
        owner=effective_owner,
        project_id=project_id,
        status=status,
        active_only=active_only,
    )
    return TaskList(items=items)


@router.post("", response_model=TaskEntry, status_code=status.HTTP_201_CREATED)
def create_task_endpoint(
    payload: TaskCreate,
    current_user: UserPublic = Depends(get_current_user),
) -> TaskEntry:
    """
    Create a task owned by the current user.
    """
    return add_task(current_user.username, payload)


@router.put("/{task_id}", response_model=TaskEntry)
def update_task_endpoint(
    task_id: int,
    payload: TaskUpdate,
    current_user: UserPublic = Depends(get_current_user),
) -> TaskEntry:
    """
    Update a task. Allowed if the current user is the owner or an admin.
    """
    existing = get_task_by_id(task_id)
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if current_user.role != "admin" and existing.owner != current_user.username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to update this task.",
        )

    updated = update_task(task_id, payload)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update task")

    return updated


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task_endpoint(
    task_id: int,
    current_user: UserPublic = Depends(get_current_user),
) -> None:
    """
    Delete a task. Allowed if the current user is the owner or an admin.
    """
    existing = get_task_by_id(task_id)
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if current_user.role != "admin" and existing.owner != current_user.username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to delete this task.",
        )

    delete_task(task_id)
    return None
