from __future__ import annotations

from pathlib import Path
from typing import List

import json
from fastapi import HTTPException, status

from app.schemas.task import TaskCreate, TaskEntry
from app.services.task_store import add_task

# TODO: adjust this path to where your generated seed file actually lives.
# For your current setup this should be correct:
TRAINING_TASKS_PATH = Path("/home/llm/devcell-training/export/tasks_seed.json")


def load_training_seeds(path: Path = TRAINING_TASKS_PATH) -> list[dict]:
    """
    Load the seed tasks JSON produced by devcell-training/build_seed_tasks.py.

    Expected format:
    {
      "items": [
        {
          "title": "...",
          "description": "...",
          "status": "todo",
          "project_name": "Malware Dev Training",
          "tags": [...],
          "progress": 0,
          "is_active": true
        },
        ...
      ]
    }
    """
    if not path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Seed tasks file not found at {path}",
        )

    try:
        raw = path.read_text(encoding="utf-8")
        data = json.loads(raw)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read or parse seed file: {e}",
        )

    items = data.get("items")
    if not isinstance(items, list):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Seed file format invalid: missing 'items' list",
        )

    return items


def import_training_tasks(owner: str) -> List[TaskEntry]:
    """
    Import all training seed tasks for the given owner.

    - Reads devcell-training/export/tasks_seed.json
    - For each item, maps into TaskCreate and calls add_task(...)
    - Returns the list of created TaskEntry objects.
    """
    seeds = load_training_seeds()
    created: List[TaskEntry] = []

    for item in seeds:
        # devcell-training seeds don't have project_id/due_date/origin_standup_id.
        # Pydantic will happily default / accept None.
        payload = TaskCreate(
            title=item["title"],
            description=item.get("description", ""),
            status=item.get("status", "todo"),
            project_id=None,  # You can later map project_name -> project_id if you want.
            progress=item.get("progress", 0),
            due_date=None,
            is_active=item.get("is_active", True),
            origin_standup_id=None,
        )

        # Your existing task_store.add_task(owner, data=TaskCreate)
        created_task = add_task(owner=owner, data=payload)
        created.append(created_task)

    return created
