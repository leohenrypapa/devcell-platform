# backend/app/api/routes/training.py

from __future__ import annotations

from datetime import date, timedelta   # 👈 add this
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.training import (
    MalwareTrainingWeek,
    MalwareTrainingSyllabus,
    SeedTasksRequest,
)
from app.schemas.task import TaskCreate, TaskList
from app.schemas.user import UserPublic
from app.services.auth_service import get_current_user
from app.services.task_store import add_task
from app.services.training.malware_seed_tasks import (
    MALWARE_TRAINING_SYLLABUS,
    generate_seed_tasks_for_week,
)

router = APIRouter(prefix="/training", tags=["training"])


@router.get(
    "/malware/syllabus",
    response_model=MalwareTrainingSyllabus,
)
def get_malware_syllabus(
    _: UserPublic = Depends(get_current_user),
) -> MalwareTrainingSyllabus:
    """
    Return the 24-week malware developer syllabus (high-level),
    gated behind auth but not role-specific.
    """
    # Pydantic will coerce dicts or models into MalwareTrainingWeek
    weeks: List[MalwareTrainingWeek] = list(MALWARE_TRAINING_SYLLABUS)
    return MalwareTrainingSyllabus(track="malware_dev_basic", weeks=weeks)


@router.post(
    "/malware/seed_tasks",
    response_model=TaskList,
    status_code=status.HTTP_201_CREATED,
)
async def create_malware_seed_tasks(
    payload: SeedTasksRequest,
    current_user: UserPublic = Depends(get_current_user),
) -> TaskList:
    """
    Generate benign lab-only seed tasks for a given week and persist them
    into the existing /api/tasks store as tasks owned by the current user.
    """
    max_week = max((w.week for w in MALWARE_TRAINING_SYLLABUS), default=0)
    if payload.week < 1 or payload.week > max_week:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Week must be between 1 and {max_week}.",
        )

    if payload.task_count < 1 or payload.task_count > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="task_count must be between 1 and 10.",
        )

    drafts = await generate_seed_tasks_for_week(
        week=payload.week,
        task_count=payload.task_count,
    )

    created = []
    for d in drafts:
        task_payload = TaskCreate(
            title=d.title,
            description=d.description,
            status="todo",
            project_id=None,
            progress=0,
            due_date=(  # ISO date string from today + offset
                (date.today() + timedelta(days=d.due_in_days)).isoformat()
                if d.due_in_days
                else None
            ),
            is_active=True,
            origin_standup_id=None,
        )
        created.append(add_task(current_user.username, task_payload))

    return TaskList(items=created)
