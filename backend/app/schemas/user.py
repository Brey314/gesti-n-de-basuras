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
    token: str


class NotifPrefOut(BaseModel):
    model_config = {"from_attributes": True}

    push01: bool
    push02: bool
    push03: bool
    push04: bool
    push05: bool
    push06: bool
    push07: bool


class NotifPrefUpdate(BaseModel):
    push01: Optional[bool] = None
    push02: Optional[bool] = None
    push03: Optional[bool] = None
    push04: Optional[bool] = None
    push05: Optional[bool] = None
    push06: Optional[bool] = None
    push07: Optional[bool] = None
