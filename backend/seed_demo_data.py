import argparse
import sys
from typing import Dict, List
import requests

# ------------------------------------------------------------
# Config
# ------------------------------------------------------------

BASE_URL = "http://localhost:9000"  # overridden by --base-url
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "password"

# Feature toggles for demo seeding
ENABLE_USER_SEEDING = False          # disable noisy warnings; admin already exists
ENABLE_STANDUP_SEEDING = False       # disable 404 warnings until endpoints ready
ENABLE_TRAINING_SEEDING = False      # disable 404 warnings until endpoints ready

USERS_SEED = [
    {
        "username": "admin",
        "password": "password",
        "role": "admin",
        "display_name": "DevCell Admin",
        "job_title": "Platform Owner",
        "team_name": "CSD-D Dev Cell",
        "rank": "CPT",
        "skills": "FastAPI, React, LLMs, Program Mgmt",
    },
    {
        "username": "cpt_you",
        "password": "DemoPass!23",
        "role": "user",
        "display_name": "CPT You",
        "job_title": "Dev Cell Lead",
        "team_name": "CSD-D Dev Cell",
        "rank": "CPT",
        "skills": "Python, FastAPI, malware dev, training pipeline",
    },
    {
        "username": "ssg_kim",
        "password": "DemoPass!23",
        "role": "user",
        "display_name": "SSG Kim",
        "job_title": "Malware Developer",
        "team_name": "CSD-D Dev Cell",
        "rank": "SSG",
        "skills": "C#, .NET, Windows internals",
    },
    {
        "username": "cw3_mizer",
        "password": "DemoPass!23",
        "role": "admin",
        "display_name": "CW3 Mizer",
        "job_title": "Technical Lead",
        "team_name": "CSD-D Dev Cell",
        "rank": "CW3",
        "skills": "Reverse engineering, tooling, oversight",
    },
    {
        "username": "analyst_lee",
        "password": "DemoPass!23",
        "role": "user",
        "display_name": "Analyst Lee",
        "job_title": "Cyber Analyst",
        "team_name": "Blue Team",
        "rank": "SSG",
        "skills": "Incident analysis, DFIR, Sigma",
    },
    {
        "username": "dev_park",
        "password": "DemoPass!23",
        "role": "user",
        "display_name": "Dev Park",
        "job_title": "Full-Stack Dev",
        "team_name": "CSD-D Dev Cell",
        "rank": "SGT",
        "skills": "React, TypeScript, UI/UX",
    },
    {
        "username": "dev_garcia",
        "password": "DemoPass!23",
        "role": "user",
        "display_name": "Dev Garcia",
        "job_title": "Backend Dev",
        "team_name": "CSD-D Dev Cell",
        "rank": "SSG",
        "skills": "FastAPI, SQLite, API design",
    },
    {
        "username": "intern_cho",
        "password": "DemoPass!23",
        "role": "user",
        "display_name": "Intern Cho",
        "job_title": "Intern",
        "team_name": "CSD-D Dev Cell",
        "rank": None,
        "skills": "Python basics, documentation",
    },
    {
        "username": "qa_smith",
        "password": "DemoPass!23",
        "role": "user",
        "display_name": "QA Smith",
        "job_title": "QA / Tester",
        "team_name": "CSD-D Dev Cell",
        "rank": "CPL",
        "skills": "Test plans, regression testing, Selenium",
    },
    {
        "username": "ops_jones",
        "password": "DemoPass!23",
        "role": "user",
        "display_name": "Ops Jones",
        "job_title": "Operations",
        "team_name": "CPB Ops",
        "rank": "SFC",
        "skills": "Runbooks, SOPs, monitoring",
    },
]

PROJECTS_SEED = [
    {
        "name": "Automation Agents Lab",
        "description": "Sandbox for building and testing DevCell automation agents (multi-agent SDLC, code review, SITREP drafting).",
        "owner": "admin",  # for seeding; everything created as admin
        "members": [
            {"username": "dev_park", "role": "member"},
            {"username": "dev_garcia", "role": "member"},
            {"username": "qa_smith", "role": "viewer"},
        ],
    },
    {
        "name": "DevSecOps Pipeline Integration",
        "description": "Integrate DevCell with CI, security scans, and artifact tracking to support continuous delivery.",
        "owner": "admin",
        "members": [
            {"username": "ops_jones", "role": "member"},
            {"username": "analyst_lee", "role": "member"},
            {"username": "admin", "role": "owner"},
        ],
    },
    {
        "name": "Reporting & Analytics",
        "description": "Dashboards, metrics, and SITREP automation for leadership reporting.",
        "owner": "admin",
        "members": [
            {"username": "cpt_you", "role": "member"},
            {"username": "analyst_lee", "role": "member"},
            {"username": "intern_cho", "role": "member"},
        ],
    },
    {
        "name": "DevCell Platform Core",
        "description": "Core FastAPI + React platform for DevCell workflows.",
        "owner": "admin",
        "members": [
            {"username": "cpt_you", "role": "member"},
            {"username": "dev_park", "role": "member"},
            {"username": "dev_garcia", "role": "member"},
            {"username": "qa_smith", "role": "viewer"},
        ],
    },
    {
        "name": "Malware Training Pipeline",
        "description": "Phase 1–4 malware dev training syllabus + task seeding.",
        "owner": "cpt_you",
        "members": [
            {"username": "ssg_kim", "role": "member"},
            {"username": "intern_cho", "role": "member"},
            {"username": "admin", "role": "viewer"},
        ],
    },
    {
        "name": "SDLC Multi-Agent Demo",
        "description": "Multi-agent SDLC orchestration demo (requirements → test plan).",
        "owner": "dev_park",
        "members": [
            {"username": "admin", "role": "member"},
            {"username": "qa_smith", "role": "member"},
            {"username": "ops_jones", "role": "viewer"},
        ],
    },
    {
        "name": "Incident Exercise Lab",
        "description": "Blue-team incident response exercise environment and scripts.",
        "owner": "analyst_lee",
        "members": [
            {"username": "admin", "role": "member"},
            {"username": "cpt_you", "role": "member"},
            {"username": "ssg_kim", "role": "viewer"},
        ],
    },
    {
        "name": "Knowledgebase Modernization",
        "description": "Central knowledgebase, SOPs, and RAG content for DevCell.",
        "owner": "admin",
        "members": [
            {"username": "intern_cho", "role": "member"},
            {"username": "ops_jones", "role": "member"},
        ],
    },
]

# Tasks grouped by project_name and owner username
TASKS_SEED = [
    # DevCell Platform Core
        # More backlog for DevCell Platform Core
        # Automation Agents Lab
    {
        "project_name": "Automation Agents Lab",
        "owner": "admin",
        "tasks": [
            {
                "title": "Design agent catalog structure",
                "description": "Decide how to describe agents (inputs, outputs, tools, permissions) in DevCell.",
                "status": "in_progress",
                "progress": 50,
            },
            {
                "title": "Create sample 'task triage' agent",
                "description": "Agent that reads new tasks and suggests owner, priority, and tags.",
                "status": "todo",
                "progress": 0,
            },
            {
                "title": "Build SDLC orchestrator v2",
                "description": "Refine multi-agent SDLC demo with better logging and failure handling.",
                "status": "todo",
                "progress": 0,
            },
            {
                "title": "Document agent safety guidelines",
                "description": "Constraints for agents when interacting with real repos and systems.",
                "status": "todo",
                "progress": 0,
            },
        ],
    },
    # DevSecOps Pipeline Integration
    {
        "project_name": "DevSecOps Pipeline Integration",
        "owner": "admin",
        "tasks": [
            {
                "title": "Map current CI/CD stages",
                "description": "Inventory existing build, test, and deploy jobs for key projects.",
                "status": "in_progress",
                "progress": 30,
            },
            {
                "title": "Prototype DevCell CI widget",
                "description": "Show CI status and last failures for each project on the dashboard.",
                "status": "todo",
                "progress": 0,
            },
            {
                "title": "Integrate SAST/DAST results into DevCell",
                "description": "Pull security scan summaries into project view for quick triage.",
                "status": "todo",
                "progress": 0,
            },
            {
                "title": "Define DevSecOps KPIs",
                "description": "Lead time for change, deployment frequency, MTTR, and escaped defects.",
                "status": "todo",
                "progress": 0,
            },
        ],
    },
    # Reporting & Analytics
    {
        "project_name": "Reporting & Analytics",
        "owner": "admin",
        "tasks": [
            {
                "title": "Create leadership dashboard mockups",
                "description": "High-level views of projects, training progress, and automation coverage.",
                "status": "in_progress",
                "progress": 60,
            },
            {
                "title": "Implement per-project metrics endpoint",
                "description": "API that returns basic stats: open tasks, done tasks, WIP, and age.",
                "status": "todo",
                "progress": 0,
            },
            {
                "title": "Add weekly SITREP generator",
                "description": "Use local LLM to draft weekly summaries for each major project.",
                "status": "todo",
                "progress": 0,
            },
            {
                "title": "Baseline current team throughput",
                "description": "Measure current task completion rates to show impact of DevCell.",
                "status": "todo",
                "progress": 0,
            },
        ],
    },
    {
        "project_name": "DevCell Platform Core",
        "owner": "admin",
        "tasks": [
            {
                "title": "Add health/metrics endpoint",
                "description": "Expose /api/health and basic metrics to support monitoring.",
                "status": "todo",
                "progress": 0,
            },
            {
                "title": "Document API routes for internal users",
                "description": "Generate markdown docs for auth, tasks, projects, standups, and knowledge APIs.",
                "status": "in_progress",
                "progress": 30,
            },
            {
                "title": "Tune local LLM model settings",
                "description": "Experiment with temperature and context length settings for DevCell agents.",
                "status": "blocked",
                "progress": 10,
            },
        ],
    },
    # Extra malware training work
    {
        "project_name": "Malware Training Pipeline",
        "owner": "admin",
        "tasks": [
            {
                "title": "Create onboarding checklist for trainees",
                "description": "Step-by-step checklist that covers lab setup, accounts, and safety brief.",
                "status": "todo",
                "progress": 0,
            },
            {
                "title": "Record short intro video for Phase 1",
                "description": "5–7 minute intro to the malware training pipeline and expectations.",
                "status": "in_progress",
                "progress": 25,
            },
            {
                "title": "Collect feedback from initial cohort",
                "description": "Survey form + summary of what worked and what needs improvement.",
                "status": "todo",
                "progress": 0,
            },
        ],
    },
    # Extra SDLC multi-agent demo work
    {
        "project_name": "SDLC Multi-Agent Demo",
        "owner": "admin",
        "tasks": [
            {
                "title": "Create sample user stories for demo",
                "description": "Pre-built user stories for DevCell so the SDLC demo looks realistic.",
                "status": "done",
                "progress": 100,
            },
            {
                "title": "Add export to markdown for agent transcript",
                "description": "Allow leadership to download the full SDLC conversation and artifacts.",
                "status": "todo",
                "progress": 0,
            },
            {
                "title": "Polish error messages for failed runs",
                "description": "Handle tool/LLM failures gracefully and surface clear messages in UI.",
                "status": "in_progress",
                "progress": 50,
            },
        ],
    },
    # Extra incident lab work
    {
        "project_name": "Incident Exercise Lab",
        "owner": "admin",
        "tasks": [
            {
                "title": "Write red team inject guide",
                "description": "One-page guide explaining how and when to drop injects during the exercise.",
                "status": "in_progress",
                "progress": 40,
            },
            {
                "title": "Define scoring criteria for teams",
                "description": "How we measure success: detection time, containment time, quality of reporting.",
                "status": "todo",
                "progress": 0,
            },
            {
                "title": "Create after-action report template",
                "description": "Markdown template for incident AAR linked from DevCell knowledgebase.",
                "status": "todo",
                "progress": 0,
            },
        ],
    },
    # Extra KB modernization tasks
    {
        "project_name": "Knowledgebase Modernization",
        "owner": "admin",
        "tasks": [
            {
                "title": "Tag KB docs by track",
                "description": "Add tags for 'malware', 'platform', 'process', and 'training' to existing notes.",
                "status": "todo",
                "progress": 0,
            },
            {
                "title": "Add KB curation checklist",
                "description": "Checklist so each note is short, current, and has an owner.",
                "status": "in_progress",
                "progress": 20,
            },
            {
                "title": "Archive outdated legacy documents",
                "description": "Move outdated docs to an archive folder so RAG avoids noisy content.",
                "status": "todo",
                "progress": 0,
            },
        ],
    },
    {
        "project_name": "DevCell Platform Core",
        "owner": "admin",
        "tasks": [
            {
                "title": "Align DevCell architecture with ADRs",
                "description": "Review ADR-001..ADR-010 and confirm backend and frontend match documented decisions.",
                "status": "in_progress",
                "progress": 40,
            },
            {
                "title": "Harden auth and session handling",
                "description": "Fix multi-device login issues and document auth flows.",
                "status": "todo",
                "progress": 0,
            },
        ],
    },
    {
        "project_name": "DevCell Platform Core",
        "owner": "dev_garcia",
        "tasks": [
            {
                "title": "Refactor task service for project permissions",
                "description": "Apply ProjectPermissions helper consistently across task routes.",
                "status": "in_progress",
                "progress": 60,
            },
            {
                "title": "Implement dashboard project summaries",
                "description": "Hook dashboard_service to project_summary helper and expose via API.",
                "status": "todo",
                "progress": 0,
            },
        ],
    },
    {
        "project_name": "DevCell Platform Core",
        "owner": "dev_park",
        "tasks": [
            {
                "title": "Polish Dashboard UI",
                "description": "Add cards for tasks, standups, training progress for current user.",
                "status": "todo",
                "progress": 0,
            },
            {
                "title": "Unify layout spacing and typography",
                "description": "Apply shared spacing tokens to all main pages.",
                "status": "done",
                "progress": 100,
            },
        ],
    },
    # Malware Training Pipeline
    {
        "project_name": "Malware Training Pipeline",
        "owner": "cpt_you",
        "tasks": [
            {
                "title": "Finalize Phase 1 syllabus",
                "description": "Windows internals, Python warmup, lab safety.",
                "status": "done",
                "progress": 100,
            },
            {
                "title": "Design Phase 2 exploit labs",
                "description": "Heap spraying, shellcode fundamentals, controlled environment.",
                "status": "in_progress",
                "progress": 30,
            },
        ],
    },
    {
        "project_name": "Malware Training Pipeline",
        "owner": "ssg_kim",
        "tasks": [
            {
                "title": "Author lab: basic loader in C#",
                "description": "Simple staged loader with config-driven behavior.",
                "status": "todo",
                "progress": 0,
            },
            {
                "title": "Write after-action template",
                "description": "Standard format for lab reflections and findings.",
                "status": "todo",
                "progress": 0,
            },
        ],
    },
    {
        "project_name": "Malware Training Pipeline",
        "owner": "intern_cho",
        "tasks": [
            {
                "title": "Document training repo structure",
                "description": "Explain src/, include/, and scripts/ layout for new trainees.",
                "status": "in_progress",
                "progress": 50,
            },
        ],
    },
    # SDLC Multi-Agent Demo
    {
        "project_name": "SDLC Multi-Agent Demo",
        "owner": "dev_park",
        "tasks": [
            {
                "title": "Wire SDLC agents to UI",
                "description": "Expose agent transcripts and artifacts in Multi-Agent demo page.",
                "status": "in_progress",
                "progress": 70,
            },
            {
                "title": "Add loading states and progress steps",
                "description": "Show each SDLC phase as chips or a progress bar for leadership demo.",
                "status": "todo",
                "progress": 0,
            },
        ],
    },
    {
        "project_name": "SDLC Multi-Agent Demo",
        "owner": "admin",
        "tasks": [
            {
                "title": "Define SDLC agent prompts",
                "description": "Create concise role prompts for Product Owner, Architect, Tester, and Scribe.",
                "status": "done",
                "progress": 100,
            },
        ],
    },
    {
        "project_name": "SDLC Multi-Agent Demo",
        "owner": "qa_smith",
        "tasks": [
            {
                "title": "Review generated test plans",
                "description": "Validate that LLM test plans cover edge cases and error paths.",
                "status": "todo",
                "progress": 0,
            },
        ],
    },
    # Incident Exercise Lab
    {
        "project_name": "Incident Exercise Lab",
        "owner": "analyst_lee",
        "tasks": [
            {
                "title": "Draft incident storyline",
                "description": "Design realistic multi-day incident with escalating injects.",
                "status": "in_progress",
                "progress": 40,
            },
            {
                "title": "Map exercise to MITRE ATT&CK",
                "description": "Tag each inject with tactics and techniques.",
                "status": "todo",
                "progress": 0,
            },
        ],
    },
    {
        "project_name": "Incident Exercise Lab",
        "owner": "ops_jones",
        "tasks": [
            {
                "title": "Prepare lab infrastructure",
                "description": "Create clean images, snapshots, and reset scripts for each run.",
                "status": "in_progress",
                "progress": 50,
            },
        ],
    },
    # Knowledgebase Modernization
    {
        "project_name": "Knowledgebase Modernization",
        "owner": "admin",
        "tasks": [
            {
                "title": "Audit existing KB notes",
                "description": "Review dev_process.txt and existing *.md notes for gaps.",
                "status": "todo",
                "progress": 0,
            },
            {
                "title": "Index KB into vector store",
                "description": "Run knowledge indexer and verify sample queries.",
                "status": "todo",
                "progress": 0,
            },
        ],
    },
    {
        "project_name": "Knowledgebase Modernization",
        "owner": "intern_cho",
        "tasks": [
            {
                "title": "Normalize KB titles and tags",
                "description": "Ensure consistent naming: guide-*, sop-*, template-*, training-*.",
                "status": "in_progress",
                "progress": 20,
            },
        ],
    },
]

# Standups: each entry will be created under that user's login
STANDUPS_SEED = [
    # admin
    {
        "username": "admin",
        "entries": [
            {
                "name": "Platform sync - Day 1",
                "yesterday": "Reviewed current DevCell backend + frontend tree and ADRs.",
                "today": "Prepare leadership demo with multi-agent SDLC and dashboard.",
                "blockers": "",
                "project_name": "DevCell Platform Core",
            },
            {
                "name": "Platform sync - Day 2",
                "yesterday": "Walked through auth/login issues and browser errors.",
                "today": "Test login from second laptop and refine seed data script.",
                "blockers": "Need time on test machine.",
                "project_name": "DevCell Platform Core",
            },
        ],
    },
    # cpt_you
    {
        "username": "cpt_you",
        "entries": [
            {
                "name": "Malware training planning",
                "yesterday": "Outlined Phase 1 objectives and lab sequence.",
                "today": "Draft Phase 2 roadmap and dependencies.",
                "blockers": "",
                "project_name": "Malware Training Pipeline",
            },
            {
                "name": "DevCell rollout",
                "yesterday": "Met with leadership to align on modernization vectors.",
                "today": "Refine 90-day roadmap and LOEs.",
                "blockers": "None.",
                "project_name": "DevCell Platform Core",
            },
        ],
    },
    # ssg_kim
    {
        "username": "ssg_kim",
        "entries": [
            {
                "name": "Lab authoring",
                "yesterday": "Tested basic loader PoC in lab VM.",
                "today": "Clean up code and add safety guardrails.",
                "blockers": "Need final template for lab writeups.",
                "project_name": "Malware Training Pipeline",
            },
        ],
    },
    # dev_park
    {
        "username": "dev_park",
        "entries": [
            {
                "name": "UI polish",
                "yesterday": "Implemented Knowledge base two-column layout.",
                "today": "Add responsive tweaks for smaller laptop screens.",
                "blockers": "",
                "project_name": "DevCell Platform Core",
            },
            {
                "name": "Multi-agent UI",
                "yesterday": "Hooked up SDLC transcripts to frontend component.",
                "today": "Add phase chips and better error messages.",
                "blockers": "Need sample agent runs with no errors.",
                "project_name": "SDLC Multi-Agent Demo",
            },
        ],
    },
    # dev_garcia
    {
        "username": "dev_garcia",
        "entries": [
            {
                "name": "Permissions refactor",
                "yesterday": "Centralized project permission checks in service helper.",
                "today": "Roll out to tasks and dashboard routes.",
                "blockers": "",
                "project_name": "DevCell Platform Core",
            },
        ],
    },
    # analyst_lee
    {
        "username": "analyst_lee",
        "entries": [
            {
                "name": "Incident storyline",
                "yesterday": "Drafted initial phishing → lateral movement chain.",
                "today": "Add DC compromise and data exfil phases.",
                "blockers": "",
                "project_name": "Incident Exercise Lab",
            },
        ],
    },
    # ops_jones
    {
        "username": "ops_jones",
        "entries": [
            {
                "name": "Lab reset runbook",
                "yesterday": "Documented snapshot restore procedure.",
                "today": "Automate reset with scripts and schedule.",
                "blockers": "Need shared storage for golden images.",
                "project_name": "Incident Exercise Lab",
            },
        ],
    },
]

TRAINING_SYLLABUS = {
    "track": "Malware Dev Phase 1-4",
    "weeks": [
        {
            "week": 1,
            "title": "Foundations & Safety",
            "focus": "Lab safety, Python refresh, Windows overview.",
            "objectives": [
                "Explain malware lab safety constraints.",
                "Set up isolated Windows VM with snapshots.",
                "Review Python basics for tooling scripts.",
            ],
            "labs": [
                "Tour of malware lab / rules of engagement.",
                "Python warmup: file IO, logging, simple scripts.",
            ],
        },
        {
            "week": 2,
            "title": "Windows Internals Basics",
            "focus": "Processes, threads, memory, and WinAPI.",
            "objectives": [
                "Describe Windows process model.",
                "Use Process Explorer to inspect running processes.",
                "Write a simple WinAPI-based tool in Python or C#.",
            ],
            "labs": [
                "Process inspection lab.",
                "Simple process enumerator tool.",
            ],
        },
        {
            "week": 3,
            "title": "Malware Loader Patterns",
            "focus": "Basic loader design and configuration.",
            "objectives": [
                "Describe common loader stages.",
                "Implement a config-driven loader skeleton.",
            ],
            "labs": [
                "Hands-on: minimal loader in C# or Python.",
            ],
        },
        {
            "week": 4,
            "title": "Command and Control Basics",
            "focus": "Simple C2 patterns and safety constraints.",
            "objectives": [
                "Compare different C2 channel options.",
                "Explain safety boundaries for simulated C2.",
            ],
            "labs": [
                "Simulated C2 over localhost only.",
            ],
        },
    ],
}

KNOWLEDGE_TEXTS = [
    {
        "title": "DevCell Project Roles – Owner, Member, Viewer",
        "text": (
            "DevCell projects support three main roles:\n\n"
            "- Owner: responsible for overall direction and membership.\n"
            "- Member: can create and update tasks, and contribute to work.\n"
            "- Viewer: can read tasks and status but not modify project settings.\n\n"
            "Use owner/member/viewer assignments to mirror how your real team works."
        ),
    },
    {
        "title": "Checklist – Preparing a DevCell Demo for Leadership",
        "text": (
            "Before a leadership demo, verify the following:\n\n"
            "1) You can log in as a dedicated demo user (e.g., admin).\n"
            "2) At least 3–5 projects exist with meaningful names.\n"
            "3) Each project has 8–20 tasks in different states.\n"
            "4) Knowledgebase has notes for platform overview, training, and SOPs.\n"
            "5) Multi-agent SDLC demo completes without errors for a sample story.\n"
            "6) Dashboard shows recent activity and looks 'lived in'."
        ),
    },
    {
        "title": "Template – Weekly DevCell SITREP",
        "text": (
            "Use this outline when generating a weekly SITREP:\n\n"
            "1. Overview of major projects and any big changes.\n"
            "2. Key accomplishments this week (per project).\n"
            "3. Training progress (who completed which phases).\n"
            "4. Automation and agent usage highlights.\n"
            "5. Blockers or risks that leadership should know about.\n"
            "6. Planned focus for next week.\n"
        ),
    },
    {
        "title": "Guide – Using DevCell for Training Tracks",
        "text": (
            "DevCell can treat training as 'first-class work' instead of something separate.\n\n"
            "- Each training track maps to a project or a training syllabus.\n"
            "- Weekly training units become tasks assigned to trainees.\n"
            "- Standup entries capture what trainees struggled with.\n"
            "- Knowledge notes document labs, solutions, and lessons learned.\n"
            "This makes training visible in the same place as operational work."
        ),
    },
    {
        "title": "FAQ – Multi-Agent SDLC Demo",
        "text": (
            "Q: What is the SDLC multi-agent demo?\n"
            "A: A scripted scenario where agents play roles like Product Owner, Architect, "
            "Tester, and Scribe to turn a user story into architecture notes and a test plan.\n\n"
            "Q: What does it prove?\n"
            "A: It shows how DevCell can automate parts of software process without "
            "replacing engineers, keeping humans in the loop.\n\n"
            "Q: Where does it run?\n"
            "A: On the same local DevCell stack: FastAPI backend, React frontend, "
            "and a local LLM with tool calls.\n"
        ),
    },

    {
        "title": "DevCell Platform – Quick Overview",
        "text": "DevCell is an internal developer platform built on FastAPI + React for cyber teams. It organizes tasks, projects, training, and knowledge in one place and adds local-LLM workflows on top.",
    },
    {
        "title": "Guide – Daily Standups and AI Summaries",
        "text": "Use the Standups page to log yesterday, today, and blockers. DevCell can summarize standups and suggest follow-on tasks while keeping the raw entries private to you.",
    },
    {
        "title": "Guide – Writing Good Knowledge Base Notes",
        "text": "Keep KB notes short, focused, and operational. Use headings, bullet lists, and clear examples. Each note should answer a specific question someone on the team might have.",
    },
    {
        "title": "SOP – Malware Lab Safety and Scope",
        "text": "All malware and exploit work in DevCell must stay inside isolated lab environments with no outbound internet. Do not run payloads on production networks or personal devices.",
    },
    {
        "title": "Training Pipeline Phase 1–4 Overview",
        "text": "The malware training pipeline moves from safety and foundations, through Windows internals and loader design, into controlled offensive techniques suitable for defensive R&D.",
    },
]

# ------------------------------------------------------------
# Helper functions
# ------------------------------------------------------------

def api_url(path: str) -> str:
    return f"{BASE_URL.rstrip('/')}{path}"

import requests

def login(username: str, password: str) -> str:
    resp = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": username, "password": password},
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Login failed for {username}: {resp.status_code} {resp.text}")
    data = resp.json()
    # Adjust key if your login response differs
    return data["access_token"]

def auth_headers(token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {token}"}

def ensure_users() -> None:
    """
    Your backend does not expose /api/auth/register, so we cannot
    auto-create users via HTTP.

    For now, we assume you have manually created the key demo accounts
    (e.g. ADMIN_USERNAME), and we just warn you about the rest.
    """
    print("== Seeding users ==")
    print("  [WARN] Skipping user creation: /api/auth/register does not exist.")
    print("  [ACTION] Make sure the following demo users exist in the DB")
    print("          if you want to actually log in as them:")
    print()
    for u in USERS_SEED:
        print(f"   - {u['username']} (role={u.get('role', 'user')})")

def ensure_projects() -> dict[str, int]:
    """
    Ensure all demo projects exist, always using the admin account.

    For demo realism, we still keep an 'owner' field in PROJECTS_SEED,
    but we don't depend on that user actually existing or being able
    to log in. Everything is created/owned by admin.
    """
    print("== Seeding projects ==")
    project_ids: dict[str, int] = {}

    # Get admin token once
    admin_password = next(u["password"] for u in USERS_SEED if u["username"] == ADMIN_USERNAME)
    admin_token = login(ADMIN_USERNAME, admin_password)
    headers = auth_headers(admin_token)

    for proj in PROJECTS_SEED:
        name = proj["name"]

        # Create project with admin token
        resp = requests.post(
            api_url("/api/projects"),
            json={
                "name": name,
                "description": proj["description"],
                # you can add "status": "active" here if your schema supports it
            },
            headers=headers,
        )

        if resp.status_code in (200, 201):
            data = resp.json()
            project_id = data["id"]
            project_ids[name] = project_id
            print(f"  [OK] project '{name}' -> id={project_id}")
        elif resp.status_code == 409:
            # Optional: project already exists, look it up so tasks can still be seeded
            list_resp = requests.get(api_url("/api/projects"), headers=headers)
            if list_resp.status_code == 200:
                for item in list_resp.json().get("items", []):
                    if item["name"] == name:
                        project_ids[name] = item["id"]
                        print(f"  [OK] project '{name}' already exists -> id={item['id']}")
                        break
            if name not in project_ids:
                print(f"  [WARN] could not resolve existing project id for '{name}' after 409")
                continue
        else:
            print(f"  [ERR] project '{name}' status={resp.status_code} body={resp.text}")
            continue

        # Add members (just for realism in UI; doesn't require the users to exist)
        for m in proj.get("members", []):
            username = m["username"]
            role = m["role"]
            m_resp = requests.post(
                api_url(f"/api/projects/{project_ids[name]}/members"),
                json={"username": username, "role": role},
                headers=headers,
            )
            if m_resp.status_code in (200, 201, 409):
                print(f"    [OK] member {username} as {role}")
            else:
                print(f"    [WARN] could not add member {username} as {role}: {m_resp.status_code} {m_resp.text}")

    return project_ids

def seed_tasks(admin_token: str, project_ids: Dict[str, int]) -> None:
    """
    Seed tasks for all projects using the admin account.

    NOTE: Task ownership will be 'admin' (the authenticated user),
    but titles/descriptions still mention the intended owner so the
    backlog looks realistic for demos.
    """
    print("== Seeding tasks ==")

    for group in TASKS_SEED:
        project_name = group["project_name"]
        intended_owner = group["owner"]

        if project_name not in project_ids:
            print(f"  [SKIP] unknown project {project_name} for tasks (did project creation fail?)")
            continue

        project_id = project_ids[project_name]

        for t in group["tasks"]:
            title = t["title"]
            desc = t.get("description", "")

            # Tag the intended owner in the description so it still looks realistic
            desc_with_owner = f"[Owner: {intended_owner}] {desc}"

            payload = {
                "title": title,
                "description": desc_with_owner,
                "status": t.get("status", "todo"),
                "progress": t.get("progress", 0),
                "project_id": project_id,
            }

            resp = requests.post(
                api_url("/api/tasks"),
                json=payload,
                headers=auth_headers(admin_token),
            )

            if resp.status_code == 201:
                print(f"  [OK] task '{title}' in {project_name} (as admin, intended {intended_owner})")
            elif resp.status_code in (400, 409):
                print(f"  [SKIP] task '{title}' in {project_name}: {resp.text}")
            else:
                print(f"  [ERR] task '{title}' in {project_name} status={resp.status_code} body={resp.text}")

def seed_standups(admin_token: str, project_ids: Dict[str, int]) -> None:
    """
    Seed standups using the admin account.

    NOTE: All standups will belong to 'admin' but we tag the
    intended username in the standup name for demo realism.
    """
    print("== Seeding standups ==")

    for user_entry in STANDUPS_SEED:
        username = user_entry["username"]

        for s in user_entry["entries"]:
            project_name = s.get("project_name")
            project_id = project_ids.get(project_name) if project_name else None

            payload = {
                "name": f"{s['name']} (by {username})",
                "yesterday": s["yesterday"],
                "today": s["today"],
                "blockers": s.get("blockers", ""),
                "project_id": project_id,
            }

            resp = requests.post(
                api_url("/api/standups"),
                json=payload,
                headers=auth_headers(admin_token),
            )

            if resp.status_code == 201:
                print(f"  [OK] standup '{s['name']}' (recorded as admin, intended {username})")
            elif resp.status_code in (400, 409):
                print(f"  [SKIP] standup '{s['name']}' for {username}: {resp.text}")
            else:
                print(f"  [ERR] standup '{s['name']}' for {username} status={resp.status_code} body={resp.text}")

def seed_training(admin_token: str) -> None:
    print("== Seeding training syllabus and tasks ==")
    resp = requests.post(
        api_url("/api/training/syllabus"),
        json=TRAINING_SYLLABUS,
        headers=auth_headers(admin_token),
    )
    if resp.status_code in (200, 201):
        print("  [OK] training syllabus upserted")
    else:
        print(f"  [WARN] training syllabus status={resp.status_code} body={resp.text}")

    # Seed tasks for weeks 1–4
    for week in (1, 2, 3, 4):
        payload = {"week": week, "task_count": 4}
        resp = requests.post(
            api_url("/api/training/seed_tasks"),
            json=payload,
            headers=auth_headers(admin_token),
        )
        if resp.status_code in (200, 201):
            print(f"  [OK] seeded training tasks for week {week}")
        else:
            print(f"  [WARN] seed_tasks week={week} status={resp.status_code} body={resp.text}")

def seed_knowledge(admin_token: str) -> None:
    print("== Seeding knowledge documents ==")
    for doc in KNOWLEDGE_TEXTS:
        payload = {"title": doc["title"], "text": doc["text"]}
        resp = requests.post(
            api_url("/api/knowledge/add_text"),
            json=payload,
            headers=auth_headers(admin_token),
        )
        if resp.status_code in (200, 201):
            print(f"  [OK] KB doc '{doc['title']}'")
        elif resp.status_code in (400, 409):
            print(f"  [SKIP] KB doc '{doc['title']}': {resp.text}")
        else:
            print(f"  [ERR] KB doc '{doc['title']}' status={resp.status_code} body={resp.text}")

def main() -> None:
    global BASE_URL

    print(f"Using BASE_URL={BASE_URL}")
    print(f"Using admin user={ADMIN_USERNAME}")

    try:
        admin_token = login(ADMIN_USERNAME, ADMIN_PASSWORD)
    except Exception as e:
        print(f"ERROR: could not log in as admin '{ADMIN_USERNAME}': {e}", file=sys.stderr)
        sys.exit(1)

    # Seed in order
    if ENABLE_USER_SEEDING:
        ensure_users()
    else:
        print("== Skipping user seeding (ENABLE_USER_SEEDING=False) ==")

    project_ids = ensure_projects()
    seed_tasks(admin_token, project_ids)

    if ENABLE_STANDUP_SEEDING:
        seed_standups(admin_token, project_ids)
    else:
        print("== Skipping standups seeding (ENABLE_STANDUP_SEEDING=False) ==")

    if ENABLE_TRAINING_SEEDING:
        seed_training(admin_token)
    else:
        print("== Skipping training seeding (ENABLE_TRAINING_SEEDING=False) ==")

    seed_knowledge(admin_token)

    print("Done seeding demo data.")


if __name__ == "__main__":
    main()
