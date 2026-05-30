from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.notif_pref import NotifPref
from app.schemas.user import NotifPrefOut, NotifPrefUpdate, PushTokenUpdate
from app.services.push_service import send_collection_confirmed, send_schedule_change

router = APIRouter(tags=["notifications"])


@router.post("/notifications/register-token")
def register_push_token(
    body: PushTokenUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    current_user.push_token = body.token
    db.commit()
    return {"message": "Token registrado"}


@router.patch("/notifications/preferences", response_model=NotifPrefOut)
def update_notif_preferences(
    body: NotifPrefUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    pref = db.query(NotifPref).filter(NotifPref.user_id == current_user.id).first()
    if not pref:
        raise HTTPException(status_code=404, detail="Preferencias no encontradas")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(pref, field, value)

    db.commit()
    db.refresh(pref)
    return pref


class ScheduleChangeBody(BaseModel):
    new_time: str
    day_name: str


@router.post("/admin/notify/collection")
def notify_collection(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("ADMIN"))],
):
    sent = send_collection_confirmed(db)
    return {"sent": sent}


@router.post("/admin/notify/schedule-change")
def notify_schedule_change(
    body: ScheduleChangeBody,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("ADMIN"))],
):
    sent = send_schedule_change(body.new_time, body.day_name, db)
    return {"sent": sent}
