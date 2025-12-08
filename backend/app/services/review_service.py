from app.core.llm_client import llm_chat
from app.schemas.review import CodeReviewRequest


async def generate_code_review(request: CodeReviewRequest) -> str:
    """
    Ask the LLM to review the given code snippet or diff.
    """

    language_str = request.language or "code"
    focus_str = request.focus or "general"

    description_part = (
        f"\nAdditional context from the developer:\n{request.description}\n"
        if request.description
        else ""
    )

    system_prompt = (
        "You are a senior software engineer and code reviewer.\n"
        "You are reviewing code written by developers in a military / enterprise environment.\n"
        "Provide constructive, concise feedback.\n"
        "Focus on correctness, readability, maintainability, security, and potential bugs.\n"
        "If the user asked for a specific focus (e.g., security), prioritize that.\n"
        "Organize your response with short sections and bullet points.\n"
    )

    user_prompt = (
        f"Language / context: {language_str}\n"
        f"Review focus: {focus_str}\n"
        f"{description_part}\n"
        "Here is the code or diff to review:\n\n"
        f"{request.code}"
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    review_text = await llm_chat(messages)
    return review_text
