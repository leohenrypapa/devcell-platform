# backend/app/services/projects/members.py

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from app.db import get_connection
from app.schemas.project import (
    Project,
    ProjectMember,
    ProjectRole,
)
from app.services.projects.crud import _row_to_project


def _row_to_member(row) -> ProjectMember:
    return ProjectMember(
        project_id=row["project_id"],
        username=row["username"],
        role=row["role"],
        created_at=datetime.fromisoformat(row["created_at"]),
    )


def add_project_member(
    project_id: int,
    username: str,
    role: ProjectRole,
) -> ProjectMember:
    """
    Upsert a membership row for (project_id, username).

    - If no row exists, insert.
    - If it exists, update the role.
    """
    conn = get_connection()
    cur = conn.cursor()

    created_at = datetime.now().isoformat()

    cur.execute(
        """
        INSERT INTO project_members (project_id, username, role, created_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(project_id, username)
        DO UPDATE SET role = excluded.role
        """,
        (project_id, username, role, created_at),
    )
    conn.commit()

    cur.execute(
        """
        SELECT project_id, username, role, created_at
        FROM project_members
        WHERE project_id = ? AND username = ?
        """,
        (project_id, username),
    )
    row = cur.fetchone()
    conn.close()

    if row is None:
        raise RuntimeError("Failed to fetch project member after upsert")

    return _row_to_member(row)


def list_project_members(project_id: int) -> List[ProjectMember]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT project_id, username, role, created_at
        FROM project_members
        WHERE project_id = ?
        ORDER BY created_at ASC
        """,
        (project_id,),
    )
    rows = cur.fetchall()
    conn.close()
    return [_row_to_member(r) for r in rows]


def remove_project_member(project_id: int, username: str) -> None:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        DELETE FROM project_members
        WHERE project_id = ? AND username = ?
        """,
        (project_id, username),
    )
    conn.commit()
    conn.close()


def get_user_role_for_project(
    project_id: int,
    username: str,
) -> Optional[ProjectRole]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT role
        FROM project_members
        WHERE project_id = ? AND username = ?
        """,
        (project_id, username),
    )
    row = cur.fetchone()
    conn.close()
    if row is None:
        return None
    return row["role"]  # type: ignore[return-value]


def list_projects_for_user(username: str) -> List[Project]:
    """
    List projects where the user is either:

    - the project.owner, OR
    - present in project_members (any role)
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT p.*
        FROM projects p
        LEFT JOIN project_members m
          ON p.id = m.project_id
        WHERE p.owner = ?
           OR m.username = ?
        GROUP BY p.id
        ORDER BY p.created_at ASC
        """,
        (username, username),
    )
    rows = cur.fetchall()
    conn.close()
    return [_row_to_project(r) for r in rows]
