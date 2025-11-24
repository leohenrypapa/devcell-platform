from __future__ import annotations
from datetime import datetime, date
from typing import List, Optional

from app.schemas.standup import StandupCreate, StandupEntry, StandupUpdate
from app.services.project_store import get_project_by_id
from app.db import get_connection


def _row_to_standup(row) -> StandupEntry:
    # Determine project_name from projects table if needed
    project_id = row["project_id"]
    project_name: Optional[str] = None
    if project_id is not None:
        proj = get_project_by_id(project_id)
        if proj is not None:
            project_name = proj.name

    return StandupEntry(
        id=row["id"],
        name=row["name"],
        yesterday=row["yesterday"],
        today=row["today"],
        blockers=row["blockers"],
        created_at=datetime.fromisoformat(row["created_at"]),
        project_id=project_id,
        project_name=project_name,
    )


def add_standup(data: StandupCreate) -> StandupEntry:
    conn = get_connection()
    cur = conn.cursor()

    created_at = datetime.now().isoformat()

    cur.execute(
        """
        INSERT INTO standups (name, yesterday, today, blockers, created_at, project_id)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            data.name,
            data.yesterday,
            data.today,
            data.blockers,
            created_at,
            data.project_id,
        ),
    )
    standup_id = cur.lastrowid
    conn.commit()

    cur.execute("SELECT * FROM standups WHERE id = ?", (standup_id,))
    row = cur.fetchone()
    conn.close()

    if row is None:
        raise RuntimeError("Failed to fetch standup after insert")

    return _row_to_standup(row)


def _get_all_standups() -> List[StandupEntry]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM standups ORDER BY created_at ASC")
    rows = cur.fetchall()
    conn.close()
    return [_row_to_standup(row) for row in rows]


def get_today_standups() -> List[StandupEntry]:
    """
    Filter today's standups in Python, based on created_at date.
    """
    all_entries = _get_all_standups()
    today = date.today()
    return [s for s in all_entries if s.created_at.date() == today]


def get_today_standups_for_project(project_id: int) -> List[StandupEntry]:
    """
    Get today's standups filtered by a specific project_id.
    """
    all_entries = _get_all_standups()
    today = date.today()
    return [
        s
        for s in all_entries
        if s.created_at.date() == today and s.project_id == project_id
    ]


def get_standups_for_date(target_date: date) -> List[StandupEntry]:
    """
    Get all standups for a specific calendar date.
    """
    all_entries = _get_all_standups()
    return [s for s in all_entries if s.created_at.date() == target_date]


def get_standup_by_id(standup_id: int) -> Optional[StandupEntry]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM standups WHERE id = ?", (standup_id,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return None
    return _row_to_standup(row)


def delete_standup(standup_id: int) -> None:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM standups WHERE id = ?", (standup_id,))
    conn.commit()
    conn.close()


def update_standup(standup_id: int, data: StandupUpdate) -> Optional[StandupEntry]:
    conn = get_connection()
    cur = conn.cursor()

    # Fetch current row
    cur.execute("SELECT * FROM standups WHERE id = ?", (standup_id,))
    row = cur.fetchone()
    if row is None:
        conn.close()
        return None

    current = _row_to_standup(row)

    # Compute new values (keep old if None)
    new_yesterday = data.yesterday if data.yesterday is not None else current.yesterday
    new_today = data.today if data.today is not None else current.today
    new_blockers = data.blockers if data.blockers is not None else current.blockers
    new_project_id = (
        data.project_id if data.project_id is not None else current.project_id
    )

    cur.execute(
        """
        UPDATE standups
        SET yesterday = ?, today = ?, blockers = ?, project_id = ?
        WHERE id = ?
        """,
        (new_yesterday, new_today, new_blockers, new_project_id, standup_id),
    )
    conn.commit()

    cur.execute("SELECT * FROM standups WHERE id = ?", (standup_id,))
    updated_row = cur.fetchone()
    conn.close()

    if updated_row is None:
        return None

    return _row_to_standup(updated_row)
