from fastapi import APIRouter, HTTPException, Depends, status

from app.schemas.user import (
    UserCreate,
    UserPublic,
    LoginRequest,
    LoginResponse,
    UserList,
    AdminCreateUserRequest,
    # new schemas for profile & admin updates
    UserUpdateProfile,
    UserChangePassword,
    UserAdminUpdate,
)
from app.services.user_store import (
    count_users,
    get_user_by_username,
    create_user,
    verify_user_credentials,
    create_session,
    list_users,
    # new store functions you will implement
    update_user_profile,
    change_user_password,
    admin_update_user,
)
from app.services.auth_service import get_current_user, require_admin


router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/status")
def status_route():
    return {"detail": "Auth service is available."}


@router.post("/register", response_model=LoginResponse)
def register(payload: UserCreate):
    """
    Register a new user.

    Rules:
    - If this is the FIRST user in the system, they become admin.
    - Otherwise, new users are created as role='user' (payload.role is ignored).
    - Returns a LoginResponse so the frontend can auto-login after registration.
    """
    if get_user_by_username(payload.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )

    user_count = count_users()
    if user_count == 0:
        # First user becomes admin (bootstrap)
        role = "admin"
    else:
        role = "user"

    # create_user should hash the password and store the user
    # NOTE: if you extend create_user to accept profile fields,
    #       pass them in here as well.
    user = create_user(payload.username, payload.password, role)

    # Immediately create a session so we can return an access token
    token = create_session(user.id)

    return LoginResponse(
        access_token=token,
        user=user,
    )


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    """
    Login with username + password.

    If credentials are valid:
    - Issues a session token.
    - Returns LoginResponse { access_token, user }.
    """
    user = verify_user_credentials(payload.username, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_session(user.id)
    return LoginResponse(access_token=token, user=user)


@router.get("/me", response_model=UserPublic)
def me(current_user: UserPublic = Depends(get_current_user)):
    """
    Return the current user (from the session token).
    """
    return current_user


@router.put("/me", response_model=UserPublic)
def update_me(
    payload: UserUpdateProfile,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Update the current user's own profile fields:
    - display_name
    - job_title
    - team_name
    - rank
    - skills
    """
    updated = update_user_profile(
        user_id=current_user.id,
        display_name=payload.display_name,
        job_title=payload.job_title,
        team_name=payload.team_name,
        rank=payload.rank,
        skills=payload.skills,
    )
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return updated


@router.put("/change_password")
def change_password(
    payload: UserChangePassword,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Change the current user's password.

    - Verifies old_password before setting the new password.
    """
    ok = change_user_password(
        user_id=current_user.id,
        old_password=payload.old_password,
        new_password=payload.new_password,
    )
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Old password is incorrect",
        )
    return {"detail": "Password changed successfully"}


@router.get("/users", response_model=UserList)
def get_users(_: UserPublic = Depends(require_admin)):
    """
    List all users (admin only).
    """
    items = list_users()
    return UserList(items=items)


@router.put("/users/{user_id}", response_model=UserPublic)
def admin_update_user_route(
    user_id: int,
    payload: UserAdminUpdate,
    _: UserPublic = Depends(require_admin),
):
    """
    Admin-only update of another user.

    Can update:
    - display_name, job_title, team_name, rank, skills
    - role ('user' or 'admin')
    - is_active (True/False)
    """
    updated = admin_update_user(
        user_id=user_id,
        display_name=payload.display_name,
        job_title=payload.job_title,
        team_name=payload.team_name,
        rank=payload.rank,
        skills=payload.skills,
        role=payload.role,
        is_active=payload.is_active,
    )
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return updated


@router.post("/admin/create_user", response_model=UserPublic)
def admin_create_user(
    payload: AdminCreateUserRequest,
    _: UserPublic = Depends(require_admin),
):
    """
    Create a new user (admin only).

    - Username must be unique
    - Role is set by admin (required in payload)
    - Allowed roles: 'user', 'admin'
    - All profile fields are optional and passed to create_user
    """
    if get_user_by_username(payload.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )

    if payload.role not in ("user", "admin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'user' or 'admin'",
        )

    user = create_user(
        username=payload.username,
        raw_password=payload.password,
        role=payload.role,
        display_name=payload.display_name,
        job_title=payload.job_title,
        team_name=payload.team_name,
        rank=payload.rank,
        skills=payload.skills,
    )
    return user
