from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, cast
from uuid import UUID

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.deps import get_current_user, rate_limit, validate_csrf_origin
from config import settings
from db.models import User
from db.session import get_db
from services.usage_limits import get_usage_status

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/billing", tags=["billing"])


class BillingStatusResponse(BaseModel):
    plan: str
    subscription_status: str
    is_pro: bool
    subscription_current_period_end: str | None
    cancel_at_period_end: bool
    stripe_customer_id: str | None
    stripe_subscription_id: str | None
    usage: dict[str, Any]


class CheckoutResponse(BaseModel):
    url: str


class BillingActionResponse(BaseModel):
    ok: bool


def _require_stripe_config() -> None:
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Stripe is not configured")
    stripe.api_key = settings.stripe_secret_key


def _require_checkout_config() -> None:
    _require_stripe_config()
    if not settings.stripe_pro_price_id:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Stripe Pro price is not configured")


def _dt_from_timestamp(timestamp: int | None) -> datetime | None:
    if timestamp is None:
        return None
    return datetime.fromtimestamp(timestamp, tz=timezone.utc)


def _timestamp_from_subscription_period_end(subscription: dict[str, Any]) -> int | None:
    period_end = subscription.get("current_period_end")
    if isinstance(period_end, int):
        return period_end

    items = subscription.get("items")
    if isinstance(items, dict):
        for item in items.get("data") or []:
            if not isinstance(item, dict):
                continue
            item_period_end = item.get("current_period_end")
            if isinstance(item_period_end, int):
                return item_period_end

    return None


def _stripe_object_to_dict(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    to_dict = getattr(value, "to_dict", None)
    if callable(to_dict):
        return cast(dict[str, Any], to_dict())
    to_dict_recursive = getattr(value, "to_dict_recursive", None)
    if callable(to_dict_recursive):
        return cast(dict[str, Any], to_dict_recursive())
    raise TypeError(f"Unsupported Stripe object type: {type(value).__name__}")


def _sync_subscription_to_user(db: Session, subscription: Any, user: User | None = None) -> None:
    subscription = _stripe_object_to_dict(subscription)
    customer_id = subscription.get("customer")
    if isinstance(customer_id, dict):
        customer_id = customer_id.get("id")
    subscription_id = subscription.get("id")
    if user is None:
        user = db.scalar(
            select(User).where(
                (User.stripe_subscription_id == subscription_id)
                | (User.stripe_customer_id == customer_id)
            )
        )
    if user is None:
        logger.warning("No user found for Stripe subscription %s customer %s", subscription_id, customer_id)
        return

    period_end_timestamp = _timestamp_from_subscription_period_end(subscription)
    subscription_status = subscription.get("status") or "inactive"
    if period_end_timestamp is None and subscription_status in {"active", "trialing", "past_due"}:
        logger.warning(
            "Stripe subscription %s has status %s but no current period end in subscription or items payload",
            subscription_id,
            subscription_status,
        )

    user.stripe_customer_id = customer_id
    user.stripe_subscription_id = subscription_id
    user.subscription_status = subscription_status
    user.subscription_current_period_end = _dt_from_timestamp(period_end_timestamp)
    user.cancel_at_period_end = bool(subscription.get("cancel_at_period_end", False))
    user.plan = "pro" if user.subscription_status in {"active", "trialing"} else "free"
    db.add(user)


def _sync_customer_deleted(db: Session, customer_id: str | None) -> None:
    if not customer_id:
        return
    user = db.scalar(select(User).where(User.stripe_customer_id == customer_id))
    if user is None:
        return
    user.plan = "free"
    user.subscription_status = "inactive"
    user.stripe_subscription_id = None
    user.subscription_current_period_end = None
    user.cancel_at_period_end = False
    db.add(user)


def _serialize_status(db: Session, user: User) -> BillingStatusResponse:
    usage = get_usage_status(db, user)
    return BillingStatusResponse(
        plan=user.plan,
        subscription_status=user.subscription_status,
        is_pro=usage["is_pro"],
        subscription_current_period_end=usage["subscription_current_period_end"],
        cancel_at_period_end=user.cancel_at_period_end,
        stripe_customer_id=user.stripe_customer_id,
        stripe_subscription_id=user.stripe_subscription_id,
        usage=usage,
    )


@router.get("/status", response_model=BillingStatusResponse)
def billing_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _serialize_status(db, current_user)


@router.post(
    "/checkout",
    response_model=CheckoutResponse,
    dependencies=[Depends(validate_csrf_origin), Depends(rate_limit(limit=5, window_seconds=300, scope="billing:checkout"))],
)
def create_checkout_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_checkout_config()

    customer_id = current_user.stripe_customer_id
    if not customer_id:
        customer = stripe.Customer.create(email=current_user.email, metadata={"user_id": str(current_user.id)})
        customer_id = customer["id"]
        current_user.stripe_customer_id = customer_id
        db.add(current_user)
        db.commit()

    checkout = stripe.checkout.Session.create(
        mode="subscription",
        customer=customer_id,
        line_items=[{"price": settings.stripe_pro_price_id, "quantity": 1}],
        success_url=settings.billing_success_url,
        cancel_url=settings.billing_cancel_url,
        client_reference_id=str(current_user.id),
        metadata={"user_id": str(current_user.id)},
        subscription_data={"metadata": {"user_id": str(current_user.id)}},
    )
    return CheckoutResponse(url=checkout["url"])


@router.post(
    "/cancel",
    response_model=BillingActionResponse,
    dependencies=[Depends(validate_csrf_origin), Depends(rate_limit(limit=5, window_seconds=300, scope="billing:cancel"))],
)
def cancel_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_stripe_config()
    if not current_user.stripe_subscription_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active subscription found")

    subscription = stripe.Subscription.modify(current_user.stripe_subscription_id, cancel_at_period_end=True)
    _sync_subscription_to_user(db, _stripe_object_to_dict(subscription))
    db.commit()
    return BillingActionResponse(ok=True)


@router.post(
    "/resume",
    response_model=BillingActionResponse,
    dependencies=[Depends(validate_csrf_origin), Depends(rate_limit(limit=5, window_seconds=300, scope="billing:resume"))],
)
def resume_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_stripe_config()
    if not current_user.stripe_subscription_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No subscription found")

    subscription = stripe.Subscription.modify(current_user.stripe_subscription_id, cancel_at_period_end=False)
    _sync_subscription_to_user(db, _stripe_object_to_dict(subscription))
    db.commit()
    return BillingActionResponse(ok=True)


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    _require_stripe_config()
    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Stripe webhook is not configured")

    payload = await request.body()
    signature = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(payload=payload, sig_header=signature, secret=settings.stripe_webhook_secret)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Stripe payload") from exc
    except stripe.SignatureVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Stripe signature") from exc

    event_data = _stripe_object_to_dict(event)
    event_type = event_data.get("type")
    data_object = event_data.get("data", {}).get("object", {})

    if event_type == "checkout.session.completed":
        user_id = data_object.get("client_reference_id") or data_object.get("metadata", {}).get("user_id")
        if user_id:
            try:
                user_uuid = UUID(str(user_id))
            except ValueError:
                logger.warning("Invalid user ID in Stripe checkout session: %s", user_id)
                user_uuid = None
            user = db.get(User, user_uuid) if user_uuid else None
            if user is not None:
                user.stripe_customer_id = data_object.get("customer") or user.stripe_customer_id
                subscription_id = data_object.get("subscription")
                if subscription_id:
                    subscription = stripe.Subscription.retrieve(subscription_id)
                    _sync_subscription_to_user(db, _stripe_object_to_dict(subscription), user=user)
                db.add(user)
    elif event_type in {"customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"}:
        _sync_subscription_to_user(db, data_object)
    elif event_type == "customer.deleted":
        _sync_customer_deleted(db, data_object.get("id"))

    db.commit()
    return {"received": True}
