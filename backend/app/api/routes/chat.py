from fastapi import APIRouter
from pydantic import BaseModel
from app.core.llm_client import llm_chat


router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    messages = [
        {
            "role": "system",
            "content": "You are an internal assistant helping developers in a military unit. Be concise and practical.",
        },
        {"role": "user", "content": request.message},
    ]
    reply = await llm_chat(messages)
    return ChatResponse(reply=reply)
