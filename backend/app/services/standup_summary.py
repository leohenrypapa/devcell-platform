from typing import Tuple, List

from app.services.standup_store import get_today_standups
from app.services.task_store import list_tasks
from app.core.llm_client import llm_chat


async def summarize_today_standups() -> Tuple[str, int]:
    """
    Build a combined text summary of today's standups and active tasks.
    Returns (summary_text, count_of_entries).
    """
    standups = get_today_standups()
    if not standups:
        return "No standups submitted yet today.", 0

    # ---------------------------------------------------------------------
    # 1. BUILD STANDUP TEXT BLOCK
    # ---------------------------------------------------------------------
    standup_lines: List[str] = []
    for s in standups:
        standup_lines.append(f"Name: {s.name}")
        if s.yesterday:
            standup_lines.append(f"  Yesterday: {s.yesterday}")
        standup_lines.append(f"  Today: {s.today}")
        if s.blockers:
            standup_lines.append(f"  Blockers: {s.blockers}")
        standup_lines.append("")

    standup_text = "\n".join(standup_lines)

    # ---------------------------------------------------------------------
    # 2. BUILD TASK TEXT BLOCK
    # ---------------------------------------------------------------------
    # Fetch ALL active tasks for today’s standup authors
    user_list = {s.name for s in standups}

    task_lines: List[str] = []
    task_lines.append("=== ACTIVE TASKS ===\n")

    for username in sorted(user_list):
        tasks = list_tasks(owner=username, active_only=True)

        if not tasks:
            continue

        task_lines.append(f"{username}:")
        for t in tasks:
            proj = f"[{t.project_name}] " if t.project_name else ""
            status = t.status.replace("_", " ").title()
            task_lines.append(
                f"  - {proj}{t.title} "
                f"(Status: {status}, Progress: {t.progress}%)"
            )
            if t.description:
                task_lines.append(f"      Desc: {t.description}")

            if t.status == "blocked":
                task_lines.append("      ⚠ BLOCKED")

        task_lines.append("")

    tasks_text = "\n".join(task_lines)

    # ---------------------------------------------------------------------
    # 3. COMBINED SYSTEM PROMPT
    # ---------------------------------------------------------------------
    system_prompt = (
        "You are an assistant summarizing daily progress for the DevCell developer unit.\n"
        "You will be given:\n"
        "1. Raw standup text (yesterday / today / blockers).\n"
        "2. Structured active task lists (per person, with status and progress).\n\n"
        "Produce a concise, high-signal summary containing:\n"
        "- Overall progress across the team in bullet points\n"
        "- Notable accomplishments\n"
        "- Task progress grouped by person\n"
        "- Blockers grouped by person (from both standups and tasks)\n"
        "- Any schedule risks, stalled work, or dependencies\n\n"
        "Tone: clear, factual, and suitable for a technical team lead or military officer.\n"
        "Do NOT simply rewrite the standups—synthesize the information.\n"
    )

    # ---------------------------------------------------------------------
    # 4. COMBINED MESSAGE TO LLM
    # ---------------------------------------------------------------------
    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": (
                f"Here are today's standups:\n\n{standup_text}\n\n"
                f"Here are today's active tasks:\n\n{tasks_text}"
            ),
        },
    ]

    summary = await llm_chat(messages)
    return summary, len(standups)
