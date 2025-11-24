# DevCell Platform – Feature Overview

## 1. Purpose

This document explains **what** the DevCell Platform does from a feature perspective, without going too deep into the technical implementation.

The main modules are:

- Chat
- Knowledge / RAG
- Standups
- Projects
- Dashboard
- Identity & Admin

---

## 2. Chat

### 2.1 What It Does

- Provides a simple chat interface on top of your LLM server.
- Allows developers to:
  - Ask questions
  - Draft documents/messages
  - Get coding help
  - Explore ideas

### 2.2 How It Works (Conceptually)

- Frontend calls a backend endpoint (e.g., `/api/chat`).
- Backend forwards the request to your configured LLM server.
- Response is streamed or sent back to the frontend and displayed in the chat UI.

### 2.3 Typical Use Cases

- “Explain this part of the code.”
- “Give me a summary of this incident.”
- “Draft an email or report to leadership.”

---

## 3. Knowledge / RAG

### 3.1 What It Does

- Stores unit-relevant documents and notes.
- Allows semantic search over those documents.
- Supports retrieval-augmented generation (RAG) answers via the LLM.

### 3.2 How It Works (Conceptually)

1. User uploads a document or adds text.
2. Backend indexes the content in a vector store (e.g., Chroma or similar).
3. For queries:
   - Backend retrieves the most relevant chunks.
   - Passes them along with the question to the LLM.
   - LLM responds with an answer grounded in those docs.

### 3.3 Typical Use Cases

- “What’s the current SOP for X?”
- “How do we deploy this system on the secure network?”
- “Summarize all docs about Y.”

---

## 4. Standups

### 4.1 What It Does

- Captures daily standups per developer.
- Links updates to projects.
- Generates an AI summary of the day (SITREP).

### 4.2 Key Behaviors

- Each standup entry includes:
  - Yesterday
  - Today
  - Blockers
  - Optional project link
- The **name** on each standup is set automatically from the logged-in user.
- Standups are **stored in SQLite**, not in memory, so they persist across restarts.

### 4.3 Standups Page Features

- Submit standups for the current day.
- View standups by date.
- Filter: “Show only my standups”.
- Edit or delete your own standups (admin can edit/delete any).
- Generate an AI summary of today’s standups.
- Copy the summary into reports or emails.

### 4.4 Use Cases

- Daily sync between devs in the unit.
- Quickly see who’s blocked and on what.
- Generate a higher-level summary for leadership.

---

## 5. Projects

### 5.1 What It Does

- Tracks projects and their status.
- Associates standups with projects.
- Produces AI summaries of project progress.

### 5.2 Key Behaviors

- Each project has:
  - Name
  - Description
  - Owner (auto-set from logged-in user)
  - Status:
    - `planned`
    - `active`
    - `blocked`
    - `done`
- Projects are stored in SQLite.

### 5.3 Projects Page Features

- Create a project (owner set automatically).
- Edit or delete your own projects (admin can manage all).
- View all projects in a table.
- Filter by “my projects only”.
- For each project, generate an AI summary based on today’s related standups.
- Copy that summary into a SITREP or email.

### 5.4 Use Cases

- Organize dev work by project instead of only by person.
- Track which projects are blocked or active.
- Produce project-level updates quickly.

---

## 6. Dashboard

### 6.1 What It Does

- Serves as the “morning brief” landing page.
- Combines:

  - “My Today” (my standups and my projects)
  - Unit snapshot (standup count, project status breakdown)
  - AI Unit SITREP (summary of all standups today)

### 6.2 Features

- Shows your standups for today (if any).
- Shows your projects and their statuses.
- Shows how many standups were recorded today overall.
- Shows project counts by status (planned, active, blocked, done).
- Calls the same AI summary endpoint as Standups page, but presents it as a **unit SITREP** with a **Copy SITREP** button.

---

## 7. Identity & Admin

### 7.1 Identity

- Login via username + password.
- User session is stored on the backend and referenced via a token.
- Frontend keeps track of who is logged in and what their role is (user/admin).

### 7.2 Admin

Admin-only features:

- `/admin` page lists all users.
- Create new users:
  - Set username
  - Set password
  - Choose role (`user` or `admin`)

Admin powers:

- Can see all standups and projects (same as users, but with ability to manage).
- Can edit or delete any standup/project.
- Can onboard new developers by making accounts.

---

## 8. Summary

Together, these features provide:

- A shared **communication and tracking platform** for your dev cell.
- Tight integration with your own LLM server for:
  - Chat
  - Knowledge search
  - Standup and project summaries
  - Code review
- Lightweight, deployable architecture suited for an internal unit environment.

Other docs (`04_Standups.md`, `05_Projects.md`, `06_Dashboard.md`, etc.) go into more detail about each module.
