import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.report import Report

logger = logging.getLogger("cleanup")


def delete_expired_reports(db: Session) -> int:
    """Elimina reportes cuyo expires_at ya pasó. Retorna la cantidad borrada."""
    now = datetime.now(timezone.utc)
    expired = db.query(Report).filter(Report.expires_at <= now).all()
    count = len(expired)
    for report in expired:
        db.delete(report)
    db.commit()
    logger.info("Cleanup: %d reportes eliminados", count)
    return count
