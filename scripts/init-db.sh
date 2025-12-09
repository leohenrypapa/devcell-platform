#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

python3 - << 'EOF'
import sys, os
sys.path.insert(0, os.path.abspath('backend'))
from app.db import init_db
init_db()
print("devcell.db initialized")
EOF
