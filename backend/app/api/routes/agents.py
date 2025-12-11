# backend/app/api/routes/agents.py

from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.agents.sdlc_demo import sdlc_orchestrator

router = APIRouter()


ModeLiteral = Literal["feature", "pr_review", "bug"]


class SdlcDemoRequest(BaseModel):
    mode: ModeLiteral = Field(..., description="feature | pr_review | bug")
    input: str = Field(..., description="Feature request, PR diff, or bug report")
    # Optional place for future: pr_diff, logs, etc.


class SdlcDemoResponse(BaseModel):
    mode: ModeLiteral
    transcript: list[dict]
    artifacts: dict


@router.post("/sdlc_demo", response_model=SdlcDemoResponse)
async def run_sdlc_demo(req: SdlcDemoRequest):
    if not req.input.strip():
        raise HTTPException(status_code=400, detail="Input cannot be empty")

    result = await sdlc_orchestrator.run(
        mode=req.mode,
        user_input=req.input,
        extra_payload={},
    )
    return result
