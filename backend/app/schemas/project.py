# backend/app/schemas/project.py

from pydantic import BaseModel
from datetime import datetime
from typing import List, Literal, Optional


ProjectStatus = Literal["planned", "active", "blocked", "done"]

# NEW: project-level roles
ProjectRole = Literal["owner", "member", "viewer"]


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


# NEW: membership shapes ------------------------------------------------------


class ProjectMember(BaseModel):
    project_id: int
    username: str
    role: ProjectRole
    created_at: datetime


class ProjectMemberList(BaseModel):
    items: List[ProjectMember]


class ProjectMemberCreate(BaseModel):
    """
    Payload for adding/upserting a member to a project.
    If the (project_id, username) pair already exists, the role will be updated.
    """

    username: str
    role: ProjectRole = "member"
