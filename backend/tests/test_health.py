from fastapi.testclient import TestClient

from app.main import create_app


def test_ping():
    app = create_app()
    client = TestClient(app)
    resp = client.get("/api/health/ping")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
