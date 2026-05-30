from datetime import datetime, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.models.user import User
from app.models.notif_pref import NotifPref
from app.services.auth_service import (
    create_access_token,
    get_valid_code,
    get_user_by_alias,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Annotated[Session, Depends(get_db)]):
    if get_user_by_alias(db, body.alias):
        raise HTTPException(status_code=400, detail="Alias ya en uso")

    code = get_valid_code(db, body.access_code)
    if not code:
        raise HTTPException(status_code=400, detail="Código inválido o ya usado")

    user = User(alias=body.alias, code_used=body.access_code)
    db.add(user)
    db.flush()

    pref = NotifPref(user_id=user.id)
    db.add(pref)

    code.status = "USED"
    code.used_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Annotated[Session, Depends(get_db)]):
    user = get_user_by_alias(db, body.alias)
    if not user or user.code_used != body.access_code:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    user.last_seen = datetime.now(timezone.utc)
    db.commit()

    return TokenResponse(access_token=create_access_token(user.id))
