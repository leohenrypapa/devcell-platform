# Local development notes

Quick steps to run the project locally for development.

Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# create a dev database if needed (SQLite file at repo root)
# run the app
uvicorn app.main:app --reload --host 0.0.0.0 --port 9000
```

Frontend

```bash
cd frontend
npm ci
npm run dev
```

Docker (compose)

```bash
# build images
docker compose build

# run stack
docker compose up -d

# stop
docker compose down
```

Notes

- Do not commit `devcell.db`, `.env` files, or virtualenvs. Use the provided `.env.example` files as a template.
- Consider adding tests and CI steps for linting and unit tests.
