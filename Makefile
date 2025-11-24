PY=python3

.PHONY: help backend-venv backend-run init-db frontend-install frontend-dev docker-up test-backend

help:
	@echo "Makefile targets:"
	@echo "  backend-venv     - create backend virtualenv and install deps"
	@echo "  backend-run      - run backend (uvicorn)"
	@echo "  init-db          - initialize the sqlite devcell.db"
	@echo "  frontend-install - install frontend deps"
	@echo "  frontend-dev     - run frontend dev server"
	@echo "  docker-up        - build and run docker-compose stack"
	@echo "  test-backend     - run backend pytest tests"

backend-venv:
	cd backend && $(PY) -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt

backend-run:
	cd backend && . .venv/bin/activate 2>/dev/null || true && uvicorn app.main:app --reload --host 0.0.0.0 --port 9000

init-db:
	# Initialize SQLite DB using backend package
	cd backend && $(PY) -c "import sys; sys.path.insert(0, ''); from app.db import init_db; init_db()"

frontend-install:
	cd frontend && npm ci

frontend-dev:
	cd frontend && npm run dev

docker-up:
	docker compose build && docker compose up -d

test-backend:
	cd backend && pytest -q
