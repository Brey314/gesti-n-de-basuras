import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Enum, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    container_id = Column(Integer, ForeignKey("containers.id"), nullable=True)
    status = Column(
        Enum("EMPTY", "HALF", "FULL", "OVERFLOW", name="report_status"),
        nullable=False,
    )
    photo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=False)  # set to created_at + 30 days on insert

    user = relationship("User", back_populates="reports")
    container = relationship("Container", back_populates="reports")
