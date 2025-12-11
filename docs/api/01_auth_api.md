# Auth API

The Auth API handles authentication and basic user management for the DevCell
Platform backend. It issues **opaque bearer tokens** backed by a `sessions`
table and exposes user/profile/admin utilities.

All routes are served from the `auth.py` router and, unless stated otherwise,
accept and return JSON.

---

# 🧩 Base URL

```text
/api/auth
````

---

# 🔐 Authentication Model

* DevCell uses **random opaque Bearer tokens**, not JWTs.

* After login or registration, the backend creates a row in the `sessions`
  table and returns a token.

* The client stores the token (e.g. in memory or `localStorage`) and sends it
  via:

  ```http
  Authorization: Bearer <token>
  ```

* Tokens have a **fixed lifetime** (default: 8 hours) based on
  `sessions.created_at`. Expired tokens are rejected and removed.

* Passwords are **hashed server-side** (demo SHA-256; for production use
  bcrypt/argon2).

---

# 📚 Endpoints

## 1. Register

### `POST /api/auth/register`

Self-register a new user.

Behavior:

* If this is the **first user**, they become `admin`.
* Otherwise, new users are created with `role="user"` (the request `role` is
  ignored).
* Returns a `LoginResponse` so the client can auto-login.

#### Request

```json
{
  "username": "alice",
  "password": "correct-horse",
  "display_name": "CPT You",
  "job_title": "Dev Cell Lead",
  "team_name": "CSD-D Dev Cell",
  "rank": "CPT",
  "skills": "Python, FastAPI"
}
```

#### Response

```json
{
  "access_token": "<opaque-token>",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "alice",
    "role": "admin",
    "is_active": true,
    "display_name": "CPT You",
    "created_at": "2025-12-01T10:00:00"
  }
}
```

---

## 2. Login

### `POST /api/auth/login`

Authenticate a user and create a session.

#### Request

```json
{
  "username": "alice",
  "password": "correct-horse"
}
```

#### Response

```json
{
  "access_token": "<opaque-token>",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "alice",
    "role": "user",
    "is_active": true,
    "created_at": "2025-12-01T10:00:00"
  }
}
```

If authentication fails:

* `401 Unauthorized` with `{"detail": "Invalid username or password"}`.

---

## 3. Logout

### `POST /api/auth/logout`

Invalidate the **current** session token.

#### Headers

```http
Authorization: Bearer <token>
```

#### Response

```json
{
  "detail": "Logged out successfully"
}
```

Implementation:

* Deletes the token row from the `sessions` table.
* Idempotent: calling again is safe (no session found).

---

## 4. Get Current User

### `GET /api/auth/me`

Return the authenticated user.

#### Headers

```http
Authorization: Bearer <token>
```

#### Response

```json
{
  "id": 1,
  "username": "alice",
  "role": "user",
  "is_active": true,
  "display_name": "CPT You",
  "job_title": "Dev Cell Lead",
  "team_name": "CSD-D Dev Cell",
  "rank": "CPT",
  "skills": "Python, FastAPI",
  "created_at": "2025-12-01T10:00:00"
}
```

Notes:

* Inactive users (`is_active=false`) are rejected with `401 User account is inactive`.

---

## 5. Update Own Profile

### `PUT /api/auth/me`

Update your own profile fields.

#### Request

```json
{
  "display_name": "CPT You",
  "job_title": "Dev Cell Lead",
  "team_name": "CSD-D Dev Cell",
  "rank": "CPT",
  "skills": "Python, FastAPI, malware dev"
}
```

#### Response

Returns the updated `UserPublic` as in `/me`.

---

## 6. Change Password

### `PUT /api/auth/change_password`

Change your own password.

#### Request

```json
{
  "old_password": "current-password",
  "new_password": "new-strong-password"
}
```

#### Response

```json
{
  "detail": "Password changed successfully"
}
```

If the old password is wrong:

```json
{
  "detail": "Old password is incorrect"
}
```

---

## 7. Admin: List Users

### `GET /api/auth/users`

List all users.

* **Admin only** (enforced via `require_admin`).

#### Response

```json
{
  "items": [
    {
      "id": 1,
      "username": "alice",
      "role": "admin",
      "is_active": true,
      "display_name": "CPT You",
      "created_at": "..."
    },
    {
      "id": 2,
      "username": "bob",
      "role": "user",
      "is_active": true,
      "display_name": "SSG Kim",
      "created_at": "..."
    }
  ]
}
```

---

## 8. Admin: Update User

### `PUT /api/auth/users/{user_id}`

Admin-only update of another user’s fields.

* Can change profile fields: `display_name`, `job_title`, `team_name`,
  `rank`, `skills`
* Can change `role` between `"user"` and `"admin"`
* Can toggle `is_active`

**Safeguards:**

* Cannot remove or deactivate the **last active admin**; request will fail
  with `400` and explanatory message.

#### Request

```json
{
  "display_name": "DevCell Admin",
  "role": "admin",
  "is_active": true
}
```

---

## 9. Admin: Create User

### `POST /api/auth/admin/create_user`

Create a new user as admin.

#### Request

```json
{
  "username": "bob",
  "password": "initial-pass",
  "role": "user",
  "display_name": "SSG Kim",
  "job_title": "Malware Dev",
  "team_name": "CSD-D Dev Cell",
  "rank": "SSG",
  "skills": "Python, RE"
}
```

#### Response

Returns the created `UserPublic`.

---

## 10. Logout All Sessions

### `POST /api/auth/logout_all`

Logout from **all devices/browsers** by deleting all sessions for the current user.

#### Headers

```http
Authorization: Bearer <token>
````

#### Response

```json
{
  "detail": "Logged out from all devices"
}
```

---

## 11. List Own Sessions

### `GET /api/auth/sessions/me`

List the current user's sessions without exposing token values.

#### Headers

```http
Authorization: Bearer <token>
```

#### Response

```json
{
  "items": [
    {
      "id": 1,
      "created_at": "2025-12-01T10:00:00+00:00",
      "age_hours": 0.5,
      "expires_in_hours": 7.5,
      "is_expired": false
    }
  ]
}

---

# 🔐 Role & Permission Summary

* **Roles**: `"user"`, `"admin"`.
* `admin` can:

  * List all users
  * Create new users
  * Update other users’ roles and active state
* `user` can:

  * login / logout
  * update own profile
  * change own password
* Project-level permissions (`owner/member/viewer`) are handled in the
  **Projects API** and other modules.

---

# ⚠️ Error Responses

| Code | Meaning                                    |
| ---- | ------------------------------------------ |
| 400  | Bad request / validation / last-admin rule |
| 401  | Invalid credentials or token               |
| 403  | Not enough privileges (admin-only)         |
| 404  | Target user not found                      |
| 422  | Validation error                           |

Error objects typically look like:

```json
{
  "detail": "Invalid username or password"
}
```

---

```text
© DevCell Platform Documentation — DevCell Platform
```