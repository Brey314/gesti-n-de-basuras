from datetime import datetime, timedelta, timezone
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_roles
from app.models.container import Container
from app.models.report import Report
from app.models.user import User
from app.schemas.container import ContainerOut, ContainerStatusOut, ContainerUpdate

router = APIRouter(prefix="/containers", tags=["containers"])

STALE_MINUTES = 60


def _container_status(container_id: int, db: Session) -> ContainerStatusOut:
    """Devuelve el estado actual de un contenedor usando la misma lógica que /reports/current."""
    now = datetime.now(timezone.utc)
    report = (
        db.query(Report)
        .filter(Report.container_id == container_id, Report.expires_at > now)
        .order_by(Report.created_at.desc())
        .first()
    )

    if not report:
        return ContainerStatusOut(
            container_id=container_id,
            label="",
            status=None,
            alias=None,
            minutes_ago=None,
            message="Sin reportes recientes",
        )

    delta = now - report.created_at.replace(tzinfo=timezone.utc)
    minutes_ago = int(delta.total_seconds() / 60)

    user = db.query(User).filter(User.id == report.user_id).first()
    alias = user.alias if user else "desconocido"

    if minutes_ago > STALE_MINUTES:
        return ContainerStatusOut(
            container_id=container_id,
            label="",
            status=None,
            alias=None,
            minutes_ago=None,
            message="Sin reportes recientes",
        )

    result = ContainerStatusOut(
        container_id=container_id,
        label="",
        status=report.status,
        alias=alias,
        minutes_ago=minutes_ago,
        message=None,
    )

    if minutes_ago > 240:
        result.message = "Información posiblemente desactualizada"

    return result


@router.get("/", response_model=List[ContainerOut])
def list_containers(db: Annotated[Session, Depends(get_db)]):
    containers = db.query(Container).filter(Container.active == True).order_by(Container.id).all()  # noqa: E712
    result = []
    for c in containers:
        status_info = _container_status(c.id, db)
        out = ContainerOut(
            id=c.id,
            label=c.label,
            pos_x=c.pos_x,
            pos_y=c.pos_y,
            active=c.active,
            current_status=status_info.status,
        )
        result.append(out)
    return result


@router.get("/{container_id}/status", response_model=ContainerStatusOut)
def get_container_status(container_id: int, db: Annotated[Session, Depends(get_db)]):
    container = db.query(Container).filter(Container.id == container_id).first()
    if not container or not container.active:
        raise HTTPException(status_code=404, detail="Contenedor no encontrado")
    status_info = _container_status(container_id, db)
    status_info.label = container.label
    return status_info


@router.put("/{container_id}", response_model=ContainerOut)
def update_container(
    container_id: int,
    body: ContainerUpdate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[None, Depends(require_roles("ADMIN"))],
):
    container = db.query(Container).filter(Container.id == container_id).first()
    if not container:
        raise HTTPException(status_code=404, detail="Contenedor no encontrado")

    if body.label is not None:
        container.label = body.label
    if body.pos_x is not None:
        container.pos_x = body.pos_x
    if body.pos_y is not None:
        container.pos_y = body.pos_y
    if body.active is not None:
        container.active = body.active

    db.commit()
    db.refresh(container)
    status_info = _container_status(container.id, db)
    return ContainerOut(
        id=container.id,
        label=container.label,
        pos_x=container.pos_x,
        pos_y=container.pos_y,
        active=container.active,
        current_status=status_info.status,
    )
