from typing import Literal, cast
from uuid import UUID

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.deps import get_current_user, rate_limit, validate_csrf_origin
from config import settings
from db.models import User
from db.session import get_db
from services.auth import create_session, delete_session_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


class AuthRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class UserResponse(BaseModel):
    id: UUID
    email: str

    model_config = {"from_attributes": True}


def _cookie_samesite() -> Literal["lax", "strict", "none"]:
    return cast(Literal["lax", "strict", "none"], settings.session_cookie_samesite)


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=_cookie_samesite(),
        max_age=settings.session_expire_days * 24 * 60 * 60,
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.session_cookie_name,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=_cookie_samesite(),
        path="/",
    )


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(validate_csrf_origin), Depends(rate_limit(limit=5, window_seconds=300, scope="auth:register"))],
)
def register(payload: AuthRequest, response: Response, db: Session = Depends(get_db)):
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    user = User(email=payload.email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    token, _session = create_session(db, user)
    _set_session_cookie(response, token)
    return user


@router.post(
    "/login",
    response_model=UserResponse,
    dependencies=[Depends(validate_csrf_origin), Depends(rate_limit(limit=10, window_seconds=300, scope="auth:login"))],
)
def login(payload: AuthRequest, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token, _session = create_session(db, user)
    _set_session_cookie(response, token)
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(validate_csrf_origin)])
def logout(
    response: Response,
    session_token: str | None = Cookie(default=None, alias=settings.session_cookie_name),
    db: Session = Depends(get_db),
):
    delete_session_token(db, session_token)
    _clear_session_cookie(response)
    return {"ok": True}


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user
