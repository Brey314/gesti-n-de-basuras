import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Enum, DateTime
from app.database import Base


class AccessCode(Base):
    __tablename__ = "access_codes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(8), unique=True, nullable=False)
    status = Column(
        Enum("ACTIVE", "USED", "SUSPENDED", "REVOKED", name="accesscode_status"),
        default="ACTIVE",
    )
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    used_at = Column(DateTime, nullable=True)
