from typing import Optional
from pydantic import BaseModel


class ContainerOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    label: str
    pos_x: float
    pos_y: float
    active: bool
    current_status: Optional[str] = None


class ContainerStatusOut(BaseModel):
    container_id: int
    label: str
    status: Optional[str]
    alias: Optional[str]
    minutes_ago: Optional[int]
    message: Optional[str]


class ContainerUpdate(BaseModel):
    label: Optional[str] = None
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None
    active: Optional[bool] = None
