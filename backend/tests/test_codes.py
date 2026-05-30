import uuid
import pytest
from datetime import datetime, timezone

from app.models.access_code import AccessCode


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_generate_code_admin(db, client, admin_token):
    resp = client.post("/api/v1/codes/", headers=_auth(admin_token))
    assert resp.status_code == 201
    body = resp.json()
    assert len(body["code"]) == 8
    assert body["status"] == "ACTIVE"


def test_generate_code_resident(db, client, resident_token):
    resp = client.post("/api/v1/codes/", headers=_auth(resident_token))
    assert resp.status_code == 403


def test_suspend_code(db, client, admin_token):
    code_id = str(uuid.uuid4())
    code = AccessCode(
        id=code_id, code="SUSP0001", status="ACTIVE",
        created_at=datetime.now(timezone.utc),
    )
    db.add(code)
    db.commit()

    resp = client.patch(f"/api/v1/codes/{code_id}",
                        json={"status": "SUSPENDED"},
                        headers=_auth(admin_token))
    assert resp.status_code == 200
    assert resp.json()["status"] == "SUSPENDED"


def test_list_codes_has_summary(db, client, admin_token):
    resp = client.get("/api/v1/codes/", headers=_auth(admin_token))
    assert resp.status_code == 200
    body = resp.json()
    assert "summary" in body
    summary = body["summary"]
    for key in ("total", "active", "used", "suspended", "revoked"):
        assert key in summary
