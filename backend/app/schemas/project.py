from pydantic import BaseModel
from datetime import datetime
from typing import List, Literal, Optional


ProjectStatus = Literal["planned", "active", "blocked", "done"]


class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    owner: str = ""
    status: ProjectStatus = "planned"


class Project(BaseModel):
    id: int
    name: str
    description: str
    owner: str
    status: ProjectStatus
    created_at: datetime


class ProjectList(BaseModel):
    items: List[Project]


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
