from pathlib import Path
import sqlite3

from typing import Iterator

BASE_DIR = Path(__file__).resolve().parents[2]
DB_PATH = BASE_DIR / "devcell.db"


def get_connection() -> sqlite3.Connection:
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

    conn.commit()
    conn.close()
