from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from api.deps import get_current_user, validate_csrf_origin
from db.models import Conversation, Message, Report, User
from db.session import get_db

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


class MessageResponse(BaseModel):
    id: UUID
    role: str
    kind: str
    content: str
    created_at: datetime


class ReportResponse(BaseModel):
    id: UUID
    polished_content: str
    created_at: datetime


class ConversationSummaryResponse(BaseModel):
    id: UUID
    title: str | None
    created_at: datetime
    updated_at: datetime
    message_count: int
    latest_message_preview: str | None = None


class ConversationDetailResponse(BaseModel):
    id: UUID
    title: str | None
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse]
    latest_report: ReportResponse | None = None


@router.get("", response_model=list[ConversationSummaryResponse])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message_count = func.count(Message.id).label("message_count")
    latest_message_at = func.max(Message.created_at).label("latest_message_at")

    rows = db.execute(
        select(Conversation, message_count, latest_message_at)
        .outerjoin(Message, Message.conversation_id == Conversation.id)
        .where(Conversation.user_id == current_user.id)
        .group_by(Conversation.id)
        .order_by(Conversation.updated_at.desc(), Conversation.created_at.desc())
    ).all()

    conversation_ids = [conversation.id for conversation, _, _ in rows]
    preview_by_id: dict[UUID, str] = {}
    if conversation_ids:
        ranked_messages = (
            select(
                Message.conversation_id.label("conversation_id"),
                Message.content.label("content"),
                func.row_number()
                .over(partition_by=Message.conversation_id, order_by=Message.created_at.desc())
                .label("rank"),
            )
            .where(Message.user_id == current_user.id, Message.conversation_id.in_(conversation_ids))
            .subquery()
        )
        preview_by_id = {
            conversation_id: content
            for conversation_id, content in db.execute(
                select(ranked_messages.c.conversation_id, ranked_messages.c.content).where(ranked_messages.c.rank == 1)
            )
            if content
        }

    return [
        ConversationSummaryResponse(
            id=conversation.id,
            title=conversation.title,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            message_count=int(count or 0),
            latest_message_preview=(preview[:240] if (preview := preview_by_id.get(conversation.id)) else None),
        )
        for conversation, count, _ in rows
    ]


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
def get_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = db.scalar(
        select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    )
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    messages = list(
        db.scalars(
            select(Message)
            .where(Message.conversation_id == conversation.id, Message.user_id == current_user.id)
            .order_by(Message.created_at.asc())
        )
    )
    latest_report = db.scalar(
        select(Report)
        .where(Report.conversation_id == conversation.id, Report.user_id == current_user.id)
        .order_by(Report.created_at.desc())
        .limit(1)
    )

    return ConversationDetailResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[
            MessageResponse(
                id=message.id,
                role=message.role,
                kind=message.kind,
                content=message.content,
                created_at=message.created_at,
            )
            for message in messages
        ],
        latest_report=(
            ReportResponse(
                id=latest_report.id,
                polished_content=latest_report.polished_content,
                created_at=latest_report.created_at,
            )
            if latest_report
            else None
        ),
    )


@router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(validate_csrf_origin)],
)
def delete_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = db.scalar(
        select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    )
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    db.delete(conversation)
    db.commit()
