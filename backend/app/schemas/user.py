from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Core user shapes
# ---------------------------------------------------------------------------

class UserBase(BaseModel):
    """
    Base user model used for shaping what a 'user' looks like.

    This is primarily used for responses (UserPublic) and can include
    profile fields that are not necessarily required on creation.
    """
    username: str = Field(..., min_length=3, max_length=64)
    role: str = Field(..., description="User role, e.g. 'user' or 'admin'")

    # Profile / work context fields
    display_name: Optional[str] = Field(
        None,
        description="Human-friendly name, e.g. 'CPT You' or 'SSG Kim'",
    )
    job_title: Optional[str] = Field(
        None,
        description="Job title or function, e.g. 'Dev Cell Lead'",
    )
    team_name: Optional[str] = Field(
        None,
        description="Team/section, e.g. 'CSD-D Dev Cell'",
    )
    rank: Optional[str] = Field(
        None,
        description="Optional rank, e.g. 'CPT', 'SSG', 'GS-13'",
    )
    skills: Optional[str] = Field(
        None,
        description="Free-text skills/tags, e.g. 'Python, FastAPI, malware dev'",
    )

    # Account state
    is_active: bool = Field(
        True,
        description="Whether the account is active and allowed to log in.",
    )


class UserPublic(UserBase):
    """
    Public representation of a user as returned by the API.
    """
    id: int
    created_at: datetime

    # Pydantic v2 config
    model_config = {
        "from_attributes": True
    }


# ---------------------------------------------------------------------------
# Creation / login / list
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    """
    Payload for creating users (self-register or admin-create).

    NOTE:
    - role is optional and only honored in admin-create or first-user bootstrap.
      Normal /register should set role='user' in the route logic.
    """
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field("user", description="user or admin")

    # Optional profile fields at creation time
    display_name: Optional[str] = None
    job_title: Optional[str] = None
    team_name: Optional[str] = None
    rank: Optional[str] = None
    skills: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class AdminCreateUserRequest(BaseModel):
    """
    Payload for admin creating a new user.

    Admin can set all profile fields and the role at creation time.
    """
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(..., description="'user' or 'admin'")

    # Profile fields
    display_name: Optional[str] = None
    job_title: Optional[str] = None
    team_name: Optional[str] = None
    rank: Optional[str] = None
    skills: Optional[str] = None


class UserList(BaseModel):
    items: List[UserPublic]


# ---------------------------------------------------------------------------
# Update / profile / password change
# ---------------------------------------------------------------------------

class UserUpdateProfile(BaseModel):
    """
    Payload for a normal user updating their own profile fields.
    """
    display_name: Optional[str] = None
    job_title: Optional[str] = None
    team_name: Optional[str] = None
    rank: Optional[str] = None
    skills: Optional[str] = None


class UserChangePassword(BaseModel):
    """
    Payload for a normal user changing their own password.
    """
    old_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class UserAdminUpdate(BaseModel):
    """
    Payload for admin updating another user.

    Admin can:
    - Change profile fields
    - Change role (user/admin)
    - Toggle is_active
    """
    display_name: Optional[str] = None
    job_title: Optional[str] = None
    team_name: Optional[str] = None
    rank: Optional[str] = None
    skills: Optional[str] = None
    role: Optional[str] = Field(
        None,
        description="New role, 'user' or 'admin'",
    )
    is_active: Optional[bool] = None
