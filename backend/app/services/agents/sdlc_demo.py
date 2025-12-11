# backend/app/services/agents/sdlc_demo.py

from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict, List, Literal, Optional

from app.core.llm_client import llm_chat


Mode = Literal["feature", "pr_review", "bug"]


@dataclass
class AgentResult:
    agent: str
    message: str
    data: Dict[str, Any]


class Agent:
    def __init__(self, name: str, system_prompt: str):
        self.name = name
        self.system_prompt = system_prompt

    async def run(
        self,
        user_input: str,
        context: Dict[str, Any],
        instructions: str = "",
    ) -> AgentResult:
        """
        Call the LLM with a system prompt + context + user_input.
        Uses the llm_chat function from app.core.llm_client.
        """
        messages = [
            {
                "role": "system",
                "content": self.system_prompt.strip(),
            },
        ]

        # Provide prior context as a compact summary
        if context:
            messages.append(
                {
                    "role": "system",
                    "content": (
                        "Context from previous agents:\n"
                        f"{context.get('summary', '')}"
                    ).strip(),
                }
            )

        # Optional extra instructions for this specific hop
        if instructions:
            messages.append(
                {
                    "role": "system",
                    "content": instructions.strip(),
                }
            )

        # Treat the original input as user message
        messages.append({"role": "user", "content": user_input})

        # Call the LLM via llm_chat
        try:
            response_text = await llm_chat(messages)
        except Exception as e:
            # Hard failure talking to LLM server — present a clean message
            response_text = (
                f"{self.name} agent encountered an internal LLM error. Please check the LLM logs."
            )

        # Handle the case where llm_chat itself returned an error string
        if isinstance(response_text, str) and response_text.strip().startswith("[LLM server error"):
            if self.name == "tester":
                # Friendlier placeholder for the demo so leadership sees a test plan
                response_text = (
                    "## Test Plan (fallback)\n"
                    "- NOTE: Test Engineer agent hit an internal LLM error.\n"
                    "- Manually verify:\n"
                    "  - Creating tasks with MITRE ATT&CK techniques.\n"
                    "  - Updating tasks and ensuring tags persist.\n"
                    "  - Filtering reports by technique.\n"
                )
            else:
                response_text = (
                    f"{self.name} agent encountered an internal LLM error. "
                    "See LLM server logs for details."
                )

        # For now we treat entire response as plain text, and also
        # store it into context["summary"] for the next agent
        return AgentResult(
            agent=self.name,
            message=response_text,
            data={"raw": response_text},
        )


# === Agent definitions (system prompts) ======================

PRODUCT_OWNER_PROMPT = """
You are the Product Owner Agent. Convert the request into clear requirements.

## User Story
- As a ...
- I want ...
- So that ...

## Acceptance Criteria
- ...

## Assumptions
- ...
"""

ARCHITECT_PROMPT = """
You are the Architect Agent. Design the technical approach.

## Data Model Changes
- ...

## Backend API Changes
- ...

## Frontend UI Changes
- ...

## Technical Risks
- ...
"""

IMPLEMENTATION_PLANNER_PROMPT = """
You are the Implementation Planner. Break the design into tasks.

## Backend Tasks
- ...

## Frontend Tasks
- ...

## Testing Tasks
- ...

## Effort Estimate
- S/M/L per workstream
"""

TEST_ENGINEER_PROMPT = """
You are the Test Engineer Agent. Generate a concise test plan.

Keep it short and structured:

## User-Level Scenarios
- ...

## API / Backend Tests
- ...

## Edge Cases
- ...

## Data / Permission Checks
- ...
"""

CODE_REVIEWER_PROMPT = """
You are the Code Reviewer Agent. Review the PR concisely.

## Key Issues
- ...

## Bugs / Edge Cases
- ...

## Recommendations
- ...
"""

SECURITY_REVIEW_PROMPT = """
You are the Security Reviewer. Do a lightweight threat analysis.

## Key Risks
- ...

## Validation Issues
- ...

## Mitigations
- ...
"""

BUG_TRIAGE_PROMPT = """
You are the Triage Agent. Classify the bug briefly.

## Severity
- Low / Medium / High / Critical

## Scope of Impact
- ...

## Affected Modules
- ...
"""

ROOT_CAUSE_PROMPT = """
You are the Root Cause Analyst. Propose 2-3 likely causes.

For each hypothesis:
- Hypothesis
- Evidence
- How to confirm
"""

FIX_PLANNER_PROMPT = """
You are the Fix Planner. Create a remediation plan.

## Fix Steps
- ...

## Affected Components
- ...

## Risks
- ...
"""

REGRESSION_TEST_PROMPT = """
You are the Regression Tester. Define tests to prevent recurrence.

## Test Scenarios
- ...

## Automation Ideas
- ...
"""

REPORTER_PROMPT = """
You are the Reporter Agent. Produce a clean executive summary for leadership.
Rules:
- No markdown headers
- Use short bullet points
- Keep the entire output under 7 bullets
- Focus on business value, mission impact, risks, and required decisions
- Remove technical details unless essential
Your goal is to brief a commander, not a developer.
"""


class SdlcMultiAgentOrchestrator:
    """
    Multi-agent SDLC orchestrator for demo purposes.
    """

    def __init__(self):
        # Feature mode agents
        self.product_owner = Agent("product_owner", PRODUCT_OWNER_PROMPT)
        self.architect = Agent("architect", ARCHITECT_PROMPT)
        self.impl_planner = Agent("planner", IMPLEMENTATION_PLANNER_PROMPT)
        self.test_engineer = Agent("tester", TEST_ENGINEER_PROMPT)

        # PR review mode agents
        self.code_reviewer = Agent("code_reviewer", CODE_REVIEWER_PROMPT)
        self.security_reviewer = Agent("security_reviewer", SECURITY_REVIEW_PROMPT)

        # Bug mode agents
        self.bug_triage = Agent("bug_triage", BUG_TRIAGE_PROMPT)
        self.root_cause = Agent("root_cause", ROOT_CAUSE_PROMPT)
        self.fix_planner = Agent("fix_planner", FIX_PLANNER_PROMPT)
        self.regression_tester = Agent("regression_tester", REGRESSION_TEST_PROMPT)

        # Final reporter (all modes)
        self.reporter = Agent("reporter", REPORTER_PROMPT)

    async def run(
        self,
        mode: Mode,
        user_input: str,
        extra_payload: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        context: Dict[str, Any] = {"summary": ""}
        transcript: List[Dict[str, Any]] = []

        async def step(agent: Agent, instructions: str = ""):
            nonlocal context
            result = await agent.run(
                user_input=user_input,
                context=context,
                instructions=instructions,
            )
            # Append to transcript
            transcript.append(
                {
                    "agent": result.agent,
                    "message": result.message,
                }
            )
            # Update running summary
            context["summary"] += f"\n[{result.agent}]\n{result.message}\n"

            return result

        # === Mode: feature ====================================
        if mode == "feature":
            r1 = await step(self.product_owner)
            r2 = await step(self.architect)
            r3 = await step(self.impl_planner)
            r4 = await step(self.test_engineer)
            r5 = await step(self.reporter)

            artifacts = {
                "user_story": r1.message,
                "design": r2.message,
                "tasks": r3.message,
                "test_plan": r4.message,
                "summary": r5.message,
            }

        # === Mode: pr_review ==================================
        elif mode == "pr_review":
            # user_input should contain PR description + diff
            r1 = await step(self.code_reviewer)
            r2 = await step(self.security_reviewer)
            r3 = await step(self.test_engineer)
            r4 = await step(self.impl_planner)  # as refactor planner
            r5 = await step(self.reporter)

            artifacts = {
                "review_findings": r1.message,
                "security_findings": r2.message,
                "test_plan": r3.message,
                "refactor_plan": r4.message,
                "summary": r5.message,
            }

        # === Mode: bug ========================================
        elif mode == "bug":
            r1 = await step(self.bug_triage)
            r2 = await step(self.root_cause)
            r3 = await step(self.fix_planner)
            r4 = await step(self.regression_tester)
            r5 = await step(self.reporter)

            artifacts = {
                "triage": r1.message,
                "root_cause": r2.message,
                "fix_plan": r3.message,
                "regression_tests": r4.message,
                "summary": r5.message,
            }
        else:
            raise ValueError(f"Unsupported mode: {mode}")

        return {
            "mode": mode,
            "transcript": transcript,
            "artifacts": artifacts,
        }


# Singleton orchestrator you can import in the router
sdlc_orchestrator = SdlcMultiAgentOrchestrator()
