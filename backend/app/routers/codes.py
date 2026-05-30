import secrets
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_roles
from app.models.access_code import AccessCode
from app.models.user import User

router = APIRouter(prefix="/codes", tags=["codes"])


@router.get("/", response_model=list[dict])
def list_codes(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("ADMIN"))],
):
    codes = db.query(AccessCode).all()
    return [
        {
            "id": c.id,
            "code": c.code,
            "status": c.status,
            "created_at": c.created_at.isoformat(),
            "used_at": c.used_at.isoformat() if c.used_at else None,
        }
        for c in codes
    ]


@router.post("/generate", response_model=list[dict], status_code=201)
def generate_codes(
    count: int = 1,
    db: Annotated[Session, Depends(get_db)] = None,
    _: Annotated[User, Depends(require_roles("ADMIN"))] = None,
):
    if count < 1 or count > 50:
        raise HTTPException(status_code=400, detail="count debe estar entre 1 y 50")
    new_codes = []
    for _ in range(count):
        code_str = secrets.token_hex(4).upper()
        code = AccessCode(code=code_str)
        db.add(code)
        new_codes.append(code_str)
    db.commit()
    return [{"code": c} for c in new_codes]


@router.delete("/{code_id}", status_code=204)
def revoke_code(
    code_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("ADMIN"))],
):
    code = db.query(AccessCode).filter(AccessCode.id == code_id).first()
    if not code:
        raise HTTPException(status_code=404, detail="Código no encontrado")
    code.status = "REVOKED"
    db.commit()
