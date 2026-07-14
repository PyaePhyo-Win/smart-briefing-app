import logging
from uuid import UUID

from google import genai
from sqlalchemy import select
from sqlalchemy.orm import Session

from config import settings
from db.models import Conversation, Message, utc_now
from db.session import SessionLocal

logger = logging.getLogger(__name__)

_client = genai.Client(api_key=settings.gemini_api_key)

RAW_CONTEXT_MESSAGE_LIMIT = 8
COMPACTION_PROMPT_TEMPLATE = """You are a context compaction utility designed to compress conversational history into a dense, stateless factual summary. 
[EXISTING MEMORY SUMMARY]
{old_chat_summary}
[NEW TURNS TO ACCRUE]
{evicted_raw_messages}
UPDATED COMPRESSED MEMORY:
"""


def _format_evicted_messages(messages: list[Message]) -> str:
    formatted: list[str] = []
    for message in messages:
        content = message.content.strip()
        if not content:
            continue
        label = "User" if message.role == "user" else "Assistant"
        formatted.append(f"{label}: {content}")
    return "\n\n".join(formatted)


async def compact_older_messages(conversation_id: str, db: Session) -> None:
    """Accrue chat messages older than the raw sliding window into Conversation.chat_summary."""
    try:
        conversation_uuid = UUID(conversation_id)
        conversation = db.scalar(select(Conversation).where(Conversation.id == conversation_uuid))
        if conversation is None:
            logger.info("Skipping chat compaction; conversation %s was not found", conversation_id)
            return

        uncompacted_messages = list(
            db.scalars(
                select(Message)
                .where(
                    Message.conversation_id == conversation.id,
                    Message.kind == "chat",
                    Message.role.in_(["user", "assistant"]),
                    Message.compacted_at.is_(None),
                )
                .order_by(Message.created_at.asc(), Message.id.asc())
            )
        )
        if len(uncompacted_messages) <= RAW_CONTEXT_MESSAGE_LIMIT:
            return

        evicted_messages = uncompacted_messages[:-RAW_CONTEXT_MESSAGE_LIMIT]
        evicted_raw_messages = _format_evicted_messages(evicted_messages)
        if not evicted_raw_messages:
            return

        prompt = COMPACTION_PROMPT_TEMPLATE.format(
            old_chat_summary=conversation.chat_summary.strip() or "[No existing memory summary.]",
            evicted_raw_messages=evicted_raw_messages,
        )
        response = await _client.aio.models.generate_content(
            model=settings.chat_model,
            contents=prompt,
        )
        updated_summary = (response.text or "").strip()
        if not updated_summary:
            logger.warning("Skipping chat compaction commit; Gemini returned an empty summary for %s", conversation_id)
            return

        compacted_at = utc_now()
        conversation.chat_summary = updated_summary
        conversation.updated_at = compacted_at
        for message in evicted_messages:
            message.compacted_at = compacted_at

        db.commit()
        logger.info(
            "Compacted %s chat messages for conversation %s",
            len(evicted_messages),
            conversation_id,
        )
    except Exception:
        db.rollback()
        logger.exception("Chat compaction failed for conversation %s", conversation_id)


async def compact_older_messages_in_background(conversation_id: str) -> None:
    """Run chat compaction with an independent DB session for post-stream background tasks."""
    db = SessionLocal()
    try:
        await compact_older_messages(conversation_id, db)
    finally:
        db.close()
