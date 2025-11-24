from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class UserBase(BaseModel):
    username: str
    role: str


class UserPublic(UserBase):
    id: int
    created_at: datetime


class UserCreate(BaseModel):
    username: str
    password: str
    role: Optional[str] = None  # only used for first user (admin)


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic

class UserList(BaseModel):
    items: List[UserPublic]