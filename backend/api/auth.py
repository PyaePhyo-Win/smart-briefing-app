import re
from datetime import datetime, timezone
from io import BytesIO
from typing import Literal, cast
from uuid import UUID, uuid4

from fastapi import APIRouter, Cookie, Depends, File, HTTPException, Response, UploadFile, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.deps import get_current_user, rate_limit, validate_csrf_origin
from config import settings
from db.models import User
from db.session import get_db
from services.auth import create_session, delete_session_token, hash_password, verify_and_update_password
from services.object_storage import delete_object, upload_profile_photo

router = APIRouter(prefix="/api/auth", tags=["auth"])

USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_]{3,32}$")
ALLOWED_PROFILE_IMAGE_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}

class AuthRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=1024)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class UserResponse(BaseModel):
    id: UUID
    email: str
    username: str
    display_name: str | None = None
    profile_image_url: str | None = None
    plan: str
    subscription_status: str
    subscription_current_period_end: datetime | None = None

    model_config = {"from_attributes": True}


class ProfileUpdateRequest(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=32)
    display_name: str | None = Field(default=None, max_length=80)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not USERNAME_PATTERN.fullmatch(normalized):
            raise ValueError("Username must be 3-32 characters and use only letters, numbers, or underscores")
        return normalized.lower()

    @field_validator("display_name")
    @classmethod
    def normalize_display_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = " ".join(value.strip().split())
        return normalized or None


def _generate_username(email: str, db: Session) -> str:
    local_part = email.split("@", 1)[0]
    base = re.sub(r"[^a-zA-Z0-9_]", "_", local_part).strip("_").lower() or "user"
    base = base[:32]
    if len(base) < 3:
        base = f"{base}_user"[:32]

    candidate = base
    suffix = 1
    while db.scalar(select(User.id).where(User.username == candidate)) is not None:
        suffix += 1
        suffix_text = f"_{suffix}"
        candidate = f"{base[: 32 - len(suffix_text)]}{suffix_text}"
    return candidate


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

    user = User(
        email=payload.email,
        username=_generate_username(payload.email, db),
        password_hash=hash_password(payload.password),
    )
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
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    password_valid, updated_hash = verify_and_update_password(payload.password, user.password_hash)
    if not password_valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if updated_hash is not None:
        user.password_hash = updated_hash
        db.commit()

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


@router.patch(
    "/me/profile",
    response_model=UserResponse,
    dependencies=[Depends(validate_csrf_origin), Depends(rate_limit(limit=20, window_seconds=300, scope="auth:profile"))],
)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.username is not None and payload.username != current_user.username:
        existing = db.scalar(select(User).where(User.username == payload.username, User.id != current_user.id))
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username is already taken")
        current_user.username = payload.username

    if "display_name" in payload.model_fields_set:
        current_user.display_name = payload.display_name

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post(
    "/me/profile-photo",
    response_model=UserResponse,
    dependencies=[Depends(validate_csrf_origin), Depends(rate_limit(limit=10, window_seconds=300, scope="auth:profile-photo"))],
)
async def upload_profile_photo_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content_type = file.content_type or ""
    extension = ALLOWED_PROFILE_IMAGE_TYPES.get(content_type)
    if extension is None:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Use a JPG, PNG, or WebP image")

    data = await file.read(settings.profile_upload_max_bytes + 1)
    if len(data) > settings.profile_upload_max_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Profile photo is too large")
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profile photo is empty")

    object_key = f"users/{current_user.id}/profile/{uuid4().hex}.{extension}"
    previous_object_key = current_user.profile_image_object_key
    image_url = upload_profile_photo(BytesIO(data), object_key, content_type)

    current_user.profile_image_url = image_url
    current_user.profile_image_object_key = object_key
    current_user.profile_image_content_type = content_type
    current_user.profile_image_updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)

    delete_object(previous_object_key)
    return current_user


@router.delete(
    "/me/profile-photo",
    response_model=UserResponse,
    dependencies=[Depends(validate_csrf_origin), Depends(rate_limit(limit=10, window_seconds=300, scope="auth:profile-photo"))],
)
def delete_profile_photo_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    object_key = current_user.profile_image_object_key
    current_user.profile_image_url = None
    current_user.profile_image_object_key = None
    current_user.profile_image_content_type = None
    current_user.profile_image_updated_at = None
    db.commit()
    db.refresh(current_user)

    delete_object(object_key)
    return current_user
