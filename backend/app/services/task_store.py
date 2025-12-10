# backend/app/services/task_store.py

from __future__ import annotations

from datetime import datetime, date
from typing import List, Optional

from app.schemas.task import TaskCreate, TaskEntry, TaskUpdate
from app.services.projects import get_project_by_id
from app.db import get_connection


def _row_to_task(row) -> TaskEntry:
    project_id = row["project_id"]
    project_name: Optional[str] = None
    if project_id is not None:
        proj = get_project_by_id(project_id)
        if proj is not None:
            project_name = proj.name

    return TaskEntry(
        id=row["id"],
        owner=row["owner"],
        title=row["title"],
        description=row["description"],
        status=row["status"],
        project_id=project_id,
        progress=row["progress"],
        due_date=row["due_date"],
        is_active=bool(row["is_active"]),
        origin_standup_id=row["origin_standup_id"] if "origin_standup_id" in row.keys() else None,
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
        project_name=project_name,
    )


def add_task(owner: str, data: TaskCreate) -> TaskEntry:
    """
    Insert a new task, normalizing status/progress semantics:

    - If status == "done" and progress < 100 -> progress forced to 100.
    """
    conn = get_connection()
    cur = conn.cursor()

    now = datetime.now().isoformat()

    # Normalize status/progress coupling for new tasks
    status = data.status
    progress = data.progress
    if status == "done" and progress < 100:
        progress = 100

    cur.execute(
        """
        INSERT INTO tasks (
            owner,
            title,
            description,
            status,
            project_id,
            progress,
            due_date,
            is_active,
            origin_standup_id,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            owner,
            data.title,
            data.description,
            status,
            data.project_id,
            progress,
            data.due_date.isoformat() if data.due_date else None,
            1 if data.is_active else 0,
            data.origin_standup_id,
            now,
            now,
        ),
    )
    task_id = cur.lastrowid
    conn.commit()

    cur.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
    row = cur.fetchone()
    conn.close()

    if row is None:
        raise RuntimeError("Failed to fetch task after insert")

    return _row_to_task(row)


def get_task_by_id(task_id: int) -> Optional[TaskEntry]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return None
    return _row_to_task(row)


def list_tasks(
    owner: Optional[str] = None,
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    active_only: bool = True,
    origin_standup_id: Optional[int] = None,
    search: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[TaskEntry]:
    """
    List tasks with normalized filtering semantics.

    - owner: filter by task owner
    - project_id: filter by project_id
    - status: filter by status string
    - active_only: if True, only tasks with is_active=1
    - origin_standup_id: filter by standup origin
    - search: case-insensitive LIKE match on title/description
    - start_date/end_date: inclusive date range on created_at (by date only)
    """
    conn = get_connection()
    cur = conn.cursor()

    query = "SELECT * FROM tasks"
    clauses = []
    params: list = []

    if owner is not None:
        clauses.append("owner = ?")
        params.append(owner)

    if project_id is not None:
        clauses.append("project_id = ?")
        params.append(project_id)

    if status is not None:
        clauses.append("status = ?")
        params.append(status)

    if active_only:
        clauses.append("is_active = 1")

    if origin_standup_id is not None:
        clauses.append("origin_standup_id = ?")
        params.append(origin_standup_id)

    if search:
        # Simple LIKE-based search over title and description
        clauses.append("(title LIKE ? OR description LIKE ?)")
        pattern = f"%{search}%"
        params.extend([pattern, pattern])

    if start_date is not None:
        # Compare by date(created_at) to ignore time portion
        clauses.append("date(created_at) >= ?")
        params.append(start_date.isoformat())

    if end_date is not None:
        clauses.append("date(created_at) <= ?")
        params.append(end_date.isoformat())

    if clauses:
        query += " WHERE " + " AND ".join(clauses)

    query += " ORDER BY created_at DESC"

    cur.execute(query, params)
    rows = cur.fetchall()
    conn.close()

    return [_row_to_task(r) for r in rows]


def list_tasks_for_standup(standup_id: int) -> List[TaskEntry]:
    """
    Convenience helper: list all tasks that were created from a given standup.
    Includes both active and archived tasks for historical SITREP queries.
    """
    return list_tasks(origin_standup_id=standup_id, active_only=False)


def update_task(task_id: int, data: TaskUpdate) -> Optional[TaskEntry]:
    """
    Update a task, normalizing status/progress semantics:

    - If setting status = "done" with no explicit progress and current progress < 100
      -> force progress to 100.
    - If setting status = "done" AND progress < 100 in the same request
      -> downgrade status to "in_progress".
    - If progress is explicitly set < 100 while current status is "done" and
      status is not explicitly overridden -> downgrade status to "in_progress".
    """
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
    row = cur.fetchone()
    if row is None:
        conn.close()
        return None

    current = _row_to_task(row)

    new_title = data.title if data.title is not None else current.title
    new_description = data.description if data.description is not None else current.description

    # Start from current values
    new_status = data.status if data.status is not None else current.status
    new_project_id = data.project_id if data.project_id is not None else current.project_id
    new_progress = data.progress if data.progress is not None else current.progress
    new_due_date = data.due_date if data.due_date is not None else current.due_date
    new_is_active = data.is_active if data.is_active is not None else current.is_active

    # Normalize status/progress coupling.
    if data.status is not None and data.status == "done":
        # Status explicitly set to done
        if data.progress is not None and data.progress < 100:
            # Conflicting combination: keep progress as given, downgrade status
            new_status = "in_progress"
        elif new_progress < 100:
            # No explicit conflicting progress: force to 100
            new_progress = 100
    elif (
        data.status is None
        and data.progress is not None
        and data.progress < 100
        and current.status == "done"
    ):
        # Progress lowered while status was done and not explicitly overridden
        new_status = "in_progress"

    now = datetime.now().isoformat()

    cur.execute(
        """
        UPDATE tasks
        SET title = ?,
            description = ?,
            status = ?,
            project_id = ?,
            progress = ?,
            due_date = ?,
            is_active = ?,
            updated_at = ?
        WHERE id = ?
        """,
        (
            new_title,
            new_description,
            new_status,
            new_project_id,
            new_progress,
            new_due_date.isoformat() if new_due_date else None,
            1 if new_is_active else 0,
            now,
            task_id,
        ),
    )
    conn.commit()

    cur.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
    updated_row = cur.fetchone()
    conn.close()

    if updated_row is None:
        return None

    return _row_to_task(updated_row)


def delete_task(task_id: int) -> None:
    """
    Hard delete a task from the database.

    NOTE: The Tasks API DELETE route performs a soft delete by setting
    is_active = 0. This helper remains available for internal maintenance
    scripts and should not be wired directly to API routes.
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()
