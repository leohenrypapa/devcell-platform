# Health API

The Health API provides lightweight endpoints for liveness and readiness checks
for the DevCell backend. It is primarily used by:

- Docker/Kubernetes health probes
- Reverse proxies / load balancers
- Simple “is the backend up?” checks from the frontend

These endpoints typically **do not require authentication**, but that depends on
your deployment security posture.

---

# 🧩 Base URL

```text
/api/health
```

(If your router is mounted at a different prefix, adjust accordingly.)

---

# 📚 Endpoints

---

## 1. Liveness Check

### `GET /api/health`

Returns a simple JSON payload indicating that the backend process is alive.

#### Example Response

```json
{
  "status": "ok"
}
```

Typical usage:

- Docker `HEALTHCHECK`  
- Basic monitoring alarms  
- Quick CLI checks:
  ```bash
  curl http://localhost:8000/api/health
  ```

If the application process is running and the route is reachable, this endpoint
should return HTTP `200`.

---

## 2. Readiness / Dependency Check (Optional)

If implemented in `health.py`, a separate endpoint may check dependencies such
as:

- Database connectivity
- Knowledgebase / vector store availability
- LLM server reachability

### `GET /api/health/ready`

#### Example Response

```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "llm": "ok",
    "knowledgebase": "ok"
  }
}
```

If any dependency fails, the endpoint may return HTTP `503` with details:

```json
{
  "status": "degraded",
  "checks": {
    "database": "ok",
    "llm": "unreachable",
    "knowledgebase": "ok"
  }
}
```

---

# 🔐 Authentication

In most deployments:

- `GET /api/health` is **unauthenticated** for infra probes.
- `GET /api/health/ready` may be:
  - unauthenticated (for cluster orchestration), or
  - protected (if you want to hide internal topology).

This is controlled at the router or dependency-injection layer.

---

# ⚠️ Error Responses

| Code | Meaning                            |
|------|------------------------------------|
| `500`| Unhandled error in health handler |
| `503`| One or more dependencies failing  |

Clients should treat `503` as “backend is running but not ready for traffic”.

---

# 🧪 Example Usage

### Dockerfile

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD curl -f http://localhost:8000/api/health || exit 1
```

### Kubernetes Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 10
```

---

# 📚 Related Documents

- Auth API → `auth_api.md`
- Tasks API → `tasks_api.md`
- Dashboard API → `dashboard_api.md`
- Deployment / Ops Docs → `../04_Operations.md`

---

```text
© DevCell Platform Documentation — DevCell Platform
```