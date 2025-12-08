#!/usr/bin/env bash
set -euo pipefail

OUT="devcell_bundle.txt"
: > "$OUT"

add() {
  local path="$1"
  if [ -f "$path" ]; then
    echo "===== $path =====" >> "$OUT"
    cat "$path" >> "$OUT"
    printf "\n\n" >> "$OUT"
  else
    echo "WARN: $path not found" >&2
  fi
}

paths=(
  "backend/app/api/routes/auth.py"
  "backend/app/api/routes/projects.py"
  "backend/app/schemas/user.py"
  "backend/app/schemas/project.py"
  "backend/app/services/auth_service.py"
  "backend/app/services/user_store.py"
  "backend/app/services/projects/crud.py"
  "backend/app/services/projects/members.py"

  "docs/api/01_auth_api.md"
  "docs/api/03_projects_api.md"
  "docs/api/09_permissions.md"
  "docs/adr/ADR-004-project-permissions.md"

  "frontend/src/context/UserContext.tsx"
  "frontend/src/lib/backend.ts"
  "frontend/src/lib/users.ts"
  "frontend/src/components/Layout.tsx"
  "frontend/src/components/Sidebar.tsx"
  "frontend/src/pages/LoginPage.tsx"
  "frontend/src/pages/RegisterPage.tsx"
  "frontend/src/pages/AdminPage.tsx"
  "frontend/src/pages/ProfilePage.tsx"
)

for p in "${paths[@]}"; do
  add "$p"
done

echo "Wrote bundle to $OUT"
