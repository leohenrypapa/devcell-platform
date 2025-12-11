# backend/scripts/seed_demo_knowledge_docs.py

from pathlib import Path
from textwrap import dedent

def main() -> None:
    # 👇 This is the directory the backend knowledge service actually uses
    #    (backend/app/knowledgebase/notes).
    # If you instead want to seed ~/devcell-platform/backend/Knowledgebase,
    # change this to: base_dir = Path(__file__).resolve().parent.parent / "Knowledgebase"
    base_dir = (
        Path(__file__)
        .resolve()
        .parent  # scripts/
        .parent  # backend/
        / "app"
        / "knowledgebase"
        / "notes"
    )

    base_dir.mkdir(parents=True, exist_ok=True)

    docs = {
        "sop-devcell-sdlc-demo-workflow.md": dedent(
            """
            # SOP: DevCell SDLC Demo Workflow

            This document describes how to run the end-to-end SDLC demo
            in the DevCell Platform for leadership or visitors.

            ## 1. Demo Goals

            - Show how **tasks, projects, standups, training, and knowledge** connect
            - Highlight **multi-agent automation** for requirements → tasks → reviews
            - Prove that DevCell works on a **single laptop** in an offline environment

            ## 2. Recommended Demo Flow

            1. **Login as Admin**
               - Show user management and demo accounts.
            2. **Switch to Projects**
               - Open the “Malware Training Pipeline” project.
               - Point out project members and roles (owner/member/viewer).
            3. **Open Tasks**
               - Filter by project to show realistic task backlog.
               - Demonstrate status changes and progress updates.
            4. **Run a Standup**
               - Create a standup entry and auto-generate tasks.
            5. **Open Training**
               - Show the malware training syllabus and seed tasks.
            6. **Use Knowledge Base**
               - Ask “How do I run the DevCell SDLC demo?” and show RAG answers.

            ## 3. Key Talking Points

            - Everything runs **locally** with **SQLite + local LLM**.
            - DevCell is a **developer assistant platform**, not just a chat UI.
            - Workflows match real cyber dev processes: tickets, sprints, training, SOPs.

            """
        ),

        "guide-using-dashboard-for-daily-ops.md": dedent(
            """
            # Guide: Using the DevCell Dashboard for Daily Ops

            The dashboard is the **home screen** for an individual developer.
            It aggregates tasks, standup summaries, and AI-generated SITREPs.

            ## What You See

            - **Today’s Tasks**: High-priority tasks due today or this week.
            - **Recent Activity**: New tasks, project updates, and training events.
            - **Standup Summary**: LLM-generated summary of your last standup entries.
            - **SITREP Block**: Optional markdown summary for leadership briefs.

            ## Daily Battle Rhythm

            1. Start the day on the **Dashboard**.
            2. Skim SITREP + standup summary.
            3. Jump into **Tasks** or **Training** depending on the plan.
            4. End the day by updating **Standup** → which feeds back into dashboard.

            ## Demo Tips

            - For leadership, emphasize that this view can be used as a **single pane of glass**
              for an individual developer’s workload.
            - For developers, emphasize that the system reduces context switching:
              they don’t need three different tools just to start working.
            """
        ),

        "playbook-incident-handling-with-devcell.md": dedent(
            """
            # Playbook: Using DevCell During an Incident Exercise

            This playbook shows how to use DevCell during a blue-team or incident
            response exercise.

            ## 1. Before the Exercise

            - Create a project: **“Incident Exercise – <Date>”**
            - Add members from the exercise crew.
            - Link any pre-read documents into the **Knowledge Base**.

            ## 2. During the Exercise

            - Log investigation actions as **tasks** under the incident project.
            - Use **standups** as quick “mini-debriefs” each hour:
              - What did we try?
              - What did we find?
              - What’s next?
            - Attach notes and artifacts in RAG-indexed docs for later review.

            ## 3. After the Exercise

            - Use the **Dashboard SITREP** as a starting point for the formal report.
            - Summarize the exercise using the template:
              `template-incident-exercise-summary-*.md` in the Knowledgebase.
            - Feed lessons learned back into **training** and **checklists**.

            ## Demo Angle

            For demo purposes, you don’t need a live incident. Just walk through
            the workflow so leadership can see how DevCell would be used in a real event.
            """
        ),

        "training-malware-phase1-week1-notes.md": dedent(
            """
            # Training Notes: Malware Track – Phase 1, Week 1

            **Focus:** Lab environment setup, basic Windows internals, and safety.

            ## Objectives

            - Stand up an isolated malware lab (VM snapshots, network isolation).
            - Review Windows process model and basic syscalls.
            - Learn DevCell training workflow and how tasks are auto-generated.

            ## Lab Ideas

            - Build a **Hello-World keylogger** in a safe, simulated environment.
            - Use DevCell tasks to track:
              - “Set up Windows VM snapshot”
              - “Instrument basic process monitor”
              - “Document lab safety checklist”

            ## Integration with DevCell

            - Roadmap text → **JSON training units** → **seeded tasks** per week.
            - Students see training tasks in their **Tasks** view, not a separate system.
            """
        ),

        "training-malware-phase2-week5-notes.md": dedent(
            """
            # Training Notes: Malware Track – Phase 2, Week 5

            **Focus:** Evasion techniques and defensive telemetry.

            ## Objectives

            - Explore common AV / EDR detection methods.
            - Implement simple evasion patterns in the lab (no real operations).
            - Capture telemetry and reason about defender visibility.

            ## Suggested Tasks

            - “Survey current EDR hooks and logging points”
            - “Modify lab malware sample to change process tree behavior”
            - “Document detection opportunities for blue team”

            ## Demo Usage

            During a demo, you can show:

            - The **training syllabus** for the malware track.
            - Week 5 tasks auto-generated for a specific trainee.
            - How these tasks appear side-by-side with project work.
            """
        ),

        "cheatsheet-devcell-urls-and-shortcuts.md": dedent(
            """
            # Cheatsheet: DevCell URLs & Shortcuts

            This cheatsheet is meant for new users coming into the platform.

            ## Core Pages

            - `/login` – Log in with username/password.
            - `/dashboard` – Personal dashboard and SITREP.
            - `/tasks` – All your tasks (filter by project/status).
            - `/projects` – Project list, members, and status.
            - `/standups` – Private standup entries and summaries.
            - `/training` – Training syllabus and seed tasks.
            - `/knowledge` – Ask questions + manage KB documents.
            - `/admin` – Admin-only user/project management.

            ## Keyboard / Workflow Tips

            - Keep DevCell open in one browser window all day.
            - Use **browser tabs**: one for Dashboard, one for Tasks, one for Knowledge.
            - Update standup notes continuously instead of once per day.
            """
        ),

        "faq-devcell-common-issues.md": dedent(
            """
            # FAQ: Common DevCell Issues (Demo Environment)

            These are the most common questions/issues during demos and onboarding.

            ## 1. “I can’t log in from another computer”

            - Check that the backend is bound to `0.0.0.0` instead of `127.0.0.1`.
            - Confirm you are using the correct **IP + port** (e.g. `http://192.168.x.x:9000`).
            - Ensure firewall rules allow access on that port.

            ## 2. “The Knowledge Base returns no documents”

            - Verify that `app/knowledgebase/notes` contains markdown/text files.
            - Run the **knowledge diagnostics** endpoints if available.
            - Re-ingest or restart the backend so embeddings are rebuilt.

            ## 3. “Tasks look empty”

            - For demos, run the **demo seeding script** to create:
              - Multiple users
              - Projects
              - Tasks across different statuses
              - Standup entries and training tasks

            ## 4. “The LLM feels slow”

            - Confirm the GPU is being used (if available).
            - Reduce `use_rag` if context is not needed.
            """
        ),

        "roadmap-devcell-ai-modernization.md": dedent(
            """
            # Roadmap: DevCell AI Modernization (High Level)

            This roadmap is intentionally high-level and suitable for leadership briefings.

            ## 0–90 Days: Foundation

            - Stabilize auth, projects, tasks, and training flows.
            - Stand up local LLM and RAG stack.
            - Migrate key SOPs and guides into the Knowledge Base.
            - Deliver the **SDLC multi-agent demo** as a flagship use case.

            ## 90–180 Days: Expansion

            - Add more automation agents (testing, documentation, SITREP drafting).
            - Integrate DevCell into existing CPB workflows and ticketing.
            - Build out more training tracks (Windows, Linux, exploit dev).

            ## 180+ Days: Scale

            - Package DevCell as an internal **AI software factory** platform.
            - Support multiple crews and mission teams from a shared baseline.
            - Harden deployment, monitoring, and backup processes.

            ## Demo Usage

            During a brief, you can show this document as the “north star” for where
            DevCell is going, not just what exists today.
            """
        ),
    }

    created = 0
    for filename, content in docs.items():
        path = base_dir / filename
        if path.exists():
            print(f"[skip] {path} already exists")
            continue
        path.write_text(content.strip() + "\n", encoding="utf-8")
        print(f"[ok]   wrote {path}")
        created += 1

    print(f"\nDone. Created {created} new knowledge docs under: {base_dir}")


if __name__ == "__main__":
    main()
