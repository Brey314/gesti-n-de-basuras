from datetime import datetime, timezone
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.report import Report
from app.models.user import User

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/summary")
def get_summary(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
):
    now = datetime.now(timezone.utc)
    active = db.query(Report).filter(Report.expires_at > now).all()

    counts = {"EMPTY": 0, "HALF": 0, "FULL": 0, "OVERFLOW": 0}
    for r in active:
        counts[r.status] = counts.get(r.status, 0) + 1

    latest = (
        db.query(Report)
        .filter(Report.expires_at > now)
        .order_by(Report.created_at.desc())
        .first()
    )

    return {
        "total_active_reports": len(active),
        "by_status": counts,
        "latest_report_at": latest.created_at.isoformat() if latest else None,
    }
