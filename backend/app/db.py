# backend/app/db.py

from pathlib import Path
import sqlite3


# Base directory for the backend package (…/backend)
BASE_DIR = Path(__file__).resolve().parents[1]

# SQLite DB path: backend/devcell.db
DB_PATH = BASE_DIR / "devcell.db"


def get_connection() -> sqlite3.Connection:
    """
    Open a new SQLite connection to the DevCell database.

    The connection uses Row factory so rows behave like dicts.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """
    Create tables if they do not exist.
    """
    conn = get_connection()
    cur = conn.cursor()

    # Users table
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TEXT NOT NULL,
            display_name TEXT,
            job_title TEXT,
            team_name TEXT,
            rank TEXT,
            skills TEXT,
            is_active INTEGER NOT NULL DEFAULT 1
        );
        """
    )

    # Sessions table (simple token-based auth)
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
        """
    )

    # Projects table
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            owner TEXT DEFAULT '',
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        """
    )

    # Project members table (project-level permissions)
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS project_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            username TEXT NOT NULL,
            role TEXT NOT NULL,          -- 'owner' | 'member' | 'viewer'
            created_at TEXT NOT NULL,
            UNIQUE (project_id, username),
            FOREIGN KEY (project_id) REFERENCES projects (id)
        );
        """
    )

    # Standups table
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS standups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            yesterday TEXT DEFAULT '',
            today TEXT NOT NULL,
            blockers TEXT DEFAULT '',
            created_at TEXT NOT NULL,
            project_id INTEGER,
            FOREIGN KEY (project_id) REFERENCES projects (id)
        );
        """
    )

    # Tasks table
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL,                 -- 'todo' | 'in_progress' | 'done' | 'blocked'
            project_id INTEGER,
            progress INTEGER NOT NULL DEFAULT 0,
            due_date TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            origin_standup_id INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects (id),
            FOREIGN KEY (origin_standup_id) REFERENCES standups (id)
        );
        """
    )

    # Backwards-compatible migration: add origin_standup_id to existing tasks table if missing.
    # SQLite does not support "ADD COLUMN IF NOT EXISTS", so we ignore failures.
    try:
        cur.execute("ALTER TABLE tasks ADD COLUMN origin_standup_id INTEGER")
    except Exception:
        # Column already exists or table did not exist prior to CREATE TABLE above.
        pass

    conn.commit()
    conn.close()

    # Helpful log so you always know which DB file is being used
    print(f"[DB] Initialized SQLite database at: {DB_PATH}")
