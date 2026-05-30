import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime
from app.database import Base


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    day_of_week = Column(Integer, nullable=False)  # 0=Dom, 6=Sáb
    time = Column(String(5), nullable=False)        # "18:30"
    label = Column(String, nullable=True)
    updated_at = Column(
        DateTime,
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=True,
    )
