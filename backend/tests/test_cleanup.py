import uuid
import os
import pytest
from datetime import datetime, timedelta, timezone

from app.models.report import Report
from app.models.user import User
import app.jobs.cleanup_job as cj
from tests.conftest import make_user


def _expired_report(db, user_id: str) -> Report:
    past = datetime.now(timezone.utc) - timedelta(days=31)
    r = Report(
        id=str(uuid.uuid4()),
        user_id=user_id,
        status="EMPTY",
        created_at=past,
        expires_at=past + timedelta(days=30),  # already expired
    )
    db.add(r)
    db.commit()
    return r


def _valid_report(db, user_id: str) -> Report:
    now = datetime.now(timezone.utc)
    r = Report(
        id=str(uuid.uuid4()),
        user_id=user_id,
        status="FULL",
        created_at=now,
        expires_at=now + timedelta(days=30),
    )
    db.add(r)
    db.commit()
    return r


def test_cleanup_deletes_expired(db):
    user = make_user(db, "cleanup_user1", "RESIDENT", "CL000001")
    _expired_report(db, user.id)

    count_before = db.query(Report).count()
    assert count_before == 1

    cj.run_cleanup(db)

    count_after = db.query(Report).count()
    assert count_after == 0


def test_cleanup_keeps_valid(db):
    user = make_user(db, "cleanup_user2", "RESIDENT", "CL000002")
    _valid_report(db, user.id)

    cj.run_cleanup(db)

    assert db.query(Report).count() == 1


def test_cleanup_returns_count(db):
    user = make_user(db, "cleanup_user3", "RESIDENT", "CL000003")
    _expired_report(db, user.id)
    _expired_report(db, user.id)
    _expired_report(db, user.id)

    deleted = cj.run_cleanup(db)
    assert deleted == 3


def test_cleanup_writes_log(db, tmp_path, monkeypatch):
    log_file = str(tmp_path / "test_cleanup.log")
    monkeypatch.setattr(cj, "_LOG_FILE", log_file)

    user = make_user(db, "cleanup_user4", "RESIDENT", "CL000004")
    _expired_report(db, user.id)

    cj.run_cleanup(db)

    assert os.path.exists(log_file)
    content = open(log_file, encoding="utf-8").read()
    assert "SUCCESS" in content
    assert "DELETED: 1" in content
