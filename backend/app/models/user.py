import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Enum, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    alias = Column(String, unique=True, nullable=False)
    role = Column(
        Enum("RESIDENT", "ADMIN", "RESEARCHER", "VIEWER", name="user_role"),
        default="RESIDENT",
    )
    code_used = Column(String, nullable=False)
    push_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_seen = Column(DateTime, nullable=True)

    reports = relationship("Report", back_populates="user")
    notif_pref = relationship("NotifPref", uselist=False, back_populates="user")
