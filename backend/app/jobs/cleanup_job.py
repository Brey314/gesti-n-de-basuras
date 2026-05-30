import logging
from apscheduler.schedulers.background import BackgroundScheduler
from app.database import SessionLocal
from app.services.cleanup_service import delete_expired_reports

logging.basicConfig(
    filename="logs/cleanup.log",
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)

scheduler = BackgroundScheduler()


def run_cleanup():
    db = SessionLocal()
    try:
        delete_expired_reports(db)
    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(run_cleanup, "cron", hour=3, minute=0, id="daily_cleanup")
    scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
