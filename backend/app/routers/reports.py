from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.report import Report
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/", status_code=201)
def create_report(
    body: dict,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles("RESIDENT", "ADMIN", "RESEARCHER"))],
):
    status_val = body.get("status")
    if status_val not in ("EMPTY", "HALF", "FULL", "OVERFLOW"):
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="status debe ser EMPTY, HALF, FULL u OVERFLOW")

    now = datetime.now(timezone.utc)
    report = Report(
        user_id=current_user.id,
        status=status_val,
        photo_url=body.get("photo_url"),
        created_at=now,
        expires_at=now + timedelta(days=30),
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Trigger push notifications based on status
    from app.services import push_service
    if status_val == "OVERFLOW":
        push_service.send_bin_alert("OVERFLOW", db)
    elif status_val == "FULL":
        cutoff_1h = now - timedelta(hours=1)
        full_count = (
            db.query(Report)
            .filter(Report.status == "FULL", Report.created_at >= cutoff_1h)
            .count()
        )
        if full_count >= 3:
            push_service.send_bin_alert("FULL", db)

    return {
        "id": report.id,
        "status": report.status,
        "photo_url": report.photo_url,
        "alias": current_user.alias,
        "created_at": report.created_at.isoformat(),
        "expires_at": report.expires_at.isoformat(),
    }


@router.get("/current")
def get_current_report(db: Annotated[Session, Depends(get_db)]):
    now = datetime.now(timezone.utc)
    report = (
        db.query(Report)
        .filter(Report.expires_at > now)
        .order_by(Report.created_at.desc())
        .first()
    )

    if not report:
        return {"status": None, "message": "Sin reportes recientes"}

    delta = now - report.created_at.replace(tzinfo=timezone.utc)
    minutes_ago = int(delta.total_seconds() / 60)

    user = db.query(User).filter(User.id == report.user_id).first()
    alias = user.alias if user else "desconocido"

    result: dict = {
        "status": report.status,
        "alias": alias,
        "created_at": report.created_at.isoformat(),
        "minutes_ago": minutes_ago,
    }

    if minutes_ago > 60:
        result["status"] = None
        result["message"] = "Sin reportes recientes"
        result.pop("alias", None)
        result.pop("created_at", None)
        result.pop("minutes_ago", None)

    if minutes_ago > 240:
        result["warning"] = "Información posiblemente desactualizada"

    return result


@router.get("/mine")
def get_my_reports(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles("RESIDENT", "ADMIN", "RESEARCHER"))],
):
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=30)
    reports = (
        db.query(Report)
        .filter(Report.user_id == current_user.id, Report.created_at >= since)
        .order_by(Report.created_at.desc())
        .all()
    )

    result = []
    for r in reports:
        expires = r.expires_at.replace(tzinfo=timezone.utc)
        days_left = max(0, (expires - now).days)
        result.append({
            "id": r.id,
            "status": r.status,
            "photo_url": r.photo_url,
            "created_at": r.created_at.isoformat(),
            "expires_at": r.expires_at.isoformat(),
            "days_until_expiry": days_left,
        })

    return result
