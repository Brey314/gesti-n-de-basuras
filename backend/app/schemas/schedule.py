from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ScheduleCreate(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    label: Optional[str] = None


class ScheduleOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    day_of_week: int
    time: str
    label: Optional[str]
    updated_at: Optional[datetime]
