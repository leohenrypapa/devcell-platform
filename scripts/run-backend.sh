#!/usr/bin/env bash
set -euo pipefail

# Go to repo root
cd "$(dirname "$0")/.."

# Activate venv if present (root .venv preferred, fallback to backend/.venv)
if [ -f .venv/bin/activate ]; then
  # shellcheck source=/dev/null
  . .venv/bin/activate
elif [ -f backend/.venv/bin/activate ]; then
  # shellcheck source=/dev/null
  . backend/.venv/bin/activate
fi

# Run uvicorn from backend directory so `app.main` resolves correctly
cd backend

exec uvicorn app.main:app --reload --host 0.0.0.0 --port 9000
