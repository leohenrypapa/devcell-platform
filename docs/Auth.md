# Authentication & Authorization

## 1. Overview

The DevCell Platform uses a simple username/password login with role-based access:

- `user`: regular dev
- `admin`: elevated privileges (user management, full visibility)

Auth is enforced in the backend using FastAPI dependencies and exposed in the frontend via a React context (`UserContext`).

## 2. Data Model

**Table**: `users`

- `id` (int, PK)
- `username` (text, unique)
- `password_hash` (text)
- `role` (text: "user" or "admin")
- `created_at` (datetime)

**Table**: `sessions`

- `id` (int, PK)
- `user_id` (FK → users.id)
- `token` (text, unique)
- `expires_at` (datetime)
- `created_at` (datetime)

Pydantic schemas:

- `UserBase`, `UserPublic`, `UserCreate`
- `LoginRequest`, `LoginResponse`
- `UserList`

## 3. Backend Auth Flow

### 3.1 Registration

- Endpoint: `POST /api/auth/register`
- Purpose:
  - Mainly to bootstrap the system.
  - The **first** user becomes `admin` (or we allow role in payload).
- Body: `UserCreate { username, password, role? }`
- Behavior:
  - Validates uniqueness of username.
  - Hashes password.
  - Creates user.

### 3.2 Login

- Endpoint: `POST /api/auth/login`
- Body: `LoginRequest { username, password }`
- Behavior:
  - Verify credentials using `user_store.verify_user_credentials`.
  - If valid, create a session with random token.
  - Return `LoginResponse`:
    - `access_token`
    - `token_type` `"bearer"`
    - `user` (UserPublic)

### 3.3 Current User & Role Checks

- `get_current_user`:
  - Reads `Authorization: Bearer <token>`.
  - Looks up session in DB.
  - Validates expiration.
  - Loads user and returns `UserPublic`.
- `require_admin`:
  - Wraps `get_current_user`.
  - Raises 403 if `user.role != "admin"`.

Used in routes:

- Most routes:
  - `Depends(get_current_user)` for authenticated actions (e.g. standup submit, project create, delete, update).
- Admin-only:
  - `Depends(require_admin)`:
    - `GET /api/auth/users`
    - `POST /api/auth/admin/create_user`
    - (can be extended to more admin endpoints)

## 4. Frontend Auth Handling

### 4.1 UserContext

- File: `src/context/UserContext.tsx`
- Stores:
  - `user: { id, username, role, created_at }`
  - `token` (string)
  - `isAuthenticated: boolean`
- Persists in `localStorage`.
- Provides:
  - `login(username, password)`
  - `logout()`

On login:

1. Calls `POST /api/auth/login`.
2. Stores `token` + `user` in context & `localStorage`.
3. Navigates to `/`.

On logout:

1. Clears context + `localStorage`.
2. Navigates to `/login`.

### 4.2 Routing Rules

- File: `src/App.tsx`
- `/login`:
  - NOT wrapped with `Layout`.
  - Always accessible.
- All other routes:
  - Wrapped with `Layout`.
  - If `!isAuthenticated` → `<Navigate to="/login" />`.
- `/admin`:
  - Only accessible if `isAuthenticated && user.role === "admin"`.
  - Otherwise redirect to `/` or `/login`.

## 5. Permission Rules

### 5.1 Standups

- Create:
  - Must be authenticated.
  - Backend forces `name = current_user.username`.
- Update / Delete:
  - Allowed if `current_user.username == entry.name` OR `current_user.role == "admin"`.

### 5.2 Projects

- Create:
  - Must be authenticated.
  - Backend forces `owner = current_user.username`.
- Update / Delete:
  - Allowed if `current_user.username == project.owner` OR `current_user.role == "admin"`.

### 5.3 Admin Page

- `/admin` route:
  - Requires admin.
- Endpoints:
  - `GET /api/auth/users` – list all users.
  - `POST /api/auth/admin/create_user` – create user with role.

Admins can:

- Onboard new users.
- Create additional admins as needed.
# Authentication & Authorization

## 1. Overview

The DevCell Platform uses a simple username/password login with role-based access:

- `user`: regular dev
- `admin`: elevated privileges (user management, full visibility)

Auth is enforced in the backend using FastAPI dependencies and exposed in the frontend via a React context (`UserContext`).

## 2. Data Model

**Table**: `users`

- `id` (int, PK)
- `username` (text, unique)
- `password_hash` (text)
- `role` (text: "user" or "admin")
- `created_at` (datetime)

**Table**: `sessions`

- `id` (int, PK)
- `user_id` (FK → users.id)
- `token` (text, unique)
- `expires_at` (datetime)
- `created_at` (datetime)

Pydantic schemas:

- `UserBase`, `UserPublic`, `UserCreate`
- `LoginRequest`, `LoginResponse`
- `UserList`

## 3. Backend Auth Flow

### 3.1 Registration

- Endpoint: `POST /api/auth/register`
- Purpose:
  - Mainly to bootstrap the system.
  - The **first** user becomes `admin` (or we allow role in payload).
- Body: `UserCreate { username, password, role? }`
- Behavior:
  - Validates uniqueness of username.
  - Hashes password.
  - Creates user.

### 3.2 Login

- Endpoint: `POST /api/auth/login`
- Body: `LoginRequest { username, password }`
- Behavior:
  - Verify credentials using `user_store.verify_user_credentials`.
  - If valid, create a session with random token.
  - Return `LoginResponse`:
    - `access_token`
    - `token_type` `"bearer"`
    - `user` (UserPublic)

### 3.3 Current User & Role Checks

- `get_current_user`:
  - Reads `Authorization: Bearer <token>`.
  - Looks up session in DB.
  - Validates expiration.
  - Loads user and returns `UserPublic`.
- `require_admin`:
  - Wraps `get_current_user`.
  - Raises 403 if `user.role != "admin"`.

Used in routes:

- Most routes:
  - `Depends(get_current_user)` for authenticated actions (e.g. standup submit, project create, delete, update).
- Admin-only:
  - `Depends(require_admin)`:
    - `GET /api/auth/users`
    - `POST /api/auth/admin/create_user`
    - (can be extended to more admin endpoints)

## 4. Frontend Auth Handling

### 4.1 UserContext

- File: `src/context/UserContext.tsx`
- Stores:
  - `user: { id, username, role, created_at }`
  - `token` (string)
  - `isAuthenticated: boolean`
- Persists in `localStorage`.
- Provides:
  - `login(username, password)`
  - `logout()`

On login:

1. Calls `POST /api/auth/login`.
2. Stores `token` + `user` in context & `localStorage`.
3. Navigates to `/`.

On logout:

1. Clears context + `localStorage`.
2. Navigates to `/login`.

### 4.2 Routing Rules

- File: `src/App.tsx`
- `/login`:
  - NOT wrapped with `Layout`.
  - Always accessible.
- All other routes:
  - Wrapped with `Layout`.
  - If `!isAuthenticated` → `<Navigate to="/login" />`.
- `/admin`:
  - Only accessible if `isAuthenticated && user.role === "admin"`.
  - Otherwise redirect to `/` or `/login`.

## 5. Permission Rules

### 5.1 Standups

- Create:
  - Must be authenticated.
  - Backend forces `name = current_user.username`.
- Update / Delete:
  - Allowed if `current_user.username == entry.name` OR `current_user.role == "admin"`.

### 5.2 Projects

- Create:
  - Must be authenticated.
  - Backend forces `owner = current_user.username`.
- Update / Delete:
  - Allowed if `current_user.username == project.owner` OR `current_user.role == "admin"`.

### 5.3 Admin Page

- `/admin` route:
  - Requires admin.
- Endpoints:
  - `GET /api/auth/users` – list all users.
  - `POST /api/auth/admin/create_user` – create user with role.

Admins can:

- Onboard new users.
- Create additional admins as needed.
