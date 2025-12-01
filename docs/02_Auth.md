# DevCell Platform – Authentication & Authorization

## 1. Overview

The DevCell Platform uses a simple session-token system on top of a `users` table. The goals:

- Make login easy and familiar (username + password).
- Keep logic simple enough for local deployment.
- Support roles (`user` and `admin`) to control access to sensitive operations.

This document describes how auth works end-to-end for both backend and frontend.

---

## 2. Data Model

### 2.1 Users

Table: `users`

- `id` – integer primary key
- `username` – unique text
- `password_hash` – hashed password (never store plaintext)
- `role` – `"user"` or `"admin"`
- `display_name` – optional friendly display name
- `job_title` – optional job/position
- `team_name` – optional team or section
- `rank` – optional rank/grade
- `skills` – optional skills string (tags, CSV, etc.)
- `is_active` – boolean flag (only active users can log in)
- `created_at` – timestamp

### 2.2 Sessions

Table: `sessions`

- `id` – integer primary key
- `user_id` – foreign key → `users.id`
- `token` – random string used as Bearer token
- `expires_at` – datetime when token is no longer valid
- `created_at` – timestamp

Tokens are **server-tracked** via this table, not self-contained JWTs. That means:

- You can invalidate a token by deleting the session row.
- You can adjust expiry policy in one place.

---

## 3. Backend Auth Flow

### 3.1 Registration

Endpoint: `POST /api/auth/register`

Body (Pydantic `UserCreate`):

```json
{
  "username": "admin",
  "password": "changeme",
  "role": "admin"
}
```

Behavior:

- Verifies that username is not taken.
- Hashes the password.
- Creates user with given role (or default `"user"`).
- Can be restricted in production (e.g. only admin can register others).

> **Note:** In many setups, you create the first admin user manually via `curl` or a script, then only use the Admin UI to create other users.

### 3.2 Login

Endpoint: `POST /api/auth/login`

Body (Pydantic `LoginRequest`):

```json
{
  "username": "admin",
  "password": "changeme"
}
```

Backend steps:

1. Look up user by username.
2. Verify password hash.
3. Create a session row in `sessions` with:
   - `user_id`
   - random `token`
   - `expires_at` set to a policy (e.g., 24 hours).
4. Return `LoginResponse`:

```json
{
  "access_token": "<random-token>",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "created_at": "2025-01-01T00:00:00"
  }
}
```

### 3.3 Token Expiration Policy

A typical policy:

- **Default lifetime**: 24 hours from creation.
- On each request, `get_current_user` checks `expires_at`.
  - If expired, the request is rejected (401) and the frontend logs the user out.

This can be tuned by updating the logic where sessions are created and checked.

> **Tip:** You can add a background cleanup job to delete expired sessions, but for SQLite and light usage it’s often fine to leave them and clean occasionally.

### 3.4 get_current_user Dependency

Most protected endpoints use:

```python
current_user: UserPublic = Depends(get_current_user)
```

`get_current_user`:

1. Reads `Authorization` header (`Bearer <token>`).
2. Looks up the session by token.
3. Checks `expires_at` and user existence.
4. Returns a Pydantic `UserPublic` object (id, username, role, created_at).

If anything fails, it raises `HTTPException(status_code=401, ...)`.

### 3.5 require_admin Dependency

Admin-only endpoints use:

```python
admin_user: UserPublic = Depends(require_admin)
```

`require_admin`:

1. Calls `get_current_user`.
2. Checks that `user.role == "admin"`.
3. If not, raises `HTTPException(status_code=403, detail="Not enough permissions")`.

### 3.6 Profile & Password Management

Two additional auth-related endpoints are provided:

- `PUT /api/auth/me`
  - Auth required.
  - Allows the current user to update their own profile fields:
    - `display_name`
    - `job_title`
    - `team_name`
    - `rank`
    - `skills`
  - Does **not** allow changing `username`, `role`, or `is_active`.

- `PUT /api/auth/change_password`
  - Auth required.
  - Expects the current password and a new password.
  - Verifies the current password before updating `password_hash`.


---

## 4. Frontend Auth Handling

### 4.1 UserContext

The `UserContext` is the single source of truth for frontend auth state.

It stores:

- `user` – `{ id, username, role, created_at }`
- `token` – the access token
- `isAuthenticated` – boolean

It provides:

- `login(username, password)` – calls `/api/auth/login`, saves token + user, redirects to `/`
- `logout()` – clears token + user from context and `localStorage`, redirects to `/login`

On app startup, it loads any existing token + user from `localStorage` to keep the user logged in across refreshes.

### 4.2 Protected Routes

Routing rules:

- `/login`
  - Public route.
  - If already authenticated, you may redirect to `/`.

- All other routes (`/`, `/standup`, `/projects`, `/knowledge`, `/chat`, `/admin`, `/review`, etc.)
  - Require `isAuthenticated === true`.
  - If not authenticated:
    - Redirect to `/login`.

- `/admin`
  - Additionally checked on the frontend:
    - If `user.role !== "admin"`, show “no permission” message or redirect.

> **Note:** Final enforcement is always done on the backend. Frontend checks are just for UX.

### 4.3 Storing Tokens

Tokens are:

- Stored in `UserContext` state.
- Persisted to `localStorage` for refresh survival.
- Attached to outgoing API requests via:

```ts
headers: {
  Authorization: `Bearer ${token}`,
}
```

When the backend returns 401 due to expiry or invalid token, the frontend should:

- Clear auth state.
- Redirect to `/login`.
- Optionally show a “session expired” message.

---

## 5. Permissions by Module

### 5.1 Standups

- **Create**
  - Must be authenticated.
  - Backend uses `get_current_user` and forces `name = current_user.username`.

- **Edit**
  - Allowed if:
    - `current_user.role == "admin"` OR
    - `current_user.username == standup.name`

- **Delete**
  - Same rules as Edit.

- **View by date**
  - Standups `/by-date` endpoint is not restricted by owner; anyone logged in can see all standups.
  - “My standups only” filtering is done on the frontend.

### 5.2 Projects

- **Create**
  - Must be authenticated.
  - Backend forces `owner = current_user.username`.

- **Edit/Delete**
  - Allowed if:
    - `current_user.role == "admin"` OR
    - `current_user.username == project.owner`

- **View**
  - All projects are visible to all authenticated users.
  - Frontend provides “my projects only” toggle.

### 5.3 Admin Functions

- List users: `GET /api/auth/users`
- Create user: `POST /api/auth/admin/create_user`

Permissions:

- Only admins can access these endpoints (enforced via `require_admin`).

Capabilities:

- Admin can onboard new devs by creating accounts.
- Admin can create additional admin accounts if needed.

---

## 6. User & Admin Capabilities Summary

| Action                                          | User | Admin |
|-------------------------------------------------|:----:|:-----:|
| Login / Logout                                  |  ✔   |   ✔   |
| Update own profile (`/api/auth/me`)             |  ✔   |   ✔   |
| Change own password                             |  ✔   |   ✔   |
| Submit standup                                  |  ✔   |   ✔   |
| Edit own standups                               |  ✔   |   ✔   |
| Delete own standups                             |  ✔   |   ✔   |
| Edit/delete anyone’s standups                   |      |   ✔   |
| Create project                                  |  ✔   |   ✔   |
| Edit/delete own projects                        |  ✔   |   ✔   |
| Edit/delete any project                         |      |   ✔   |
| View all standups/projects                      |  ✔   |   ✔   |
| Use chat / knowledge / code review              |  ✔   |   ✔   |
| List all users                                  |      |   ✔   |
| Create users via Admin UI (with profile fields) |      |   ✔   |
| Toggle user role (`user` / `admin`)             |      |   ✔   |
| Activate/disable user accounts (`is_active`)    |      |   ✔   |

---

## 7. Operational Tips

- For first-time setup:
  - Create a first admin user via `/api/auth/register` using curl or HTTP client.
  - Log in as that admin and create others via the Admin page.

- If users can’t log in:
  - Check that the backend can access `devcell.db`.
  - Confirm that `users` table has the accounts you expect.
  - Ensure backend and frontend agree on the backend base URL.

- If you suspect stolen tokens:
  - Delete the corresponding rows from `sessions` (or all sessions).
  - Optionally force all users to log in again.

This document should be enough for a developer or operator to understand how login and authorization work and how to debug typical issues.
