from collections import defaultdict, deque
from collections.abc import Callable
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

from fastapi import Cookie, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from config import settings
from db.models import User, UserSession
from db.session import get_db
from services.auth import hash_session_token

UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
_RATE_LIMITS: dict[str, deque[datetime]] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _normalize_origin(value: str) -> str:
    parsed = urlparse(value)
    if not parsed.scheme or not parsed.netloc:
        return ""
    return f"{parsed.scheme}://{parsed.netloc}".rstrip("/")


def validate_csrf_origin(request: Request) -> None:
    if request.method.upper() not in UNSAFE_METHODS:
        return

    allowed_origins = set(settings.allowed_origin_list)
    origin = request.headers.get("origin")
    referer = request.headers.get("referer")
    candidate = _normalize_origin(origin or referer or "")

    if not candidate or candidate not in allowed_origins:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid request origin")


def rate_limit(limit: int, window_seconds: int, scope: str) -> Callable[[Request], None]:
    def dependency(request: Request) -> None:
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(seconds=window_seconds)
        key = f"{scope}:{_client_ip(request)}"
        hits = _RATE_LIMITS[key]
        while hits and hits[0] <= cutoff:
            hits.popleft()
        if len(hits) >= limit:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many requests. Please try again later.")
        hits.append(now)

    return dependency


def get_current_user(
    db: Session = Depends(get_db),
    session_token: str | None = Cookie(default=None, alias=settings.session_cookie_name),
) -> User:
    if not session_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    session = db.scalar(
        select(UserSession).where(
            UserSession.token_hash == hash_session_token(session_token),
            UserSession.expires_at > datetime.now(timezone.utc),
        )
    )
    if session is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")

    user = db.get(User, session.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session user")
    return user
