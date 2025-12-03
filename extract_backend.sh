#!/usr/bin/env bash
set -e

OUTFILE="devcell_feature_bundle_backend.txt"

echo "Dumping backend into $OUTFILE ..."

{
  echo "==================== BACKEND (Python) ==================== "
  echo

  # Backend .py files (under backend/app)
  find backend/app -type f -name '*.py' \
    ! -path '*/__pycache__/*' \
    | sort \
    | while read -r file; do
      printf "\n\n===== FILE: %s =====\n\n" "$file"
      cat "$file"
    done

  echo
  echo "==================== BACKEND CONFIG / ROOT FILES ==================== "
  echo

  # Common backend config / metadata files
  for f in \
    "backend/requirements.txt" \
    "backend/requirements-dev.txt" \
    "backend/pyproject.toml" \
    "backend/poetry.lock" \
    "backend/alembic.ini" \
    "backend/.env.example" \
    "backend/app/__init__.py"
  do
    if [ -f "$f" ]; then
      printf "\n\n===== FILE: %s =====\n\n" "$f"
      cat "$f"
    fi
  done
} > "$OUTFILE"

echo "Done. Wrote $(wc -l < "$OUTFILE") lines to $OUTFILE"
