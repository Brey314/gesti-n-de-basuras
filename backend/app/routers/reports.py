import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.container import Container
from app.models.report import Report
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["reports"])

_ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _delete_photo_file(photo_url: str) -> None:
    """Elimina el archivo físico de una foto si existe en static/photos/."""
    try:
        path = Path(photo_url.lstrip("/"))
        if path.exists() and path.parent.name == "photos":
            path.unlink()
    except Exception:
        pass


@router.post("/", status_code=201)
def create_report(
    body: dict,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles("RESIDENT", "ADMIN", "RESEARCHER"))],
):
    status_val = body.get("status")
    if status_val not in ("EMPTY", "HALF", "FULL", "OVERFLOW"):
        raise HTTPException(status_code=422, detail="status debe ser EMPTY, HALF, FULL u OVERFLOW")

    container_id: Optional[int] = body.get("container_id")
    if container_id is not None:
        container = db.query(Container).filter(Container.id == container_id, Container.active == True).first()  # noqa: E712
        if not container:
            raise HTTPException(status_code=422, detail="Contenedor no válido")

    now = datetime.now(timezone.utc)

    # Borrar la foto del reporte anterior de este contenedor (si existe)
    if container_id is not None:
        prev = (
            db.query(Report)
            .filter(Report.container_id == container_id, Report.photo_url.isnot(None))
            .order_by(Report.created_at.desc())
            .first()
        )
        if prev and prev.photo_url:
            _delete_photo_file(prev.photo_url)
            prev.photo_url = None

    report = Report(
        user_id=current_user.id,
        container_id=container_id,
        status=status_val,
        photo_url=body.get("photo_url"),
        created_at=now,
        expires_at=now + timedelta(days=30),
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    from app.services import push_service
    if status_val == "OVERFLOW":
        push_service.send_bin_alert("OVERFLOW", db)
    elif status_val == "FULL":
        cutoff_1h = now - timedelta(hours=1)
        full_filter = [Report.status == "FULL", Report.created_at >= cutoff_1h]
        if container_id is not None:
            full_filter.append(Report.container_id == container_id)
        full_count = db.query(Report).filter(*full_filter).count()
        if full_count >= 3:
            push_service.send_bin_alert("FULL", db)

    return {
        "id": report.id,
        "container_id": report.container_id,
        "status": report.status,
        "photo_url": report.photo_url,
        "alias": current_user.alias,
        "created_at": report.created_at.isoformat(),
        "expires_at": report.expires_at.isoformat(),
    }


@router.post("/{report_id}/photo")
async def upload_report_photo(
    report_id: str,
    file: Annotated[UploadFile, File(...)],
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles("RESIDENT", "ADMIN"))],
):
    if file.content_type not in _ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=422, detail="Solo se aceptan imágenes JPEG, PNG o WebP")

    report = db.query(Report).filter(Report.id == report_id, Report.user_id == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    # Si el reporte ya tenía foto, borrar el archivo anterior
    if report.photo_url:
        _delete_photo_file(report.photo_url)

    photo_dir = Path("static/photos")
    photo_dir.mkdir(parents=True, exist_ok=True)

    filename_parts = (file.filename or "photo.jpg").rsplit(".", 1)
    ext = filename_parts[1] if len(filename_parts) == 2 else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    dest = photo_dir / filename

    content = await file.read()
    dest.write_bytes(content)

    url = f"/static/photos/{filename}"
    report.photo_url = url
    db.commit()
    return {"photo_url": url}


@router.get("/current")
def get_current_report(db: Annotated[Session, Depends(get_db)]):
    """Devuelve el estado actual de todos los contenedores activos."""
    from app.models.container import Container as ContainerModel
    from app.routers.containers import _container_status

    containers = db.query(ContainerModel).filter(ContainerModel.active == True).order_by(ContainerModel.id).all()  # noqa: E712
    result = []
    for c in containers:
        status_info = _container_status(c.id, db)
        result.append({
            "container_id": c.id,
            "label": c.label,
            "pos_x": c.pos_x,
            "pos_y": c.pos_y,
            "status": status_info.status,
            "alias": status_info.alias,
            "minutes_ago": status_info.minutes_ago,
            "message": status_info.message,
        })
    return result


@router.get("/mine")
def get_my_reports(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles("RESIDENT", "ADMIN", "RESEARCHER"))],
):
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=30)
    reports = (
        db.query(Report)
        .filter(Report.user_id == current_user.id, Report.created_at >= since)
        .order_by(Report.created_at.desc())
        .all()
    )

    result = []
    for r in reports:
        expires = r.expires_at.replace(tzinfo=timezone.utc)
        days_left = max(0, (expires - now).days)
        result.append({
            "id": r.id,
            "container_id": r.container_id,
            "status": r.status,
            "photo_url": r.photo_url,
            "created_at": r.created_at.isoformat(),
            "expires_at": r.expires_at.isoformat(),
            "days_until_expiry": days_left,
        })

    return result
