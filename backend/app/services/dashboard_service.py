# filename: backend/app/services/dashboard_service.py
from pathlib import Path
from typing import Tuple

from app.services.standup_store import get_today_standups
from app.services.projects import list_projects
from app.services.chat_service import chat_with_optional_rag
from app.core.llm_client import llm_chat
from app.services.knowledge import KNOWLEDGE_DIR


def _count_knowledge_docs() -> int:
    """
    Count simple text/markdown docs under the Knowledgebase directory.

    This is a lightweight metric used in the dashboard summary. It does not
    inspect the vector store directly; it just counts files on disk in
    KNOWLEDGE_DIR.
    """
    if not KNOWLEDGE_DIR.exists():
        return 0
    count = 0
    for ext in ("*.txt", "*.md"):
        count += len(list(KNOWLEDGE_DIR.rglob(ext)))
    return count


async def summarize_dashboard(use_rag: bool = False) -> Tuple[str, int, int, int]:
    """
    Build a high-level summary of today's activity:
    - standups
    - projects
    - knowledgebase size

    Returns (summary, standup_count, project_count, knowledge_docs).

    Behavior:
    - If use_rag = False: use the original standalone llm_chat prompt.
    - If use_rag = True: call the unified chat_with_optional_rag(...) helper,
      which may also pull Knowledgebase context.
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

    # -------------------------------------------------------------------------
    # No-RAG path: keep original behavior
    # -------------------------------------------------------------------------
    if not use_rag:
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

    # -------------------------------------------------------------------------
    # RAG path: reuse unified chat + KB pipeline
    # -------------------------------------------------------------------------
    # We use the chat service with:
    # - mode="docs" to get structured, doc-like output
    # - use_rag=True to allow KB enrichment
    # - notes carrying the full current context
    message = (
        "Generate a concise SITREP-style dashboard summary for today's activity. "
        "Focus on developer unit status, notable wins, blockers, and anything "
        "leadership should know."
    )

    notes = (
        "Here is the current DevCell context (standups, projects, knowledgebase):\n\n"
        f"{context_text}\n\n"
        "Use this context as ground truth. If Knowledgebase RAG adds additional "
        "relevant information, you may incorporate it, but do not hallucinate "
        "details that are not supported by either this context or the KB."
    )

    result = await chat_with_optional_rag(
        message=message,
        use_rag=True,
        mode="docs",
        notes=notes,
    )

    summary_text = result["reply"]
    return summary_text, standup_count, project_count, knowledge_docs
