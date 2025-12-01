from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.schemas.user import UserPublic
from app.services.user_store import get_user_by_token

# We keep auto_error=False so we can control the 401 message ourselves
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> UserPublic:
    """
    Resolve the current user from a Bearer token.

    - Expects "Authorization: Bearer <token>" header.
    - Looks up the user via the session token.
    - Rejects missing, invalid, expired, or inactive users.
    """
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    token = credentials.credentials
    user = get_user_by_token(token)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    # New: respect is_active flag on the user
    if hasattr(user, "is_active") and not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
        )

    return user


def require_admin(user: UserPublic = Depends(get_current_user)) -> UserPublic:
    """
    Dependency that ensures the current user has admin privileges.
    """
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return user
