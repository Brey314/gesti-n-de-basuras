"""
Siembra datos iniciales. Idempotente: no hace nada si ya existen usuarios.

Uso:
    cd backend
    python seed.py
"""
import secrets
import sys
from datetime import datetime, timezone

from app.database import SessionLocal, engine
from app.database import Base
import app.models  # noqa: F401 — registra todos los modelos

from app.models.access_code import AccessCode
from app.models.user import User
from app.models.schedule import Schedule
from app.models.notif_pref import NotifPref

Base.metadata.create_all(bind=engine)  # por si alembic no se ejecutó


def seed():
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("Ya sembrado — no se insertan datos.")
            return

        # Código ADMIN
        admin_code = AccessCode(
            code="ADMIN001",
            status="USED",
            used_at=datetime.now(timezone.utc),
        )
        db.add(admin_code)
        db.flush()

        # Usuario ADMIN
        admin = User(
            alias="don_hernesto",
            role="ADMIN",
            code_used="ADMIN001",
        )
        db.add(admin)
        db.flush()

        # NotifPref para admin
        pref = NotifPref(user_id=admin.id, push03=True, push05=True)
        db.add(pref)

        # 10 códigos de acceso activos
        for _ in range(10):
            code_str = secrets.token_hex(4).upper()
            db.add(AccessCode(code=code_str, status="ACTIVE"))

        # 3 horarios de recolección
        schedules = [
            Schedule(day_of_week=1, time="18:30", label="Lunes tarde"),
            Schedule(day_of_week=3, time="18:30", label="Miércoles tarde"),
            Schedule(day_of_week=5, time="07:00", label="Viernes mañana"),
        ]
        db.add_all(schedules)

        db.commit()
        print("Sembrado correctamente:")
        print("  1 usuario ADMIN (don_hernesto)")
        print("  1 código ADMIN001 (USED)")
        print("  10 códigos ACTIVE")
        print("  3 horarios")
        print("  1 NotifPref para don_hernesto")

    except Exception as e:
        db.rollback()
        print(f"Error al sembrar: {e}", file=sys.stderr)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
