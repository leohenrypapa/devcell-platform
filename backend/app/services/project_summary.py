from typing import Tuple

from app.services.projects import get_project_by_id
from app.services.standup_store import get_today_standups_for_project
from app.core.llm_client import llm_chat


async def summarize_project_today(project_id: int) -> Tuple[str, int, str]:
    """
    Summarize today's standups for a single project.
    Returns (summary_text, count_of_entries, project_name).
    """
    project = get_project_by_id(project_id)
    if project is None:
        return "Project not found.", 0, ""

    entries = get_today_standups_for_project(project_id)
    project_name = project.name

    if not entries:
        return f"No standups submitted today for project '{project_name}'.", 0, project_name

    lines = []
    for s in entries:
        lines.append(f"Name: {s.name}")
        if s.yesterday:
            lines.append(f"  Yesterday: {s.yesterday}")
        lines.append(f"  Today: {s.today}")
        if s.blockers:
            lines.append(f"  Blockers: {s.blockers}")
        lines.append("")

    text = "\n".join(lines)

    system_prompt = (
        "You are summarizing work on a single software project based on daily standups.\n"
        "Write a concise summary focused on this project only.\n"
        "Include:\n"
        "- Overall status\n"
        "- Notable progress\n"
        "- Blockers or risks\n"
        "Keep it brief and practical."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": f"Project: {project_name}\n\nHere are today's standups:\n\n{text}",
        },
    ]

    summary = await llm_chat(messages)
    return summary, len(entries), project_name
