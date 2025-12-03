from __future__ import annotations
from datetime import datetime
from typing import List, Optional

from app.schemas.project import Project, ProjectCreate, ProjectUpdate
from app.db import get_connection


def _row_to_project(row) -> Project:
    return Project(
        id=row["id"],
        name=row["name"],
        description=row["description"],
        owner=row["owner"],
        status=row["status"],
        created_at=datetime.fromisoformat(row["created_at"]),
    )


def add_project(data: ProjectCreate) -> Project:
    conn = get_connection()
    cur = conn.cursor()

    created_at = datetime.now().isoformat()

    cur.execute(
        """
        INSERT INTO projects (name, description, owner, status, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (data.name, data.description, data.owner, data.status, created_at),
    )
    project_id = cur.lastrowid

    conn.commit()

    cur.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    row = cur.fetchone()
    conn.close()

    if row is None:
        # shouldn't happen
        raise RuntimeError("Failed to fetch project after insert")

    return _row_to_project(row)


def list_projects() -> List[Project]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM projects ORDER BY created_at ASC")
    rows = cur.fetchall()
    conn.close()
    return [_row_to_project(row) for row in rows]


def get_project_by_id(project_id: int) -> Optional[Project]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return None
    return _row_to_project(row)


def delete_project(project_id: int) -> None:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()


def update_project(project_id: int, data: ProjectUpdate) -> Optional[Project]:
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    row = cur.fetchone()
    if row is None:
        conn.close()
        return None

    current = _row_to_project(row)

    new_name = data.name if data.name is not None else current.name
    new_description = (
        data.description if data.description is not None else current.description
    )
    new_status = data.status if data.status is not None else current.status

    cur.execute(
        """
        UPDATE projects
        SET name = ?, description = ?, status = ?
        WHERE id = ?
        """,
        (new_name, new_description, new_status, project_id),
    )
    conn.commit()

    cur.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    updated_row = cur.fetchone()
    conn.close()

    if updated_row is None:
        return None

    return _row_to_project(updated_row)
