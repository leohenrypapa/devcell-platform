from datetime import date as date_cls
from typing import List, Optional, Literal

from fastapi import APIRouter, HTTPException, Query, Depends, status
from pydantic import BaseModel, Field

from app.schemas.standup import StandupCreate, StandupEntry, StandupList, StandupUpdate
from app.schemas.task import TaskCreate, TaskEntry, TaskList
from app.services.standup_store import (
    add_standup,
    get_today_standups,
    get_standups_for_date,
    get_standup_by_id,
    delete_standup,
)
from app.services.standup_summary import (
    summarize_today_standups,
    summarize_standups_for_date,
)
from app.services.task_store import list_tasks_for_standup, add_task
from app.services.auth_service import get_current_user
from app.schemas.user import UserPublic

router = APIRouter(prefix="/standup", tags=["standup"])


class StandupSummary(BaseModel):
    summary: str
    count: int


class StandupTaskConversionItem(BaseModel):
    section: Literal["yesterday", "today", "blockers"]
    text: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    create: bool = True
    project_id: Optional[int] = None
    due_date: Optional[date_cls] = None
    status: Optional[str] = "todo"
    progress: Optional[int] = Field(0, ge=0, le=100)


class StandupTaskConversionRequest(BaseModel):
    items: List[StandupTaskConversionItem]


@router.get("/status")
def standup_status():
    """
    Lightweight health/status endpoint for the standup service.
    """
    return {"detail": "Standup service is available."}


@router.post("", response_model=StandupEntry)
def submit_standup(
    payload: StandupCreate,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Submit a standup entry for today.
    Name is always taken from the authenticated user.
    """
    payload.name = current_user.username
    entry = add_standup(payload)
    return entry


@router.get("/today", response_model=StandupList)
def list_today():
    """
    Get all standup entries for today.
    """
    items = get_today_standups()
    return StandupList(items=items)


@router.get("/by-date", response_model=StandupList)
def list_by_date(date: str = Query(..., description="Date in YYYY-MM-DD format")):
    """
    Get all standup entries for a specific date (YYYY-MM-DD).
    """
    try:
        target = date_cls.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    items = get_standups_for_date(target)
    return StandupList(items=items)


@router.get("/summary", response_model=StandupSummary)
async def standup_summary(
    date: str | None = Query(
        None,
        description="Optional date in YYYY-MM-DD format. If omitted, summarize today.",
    )
):
    """
    Generate an AI-powered summary of standups for today or a specific date.
    """
    if date is None:
        summary, count = await summarize_today_standups()
    else:
        try:
            target_date = date_cls.fromisoformat(date)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid date format. Use YYYY-MM-DD.",
            )
        summary, count = await summarize_standups_for_date(target_date)

    return StandupSummary(summary=summary, count=count)


@router.delete("/{standup_id}", status_code=204)
def remove_standup(
    standup_id: int,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Delete a standup entry.
    Allowed if:
    - current user is admin, or
    - current user name matches standup.name
    """
    entry = get_standup_by_id(standup_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Standup not found")

    if current_user.role != "admin" and current_user.username != entry.name:
        raise HTTPException(
            status_code=403,
            detail="Not allowed to delete this standup",
        )

    delete_standup(standup_id)
    return


@router.put("/{standup_id}", response_model=StandupEntry)
def edit_standup(
    standup_id: int,
    payload: StandupUpdate,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Edit a standup entry.
    Allowed if:
    - current user is admin, or
    - current user name matches standup.name
    """
    entry = get_standup_by_id(standup_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Standup not found")

    if current_user.role != "admin" and current_user.username != entry.name:
        raise HTTPException(
            status_code=403,
            detail="Not allowed to edit this standup",
        )

    from app.services.standup_store import update_standup

    updated = update_standup(standup_id, payload)
    if updated is None:
        raise HTTPException(status_code=500, detail="Failed to update standup")

    return updated


@router.get("", response_model=StandupList)
def list_standups(
    date: str = Query(..., description="Date in YYYY-MM-DD"),
    mine: bool = Query(
        False,
        description="If true, only return standups authored by the current user",
    ),
    current_user: UserPublic = Depends(get_current_user),
):
    """
    List standup entries for a specific date.

    - `date` (required): which day to load
    - `mine`: if true, only return entries where entry.name == current_user.username
    """
    try:
        target_date = date_cls.fromisoformat(date)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD.",
        )

    items = get_standups_for_date(target_date)
    if mine:
        items = [s for s in items if s.name == current_user.username]

    return StandupList(items=items)


@router.get("/{standup_id}/tasks", response_model=TaskList)
def get_tasks_for_standup(
    standup_id: int,
    current_user: UserPublic = Depends(get_current_user),
) -> TaskList:
    """
    List tasks that were created from a specific standup.

    Non-admin users only see their own tasks; admins can see all tasks
    linked to this standup.
    """
    entry = get_standup_by_id(standup_id)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Standup not found")

    tasks = list_tasks_for_standup(standup_id)
    if current_user.role != "admin":
        tasks = [t for t in tasks if t.owner == current_user.username]

    return TaskList(items=tasks)


@router.post(
    "/{standup_id}/convert",
    response_model=TaskList,
    status_code=status.HTTP_201_CREATED,
)
def convert_standup_to_tasks(
    standup_id: int,
    payload: StandupTaskConversionRequest,
    current_user: UserPublic = Depends(get_current_user),
) -> TaskList:
    """
    Convert a standup entry into one or more tasks, using a structured payload.

    Permissions:
    - Admins may convert any standup.
    - Non-admins may only convert their own standups.
    """
    entry = get_standup_by_id(standup_id)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Standup not found")

    if current_user.role != "admin" and current_user.username != entry.name:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to convert this standup into tasks.",
        )

    if not payload.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No conversion items provided.",
        )

    created_tasks: List[TaskEntry] = []

    for item in payload.items:
        if not item.create:
            continue

        text = (item.text or "").strip()
        if not text:
            continue

        title = (item.title or "").strip()
        if not title:
            # Fallback: derive from text
            title = text[:117] + "..." if len(text) > 120 else text

        # Default status: blockers -> blocked, other sections -> todo
        status_value = item.status or ("blocked" if item.section == "blockers" else "todo")

        project_id = item.project_id if item.project_id is not None else entry.project_id

        task_data = TaskCreate(
            title=title,
            description=text,
            status=status_value,  # type: ignore[arg-type]
            project_id=project_id,
            progress=item.progress if item.progress is not None else 0,
            due_date=item.due_date,
            is_active=True,
            origin_standup_id=standup_id,
        )

        created = add_task(current_user.username, task_data)
        created_tasks.append(created)

    if not created_tasks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No tasks were created (all items were disabled or empty).",
        )

    return TaskList(items=created_tasks)
