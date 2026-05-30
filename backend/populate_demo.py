"""
Inserta datos de demostración realistas para el dashboard.
Idempotente: no duplica si ya existen residentes.

Uso:
    cd backend
    python populate_demo.py
"""

import random
from datetime import datetime, timedelta, timezone

random.seed(42)

from app.database import SessionLocal, engine
from app.database import Base
import app.models  # noqa: registra todos los modelos

from app.models.access_code import AccessCode
from app.models.user import User
from app.models.report import Report
from app.models.notif_pref import NotifPref

Base.metadata.create_all(bind=engine)

# ── Configuración ─────────────────────────────────────────────────────────────

ALIASES = [
    "vecino_01", "vecino_42", "anon_7B", "casa_3", "vecino_11",
    "familia_4", "apt_205", "torre_B", "res_norte", "bloque_5",
]

STATUSES = ["EMPTY", "HALF", "FULL", "OVERFLOW"]
STATUS_WEIGHTS = [0.20, 0.35, 0.30, 0.15]

# Pesos por hora del día (pico en 18-21)
HOUR_WEIGHTS = [
    1, 1, 1, 1, 1, 2,   # 00-05
    3, 5, 6, 5, 4, 4,   # 06-11
    5, 4, 4, 5, 6, 8,   # 12-17
    12, 13, 11, 8, 4, 2, # 18-23
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_code(db) -> str:
    charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    for _ in range(10):
        code = "".join(random.choices(charset, k=8))
        if not db.query(AccessCode).filter(AccessCode.code == code).first():
            return code
    raise RuntimeError("No se pudo generar un código único")


def _report_time(days_ago: int) -> datetime:
    """Hora aleatoria dentro del día indicado, ponderada hacia la tarde."""
    now = datetime.now(timezone.utc)
    max_hour = now.hour if days_ago == 0 else 23
    valid_hours = list(range(max_hour + 1))
    weights = HOUR_WEIGHTS[: len(valid_hours)]
    hour = random.choices(valid_hours, weights=weights)[0]
    max_min = now.minute if (days_ago == 0 and hour == now.hour) else 59
    minute = random.randint(0, max(max_min, 0))
    base = now - timedelta(days=days_ago)
    result = base.replace(hour=hour, minute=minute, second=random.randint(0, 59), microsecond=0)
    return min(result, now - timedelta(seconds=1))


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.role == "RESIDENT").count()
        if existing >= len(ALIASES):
            print("Datos de demostración ya existen — sin cambios.")
            return

        # ── Usuarios residentes ──────────────────────────────────────────────
        print("Insertando usuarios residentes...")
        users = []
        for alias in ALIASES:
            code_str = _make_code(db)
            code = AccessCode(
                code=code_str,
                status="USED",
                used_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 20)),
            )
            db.add(code)
            db.flush()

            user = User(
                alias=alias,
                role="RESIDENT",
                code_used=code_str,
                last_seen=datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 30)),
            )
            db.add(user)
            db.flush()

            db.add(NotifPref(user_id=user.id, push03=True, push05=random.choice([True, False])))
            users.append(user)

        db.commit()
        db.expire_all()
        users = db.query(User).filter(User.role == "RESIDENT").all()
        print(f"  {len(users)} residentes creados.")

        # ── Reportes (últimos 30 días) ───────────────────────────────────────
        print("Insertando reportes históricos...")
        now = datetime.now(timezone.utc)
        total = 0

        for day in range(30):
            # Fines de semana tienen menos actividad
            dow = (now - timedelta(days=day)).weekday()
            n = random.randint(4, 12) if dow >= 5 else random.randint(8, 22)

            for _ in range(n):
                created_at = _report_time(day)
                status = random.choices(STATUSES, weights=STATUS_WEIGHTS)[0]
                user = random.choice(users)
                db.add(Report(
                    user_id=user.id,
                    status=status,
                    created_at=created_at,
                    expires_at=created_at + timedelta(days=30),
                ))
                total += 1

        # Garantiza al menos 1 reporte reciente (< 60 min) para current_status
        recent_user = random.choice(users)
        db.add(Report(
            user_id=recent_user.id,
            status=random.choices(STATUSES, weights=STATUS_WEIGHTS)[0],
            created_at=now - timedelta(minutes=random.randint(8, 45)),
            expires_at=now + timedelta(days=30),
        ))
        total += 1

        db.commit()
        print(f"  {total} reportes insertados.")

        # ── Resumen ──────────────────────────────────────────────────────────
        from sqlalchemy import func
        today_str = now.strftime("%Y-%m-%d")
        today_n = db.query(func.count(Report.id)).filter(
            func.strftime("%Y-%m-%d", Report.created_at) == today_str
        ).scalar()
        active_n = db.query(func.count(User.id)).filter(
            User.last_seen >= now - timedelta(hours=24)
        ).scalar()

        print(f"\n  OK Usuarios totales  : {db.query(User).count()}")
        print(f"  OK Activos (24 h)    : {active_n}")
        print(f"  OK Reportes hoy      : {today_n}")
        print(f"  OK Reportes totales  : {db.query(Report).count()}")

    except Exception as exc:
        db.rollback()
        print(f"Error: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
