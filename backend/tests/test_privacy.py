import uuid
import pytest
from datetime import datetime, timedelta, timezone

from app.models.report import Report
from app.models.user import User


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_me_data_no_sensitive_fields(db, client, resident_token):
    resp = client.get("/api/v1/me/data", headers=_auth(resident_token))
    assert resp.status_code == 200
    body = resp.json()
    for forbidden in ("id", "user_id", "code_used"):
        assert forbidden not in body, f"Sensitive field present: {forbidden}"
    assert "alias" in body
    assert "role" in body


def test_delete_me_removes_reports(db, client, resident_token):
    user = db.query(User).filter(User.alias == "resident_test").first()
    user_id = str(user.id)  # capture before the delete invalidates the instance
    now = datetime.now(timezone.utc)
    report = Report(
        id=str(uuid.uuid4()), user_id=user_id, status="FULL",
        created_at=now, expires_at=now + timedelta(days=30),
    )
    db.add(report)
    db.commit()

    resp = client.delete("/api/v1/me", headers=_auth(resident_token))
    assert resp.status_code == 200

    db.expire_all()  # flush ORM cache — delete happened in a different session
    remaining = db.query(Report).filter(Report.user_id == user_id).count()
    assert remaining == 0


def test_delete_me_invalidates_session(db, client, resident_token):
    auth = _auth(resident_token)

    resp = client.delete("/api/v1/me", headers=auth)
    assert resp.status_code == 200

    resp = client.get("/api/v1/reports/mine", headers=auth)
    assert resp.status_code == 401
