# backend/app/services/user_store.py
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional, Tuple, List
import hashlib
import secrets

from app.db import get_connection
from app.schemas.user import UserPublic

# NOTE: for internal tool only; for production use a better password hashing scheme.
PASSWORD_SALT = "devcell-demo-salt"

# Session lifetime (hours). Tokens older than this are treated as expired.
SESSION_LIFETIME_HOURS = 8


def _normalize_username(username: str) -> str:
    """
    Normalize username for storage and lookup.

    - Strips leading/trailing whitespace.
    - (Case is preserved in storage, but lookups are done case-insensitively.)
    """
    return username.strip()


def _hash_password(raw_password: str) -> str:
    data = (PASSWORD_SALT + raw_password).encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def _row_to_user(row) -> UserPublic:
    """
    Convert a DB row to UserPublic.
    Assumes the 'users' table has (at least):
      id, username, role, created_at,
      display_name, job_title, team_name, rank, skills, is_active
    New columns are allowed to be NULL.
    """
    data = dict(row)

    return UserPublic(
        id=data["id"],
        username=data["username"],
        role=data["role"],
        created_at=datetime.fromisoformat(data["created_at"]),
        display_name=data.get("display_name"),
        job_title=data.get("job_title"),
        team_name=data.get("team_name"),
        rank=data.get("rank"),
        skills=data.get("skills"),
        # default to active if column is NULL or missing
        is_active=bool(data.get("is_active", 1)),
    )


def count_users() -> int:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) AS c FROM users")
    row = cur.fetchone()
    conn.close()
    return int(row["c"] if row else 0)


def get_user_by_username(username: str) -> Optional[UserPublic]:
    """
    Case-insensitive lookup of a user by username.
    """
    normalized = _normalize_username(username)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT *
        FROM users
        WHERE LOWER(username) = LOWER(?)
        """,
        (normalized,),
    )
    row = cur.fetchone()
    conn.close()
    if row is None:
        return None
    return _row_to_user(row)


def get_user_by_id(user_id: int) -> Optional[UserPublic]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return None
    return _row_to_user(row)


def create_user(
    username: str,
    raw_password: str,
    role: str,
    *,
    display_name: Optional[str] = None,
    job_title: Optional[str] = None,
    team_name: Optional[str] = None,
    rank: Optional[str] = None,
    skills: Optional[str] = None,
    is_active: bool = True,
) -> UserPublic:
    """
    Create a new user and return it.

    NOTE: all new users should normally be created with role='user' unless an
    existing admin is intentionally creating another admin.
    """
    normalized_username = _normalize_username(username)
    password_hash = _hash_password(raw_password)
    created_at = datetime.now().isoformat()
    is_active_int = 1 if is_active else 0

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO users (
            username,
            password_hash,
            role,
            created_at,
            display_name,
            job_title,
            team_name,
            rank,
            skills,
            is_active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            normalized_username,
            password_hash,
            role,
            created_at,
            display_name,
            job_title,
            team_name,
            rank,
            skills,
            is_active_int,
        ),
    )
    user_id = cur.lastrowid
    conn.commit()

    cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    conn.close()

    if row is None:
        raise RuntimeError("Failed to fetch user after insert")

    return _row_to_user(row)


def verify_user_credentials(username: str, raw_password: str) -> Optional[UserPublic]:
    """
    Verify username/password and return UserPublic if valid.
    Only returns active users (is_active = 1) if that column exists.
    """
    normalized_username = _normalize_username(username)
    password_hash = _hash_password(raw_password)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT *
        FROM users
        WHERE LOWER(username) = LOWER(?)
          AND password_hash = ?
        """,
        (normalized_username, password_hash),
    )
    row = cur.fetchone()
    conn.close()

    if row is None:
        return None

    if "is_active" in row.keys() and not row["is_active"]:
        # user exists but is marked inactive
        return None

    return _row_to_user(row)


def create_session(user_id: int) -> str:
    """
    Create a new random session token for a user and store it in the sessions table.
    """
    token = secrets.token_urlsafe(32)
    created_at = datetime.now().isoformat()

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO sessions (user_id, token, created_at)
        VALUES (?, ?, ?)
        """,
        (user_id, token, created_at),
    )
    conn.commit()
    conn.close()
    return token


def delete_session(token: str) -> None:
    """
    Delete a single session by its token. Used by /auth/logout.
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()


def create_user_and_session(
    username: str,
    raw_password: str,
    role: str = "user",
    *,
    display_name: Optional[str] = None,
    job_title: Optional[str] = None,
    team_name: Optional[str] = None,
    rank: Optional[str] = None,
    skills: Optional[str] = None,
    is_active: bool = True,
) -> Tuple[UserPublic, str]:
    """
    Helper used by /register or admin-created users who should be logged in immediately.
    Creates a user, then a session, and returns (user, token).
    """
    user = create_user(
        username=username,
        raw_password=raw_password,
        role=role,
        display_name=display_name,
        job_title=job_title,
        team_name=team_name,
        rank=rank,
        skills=skills,
        is_active=is_active,
    )
    token = create_session(user.id)
    return user, token


def get_user_by_token(token: str) -> Optional[UserPublic]:
    """
    Lookup a user from a session token.

    - Joins sessions and users.
    - Enforces a simple max lifetime based on sessions.created_at.
    - Returns None if token is missing or expired.
    """
    now = datetime.now()
    lifetime = timedelta(hours=SESSION_LIFETIME_HOURS)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT u.*, s.created_at AS session_created_at
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ?
        """,
        (token,),
    )
    row = cur.fetchone()

    if row is None:
        conn.close()
        return None

    data = dict(row)
    session_created_str = data.get("session_created_at")
    try:
        session_created = datetime.fromisoformat(session_created_str)
    except Exception:
        # If parsing fails, treat token as invalid.
        cur.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
        conn.close()
        return None

    if now - session_created > lifetime:
        # Token expired: clean up and reject.
        cur.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
        conn.close()
        return None

    conn.close()
    return _row_to_user(row)


def list_users() -> List[UserPublic]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users ORDER BY created_at ASC")
    rows = cur.fetchall()
    conn.close()
    return [_row_to_user(row) for row in rows]


def update_user_profile(
    user_id: int,
    *,
    display_name: Optional[str] = None,
    job_title: Optional[str] = None,
    team_name: Optional[str] = None,
    rank: Optional[str] = None,
    skills: Optional[str] = None,
) -> UserPublic:
    """
    Used when a user updates their own profile fields.
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE users
        SET display_name = ?,
            job_title = ?,
            team_name = ?,
            rank = ?,
            skills = ?
        WHERE id = ?
        """,
        (display_name, job_title, team_name, rank, skills, user_id),
    )
    conn.commit()

    cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        raise RuntimeError("User not found after profile update")

    return _row_to_user(row)


def change_user_password(
    user_id: int,
    old_password: str,
    new_password: str,
) -> bool:
    """
    Change a user's password if the old password is correct.
    Returns True on success, False if old password is wrong or user not found.
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT password_hash FROM users WHERE id = ?",
        (user_id,),
    )
    row = cur.fetchone()
    if row is None:
        conn.close()
        return False

    current_hash = row["password_hash"]
    if current_hash != _hash_password(old_password):
        conn.close()
        return False

    new_hash = _hash_password(new_password)
    cur.execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        (new_hash, user_id),
    )
    conn.commit()
    conn.close()
    return True


def admin_update_user(
    user_id: int,
    *,
    display_name: Optional[str] = None,
    job_title: Optional[str] = None,
    team_name: Optional[str] = None,
    rank: Optional[str] = None,
    skills: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> Optional[UserPublic]:
    """
    Admin-only update of another user's fields (including role and is_active).

    - Prevents deactivating or demoting the last active admin account.
    - Returns updated UserPublic, or None if user_id does not exist.

    Raises:
        ValueError: if attempting to remove the last active admin.
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    if row is None:
        conn.close()
        return None

    data = dict(row)
    current_role = data["role"]
    # default to active if column is NULL or missing
    current_is_active = bool(data.get("is_active", 1))

    is_current_admin = current_role == "admin" and current_is_active

    # Determine if this update would remove admin status or deactivate the user.
    will_no_longer_be_admin = False
    if role is not None and role != "admin":
        will_no_longer_be_admin = True
    if is_active is not None and not is_active:
        will_no_longer_be_admin = True

    if is_current_admin and will_no_longer_be_admin:
        # Check how many active admins exist.
        cur.execute(
            "SELECT COUNT(*) AS c FROM users WHERE role = 'admin' AND is_active = 1"
        )
        count_row = cur.fetchone()
        active_admins = int(count_row["c"] if count_row else 0)

        if active_admins <= 1:
            conn.close()
            raise ValueError(
                "Cannot remove or deactivate the last active admin user."
            )

    fields = []
    params: List[object] = []

    if display_name is not None:
        fields.append("display_name = ?")
        params.append(display_name)

    if job_title is not None:
        fields.append("job_title = ?")
        params.append(job_title)

    if team_name is not None:
        fields.append("team_name = ?")
        params.append(team_name)

    if rank is not None:
        fields.append("rank = ?")
        params.append(rank)

    if skills is not None:
        fields.append("skills = ?")
        params.append(skills)

    if role is not None:
        fields.append("role = ?")
        params.append(role)

    if is_active is not None:
        fields.append("is_active = ?")
        params.append(1 if is_active else 0)

    if fields:
        sql = "UPDATE users SET " + ", ".join(fields) + " WHERE id = ?"
        params.append(user_id)
        cur.execute(sql, tuple(params))
        conn.commit()

    # Re-fetch
    cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    updated_row = cur.fetchone()
    conn.close()
    if updated_row is None:
        return None

    return _row_to_user(updated_row)


def ensure_default_admin() -> None:
    """
    Ensure there is at least one admin account.

    If no admin exists, create a default one:
      - username: admin
      - password: password

    This is intended for dev/demo/reset scenarios only.
    """
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'")
        row = cur.fetchone()
        conn.close()
    except Exception:
        # If the table doesn't exist yet or some other error occurs,
        # just skip silently so startup doesn't crash.
        return

    count = int(row["c"] if row else 0)
    if count > 0:
        return

    try:
        create_user(
            username="admin",
            raw_password="password",
            role="admin",
            display_name="DevCell Admin",
            job_title="Admin",
            team_name="DevCell",
            rank=None,
            skills=None,
            is_active=True,
        )
    except Exception:
        # Don't crash app startup if this fails; can be corrected manually.
        return
