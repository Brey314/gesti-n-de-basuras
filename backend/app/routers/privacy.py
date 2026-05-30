from datetime import datetime, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.report import Report
from app.models.notif_pref import NotifPref

router = APIRouter(prefix="/privacy", tags=["privacy"])


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_account(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Elimina todos los datos del usuario (derecho al olvido)."""
    db.query(Report).filter(Report.user_id == current_user.id).delete()
    db.query(NotifPref).filter(NotifPref.user_id == current_user.id).delete()
    db.delete(current_user)
    db.commit()


@router.get("/me/data")
def export_my_data(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Exporta todos los datos del usuario (portabilidad)."""
    now = datetime.now(timezone.utc)
    reports = db.query(Report).filter(Report.user_id == current_user.id).all()
    pref = db.query(NotifPref).filter(NotifPref.user_id == current_user.id).first()

    return {
        "alias": current_user.alias,
        "role": current_user.role,
        "created_at": current_user.created_at.isoformat(),
        "reports": [
            {"id": r.id, "status": r.status, "created_at": r.created_at.isoformat()}
            for r in reports
        ],
        "notif_preferences": {
            "push01": pref.push01 if pref else False,
            "push02": pref.push02 if pref else False,
            "push03": pref.push03 if pref else True,
            "push04": pref.push04 if pref else False,
            "push05": pref.push05 if pref else True,
            "push06": pref.push06 if pref else False,
        },
    }
