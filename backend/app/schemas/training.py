# backend/app/schemas/training.py

from __future__ import annotations

from typing import List
from pydantic import BaseModel


class MalwareTrainingWeek(BaseModel):
    week: int
    title: str
    focus: str
    objectives: List[str]
    labs: List[str]


class MalwareTrainingSyllabus(BaseModel):
    track: str
    weeks: List[MalwareTrainingWeek]


class SeedTasksRequest(BaseModel):
    week: int
    task_count: int = 4  # default seed tasks per week
