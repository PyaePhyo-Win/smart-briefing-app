import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from passlib.context import CryptContext
from sqlalchemy import delete
from sqlalchemy.orm import Session

from config import settings
from db.models import User, UserSession

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_session(db: Session, user: User) -> tuple[str, UserSession]:
    token = secrets.token_urlsafe(48)
    session = UserSession(
        user_id=user.id,
        token_hash=hash_session_token(token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.session_expire_days),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return token, session


def delete_session_token(db: Session, token: str | None) -> None:
    if not token:
        return
    db.execute(delete(UserSession).where(UserSession.token_hash == hash_session_token(token)))
    db.commit()
