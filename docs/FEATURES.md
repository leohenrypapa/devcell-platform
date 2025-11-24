# Feature Documentation

## Chat
LLM-based assistant via `/api/chat`.

## Knowledge / RAG
- Docs in `Knowledgebase/`
- Indexed by Chroma
- Queried via `/api/knowledge/query`
- Frontend shows answer + sources

## Standups
- Submit updates via `/api/standup`
- Daily list via `/api/standup/today`
- AI summary via `/api/standup/summary`
- In-memory store

## Projects
- Create/list projects
- Endpoint: `/api/projects`
- In-memory store, includes owner, status, description

## Code Review
- Paste code/diff → `/api/review`
- LLM provides structured review
- Supports focus tags (security, performance, etc.)

## Dashboard
- Summary from standups, projects, knowledge count
- Endpoint: `/api/dashboard/summary`
- Produces SITREP-style overview via LLM

## Identity
- Local user stored via React context + localStorage
- Used in Standups & Projects as default name
