# Auth API

The Auth API handles authentication and basic user management for the DevCell
Platform backend. It issues JWT access tokens and exposes a minimal set of user
utility endpoints used by the frontend.

All routes are served from the `auth.py` router and, unless stated otherwise,
accept and return JSON.

---

# 🧩 Base URL

```text
/api/auth
```

---

# 🔐 Authentication Model

- DevCell uses **JWT bearer tokens** for API authentication.
- After login, the client stores the token (e.g., in memory or localStorage)
  and sends it via `Authorization: Bearer <token>` for all subsequent API calls.
- Passwords are hashed server-side; plaintext passwords are never stored.

---

# 📚 Endpoints

---

## 1. Login

### `POST /api/auth/login`

Authenticates a user and returns an access token.

#### Request Body

```json
{
  "username": "alice",
  "password": "correct horse battery staple"
}
```

#### Response

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "username": "alice",
  "role": "user"
}
```

If authentication fails:

- `401 Unauthorized` with an error message.

---

## 2. Get Current User

### `GET /api/auth/me`

Returns basic information about the authenticated user.

#### Headers

```http
Authorization: Bearer <access_token>
```

#### Response

```json
{
  "username": "alice",
  "role": "user",
  "created_at": "2025-12-01T10:00:00Z",
  "is_active": true
}
```

Used by the frontend to:

- hydrate `AuthContext`
- determine role-based UI features (admin vs user)

---

## 3. Refresh / Validate Token (Optional)

> If implemented in your backend, this route is used to validate or refresh
> tokens. If your codebase does not include it, this section can be omitted.

### `GET /api/auth/refresh` (or similar)

- Validates current token
- May return a new token or simply confirm validity

Example response:

```json
{
  "valid": true,
  "username": "alice",
  "role": "user"
}
```

---

## 4. Admin: Create User (Optional)

If enabled, admins can create new users via an API endpoint.

### `POST /api/auth/users`

#### Request

```json
{
  "username": "bob",
  "password": "initial-password",
  "role": "user"
}
```

#### Response

```json
{
  "username": "bob",
  "role": "user",
  "created_at": "2025-12-08T12:00:00Z"
}
```

Permission:

- Only `admin`-role users can call this endpoint.

---

## 5. Change Password (Optional)

### `POST /api/auth/change_password`

Allows a user to change their password.

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
  "success": true
}
```

If `old_password` is incorrect, returns `401` or `400` depending on
implementation.

---

# 🔐 Permission & Role Summary

- **Roles**: `user`, `admin`
- `admin` can:
  - manage users (if the create-user endpoint is enabled)
  - see additional admin UI in the frontend
- `user` can:
  - log in
  - call `/me`
  - access non-admin APIs according to project/permissions model

Auth API itself does **not** expose project-level permissions. Those are enforced
in other modules (Tasks, Projects, Training, Dashboard, etc.).

---

# ⚠️ Error Responses

| Code | Meaning                           |
|------|-----------------------------------|
| `400`| Malformed request body           |
| `401`| Invalid credentials or token     |
| `403`| Not enough privileges (admin)    |
| `422`| Validation error                 |

Error objects typically include a JSON body:

```json
{
  "detail": "Invalid username or password"
}
```

---

# 🧪 Example Login Flow

1. Frontend posts credentials to `/api/auth/login`.
2. Backend verifies the password and issues a JWT.
3. Frontend stores token.
4. All subsequent API calls use `Authorization: Bearer <token>`.
5. Frontend calls `/api/auth/me` to fetch user profile and role.

---

# 📚 Related Documents

- Permissions Module → `../modules/permissions.md`
- Tasks API → `tasks_api.md`
- Projects API → `projects_api.md`
- Dashboard API → `dashboard_api.md`

---

```text
© DevCell Platform Documentation — DevCell Platform
```