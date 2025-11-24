import sqlite3
from pathlib import Path

from app.db import init_db, DB_PATH


def test_init_db_creates_file_and_tables(tmp_path, monkeypatch):
    # Redirect DB_PATH to a temp file
    temp_db = tmp_path / "test_devcell.db"

    # Monkeypatch DB_PATH in module
    monkeypatch.setattr("app.db.DB_PATH", temp_db)

    # Call init_db and assert file is created
    init_db()
    assert temp_db.exists()

    # Connect and check tables exist
    conn = sqlite3.connect(temp_db)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = {row[0] for row in cur.fetchall()}
    expected = {"users", "sessions", "projects", "standups"}
    assert expected.issubset(tables)
    conn.close()
