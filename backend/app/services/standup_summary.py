from datetime import date as date_cls
from typing import Tuple, List

from app.services.standup_store import get_today_standups, get_standups_for_date
from app.services.task_store import list_tasks
from app.core.llm_client import llm_chat


async def summarize_standups_for_date(target_date: date_cls) -> Tuple[str, int]:
    """
    Build a combined text summary of standups and active tasks for a given date.
    Returns (summary_text, count_of_entries).
    """
    # Choose how to load standups based on date
    if target_date == date_cls.today():
        standups = get_today_standups()
    else:
        standups = get_standups_for_date(target_date)

    if not standups:
        return f"No standups submitted for {target_date.isoformat()}.", 0

    # ------------------------------------------------------------------
    # Build standup text block
    # ------------------------------------------------------------------
    standup_lines: List[str] = []
    for s in standups:
        standup_lines.append(f"Name: {s.name}")
        if s.yesterday:
            standup_lines.append(f"Yesterday: {s.yesterday}")
        if s.today:
            standup_lines.append(f"Today: {s.today}")
        if s.blockers:
            standup_lines.append(f"Blockers: {s.blockers}")
        standup_lines.append("")  # blank line between entries

    standup_text = "\n".join(standup_lines)

    # ------------------------------------------------------------------
    # Build tasks text block (active tasks per person)
    # ------------------------------------------------------------------
    owners = sorted({s.name for s in standups if s.name})
    task_lines: List[str] = []

    for owner in owners:
        tasks = list_tasks(owner=owner, active_only=True)
        if not tasks:
            continue

        task_lines.append(f"Owner: {owner}")
        for t in tasks:
            project_label = t.project_name or "n/a"
            task_lines.append(
                f"- [{t.status}][{t.progress}%] {t.title} (project: {project_label})"
            )
        task_lines.append("")  # blank line between owners

    if task_lines:
        tasks_text = "\n".join(task_lines)
    else:
        tasks_text = "No active tasks for these owners."

    # ------------------------------------------------------------------
    # LLM prompt
    # ------------------------------------------------------------------
    system_prompt = (
        "You are an assistant that summarizes daily standups and related tasks for an engineering team. "
        "Generate a concise but useful summary that:\n"
        "- Groups information by person and/or project where helpful.\n"
        "- Highlights progress, key accomplishments, and important blockers.\n"
        "- Mentions urgent or cross-team dependencies.\n"
        "- Uses short paragraphs or bullet points, not one long wall of text.\n"
    )

    date_label = target_date.isoformat()

    user_content = (
        f"Date: {date_label}\n\n"
        f"Here are the standup entries for this date:\n\n{standup_text}\n\n"
        f"Here are the active tasks for the people above:\n\n{tasks_text}"
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]

    summary = await llm_chat(messages)
    return summary, len(standups)


async def summarize_today_standups() -> Tuple[str, int]:
    """
    Backwards-compatible helper for 'today' summary.
    """
    return await summarize_standups_for_date(date_cls.today())
