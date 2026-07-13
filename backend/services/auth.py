import base64
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from sqlalchemy import delete
from sqlalchemy.orm import Session

from config import settings
from db.models import User, UserSession

PASSWORD_HASH_PREFIX = "$bcrypt-sha256$"


def _prehash_password(password: str) -> bytes:
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    return base64.b64encode(digest)


def hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(_prehash_password(password), bcrypt.gensalt())
    return f"{PASSWORD_HASH_PREFIX}{hashed.decode('utf-8')}"


def _verify_current_password(password: str, password_hash: str) -> bool:
    bcrypt_hash = password_hash.removeprefix(PASSWORD_HASH_PREFIX).encode("utf-8")
    return bcrypt.checkpw(_prehash_password(password), bcrypt_hash)


def _verify_legacy_bcrypt_password(password: str, password_hash: str) -> bool:
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        return False
    return bcrypt.checkpw(password_bytes, password_hash.encode("utf-8"))


def verify_password(password: str, password_hash: str) -> bool:
    try:
        if password_hash.startswith(PASSWORD_HASH_PREFIX):
            return _verify_current_password(password, password_hash)
        return _verify_legacy_bcrypt_password(password, password_hash)
    except (TypeError, ValueError):
        return False


def verify_and_update_password(password: str, password_hash: str) -> tuple[bool, str | None]:
    password_valid = verify_password(password, password_hash)
    if not password_valid:
        return False, None
    if password_hash.startswith(PASSWORD_HASH_PREFIX):
        return True, None
    return True, hash_password(password)


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
