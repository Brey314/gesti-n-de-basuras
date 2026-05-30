from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel

ReportStatus = Literal["EMPTY", "HALF", "FULL", "OVERFLOW"]


class ReportCreate(BaseModel):
    status: ReportStatus
    photo_url: Optional[str] = None


class ReportOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    user_id: str
    status: str
    photo_url: Optional[str]
    created_at: datetime
    expires_at: datetime
