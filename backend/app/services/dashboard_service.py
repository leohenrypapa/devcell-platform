from pathlib import Path
from typing import Tuple

from app.services.standup_store import get_today_standups
from app.services.projects import list_projects
from app.core.llm_client import llm_chat


BASE_DIR = Path(__file__).resolve().parents[3]
KNOWLEDGE_BASE_DIR = BASE_DIR / "knowledgebase"


def _count_knowledge_docs() -> int:
    if not KNOWLEDGE_BASE_DIR.exists():
        return 0
    count = 0
    for ext in ("*.txt", "*.md"):
        count += len(list(KNOWLEDGE_BASE_DIR.rglob(ext)))
    return count


async def summarize_dashboard() -> Tuple[str, int, int, int]:
    """
    Build a high-level summary of today's activity:
    - standups
    - projects
    - knowledgebase size
    Returns (summary, standup_count, project_count, knowledge_docs)
    """
    standups = get_today_standups()
    projects = list_projects()
    knowledge_docs = _count_knowledge_docs()

    standup_count = len(standups)
    project_count = len(projects)

    # If nothing at all, no need to bother the LLM
    if standup_count == 0 and project_count == 0 and knowledge_docs == 0:
        return (
            "No activity yet: no standups, no projects, and an empty knowledgebase.",
            standup_count,
            project_count,
            knowledge_docs,
        )

    # Build text summary for the LLM as context
    lines = []

    if standup_count > 0:
        lines.append("TODAY'S STANDUPS:")
        for s in standups:
            lines.append(f"- {s.name}:")
            if s.yesterday:
                lines.append(f"    Yesterday: {s.yesterday}")
            lines.append(f"    Today: {s.today}")
            if s.blockers:
                lines.append(f"    Blockers: {s.blockers}")
        lines.append("")

    if project_count > 0:
        lines.append("PROJECTS:")
        for p in projects:
            lines.append(f"- {p.name} [{p.status}] (owner: {p.owner or 'unknown'})")
            if p.description:
                lines.append(f"    {p.description}")
        lines.append("")

    lines.append(f"KNOWLEDGEBASE: {knowledge_docs} document(s) in knowledgebase/")
    context_text = "\n".join(lines)

    system_prompt = (
        "You are a technical lead in a small developer unit.\n"
        "You will be given today's standups, current projects, and knowledgebase size.\n"
        "Write a short dashboard summary that could be used as a SITREP / status update.\n"
        "Include:\n"
        "- Overall status in a few bullet points\n"
        "- Notable progress or wins\n"
        "- Blockers or risks\n"
        "- Anything that needs leadership attention\n"
        "Be concise and practical."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": f"Here is the current context:\n\n{context_text}",
        },
    ]

    summary_text = await llm_chat(messages)
    return summary_text, standup_count, project_count, knowledge_docs
