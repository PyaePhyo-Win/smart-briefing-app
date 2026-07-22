from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from db.models import UsageEvent, User

CHAT_KIND = "chat"
RESEARCH_KIND = "research"
CHAT_UNITS = 1
RESEARCH_UNITS = 5

FREE_WINDOW = timedelta(hours=24)
FREE_UNIT_LIMIT = 10

PRO_WINDOW = timedelta(hours=5)
PRO_CHAT_LIMIT = 100
PRO_RESEARCH_LIMIT = 10

ACTIVE_SUBSCRIPTION_STATUSES = {"active", "trialing"}


@dataclass(frozen=True)
class UsageRule:
    kind: str
    units: int


USAGE_RULES = {
    CHAT_KIND: UsageRule(kind=CHAT_KIND, units=CHAT_UNITS),
    RESEARCH_KIND: UsageRule(kind=RESEARCH_KIND, units=RESEARCH_UNITS),
}


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def is_pro_user(user: User) -> bool:
    return user.plan == "pro" and user.subscription_status in ACTIVE_SUBSCRIPTION_STATUSES


def _sum_units(db: Session, user_id: UUID, since: datetime) -> int:
    return int(
        db.scalar(
            select(func.coalesce(func.sum(UsageEvent.units), 0)).where(
                UsageEvent.user_id == user_id,
                UsageEvent.created_at >= since,
            )
        )
        or 0
    )


def _count_kind(db: Session, user_id: UUID, kind: str, since: datetime) -> int:
    return int(
        db.scalar(
            select(func.count()).select_from(UsageEvent).where(
                UsageEvent.user_id == user_id,
                UsageEvent.kind == kind,
                UsageEvent.created_at >= since,
            )
        )
        or 0
    )


def _free_window_status(db: Session, user_id: UUID, at: datetime) -> dict:
    window_start = at - FREE_WINDOW
    used_units = _sum_units(db, user_id, window_start)
    return {
        "name": "Free rolling 24-hour credits",
        "kind": "shared",
        "window_seconds": int(FREE_WINDOW.total_seconds()),
        "window_start": window_start.isoformat(),
        "window_end": at.isoformat(),
        "limit": FREE_UNIT_LIMIT,
        "used": used_units,
        "remaining": max(FREE_UNIT_LIMIT - used_units, 0),
    }


def _pro_kind_status(db: Session, user_id: UUID, kind: str, limit: int, at: datetime) -> dict:
    window_start = at - PRO_WINDOW
    used = _count_kind(db, user_id, kind, window_start)
    return {
        "name": f"Pro {kind} rolling 5-hour limit",
        "kind": kind,
        "window_seconds": int(PRO_WINDOW.total_seconds()),
        "window_start": window_start.isoformat(),
        "window_end": at.isoformat(),
        "limit": limit,
        "used": used,
        "remaining": max(limit - used, 0),
    }


def get_usage_status(db: Session, user: User) -> dict:
    at = now_utc()
    pro = is_pro_user(user)
    windows = (
        [
            _pro_kind_status(db, user.id, CHAT_KIND, PRO_CHAT_LIMIT, at),
            _pro_kind_status(db, user.id, RESEARCH_KIND, PRO_RESEARCH_LIMIT, at),
        ]
        if pro
        else [_free_window_status(db, user.id, at)]
    )

    return {
        "plan": user.plan,
        "subscription_status": user.subscription_status,
        "is_pro": pro,
        "subscription_current_period_end": user.subscription_current_period_end.isoformat()
        if user.subscription_current_period_end
        else None,
        "windows": windows,
        "rules": {
            "free": {
                "window_seconds": int(FREE_WINDOW.total_seconds()),
                "shared_unit_limit": FREE_UNIT_LIMIT,
                "chat_units": CHAT_UNITS,
                "research_units": RESEARCH_UNITS,
            },
            "pro": {
                "window_seconds": int(PRO_WINDOW.total_seconds()),
                "chat_limit": PRO_CHAT_LIMIT,
                "research_limit": PRO_RESEARCH_LIMIT,
            },
        },
    }


def reserve_usage(db: Session, user: User, kind: str, conversation_id: UUID | None = None) -> UsageEvent:
    rule = USAGE_RULES.get(kind)
    if rule is None:
        raise ValueError(f"Unsupported usage kind: {kind}")

    at = now_utc()
    if is_pro_user(user):
        window_start = at - PRO_WINDOW
        limit = PRO_CHAT_LIMIT if kind == CHAT_KIND else PRO_RESEARCH_LIMIT
        used = _count_kind(db, user.id, kind, window_start)
        if used >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Pro {kind} limit reached. Please try again later.",
            )
    else:
        window_start = at - FREE_WINDOW
        used_units = _sum_units(db, user.id, window_start)
        if used_units + rule.units > FREE_UNIT_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Free plan limit reached. Upgrade to Pro or try again later.",
            )

    event = UsageEvent(user_id=user.id, conversation_id=conversation_id, kind=kind, units=rule.units, created_at=at)
    db.add(event)
    return event
