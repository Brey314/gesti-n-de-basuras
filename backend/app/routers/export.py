import csv
import io
import random
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Annotated
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_roles
from app.models.report import Report
from app.models.schedule import Schedule
from app.models.user import User

router = APIRouter(prefix="/export", tags=["export"])

DAY_NAMES = {0: "Domingo", 1: "Lunes", 2: "Martes", 3: "Miércoles",
             4: "Jueves", 5: "Viernes", 6: "Sábado"}

SHORT_DAY = {0: "Dom", 1: "Lun", 2: "Mar", 3: "Mie", 4: "Jue", 5: "Vie", 6: "Sab"}

_TIPS = [
    "Saca la basura la noche anterior para mayor comodidad.",
    "Separa los reciclables para facilitar la recolección.",
    "Usa bolsas resistentes para evitar derrames.",
    "Reporta el estado del contenedor después de cada recolección.",
    "Comparte el horario con tus vecinos para más participación.",
]


def _hour_slot(hour: int) -> str:
    s = (hour // 3) * 3
    return f"{s:02d}-{s + 3:02d}"


@router.get("/csv")
def export_csv(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("ADMIN", "RESEARCHER"))],
):
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=30)

    reports = db.query(Report).filter(Report.created_at >= since).all()

    # Aggregate by date
    by_date: dict[str, list[Report]] = defaultdict(list)
    for r in reports:
        date_str = r.created_at.strftime("%Y-%m-%d")
        by_date[date_str].append(r)

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["date", "total_reports", "peak_slot", "most_common_status"])

    for date_str in sorted(by_date.keys()):
        day_reports = by_date[date_str]
        total = len(day_reports)

        slot_counts: dict[str, int] = defaultdict(int)
        for r in day_reports:
            slot_counts[_hour_slot(r.created_at.hour)] += 1
        peak_slot = max(slot_counts, key=lambda k: slot_counts[k]) if slot_counts else ""

        status_counts = Counter(r.status for r in day_reports)
        most_common = status_counts.most_common(1)[0][0] if status_counts else ""

        writer.writerow([date_str, total, peak_slot, most_common])

    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=\"reporte_mes.csv\""},
    )


@router.get("/poster")
def export_poster(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("ADMIN", "RESEARCHER", "VIEWER"))],
):
    now = datetime.now(timezone.utc)
    since_30 = now - timedelta(days=30)
    since_7 = now - timedelta(days=7)

    schedules = db.query(Schedule).order_by(Schedule.day_of_week).all()
    schedules_data = [
        {"day_name": DAY_NAMES.get(s.day_of_week, ""), "time": s.time, "label": s.label}
        for s in schedules
    ]

    # Busiest days (last 30 days)
    rows = (
        db.query(
            func.strftime("%w", Report.created_at).label("dow"),
            func.count(Report.id).label("cnt"),
        )
        .filter(Report.created_at >= since_30)
        .group_by(func.strftime("%w", Report.created_at))
        .order_by(func.count(Report.id).desc())
        .limit(2)
        .all()
    )
    busiest_days = [DAY_NAMES.get(int(r.dow), "") for r in rows]

    # Peak hour slot (last 30 days)
    hour_rows = (
        db.query(
            func.strftime("%H", Report.created_at).label("hour"),
            func.count(Report.id).label("cnt"),
        )
        .filter(Report.created_at >= since_30)
        .group_by(func.strftime("%H", Report.created_at))
        .order_by(func.count(Report.id).desc())
        .first()
    )
    peak_hour = _hour_slot(int(hour_rows.hour)) if hour_rows else "N/A"

    total_reports_week = (
        db.query(func.count(Report.id))
        .filter(Report.created_at >= since_7)
        .scalar()
    )

    # Reports per actual calendar day for last 7 days
    recent_reports = db.query(Report).filter(Report.created_at >= since_7).all()
    by_date: dict[str, int] = defaultdict(int)
    for r in recent_reports:
        by_date[r.created_at.strftime("%Y-%m-%d")] += 1

    reports_by_day = []
    for offset in range(6, -1, -1):
        day = now - timedelta(days=offset)
        dow = int(day.strftime("%w"))  # 0=Sunday, 6=Saturday
        reports_by_day.append({
            "day_name": SHORT_DAY.get(dow, ""),
            "count": by_date.get(day.strftime("%Y-%m-%d"), 0),
        })

    return {
        "generated_at": now.isoformat(),
        "schedules": schedules_data,
        "busiest_days": busiest_days,
        "peak_hour": peak_hour,
        "total_reports_week": total_reports_week,
        "tip": random.choice(_TIPS),
        "reports_by_day": reports_by_day,
    }
