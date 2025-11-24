# DevCell Platform – Operations Guide

## 1. Purpose

This document is for the people who operate the DevCell Platform day-to-day (not necessarily writing code). It covers:

- Starting and stopping the system
- Managing users
- Backups
- Basic troubleshooting

---

## 2. Starting & Stopping

### 2.1 With Docker Compose (Recommended)

From the repo root on the server:

```bash
# Start
docker compose up -d

# Check status
docker compose ps

# Stop
docker compose down
```

You can also restart only one service, for example:

```bash
docker compose restart backend
docker compose restart frontend
```

### 2.2 Without Docker (Dev Only)

If running directly:

- Backend:

  ```bash
  cd backend
  source .venv/bin/activate
  uvicorn app.main:app --host 0.0.0.0 --port 9000
  ```

- Frontend:

  ```bash
  cd frontend
  npm run dev   # dev mode
  ```

This is mainly for developers, not for long-term operational deployment.

---

## 3. User Management

Most user management can be done through the **Admin page** in the UI.

### 3.1 Creating Users (Admin Only)

1. Log in as an admin.
2. Go to `/admin` (Admin in the sidebar).
3. Use the **Create New User** form:
   - Set `username`
   - Set `password`
   - Choose `role` (`user` or `admin`)
4. New user will appear in the user list and can log in immediately.

### 3.2 Changing a User’s Role

The simplest workflow:

- Delete and recreate the user with a new role, or
- Extend the code later with an explicit “edit user” feature.

For now, if you need to promote a user to admin and you’re comfortable with DB tools:

1. Stop the backend.
2. Open `devcell.db` with `sqlite3`.
3. Run:

   ```sql
   UPDATE users SET role = 'admin' WHERE username = 'their_username';
   ```

4. Start backend again.

### 3.3 Password Reset (Manual Approach)

If you do not yet have a UI for password reset, there are two options:

- **Option 1**: Admin deletes the user and recreates it with a new password.
- **Option 2**: Use a small script or DB command to set a new password hash (requires dev support).

For most unit setups, Option 1 is simpler.

---

## 4. Backups

The primary data to back up:

- `devcell.db` – the SQLite database.

### 4.1 Basic Backup

1. Stop the backend (and ideally the whole stack) to avoid writes during copy.
2. Copy the DB file:

   ```bash
   cp devcell.db devcell_backup_$(date +%Y%m%d).db
   ```

If using Docker and the DB is mounted from repo root:

- The file is still `./devcell.db` relative to repo.

### 4.2 Restore

To restore from a backup:

1. Stop the stack.
2. Replace `devcell.db` with a backup file:

   ```bash
   cp devcell_backup_YYYYMMDD.db devcell.db
   ```

3. Start the stack again with `docker compose up -d`.

> **Note:** Restoring will revert all data to the state at the time of backup.

---

## 5. Logs & Monitoring

### 5.1 Docker Logs

Use Docker logs to check what’s going on:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### 5.2 Backend Logs

The backend logs include:

- API errors
- Auth failures
- LLM/RAG errors

Look here if:

- Users cannot log in
- AI summaries fail
- API calls return 5xx

### 5.3 Frontend Logs

Open the browser’s developer tools (F12) → Console & Network tabs:

- Look for network errors (404, 500, CORS issues).
- Check for JavaScript errors affecting the UI.

---

## 6. Common Issues & Troubleshooting

### 6.1 Users Cannot Log In

Check:

1. Is the backend running?
2. Does the `users` table contain the account? (Use `sqlite3 devcell.db`).
3. Are frontend and backend URLs configured correctly (`VITE_BACKEND_BASE_URL`)?
4. Backend logs: any auth errors?

If necessary, recreate an admin user via `curl` or script and then recreate other users via the Admin UI.

### 6.2 Standups or Projects Disappeared

1. Confirm you’re looking at the correct date (on Standups page).
2. Confirm DB file hasn’t been replaced.
3. Check if there was a recent restore from backup.
4. Confirm that the containers are using the correct `devcell.db` (for Docker).

### 6.3 AI Summary Not Working

Symptoms: summary section shows an error or stays empty.

Check:

1. Backend logs for errors around the summary endpoint.
2. LLM server is running and reachable (`LLM_BASE_URL` correct).
3. Any API keys or tokens required for LLM are set as environment variables.
4. Network/firewall rules between backend and LLM server.

### 6.4 Frontend Shows “Cannot Reach Backend”

Check:

1. Frontend URL and backend URL:
   - For Docker: frontend is usually `http://<server>:8080`, backend is reachable at `http://<server>:9000`.
2. That `VITE_BACKEND_BASE_URL` was set correctly when the frontend was built.
3. Network connectivity and firewall rules.
4. Browser dev tools → Network tab to see the failing requests.

---

## 7. Changes & Upgrades

### 7.1 Updating the Code

When new versions of the platform are pulled (e.g. via git):

1. Stop the stack:

   ```bash
   docker compose down
   ```

2. Rebuild images:

   ```bash
   docker compose build
   ```

3. Start again:

   ```bash
   docker compose up -d
   ```

### 7.2 Database Migrations

For small changes (adding columns/tables), a developer can provide a SQL migration script. Operators should:

1. Stop backend.
2. Run the migration SQL against `devcell.db`.
3. Start backend again.

If schema changes become frequent, consider introducing a migration tool like Alembic.

---

## 8. Operational Checklist

When something is wrong, run through this quick list:

1. **Is Docker running and containers healthy?**  
   `docker compose ps`

2. **Do logs show obvious errors?**  
   `docker compose logs backend`  
   `docker compose logs frontend`

3. **Is the database file present and writable?**  
   `ls -l devcell.db`

4. **Can you reach the LLM server from the backend?**  
   Use `curl` inside backend container if needed.

5. **Is the frontend pointed at the correct backend URL?**  
   Check `VITE_BACKEND_BASE_URL` and rebuild if necessary.

If you go through these steps, you can usually narrow down issues quickly and either fix them or hand off clear details to a developer.
