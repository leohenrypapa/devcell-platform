#!/usr/bin/env bash
set -e

OUTFILE="devcell_feature_bundle_fullstack.txt"

echo "Dumping backend + frontend into $OUTFILE ..."

{
  echo "==================== BACKEND (Python) ==================== "
  echo

  # Backend .py files
  find backend/app -type f -name '*.py' \
    ! -path '*/__pycache__/*' \
    | sort \
    | while read -r file; do
        printf "\n\n===== FILE: %s =====\n\n" "$file"
        cat "$file"
      done

  echo
  echo "==================== FRONTEND (TypeScript/React) ==================== "
  echo

  # Frontend .ts / .tsx
  find frontend/src -type f \( -name '*.ts' -o -name '*.tsx' \) \
    ! -path '*/node_modules/*' \
    ! -path '*/dist/*' \
    ! -path '*/.vite/*' \
    | sort \
    | while read -r file; do
        printf "\n\n===== FILE: %s =====\n\n" "$file"
        cat "$file"
      done

  echo
  echo "==================== ROOT CONFIG FILES ==================== "
  echo

  for f in \
    "package.json" \
    "frontend/package.json" \
    "frontend/vite.config.ts" \
    "backend/requirements.txt" \
    "README.md" \
    "CHANGELOG.md"
  do
    if [ -f "$f" ]; then
      printf "\n\n===== FILE: %s =====\n\n" "$f"
      cat "$f"
    fi
  done
} > "$OUTFILE"

echo "Done. Wrote $(wc -l < "$OUTFILE") lines to $OUTFILE"
