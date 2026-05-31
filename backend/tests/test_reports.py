import uuid
import pytest
from datetime import datetime, timedelta, timezone

from app.models.container import Container
from app.models.report import Report
from app.models.user import User
from app.services.auth_service import create_access_token
from tests.conftest import make_user


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _insert_container(db, container_id: int = 1, label: str = "Test A") -> Container:
    c = Container(id=container_id, label=label, pos_x=0.2, pos_y=0.3, active=True)
    db.add(c)
    db.commit()
    return c


def _insert_report(db, user_id: str, status: str, hours_ago: int = 0,
                   container_id: int | None = None) -> Report:
    now = datetime.now(timezone.utc)
    created = now - timedelta(hours=hours_ago)
    r = Report(
        id=str(uuid.uuid4()),
        user_id=user_id,
        container_id=container_id,
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


# ── Current report (now returns array per container) ─────────────────────────

def test_get_current_no_reports(db, client):
    # Sin contenedores en el DB de test → lista vacía
    resp = client.get("/api/v1/reports/current")
    assert resp.status_code == 200
    assert resp.json() == []


def test_get_current_with_recent_report(db, client, resident_token):
    _insert_container(db, container_id=1)
    client.post("/api/v1/reports/",
                json={"status": "FULL", "container_id": 1},
                headers=_auth(resident_token))
    resp = client.get("/api/v1/reports/current")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["status"] == "FULL"
    assert "alias" in items[0]
    assert "user_id" not in items[0]


def test_current_report_old_shows_stale(db, client):
    # Un reporte >60 min se considera desactualizado: status=None
    _insert_container(db, container_id=1)
    user = make_user(db, "old_reporter", "RESIDENT", "OLD00001")
    _insert_report(db, user.id, "FULL", hours_ago=5, container_id=1)
    resp = client.get("/api/v1/reports/current")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["status"] is None
    assert items[0]["message"] is not None


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
