# backend/app/services/user_store.py

from __future__ import annotations

import hashlib
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Optional, List

from app.db import get_connection
from app.schemas.user import UserPublic
from app.core.config import settings


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _iso_now() -> str:
    return _utc_now().isoformat()


def _hash_password(raw_password: str) -> str:
    """
    Simple SHA-256 password hashing for demo purposes.

    NOTE: For production, replace with bcrypt/argon2.
    """
    return hashlib.sha256(raw_password.encode("utf-8")).hexdigest()


def _row_to_user_public(row: sqlite3.Row) -> UserPublic:
    """
    Map a SQLite row from the `users` table to a UserPublic model.
    """
    return UserPublic(
        id=row["id"],
        username=row["username"],
        role=row["role"],
        display_name=row["display_name"],
        job_title=row["job_title"],
        team_name=row["team_name"],
        rank=row["rank"],
        skills=row["skills"],
        is_active=bool(row["is_active"]),
        created_at=row["created_at"],
    )


SESSION_TTL_HOURS = getattr(settings, "SESSION_TTL_HOURS", 8)


# ---------------------------------------------------------------------------
# User queries
# ---------------------------------------------------------------------------

def count_users() -> int:
    """
    Return total number of users in the system (active + inactive).
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) AS c FROM users")
    row = cur.fetchone()
    conn.close()
    return int(row["c"] if row else 0)


def _get_user_row_by_username_raw(username: str) -> Optional[sqlite3.Row]:
    """
    Internal helper: fetch a user row by username (case-insensitive).
    """
    normalized = username.strip().lower()
    if not normalized:
        return None

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT *
        FROM users
        WHERE lower(username) = ?
        """,
        (normalized,),
    )
    row = cur.fetchone()
    conn.close()
    return row


def get_user_by_username(username: str) -> Optional[UserPublic]:
    """
    Public API: fetch user by username (case-insensitive).
    """
    row = _get_user_row_by_username_raw(username)
    if row is None:
        return None
    return _row_to_user_public(row)


def list_users() -> List[UserPublic]:
    """
    Return all users ordered by id.
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT *
        FROM users
        ORDER BY id ASC
        """
    )
    rows = cur.fetchall()
    conn.close()
    return [_row_to_user_public(r) for r in rows]


# ---------------------------------------------------------------------------
# User creation / credentials
# ---------------------------------------------------------------------------

def create_user(
    username: str,
    raw_password: str,
    role: str,
    display_name: Optional[str] = None,
    job_title: Optional[str] = None,
    team_name: Optional[str] = None,
    rank: Optional[str] = None,
    skills: Optional[str] = None,
) -> UserPublic:
    """
    Create a new user with hashed password and return the stored UserPublic.

    - Username is normalized to lowercase before storing.
    - Role must be 'user' or 'admin' (enforced at route level).
    """
    normalized = username.strip().lower()
    if not normalized:
        raise ValueError("Username cannot be empty or whitespace")

    password_hash = _hash_password(raw_password)
    created_at = _iso_now()

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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """,
        (
            normalized,
            password_hash,
            role,
            created_at,
            display_name,
            job_title,
            team_name,
            rank,
            skills,
        ),
    )
    user_id = cur.lastrowid
    conn.commit()

    cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    conn.close()

    return _row_to_user_public(row)


def verify_user_credentials(username: str, raw_password: str) -> Optional[UserPublic]:
    """
    Verify username + password and return the corresponding user, or None.

    - Username is matched case-insensitively.
    - Inactive users (is_active=0) cannot log in.
    """
    row = _get_user_row_by_username_raw(username)
    if row is None:
        return None

    if not bool(row["is_active"]):
        # Inactive accounts cannot log in
        return None

    expected_hash = row["password_hash"]
    candidate_hash = _hash_password(raw_password)
    if candidate_hash != expected_hash:
        return None

    return _row_to_user_public(row)


# ---------------------------------------------------------------------------
# Sessions (opaque tokens)
# ---------------------------------------------------------------------------

def create_session(user_id: int) -> str:
    """
    Create a new session for the given user and return the opaque token.

    Multiple sessions per user are allowed (multi-device login).
    """
    token = None
    created_at = _iso_now()

    conn = get_connection()
    cur = conn.cursor()

    # Ensure token uniqueness (very low collision probability, but safe loop)
    while token is None:
        candidate = secrets.token_urlsafe(32)
        try:
            cur.execute(
                """
                INSERT INTO sessions (user_id, token, created_at)
                VALUES (?, ?, ?)
                """,
                (user_id, candidate, created_at),
            )
            token = candidate
        except sqlite3.IntegrityError:
            # Token collision: generate a new one
            token = None

    conn.commit()
    conn.close()
    return token


def delete_session(token: str) -> None:
    """
    Delete a single session by its token. Idempotent.
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()


def delete_all_sessions_for_user(user_id: int) -> None:
    """
    Delete all sessions belonging to the given user. Idempotent.
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()


def get_user_by_token(token: str) -> Optional[UserPublic]:
    """
    Resolve a user from the given session token.

    - Returns None if the token does not exist.
    - Enforces expiration using SESSION_TTL_HOURS.
    - Deletes expired session rows eagerly.
    - Returns None if the corresponding user is inactive.
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT
            s.id AS session_id,
            s.created_at AS session_created_at,
            u.*
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

    # Check session expiration
    session_id = row["session_id"]
    session_created_at_str = row["session_created_at"]
    try:
        session_created_at = datetime.fromisoformat(session_created_at_str)
    except Exception:
        # If parsing fails, treat the session as invalid/expired
        cur.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        conn.commit()
        conn.close()
        return None

    now = _utc_now()
    ttl = timedelta(hours=SESSION_TTL_HOURS)
    if now - session_created_at > ttl:
        # Session expired — delete and reject
        cur.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        conn.commit()
        conn.close()
        return None

    if not bool(row["is_active"]):
        # User is inactive; treat as invalid token
        conn.close()
        return None

    user = _row_to_user_public(row)
    conn.close()
    return user


def list_user_sessions(user_id: int) -> List[dict]:
    """
    List sessions for a user without exposing token values.

    Returns a list of dicts:
        {
          "id": session_id,
          "created_at": iso_string,
          "age_hours": float,
          "expires_in_hours": float,
          "is_expired": bool
        }
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, created_at
        FROM sessions
        WHERE user_id = ?
        ORDER BY created_at DESC
        """,
        (user_id,),
    )
    rows = cur.fetchall()
    conn.close()

    now = _utc_now()
    ttl = timedelta(hours=SESSION_TTL_HOURS)
    sessions: List[dict] = []

    for r in rows:
        created_str = r["created_at"]
        try:
            created_dt = datetime.fromisoformat(created_str)
        except Exception:
            created_dt = now  # treat as now for safety, mark as non-expired

        age = now - created_dt
        age_hours = age.total_seconds() / 3600.0
        is_expired = age > ttl
        expires_in_hours = max(SESSION_TTL_HOURS - age_hours, 0.0)

        sessions.append(
            {
                "id": r["id"],
                "created_at": created_str,
                "age_hours": age_hours,
                "expires_in_hours": expires_in_hours,
                "is_expired": is_expired,
            }
        )

    return sessions


# ---------------------------------------------------------------------------
# Profile / password updates
# ---------------------------------------------------------------------------

def update_user_profile(
    user_id: int,
    display_name: Optional[str],
    job_title: Optional[str],
    team_name: Optional[str],
    rank: Optional[str],
    skills: Optional[str],
) -> Optional[UserPublic]:
    """
    Update a user's profile fields.

    Returns the updated UserPublic, or None if user does not exist.
    """
    fields = {
        "display_name": display_name,
        "job_title": job_title,
        "team_name": team_name,
        "rank": rank,
        "skills": skills,
    }
    # Filter out None values (only update provided fields)
    updates = {k: v for k, v in fields.items() if v is not None}

    if not updates:
        # Nothing to update; just return current user
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        conn.close()
        if row is None:
            return None
        return _row_to_user_public(row)

    set_clause = ", ".join(f"{col} = :{col}" for col in updates.keys())
    updates["user_id"] = user_id

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        f"""
        UPDATE users
        SET {set_clause}
        WHERE id = :user_id
        """,
        updates,
    )
    conn.commit()

    cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return None
    return _row_to_user_public(row)


def change_user_password(
    user_id: int,
    old_password: str,
    new_password: str,
) -> bool:
    """
    Change a user's password after verifying the old password.

    Returns True on success, False if old_password is incorrect or user missing.
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT password_hash
        FROM users
        WHERE id = ?
        """,
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
        """
        UPDATE users
        SET password_hash = ?
        WHERE id = ?
        """,
        (new_hash, user_id),
    )
    conn.commit()
    conn.close()
    return True


# ---------------------------------------------------------------------------
# Admin updates & safeguards
# ---------------------------------------------------------------------------

def _count_active_admins_excluding(user_id: Optional[int] = None) -> int:
    """
    Count active admin users, optionally excluding a given user_id.
    """
    conn = get_connection()
    cur = conn.cursor()
    if user_id is not None:
        cur.execute(
            """
            SELECT COUNT(*) AS c
            FROM users
            WHERE role = 'admin' AND is_active = 1 AND id != ?
            """,
            (user_id,),
        )
    else:
        cur.execute(
            """
            SELECT COUNT(*) AS c
            FROM users
            WHERE role = 'admin' AND is_active = 1
            """
        )
    row = cur.fetchone()
    conn.close()
    return int(row["c"] if row else 0)


def admin_update_user(
    user_id: int,
    display_name: Optional[str],
    job_title: Optional[str],
    team_name: Optional[str],
    rank: Optional[str],
    skills: Optional[str],
    role: Optional[str],
    is_active: Optional[bool],
) -> Optional[UserPublic]:
    """
    Admin-only update of a user.

    - Can update profile fields
    - Can change role (user/admin)
    - Can toggle is_active
    - Enforces 'cannot remove/deactivate last active admin'
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    existing = cur.fetchone()
    if existing is None:
        conn.close()
        return None

    current_role = existing["role"]
    current_is_active = bool(existing["is_active"])

    new_role = role if role is not None else current_role
    new_is_active = is_active if is_active is not None else current_is_active

    # Safeguard: cannot remove/deactivate the last active admin
    if current_role == "admin" and current_is_active:
        if new_role != "admin" or not new_is_active:
            if _count_active_admins_excluding(user_id=user_id) == 0:
                conn.close()
                raise ValueError(
                    "Cannot remove or deactivate the last active admin user."
                )

    fields = {
        "display_name": display_name,
        "job_title": job_title,
        "team_name": team_name,
        "rank": rank,
        "skills": skills,
        "role": new_role,
        "is_active": int(new_is_active),
    }

    set_clause = ", ".join(f"{col} = :{col}" for col in fields.keys())
    fields["user_id"] = user_id

    cur.execute(
        f"""
        UPDATE users
        SET {set_clause}
        WHERE id = :user_id
        """,
        fields,
    )
    conn.commit()

    cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    updated = cur.fetchone()
    conn.close()
    if updated is None:
        return None
    return _row_to_user_public(updated)


# ---------------------------------------------------------------------------
# Startup helper: ensure default admin
# ---------------------------------------------------------------------------

def ensure_default_admin() -> None:
    """
    Ensure there is at least one active admin user.

    If no active admin exists, creates:
      username: admin
      password: password
      role: admin

    This is a bootstrap convenience for demos; change the password immediately.
    """
    if _count_active_admins_excluding(user_id=None) > 0:
        return

    existing_admin = get_user_by_username("admin")
    if existing_admin is not None and existing_admin.is_active:
        return

    create_user(
        username="admin",
        raw_password="password",
        role="admin",
        display_name="DevCell Admin",
        job_title="DevCell Platform Admin",
        team_name="DevCell",
        rank=None,
        skills=None,
    )
    print("[AUTH] Created default admin user: username=admin, password=password")
