from datetime import datetime, timedelta, timezone
from jose import jwt
from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import User
from app.models.access_code import AccessCode


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def get_valid_code(db: Session, code: str) -> AccessCode | None:
    return (
        db.query(AccessCode)
        .filter(AccessCode.code == code, AccessCode.status == "ACTIVE")
        .first()
    )


def get_user_by_alias(db: Session, alias: str) -> User | None:
    return db.query(User).filter(User.alias == alias).first()
