#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Ensure we run with system Python in this script; use backend package to initialize DB
python3 -c "import sys; sys.path.insert(0, 'backend'); from app.db import init_db; init_db(); print('devcell.db initialized')"
