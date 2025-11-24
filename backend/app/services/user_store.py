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
    return UserPublic(
        id=row["id"],
        username=row["username"],
        role=row["role"],
        created_at=datetime.fromisoformat(row["created_at"]),
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


def create_user(username: str, raw_password: str, role: str) -> UserPublic:
    password_hash = _hash_password(raw_password)
    created_at = datetime.now().isoformat()

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO users (username, password_hash, role, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (username, password_hash, role, created_at),
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
    password_hash = _hash_password(raw_password)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM users WHERE username = ? AND password_hash = ?",
        (username, password_hash),
    )
    row = cur.fetchone()
    conn.close()

    if row is None:
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