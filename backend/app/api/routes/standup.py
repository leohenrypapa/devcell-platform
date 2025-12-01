from datetime import date as date_cls
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel

from app.schemas.standup import StandupCreate, StandupEntry, StandupList, StandupUpdate
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
from app.services.auth_service import get_current_user
from app.schemas.user import UserPublic

router = APIRouter(prefix="/standup", tags=["standup"])


class StandupSummary(BaseModel):
    summary: str
    count: int


@router.get("/status")
def status():
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
