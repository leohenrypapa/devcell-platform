from typing import Tuple

from app.services.standup_store import get_today_standups
from app.core.llm_client import llm_chat


async def summarize_today_standups() -> Tuple[str, int]:
    """
    Build a text summary of today's standups using the LLM.
    Returns (summary_text, count_of_entries).
    """
    entries = get_today_standups()
    if not entries:
        return "No standups submitted yet today.", 0

    # Build a plain-text representation of today's entries
    lines = []
    for s in entries:
        lines.append(f"Name: {s.name}")
        if s.yesterday:
            lines.append(f"  Yesterday: {s.yesterday}")
        lines.append(f"  Today: {s.today}")
        if s.blockers:
            lines.append(f"  Blockers: {s.blockers}")
        lines.append("")  # blank line between people

    standup_text = "\n".join(lines)

    system_prompt = (
        "You are an assistant summarizing daily standup reports for a small developer unit.\n"
        "You will be given multiple team member standups for today.\n"
        "Write a concise summary with:\n"
        "- Overall progress in bullet points\n"
        "- Notable accomplishments\n"
        "- Blockers grouped by person\n"
        "- Any risks or dependencies worth highlighting\n"
        "Keep it short and practical, as if writing a summary for a tech lead or military officer."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": f"Here are today's standups:\n\n{standup_text}",
        },
    ]

    summary = await llm_chat(messages)
    return summary, len(entries)
