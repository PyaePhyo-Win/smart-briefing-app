from collections import defaultdict, deque
from collections.abc import Callable
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from importlib import import_module
from urllib.parse import urlparse
from uuid import uuid4

from fastapi import Cookie, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from config import settings
from db.models import User, UserSession
from db.session import get_db
from services.auth import hash_session_token

UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
_RATE_LIMITS: dict[str, deque[datetime]] = defaultdict(deque)


@lru_cache(maxsize=1)
def _get_redis():
    if not settings.redis_url:
        return None
    try:
        redis_module = import_module("redis")
        client = redis_module.Redis.from_url(settings.redis_url, decode_responses=True)
        client.ping()
        return client
    except Exception:
        return None


_REDIS_RATE_LIMIT_SCRIPT = """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local cutoff = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]
redis.call('ZREMRANGEBYSCORE', key, '-inf', cutoff)
local count = redis.call('ZCARD', key)
if count >= limit then
  return 0
end
redis.call('ZADD', key, now, member)
redis.call('EXPIRE', key, tonumber(ARGV[5]))
return 1
"""


def _remote_host(request: Request) -> str:
    if request.client:
        return request.client.host
    return "unknown"


def _client_ip(request: Request) -> str:
    remote_host = _remote_host(request)
    if remote_host in settings.trusted_proxy_ip_list:
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            first_hop = forwarded_for.split(",", 1)[0].strip()
            if first_hop:
                return first_hop
    return remote_host


def _prune_rate_limit_buckets(cutoff: datetime) -> None:
    for key in list(_RATE_LIMITS.keys()):
        hits = _RATE_LIMITS[key]
        while hits and hits[0] <= cutoff:
            hits.popleft()
        if not hits:
            del _RATE_LIMITS[key]

    while len(_RATE_LIMITS) > settings.rate_limit_max_keys:
        oldest_key = min(_RATE_LIMITS, key=lambda key: _RATE_LIMITS[key][0] if _RATE_LIMITS[key] else cutoff)
        del _RATE_LIMITS[oldest_key]


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

        redis_client = _get_redis()
        if redis_client is not None:
            now_ms = int(now.timestamp() * 1000)
            cutoff_ms = int(cutoff.timestamp() * 1000)
            try:
                allowed = redis_client.eval(
                    _REDIS_RATE_LIMIT_SCRIPT,
                    1,
                    f"smart-briefing:rate-limit:{key}",
                    now_ms,
                    cutoff_ms,
                    limit,
                    f"{now_ms}:{uuid4().hex}",
                    window_seconds + 1,
                )
                if not allowed:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Too many requests. Please try again later.",
                    )
                return
            except HTTPException:
                raise
            except Exception:
                pass

        _prune_rate_limit_buckets(cutoff)
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
