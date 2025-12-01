from __future__ import annotations

from datetime import datetime
from typing import Optional, Tuple, List
import hashlib
import secrets

from app.db import get_connection
from app.schemas.user import UserPublic

# NOTE: for internal tool only; for production use a better password hashing scheme.
PASSWORD_SALT = "devcell-demo-salt"


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
    # sqlite3.Row -> dict so we can safely use .get()
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
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username = ?", (username,))
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
            username,
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
    password_hash = _hash_password(raw_password)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT *
        FROM users
        WHERE username = ?
          AND password_hash = ?
        """,
        (username, password_hash),
    )
    row = cur.fetchone()
    conn.close()

    if row is None:
        return None

    # row is sqlite3.Row; it has .keys()
    if "is_active" in row.keys() and not row["is_active"]:
        # user exists but is marked inactive
        return None

    return _row_to_user(row)


def create_session(user_id: int) -> str:
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
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT u.*
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ?
        """,
        (token,),
    )
    row = cur.fetchone()
    conn.close()
    if row is None:
        return None
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
    Returns updated UserPublic, or None if user_id does not exist.
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    if row is None:
        conn.close()
        return None

    fields = []
    params = []

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
