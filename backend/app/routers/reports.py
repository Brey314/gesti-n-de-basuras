from datetime import datetime, timedelta, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.report import Report
from app.models.user import User
from app.schemas.report import ReportCreate, ReportOut

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
def create_report(
    body: ReportCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    now = datetime.now(timezone.utc)
    report = Report(
        user_id=current_user.id,
        status=body.status,
        photo_url=body.photo_url,
        created_at=now,
        expires_at=now + timedelta(days=30),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/", response_model=list[ReportOut])
def list_reports(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
):
    now = datetime.now(timezone.utc)
    return db.query(Report).filter(Report.expires_at > now).order_by(Report.created_at.desc()).all()


@router.get("/{report_id}", response_model=ReportOut)
def get_report(
    report_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    return report


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    if report.user_id != current_user.id and current_user.role not in ("ADMIN",):
        raise HTTPException(status_code=403, detail="Sin permisos")
    db.delete(report)
    db.commit()
