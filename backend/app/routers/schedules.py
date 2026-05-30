from datetime import datetime, timezone
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_roles
from app.models.schedule import Schedule
from app.models.user import User

router = APIRouter(prefix="/schedules", tags=["schedules"])

DAY_NAMES = {0: "Domingo", 1: "Lunes", 2: "Martes", 3: "Miércoles",
             4: "Jueves", 5: "Viernes", 6: "Sábado"}


def _schedule_out(s: Schedule) -> dict:
    return {
        "id": s.id,
        "day_of_week": s.day_of_week,
        "day_name": DAY_NAMES.get(s.day_of_week, ""),
        "time": s.time,
        "label": s.label,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
    }


@router.get("/")
def list_schedules(db: Annotated[Session, Depends(get_db)]):
    schedules = (
        db.query(Schedule)
        .order_by(Schedule.day_of_week.asc(), Schedule.time.asc())
        .all()
    )
    return [_schedule_out(s) for s in schedules]


class ScheduleUpdate:
    def __init__(
        self,
        day_of_week: Optional[int] = None,
        time: Optional[str] = None,
        label: Optional[str] = None,
    ):
        self.day_of_week = day_of_week
        self.time = time
        self.label = label


@router.put("/{schedule_id}")
def update_schedule(
    schedule_id: str,
    body: dict,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("ADMIN"))],
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Horario no encontrado")

    if "day_of_week" in body:
        val = body["day_of_week"]
        if not (0 <= val <= 6):
            raise HTTPException(status_code=422, detail="day_of_week debe estar entre 0 y 6")
        schedule.day_of_week = val

    if "time" in body:
        import re
        if not re.match(r"^\d{2}:\d{2}$", body["time"]):
            raise HTTPException(status_code=422, detail="time debe tener formato HH:MM")
        schedule.time = body["time"]

    if "label" in body:
        schedule.label = body["label"]

    schedule.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(schedule)
    return _schedule_out(schedule)
