import uuid
import pytest
from datetime import datetime, timezone

from app.models.access_code import AccessCode
from app.models.user import User
from tests.conftest import make_user


def _active_code(db, code_str: str):
    code = AccessCode(
        id=str(uuid.uuid4()),
        code=code_str,
        status="ACTIVE",
        created_at=datetime.now(timezone.utc),
    )
    db.add(code)
    db.commit()
    return code


# ── Register ─────────────────────────────────────────────────────────────────

def test_register_with_valid_code(db, client):
    _active_code(db, "VALID001")
    resp = client.post("/api/v1/auth/register",
                       json={"alias": "new_user", "code": "VALID001"})
    assert resp.status_code == 201
    body = resp.json()
    assert "access_token" in body
    assert body["role"] == "RESIDENT"
    assert body["alias"] == "new_user"


def test_register_with_invalid_code(client):
    resp = client.post("/api/v1/auth/register",
                       json={"alias": "user_bad", "code": "NOEXIST1"})
    assert resp.status_code == 400


def test_register_duplicate_alias(db, client):
    make_user(db, "dup_alias", "RESIDENT", "FIRSTCD1")
    _active_code(db, "SCNDCD01")
    resp = client.post("/api/v1/auth/register",
                       json={"alias": "dup_alias", "code": "SCNDCD01"})
    assert resp.status_code == 400


# ── Login ─────────────────────────────────────────────────────────────────────

def test_login_success(db, client):
    make_user(db, "login_user", "RESIDENT", "LOGIN001")
    resp = client.post("/api/v1/auth/login",
                       json={"alias": "login_user", "code": "LOGIN001"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_code(db, client):
    make_user(db, "wrong_code_user", "RESIDENT", "RIGHTCD1")
    resp = client.post("/api/v1/auth/login",
                       json={"alias": "wrong_code_user", "code": "WRONGCD1"})
    assert resp.status_code == 401


# ── Auth guard ────────────────────────────────────────────────────────────────

def test_protected_endpoint_without_token(client):
    resp = client.get("/api/v1/reports/mine")
    assert resp.status_code == 401
