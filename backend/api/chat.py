import asyncio
import json
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.deps import get_current_user, rate_limit, validate_csrf_origin
from db.models import Conversation, Message, User, utc_now
from db.session import get_db
from services.chat import MAX_HISTORY_MESSAGES, stream_chat
from services.compaction import compact_older_messages_in_background
from services.rag import retrieve_relevant_chunks

logger = logging.getLogger(__name__)
router = APIRouter()


class ChatRequest(BaseModel):
    conversation_id: UUID | None = None
    message: str

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 1:
            raise ValueError("Message is required")
        if len(value) > 2000:
            raise ValueError("Message must be under 2000 characters")
        return value


def _sse(event_type: str, **data) -> str:
    body = {"type": event_type, **data}
    return f"data: {json.dumps(body)}\n\n"


@router.post(
    "/api/chat/stream",
    dependencies=[Depends(validate_csrf_origin), Depends(rate_limit(limit=12, window_seconds=300, scope="chat:stream"))],
)
async def chat_stream(
    req: ChatRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if req.conversation_id is None:
        conversation = Conversation(user_id=current_user.id, title=req.message[:160])
        db.add(conversation)
        db.flush()
    else:
        conversation = db.scalar(
            select(Conversation).where(Conversation.id == req.conversation_id, Conversation.user_id == current_user.id)
        )
        if conversation is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    previous_messages = list(
        db.scalars(
            select(Message)
            .where(Message.conversation_id == conversation.id, Message.role.in_(["user", "assistant"]))
            .order_by(Message.created_at.desc())
            .limit(MAX_HISTORY_MESSAGES)
        )
    )
    history = [
        {"role": message.role, "content": message.content}
        for message in reversed(previous_messages)
        if message.role in {"user", "assistant"}
    ]
    context_chunks = [chunk.content for chunk in retrieve_relevant_chunks(db, current_user.id, conversation.id, req.message)]
    chat_summary = conversation.chat_summary or ""

    db.add(Message(user_id=current_user.id, conversation_id=conversation.id, role="user", kind="chat", content=req.message))
    conversation.updated_at = utc_now()
    db.commit()

    async def event_stream():
        assistant_parts: list[str] = []
        try:
            async for text_chunk in stream_chat(req.message, history, context_chunks, chat_summary):
                if await request.is_disconnected():
                    return
                assistant_parts.append(text_chunk)
                yield _sse("token", text=text_chunk)
        except Exception as exc:
            logger.exception("Gemini chat failed")
            yield _sse("error", message="Chat failed. Please try again.")
            return

        assistant_text = "".join(assistant_parts).strip()
        if assistant_text:
            try:
                db.add(
                    Message(
                        user_id=current_user.id,
                        conversation_id=conversation.id,
                        role="assistant",
                        kind="chat",
                        content=assistant_text,
                    )
                )
                conversation.updated_at = utc_now()
                db.commit()
                asyncio.create_task(compact_older_messages_in_background(str(conversation.id)))
            except Exception:
                db.rollback()
                logger.exception("Failed to persist chat assistant response")
                yield _sse("error", message="Chat response could not be saved. Please try again.")
                return

        yield _sse("done", conversation_id=str(conversation.id))

    return StreamingResponse(event_stream(), media_type="text/event-stream")
