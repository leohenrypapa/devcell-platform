# Contributing to DevCell

## 1. Developer Environment Setup
### Backend
- Python 3.10+
- Create venv: `python3 -m venv .venv`
- Activate: `source .venv/bin/activate`
- Install deps: `pip install -r backend/requirements.txt`
- Run: `uvicorn app.main:app --reload --port 9000`

### Frontend
- Node 18+
- Install: `npm install`
- Run: `npm run dev`

## 2. Branching & PRs
- Use feature branches: `feature/<name>`
- Submit PRs; require at least one review.
- Keep commits small and meaningful.

## 3. Code Style
### Python
- Use `black` and `ruff`.
### TypeScript/React
- Use `eslint` + `prettier`.

## 4. Tests
- Backend: `pytest`
- Frontend: `npm test`
