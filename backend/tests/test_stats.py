import pytest


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_kpis_structure(db, client, admin_token):
    resp = client.get("/api/v1/stats/kpis", headers=_auth(admin_token))
    assert resp.status_code == 200
    body = resp.json()
    for key in ("reports_today", "active_users", "current_status", "critical_days"):
        assert key in body, f"Missing key: {key}"


def test_daily_returns_7_days(db, client, admin_token):
    resp = client.get("/api/v1/stats/daily", headers=_auth(admin_token))
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 7


def test_hourly_returns_8_slots(db, client, admin_token):
    resp = client.get("/api/v1/stats/hourly", headers=_auth(admin_token))
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 8


def test_recent_no_user_id(db, client, researcher_token):
    resp = client.get("/api/v1/stats/recent", headers=_auth(researcher_token))
    assert resp.status_code == 200
    for item in resp.json():
        assert "user_id" not in item
