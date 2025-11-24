#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Activate venv if present
if [ -f backend/.venv/bin/activate ]; then
  # shellcheck source=/dev/null
  . backend/.venv/bin/activate
fi

exec uvicorn app.main:app --reload --host 0.0.0.0 --port 9000
