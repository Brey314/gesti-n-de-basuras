import os
from datetime import datetime, timedelta, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.report import Report

os.makedirs("logs", exist_ok=True)

scheduler = BackgroundScheduler()

_DOW_MAP = {0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat"}
_LOG_FILE = "logs/cleanup.log"


def run_cleanup(db: Session) -> int:
    from app.services import push_service

    now = datetime.now(timezone.utc)
    ts = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    try:
        expired = db.query(Report).filter(Report.expires_at <= now).all()
        affected_user_ids = list({r.user_id for r in expired})

        deleted = (
            db.query(Report)
            .filter(Report.expires_at <= now)
            .delete(synchronize_session=False)
        )
        db.commit()
        line = f"{ts} | DELETED: {deleted} | STATUS: SUCCESS\n"

        if affected_user_ids:
            push_service.send_auto_delete_notice(affected_user_ids, db)
    except Exception as exc:
        db.rollback()
        line = f"{ts} | DELETED: 0 | STATUS: ERROR | MSG: {exc}\n"
        deleted = 0
        push_service.send_admin_failure_alert(str(exc), db)

    with open(_LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line)

    return deleted


def _scheduled_cleanup():
    db = SessionLocal()
    try:
        run_cleanup(db)
    finally:
        db.close()


def _run_truck_reminder(schedule_time: str):
    from app.services import push_service
    db = SessionLocal()
    try:
        push_service.send_truck_reminder(schedule_time, db)
    finally:
        db.close()


def _run_citizenship_tip():
    from app.services import push_service
    db = SessionLocal()
    try:
        push_service.send_citizenship_tip(db)
    finally:
        db.close()


def _add_truck_reminder_job(schedule):
    h, m = map(int, schedule.time.split(":"))
    dt = datetime(2000, 1, 1, h, m) - timedelta(minutes=30)
    aps_dow = _DOW_MAP[schedule.day_of_week]
    scheduler.add_job(
        _run_truck_reminder,
        "cron",
        day_of_week=aps_dow,
        hour=dt.hour,
        minute=dt.minute,
        id=f"truck_reminder_{schedule.id}",
        args=[schedule.time],
        replace_existing=True,
    )


def start_scheduler():
    scheduler.add_job(
        _scheduled_cleanup,
        "cron",
        hour=2,
        minute=0,
        id="daily_cleanup",
        replace_existing=True,
    )
    scheduler.add_job(
        _run_citizenship_tip,
        "cron",
        day_of_week="fri",
        hour=10,
        minute=0,
        id="weekly_tip",
        replace_existing=True,
    )

    from app.models.schedule import Schedule as ScheduleModel
    db = SessionLocal()
    try:
        for s in db.query(ScheduleModel).all():
            _add_truck_reminder_job(s)
    finally:
        db.close()

    scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
