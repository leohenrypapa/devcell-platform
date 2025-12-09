from typing import Any, Dict, List

from app.core.llm_client import llm_chat
from app.schemas.knowledge import KnowledgeSourceChunk
from app.services.knowledge import query_knowledge as kb_query_knowledge


async def query_knowledge(question: str, n_results: int = 3) -> Dict[str, Any]:
    """
    Compatibility wrapper around the unified Knowledgebase + RAG subsystem.

    This function preserves the old `app.services.rag.query_knowledge(...)`
    signature but delegates all retrieval to the knowledge service and uses
    the shared llm_chat() helper for the LLM call.

    Returns:
        {
            "answer": str,
            "sources": List[str],  # document_ids for the chunks used
        }
    """
    # 1) Retrieve semantic matches from the unified KB collection
    sources: List[KnowledgeSourceChunk] = kb_query_knowledge(
        query=question,
        top_k=n_results,
    )

    # If no docs at all, just fall back to a plain chat-style answer
    if not sources:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are an internal assistant helping developers in a "
                    "military unit. Be concise and practical."
                ),
            },
            {"role": "user", "content": question},
        ]
        answer = await llm_chat(messages)
        return {"answer": answer, "sources": []}

    # 2) Build context from retrieved chunks
    context_blocks = []
    for idx, s in enumerate(sources, start=1):
        context_blocks.append(
            f"[Source {idx} - {s.title}]\n{s.snippet}\n"
        )
    context_text = "\n\n".join(context_blocks)

    # 3) RAG-style prompt
    messages = [
        {
            "role": "system",
            "content": (
                "You are an internal assistant helping developers in a military unit.\n"
                "Use the following knowledge base context to answer the user's question.\n"
                "If the answer cannot be found in the context, say so clearly.\n\n"
                f"CONTEXT:\n{context_text}"
            ),
        },
        {"role": "user", "content": question},
    ]

    # 4) Call shared LLM helper
    answer = await llm_chat(messages)

    # Export chunk identifiers as legacy 'sources'
    source_ids = [s.document_id for s in sources]
    return {"answer": answer, "sources": source_ids}
