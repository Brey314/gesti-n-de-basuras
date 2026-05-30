from datetime import datetime, timezone
from typing import Annotated
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_roles
from app.models.report import Report
from app.models.schedule import Schedule
from app.models.user import User

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/reports")
def export_reports(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("ADMIN", "RESEARCHER"))],
):
    """Exporta reportes activos como JSON (PDF en fase posterior)."""
    now = datetime.now(timezone.utc)
    reports = db.query(Report).filter(Report.expires_at > now).all()
    return [
        {
            "id": r.id,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
            "expires_at": r.expires_at.isoformat(),
        }
        for r in reports
    ]


@router.get("/schedules")
def export_schedules(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("ADMIN", "VIEWER"))],
):
    """Exporta horarios (usado para generar la cartelera impresa)."""
    schedules = db.query(Schedule).order_by(Schedule.day_of_week).all()
    days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    return [
        {"dia": days[s.day_of_week], "hora": s.time, "etiqueta": s.label}
        for s in schedules
    ]
