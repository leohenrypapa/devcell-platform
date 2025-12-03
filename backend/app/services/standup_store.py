from __future__ import annotations
from datetime import datetime, date
from typing import List, Optional

from app.schemas.standup import StandupCreate, StandupEntry, StandupUpdate
from app.services.projects import get_project_by_id
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
    now_str = datetime.utcnow().isoformat(timespec="seconds")
    cur.execute(
        """
        INSERT INTO standups (name, yesterday, today, blockers, created_at, project_id)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (data.name, data.yesterday, data.today, data.blockers, now_str, data.project_id),
    )
    standup_id = cur.lastrowid
    conn.commit()

    cur.execute("SELECT * FROM standups WHERE id = ?", (standup_id,))
    row = cur.fetchone()
    conn.close()
    return _row_to_standup(row)


def _get_all_standups() -> List[StandupEntry]:
    """(Kept for any legacy uses; no longer used by date-based APIs.)"""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM standups ORDER BY created_at ASC")
    rows = cur.fetchall()
    conn.close()
    return [_row_to_standup(row) for row in rows]


def get_standups_for_date(target_date: date) -> List[StandupEntry]:
    """
    Get all standups whose created_at DATE is target_date.
    Uses SQL filtering instead of loading the entire table.
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT * FROM standups
        WHERE date(created_at) = ?
        ORDER BY created_at ASC
        """,
        (target_date.isoformat(),),
    )
    rows = cur.fetchall()
    conn.close()
    return [_row_to_standup(row) for row in rows]


def get_today_standups() -> List[StandupEntry]:
    """
    Convenience wrapper for today's standups.
    """
    return get_standups_for_date(date.today())


def get_today_standups_for_project(project_id: int) -> List[StandupEntry]:
    """
    Get today's standups filtered by a specific project_id.
    """
    today_items = get_today_standups()
    return [s for s in today_items if s.project_id == project_id]


def get_standups_for_project_on_date(project_id: int, target_date: date) -> List[StandupEntry]:
    """
    Get standups for a project on a specific date.
    """
    items = get_standups_for_date(target_date)
    return [s for s in items if s.project_id == project_id]


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
