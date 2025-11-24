from fastapi import APIRouter, HTTPException, Depends, status

from app.schemas.user import (
    UserCreate,
    UserPublic,
    LoginRequest,
    LoginResponse,
    UserList,
)
from app.services.user_store import (
    count_users,
    get_user_by_username,
    create_user,
    verify_user_credentials,
    create_session,
    list_users,
)
from app.services.auth_service import get_current_user, require_admin


router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/status")
def status_route():
    return {"detail": "Auth service is available."}


@router.post("/register", response_model=UserPublic)
def register(payload: UserCreate):
    """
    Register a new user.

    Rules:
    - If this is the FIRST user in the system, they become admin.
    - Otherwise, new users are created as role='user' (payload.role is ignored).
      (You can tighten this later to admin-only.)
    """
    if get_user_by_username(payload.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )

    user_count = count_users()
    if user_count == 0:
        # First user becomes admin
        role = "admin"
    else:
        role = "user"

    user = create_user(payload.username, payload.password, role)
    return user


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
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
    return current_user

@router.get("/users", response_model=UserList)
def get_users(_: UserPublic = Depends(require_admin)):
    """
    List all users (admin only).
    """
    items = list_users()
    return UserList(items=items)

@router.post("/admin/create_user", response_model=UserPublic)
def admin_create_user(
    payload: UserCreate,
    _: UserPublic = Depends(require_admin),
):
    """
    Create a new user (admin only).

    - Username must be unique
    - Role defaults to 'user' if not provided
    - Allowed roles: 'user', 'admin'
    """
    if get_user_by_username(payload.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )

    role = payload.role or "user"
    if role not in ("user", "admin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'user' or 'admin'",
        )

    user = create_user(payload.username, payload.password, role)
    return user
