from datetime import date as date_cls
from typing import List

from fastapi import HTTPException, status

from app.schemas.standup import StandupEntry
from app.schemas.task import TaskCreate, TaskEntry
from app.schemas.user import UserPublic
from app.services.standup_store import get_standup_by_id
from app.services.task_store import add_task


def convert_standup_to_tasks(
    standup_id: int,
    items,
    current_user: UserPublic,
) -> List[TaskEntry]:
    """
    Convert a standup entry into one or more tasks.

    Permissions:
    - Admins may convert any standup.
    - Non-admins may only convert their own standups.
    """
    entry: StandupEntry | None = get_standup_by_id(standup_id)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Standup not found",
        )

    if current_user.role != "admin" and current_user.username != entry.name:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to convert this standup into tasks.",
        )

    if not items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No conversion items provided.",
        )

    created_tasks: List[TaskEntry] = []

    for item in items:
        if not item.create:
            continue

        text = (item.text or "").strip()
        if not text:
            continue

        title = (item.title or "").strip()
        if not title:
            title = text[:117] + "..." if len(text) > 120 else text

        status_value = item.status or (
            "blocked" if item.section == "blockers" else "todo"
        )

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

    return created_tasks
