from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class StandupCreate(BaseModel):
    name: str
    yesterday: str
    today: str
    blockers: str = ""
    project_id: Optional[int] = None  # optional link to a project


class StandupEntry(BaseModel):
    id: int
    name: str
    yesterday: str
    today: str
    blockers: str
    created_at: datetime
    project_id: Optional[int] = None
    project_name: Optional[str] = None


class StandupList(BaseModel):
    items: List[StandupEntry]


class StandupUpdate(BaseModel):
    yesterday: Optional[str] = None
    today: Optional[str] = None
    blockers: Optional[str] = None
    project_id: Optional[int] = None
