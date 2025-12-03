from __future__ import annotations

from datetime import datetime, date
from typing import List, Optional, Literal

from pydantic import BaseModel, Field


TaskStatus = Literal["todo", "in_progress", "done", "blocked"]


class TaskBase(BaseModel):
    title: str
    description: str = ""
    status: TaskStatus = "todo"
    project_id: Optional[int] = None
    progress: int = Field(0, ge=0, le=100)
    due_date: Optional[date] = None
    is_active: bool = True


class TaskCreate(TaskBase):
    """
    Task creation payload. The owner is taken from the authenticated user
    on the backend and not supplied by the client.

    `origin_standup_id` is an optional link back to the standup entry
    that this task was created from (if any).
    """
    origin_standup_id: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    project_id: Optional[int] = None
    progress: Optional[int] = Field(None, ge=0, le=100)
    due_date: Optional[date] = None
    is_active: Optional[bool] = None


class TaskEntry(TaskBase):
    id: int
    owner: str
    origin_standup_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    project_name: Optional[str] = None


class TaskList(BaseModel):
    items: List[TaskEntry]
