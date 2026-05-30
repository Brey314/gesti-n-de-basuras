from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_roles
from app.models.report import Report
from app.models.user import User

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/kpis")
def get_kpis(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("ADMIN", "RESEARCHER"))],
):
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")

    reports_today = (
        db.query(func.count(Report.id))
        .filter(func.strftime("%Y-%m-%d", Report.created_at) == today_str)
        .scalar()
    )

    cutoff_24h = now - timedelta(hours=24)
    active_users = (
        db.query(func.count(User.id))
        .filter(User.last_seen >= cutoff_24h)
        .scalar()
    )

    cutoff_60m = now - timedelta(minutes=60)
    recent = (
        db.query(Report)
        .filter(Report.created_at >= cutoff_60m, Report.expires_at > now)
        .order_by(Report.created_at.desc())
        .first()
    )
    current_status = recent.status if recent else None

    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    rows = (
        db.query(
            func.strftime("%Y-%m-%d", Report.created_at).label("date"),
            func.count(Report.id).label("cnt"),
        )
        .filter(Report.created_at >= month_start)
        .group_by(func.strftime("%Y-%m-%d", Report.created_at))
        .all()
    )
    critical_days = sum(1 for r in rows if r.cnt >= 10)

    return {
        "reports_today": reports_today,
        "active_users": active_users,
        "current_status": current_status,
        "critical_days": critical_days,
    }


@router.get("/daily")
def get_daily(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("ADMIN", "RESEARCHER"))],
):
    now = datetime.now(timezone.utc)
    dates = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(6, -1, -1)]

    rows = (
        db.query(
            func.strftime("%Y-%m-%d", Report.created_at).label("date"),
            func.count(Report.id).label("cnt"),
        )
        .filter(Report.created_at >= now - timedelta(days=7))
        .group_by(func.strftime("%Y-%m-%d", Report.created_at))
        .all()
    )
    counts = {r.date: r.cnt for r in rows}
    return [{"date": d, "count": counts.get(d, 0)} for d in dates]


@router.get("/hourly")
def get_hourly(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("ADMIN", "RESEARCHER"))],
):
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=30)

    rows = (
        db.query(
            func.strftime("%H", Report.created_at).label("hour"),
            func.count(Report.id).label("cnt"),
        )
        .filter(Report.created_at >= since)
        .group_by(func.strftime("%H", Report.created_at))
        .all()
    )

    slot_counts: dict[int, int] = defaultdict(int)
    total = 0
    for r in rows:
        hour = int(r.hour)
        slot = (hour // 3) * 3
        slot_counts[slot] += r.cnt
        total += r.cnt

    result = []
    for slot_start in range(0, 24, 3):
        cnt = slot_counts.get(slot_start, 0)
        pct = round(cnt / total * 100, 1) if total > 0 else 0.0
        result.append({
            "slot": f"{slot_start:02d}-{slot_start + 3:02d}",
            "count": cnt,
            "pct": pct,
        })
    return result


@router.get("/recent")
def get_recent(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("ADMIN", "RESEARCHER"))],
):
    now = datetime.now(timezone.utc)
    reports = (
        db.query(Report)
        .filter(Report.expires_at > now)
        .order_by(Report.created_at.desc())
        .limit(5)
        .all()
    )

    result = []
    for r in reports:
        user = db.query(User).filter(User.id == r.user_id).first()
        delta = now - r.created_at.replace(tzinfo=timezone.utc)
        result.append({
            "alias": user.alias if user else "desconocido",
            "status": r.status,
            "created_at": r.created_at.isoformat(),
            "minutes_ago": int(delta.total_seconds() / 60),
        })
    return result


@router.get("/admin/logs/cleanup")
def get_cleanup_logs(
    _: Annotated[User, Depends(require_roles("ADMIN", "RESEARCHER"))],
):
    log_path = "logs/cleanup.log"
    try:
        with open(log_path, encoding="utf-8") as f:
            lines = f.readlines()
    except FileNotFoundError:
        return []

    result = []
    for line in lines[-30:]:
        line = line.strip()
        if not line:
            continue
        parts = [p.strip() for p in line.split("|")]
        entry: dict = {
            "timestamp": parts[0] if len(parts) > 0 else None,
            "deleted_count": None,
            "status": None,
            "error_msg": None,
        }
        for part in parts[1:]:
            if part.startswith("DELETED:"):
                try:
                    entry["deleted_count"] = int(part.split(":")[1].strip())
                except ValueError:
                    pass
            elif part.startswith("STATUS:"):
                entry["status"] = part.split(":", 1)[1].strip()
            elif part.startswith("MSG:"):
                entry["error_msg"] = part.split(":", 1)[1].strip()
        result.append(entry)
    return result
