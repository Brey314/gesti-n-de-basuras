from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UserOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    alias: str
    role: str
    created_at: datetime
    last_seen: Optional[datetime]


class PushTokenUpdate(BaseModel):
    push_token: str
