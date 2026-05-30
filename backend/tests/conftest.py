import uuid
import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.access_code import AccessCode
from app.services.auth_service import create_access_token

# StaticPool ensures all connections share the SAME in-memory SQLite database.
# Without it, each new connection gets an empty database, breaking HTTP tests.
_DB_URL = "sqlite:///:memory:"


# ── Disable APScheduler ──────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def _no_scheduler(monkeypatch):
    """Patch the references imported by app.main (not the original module)."""
    import app.main as _main
    monkeypatch.setattr(_main, "start_scheduler", lambda: None)
    monkeypatch.setattr(_main, "stop_scheduler", lambda: None)


# ── Shared in-memory database ────────────────────────────────────────────────

@pytest.fixture()
def db():
    engine = create_engine(
        _DB_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestSession()
    yield session
    session.close()
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture()
def client(db):
    """HTTP test client whose dependency sessions use the same StaticPool engine."""
    engine = db.get_bind()
    TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def _override():
        s = TestSession()
        try:
            yield s
        finally:
            s.close()

    app.dependency_overrides[get_db] = _override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── User helpers ─────────────────────────────────────────────────────────────

def make_user(db, alias: str, role: str, code_str: str) -> User:
    """Insert AccessCode + User directly into the test DB, return the User."""
    code = AccessCode(
        id=str(uuid.uuid4()),
        code=code_str,
        status="ACTIVE",
        created_at=datetime.now(timezone.utc),
    )
    user = User(
        id=str(uuid.uuid4()),
        alias=alias,
        role=role,
        code_used=code_str,
        created_at=datetime.now(timezone.utc),
    )
    db.add_all([code, user])
    db.commit()
    return user


# ── Token fixtures ────────────────────────────────────────────────────────────

@pytest.fixture()
def admin_token(db):
    u = make_user(db, "admin_test", "ADMIN", "ADM00001")
    return create_access_token(u.id, u.role)


@pytest.fixture()
def resident_token(db, client):
    """Register via the API so NotifPref is also created automatically."""
    code = AccessCode(
        id=str(uuid.uuid4()),
        code="RES00001",
        status="ACTIVE",
        created_at=datetime.now(timezone.utc),
    )
    db.add(code)
    db.commit()
    resp = client.post(
        "/api/v1/auth/register",
        json={"alias": "resident_test", "code": "RES00001"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


@pytest.fixture()
def researcher_token(db):
    u = make_user(db, "researcher_test", "RESEARCHER", "RSC00001")
    return create_access_token(u.id, u.role)
