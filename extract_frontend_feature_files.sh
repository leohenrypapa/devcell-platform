#!/usr/bin/env bash
set -e

OUTFILE="devcell_feature_bundle_frontend.txt"

echo "Dumping frontend (.ts / .tsx) into $OUTFILE ..."

{
  echo "==================== FRONTEND (TypeScript / TSX) ==================== "
  echo

  # Root-level frontend TS files (config, build, etc.)
  if [ -f "frontend/vite.config.ts" ]; then
    printf "\n\n===== FILE: %s =====\n\n" "frontend/vite.config.ts"
    cat "frontend/vite.config.ts"
  fi

  echo
  echo "==================== SRC ROOT ==================== "
  echo

  # src root files
  for f in \
    "frontend/src/main.tsx" \
    "frontend/src/App.tsx"
  do
    if [ -f "$f" ]; then
      printf "\n\n===== FILE: %s =====\n\n" "$f"
      cat "$f"
    fi
  done

  echo
  echo "==================== COMPONENTS ==================== "
  echo

  for f in \
    "frontend/src/components/Layout.tsx" \
    "frontend/src/components/Sidebar.tsx" \
    "frontend/src/components/StandupTaskConvertModal.tsx" \
    "frontend/src/components/Topbar.tsx"
  do
    if [ -f "$f" ]; then
      printf "\n\n===== FILE: %s =====\n\n" "$f"
      cat "$f"
    fi
  done

  echo
  echo "==================== CONTEXT ==================== "
  echo

  for f in \
    "frontend/src/context/ThemeContext.tsx" \
    "frontend/src/context/ToastContext.tsx" \
    "frontend/src/context/UserContext.tsx"
  do
    if [ -f "$f" ]; then
      printf "\n\n===== FILE: %s =====\n\n" "$f"
      cat "$f"
    fi
  done

  echo
  echo "==================== LIB ==================== "
  echo

  for f in \
    "frontend/src/lib/backend.ts" \
    "frontend/src/lib/standups.ts" \
    "frontend/src/lib/tasks.ts"
  do
    if [ -f "$f" ]; then
      printf "\n\n===== FILE: %s =====\n\n" "$f"
      cat "$f"
    fi
  done

  echo
  echo "==================== PAGES ==================== "
  echo

  for f in \
    "frontend/src/pages/AdminPage.tsx" \
    "frontend/src/pages/ChatPage.tsx" \
    "frontend/src/pages/CodeReviewPage.tsx" \
    "frontend/src/pages/DashboardPage.tsx" \
    "frontend/src/pages/KnowledgePage.tsx" \
    "frontend/src/pages/LoginPage.tsx" \
    "frontend/src/pages/ProfilePage.tsx" \
    "frontend/src/pages/ProjectsPage.tsx" \
    "frontend/src/pages/RegisterPage.tsx" \
    "frontend/src/pages/StandupPage.tsx" \
    "frontend/src/pages/TasksPage.tsx"
  do
    if [ -f "$f" ]; then
      printf "\n\n===== FILE: %s =====\n\n" "$f"
      cat "$f"
    fi
  done

} > "$OUTFILE"

echo "Done. Wrote $(wc -l < "$OUTFILE") lines to $OUTFILE"
