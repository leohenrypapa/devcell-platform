# Security Model

## Principles

- No chat logs (no persistent storage of chat content).
- Private standups (standup content scoped to the owning user/project).
- Opaque token auth (no JWTs).
- Local LLM only (no external SaaS or cloud LLMs).
- Principle of least privilege for all routes.

---

## Authentication & Sessions

### Model

- DevCell uses **random opaque Bearer tokens**, not JWTs.
- After login or registration, the backend:
  - Creates a row in the `sessions` table.
  - Returns a random token to the client.
- The client sends the token via:

  ```http
  Authorization: Bearer <token>
````

* Tokens are **scoped to a single user** but **not to a device**:

  * Users may log in from multiple devices (multiple active sessions).

### Lifetime & Expiration

* Session tokens have a **fixed lifetime** of **8 hours**.
* Lifetime is enforced using the `sessions.created_at` timestamp.
* When a token is presented:

  * If it is older than the configured TTL, the session row is deleted and the
    token is rejected.
* Expiration is configured via:

  ```python
  settings.SESSION_TTL_HOURS  # default: 8
  ```

### Passwords

* Passwords are hashed server-side using **SHA-256** for demo purposes.
* For production environments, use a stronger KDF (e.g., bcrypt, argon2).
* Plaintext passwords are never stored or logged.

---

## User Accounts

* Users have roles: `"user"` or `"admin"`.
* The **first user** to register becomes `admin`.
* All subsequent self-registered users default to `role="user"`.
* An `admin` can:

  * List all users.
  * Create users.
  * Update roles and active state.
* A `user` can:

  * Log in / log out.
  * Update their own profile.
  * Change their own password.

### Last Admin Safeguard

* The system enforces a *last admin* rule:

  * It is not possible to remove or deactivate the **last active admin**.
  * Attempts to do so fail with `400` and a clear error message.

### Active State

* `is_active` controls whether a user can log in and use tokens.
* Inactive users:

  * Cannot authenticate (login fails).
  * Existing tokens are treated as invalid.

---

## Data Access Patterns

* Project-level membership and permissions (`owner/member/viewer`) are handled
  by the **Projects API** and related modules.
* All project-scoped routes must enforce membership checks in line with
  ADR-004 (Project Permissions).
* Authentication (Bearer token → user) is enforced via the
  `get_current_user` dependency in `auth_service.py`.

---

## Logging & Privacy

* No server-side chat logs:

  * Chat content is not persisted beyond what is necessary for immediate
    request handling.
* Sensitive data:

  * Passwords and tokens are never logged.
  * Debug endpoints must never expose raw password or token values.

````

---

## 4️⃣ How to Apply the Changes

From your **repo root**:

1. **Create/replace** `backend/app/services/user_store.py` with the full content above.
2. **Replace** `backend/app/core/config.py` with the updated version.
3. **Replace** `docs/developer/10_security_model.md` with the updated version.
4. Make sure imports still line up (they already do in your code):
   - `main.py` imports `ensure_default_admin` from `app.services.user_store`. :contentReference[oaicite:5]{index=5}  
   - `auth.py` imports all the user/session functions we implemented. :contentReference[oaicite:6]{index=6}  
5. Restart your backend:

```bash
# From backend/ or repo root with your usual command, e.g.:
uvicorn app.main:app --reload --port 9000
````

If you’re serving the frontend dev server, keep using `npm run dev` / `yarn dev`.

> 🔁 **CORS note**: with `BACKEND_CORS_ORIGINS=["*"]`, any origin can talk to the backend. For internal/demo, this is fine. For a locked-down environment, override this via `BACKEND_CORS_ORIGINS` env variable.

---

## 5️⃣ How to Test — End-to-End Flows

Assume backend at `http://<DEV_MACHINE_IP>:9000` and API prefix `/api`. 

### 1. Register → Auto-login

```bash
curl -X POST "http://<DEV_MACHINE_IP>:9000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "password": "correct-horse-battery",
    "display_name": "CPT You",
    "job_title": "Dev Cell Lead",
    "team_name": "CSD-D Dev Cell",
    "rank": "CPT",
    "skills": "Python, FastAPI"
  }'
```

You should get:

```json
{
  "access_token": "<opaque-token>",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "alice",
    "role": "admin",          // if first user
    "is_active": true,
    ...
  }
}
```

Save the `access_token` into an environment variable:

```bash
TOKEN_A="<opaque-token-from-response>"
```

---

### 2. Call Protected Endpoint (`/me`)

```bash
curl "http://<DEV_MACHINE_IP>:9000/api/auth/me" \
  -H "Authorization: Bearer $TOKEN_A"
```

You should see the user info for `alice`.

---

### 3. Login from Another Device with Same Credentials

On **Device B** (e.g., your laptop):

```bash
curl -X POST "http://<DEV_MACHINE_IP>:9000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "password": "correct-horse-battery"
  }'
```

You get a **different** `access_token`:

```bash
TOKEN_B="<new-opaque-token-from-device-B>"
```

Test `/me` from Device B:

```bash
curl "http://<DEV_MACHINE_IP>:9000/api/auth/me" \
  -H "Authorization: Bearer $TOKEN_B"
```

✅ Expected: works, returns the same user.

---

### 4. Logout Only One Device

On **Device A**:

```bash
curl -X POST "http://<DEV_MACHINE_IP>:9000/api/auth/logout" \
  -H "Authorization: Bearer $TOKEN_A"
```

Now:

```bash
curl "http://<DEV_MACHINE_IP>:9000/api/auth/me" \
  -H "Authorization: Bearer $TOKEN_A"
```

❌ Expected: `401 Unauthorized` (`Invalid or expired token`).

On **Device B**:

```bash
curl "http://<DEV_MACHINE_IP>:9000/api/auth/me" \
  -H "Authorization: Bearer $TOKEN_B"
```

✅ Expected: still works — **multi-device sessions confirmed**.

---

### 5. Token Expiration (TTL sanity check)

You can do a quick TTL sanity check by temporarily setting:

```python
SESSION_TTL_HOURS = 0
```

in `core/config.py`, restart backend, log in, then immediately call `/me` — it should now fail after the first use because TTL is effectively zero. Then set it back to `8`.