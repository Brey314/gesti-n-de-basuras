from datetime import datetime, timedelta, timezone
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.report import Report
from app.models.notif_pref import NotifPref

router = APIRouter(tags=["privacy"])


@router.get("/me/data")
def export_my_data(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    now = datetime.now(timezone.utc)
    in_7_days = now + timedelta(days=7)

    total_reports = (
        db.query(Report).filter(Report.user_id == current_user.id).count()
    )
    expiring_soon = (
        db.query(Report)
        .filter(Report.user_id == current_user.id, Report.expires_at <= in_7_days, Report.expires_at > now)
        .count()
    )

    pref = db.query(NotifPref).filter(NotifPref.user_id == current_user.id).first()

    return {
        "alias": current_user.alias,
        "role": current_user.role,
        "created_at": current_user.created_at.isoformat(),
        "total_reports": total_reports,
        "reports_expiring_soon": expiring_soon,
        "notif_preferences": {
            "push01": pref.push01 if pref else False,
            "push02": pref.push02 if pref else False,
            "push03": pref.push03 if pref else True,
            "push04": pref.push04 if pref else False,
            "push05": pref.push05 if pref else True,
            "push06": pref.push06 if pref else False,
        },
    }


@router.delete("/me", status_code=200)
def delete_my_account(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    db.query(Report).filter(Report.user_id == current_user.id).delete()
    db.query(NotifPref).filter(NotifPref.user_id == current_user.id).delete()
    db.delete(current_user)
    db.commit()
    return {
        "message": "Cuenta y datos eliminados correctamente",
        "deleted_at": datetime.now(timezone.utc).isoformat(),
    }
