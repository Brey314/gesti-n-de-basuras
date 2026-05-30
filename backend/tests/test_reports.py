import uuid
import pytest
from datetime import datetime, timedelta, timezone

from app.models.report import Report
from app.models.user import User
from app.services.auth_service import create_access_token
from tests.conftest import make_user


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _insert_report(db, user_id: str, status: str, hours_ago: int = 0) -> Report:
    now = datetime.now(timezone.utc)
    created = now - timedelta(hours=hours_ago)
    r = Report(
        id=str(uuid.uuid4()),
        user_id=user_id,
        status=status,
        created_at=created,
        expires_at=created + timedelta(days=30),
    )
    db.add(r)
    db.commit()
    return r


# ── Create report ─────────────────────────────────────────────────────────────

def test_create_report_resident(db, client, resident_token):
    resp = client.post("/api/v1/reports/",
                       json={"status": "FULL"}, headers=_auth(resident_token))
    assert resp.status_code in (200, 201)
    body = resp.json()
    assert body["status"] == "FULL"
    created = datetime.fromisoformat(body["created_at"].replace("Z", "+00:00"))
    expires = datetime.fromisoformat(body["expires_at"].replace("Z", "+00:00"))
    assert 29 <= (expires - created).days <= 31


def test_create_report_invalid_status(db, client, resident_token):
    resp = client.post("/api/v1/reports/",
                       json={"status": "INVALID"}, headers=_auth(resident_token))
    assert resp.status_code == 422


# ── Current report ────────────────────────────────────────────────────────────

def test_get_current_no_reports(client):
    resp = client.get("/api/v1/reports/current")
    assert resp.status_code == 200
    assert resp.json()["status"] is None


def test_get_current_with_recent_report(db, client, resident_token):
    client.post("/api/v1/reports/",
                json={"status": "FULL"}, headers=_auth(resident_token))
    resp = client.get("/api/v1/reports/current")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "FULL"
    assert "alias" in body
    assert "user_id" not in body


def test_current_report_old_has_warning(db, client):
    user = make_user(db, "old_reporter", "RESIDENT", "OLD00001")
    _insert_report(db, user.id, "FULL", hours_ago=5)
    resp = client.get("/api/v1/reports/current")
    assert resp.status_code == 200
    assert "warning" in resp.json()


# ── My reports ────────────────────────────────────────────────────────────────

def test_get_mine_returns_only_own_reports(db, client):
    u1 = make_user(db, "u_one", "RESIDENT", "UC000001")
    u2 = make_user(db, "u_two", "RESIDENT", "UC000002")

    _insert_report(db, u1.id, "FULL")
    _insert_report(db, u2.id, "EMPTY")

    token1 = create_access_token(u1.id, "RESIDENT")
    resp = client.get("/api/v1/reports/mine", headers=_auth(token1))

    assert resp.status_code == 200
    reports = resp.json()
    assert len(reports) == 1
    assert reports[0]["status"] == "FULL"
