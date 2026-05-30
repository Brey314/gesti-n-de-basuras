import random
from datetime import datetime, timezone
from typing import Annotated, Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_roles
from app.models.access_code import AccessCode
from app.models.user import User

router = APIRouter(prefix="/codes", tags=["codes"])

# Charset sin caracteres ambiguos: O, 0, I, 1
_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def _code_out(c: AccessCode) -> dict:
    return {
        "id": c.id,
        "code": c.code,
        "status": c.status,
        "created_at": c.created_at.isoformat(),
        "used_at": c.used_at.isoformat() if c.used_at else None,
    }


@router.get("/")
def list_codes(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("ADMIN"))],
):
    codes = db.query(AccessCode).order_by(AccessCode.created_at.desc()).all()
    counts = {"total": len(codes), "active": 0, "used": 0, "suspended": 0, "revoked": 0}
    for c in codes:
        key = c.status.lower()
        if key in counts:
            counts[key] += 1
    return {"codes": [_code_out(c) for c in codes], "summary": counts}


@router.post("/", status_code=201)
def create_code(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("ADMIN"))],
):
    for _ in range(5):
        candidate = "".join(random.choices(_CHARSET, k=8))
        exists = db.query(AccessCode).filter(AccessCode.code == candidate).first()
        if not exists:
            code = AccessCode(code=candidate)
            db.add(code)
            db.commit()
            db.refresh(code)
            return _code_out(code)
    raise HTTPException(status_code=500, detail="No se pudo generar un código único")


class CodeStatusUpdate(BaseModel):
    status: Literal["SUSPENDED", "REVOKED"]


@router.patch("/{code_id}")
def update_code_status(
    code_id: str,
    body: CodeStatusUpdate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("ADMIN"))],
):
    code = db.query(AccessCode).filter(AccessCode.id == code_id).first()
    if not code:
        raise HTTPException(status_code=404, detail="Código no encontrado")
    code.status = body.status
    db.commit()
    db.refresh(code)
    return _code_out(code)
