import asyncio
import json
import logging
import queue as q
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from agents.crew_runner import get_executor, run_crew
from api.deps import get_current_user, rate_limit, validate_csrf_origin
from db.models import Conversation, Message, Report, User, utc_now
from db.session import get_db
from services.polish import stream_polish
from services.rag import index_report_chunks
from services.streaming import register_crew_handlers, unregister_handlers

logger = logging.getLogger(__name__)
router = APIRouter()


class ResearchRequest(BaseModel):
    topic: str

    @field_validator("topic")
    @classmethod
    def validate_topic(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Topic must be at least 3 characters")
        if len(v) > 300:
            raise ValueError("Topic must be under 300 characters")
        return v


def _sse(event_type: str, **data) -> str:
    body = {"type": event_type, **data}
    return f"data: {json.dumps(body)}\n\n"


@router.post(
    "/stream",
    dependencies=[Depends(validate_csrf_origin), Depends(rate_limit(limit=3, window_seconds=300, scope="research:stream"))],
)
async def research_stream(
    request: ResearchRequest,
    _request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    topic = request.topic
    conversation = Conversation(user_id=current_user.id, title=topic[:120])
    db.add(conversation)
    db.flush()
    db.add(Message(user_id=current_user.id, conversation_id=conversation.id, role="user", kind="research", content=topic))
    conversation.updated_at = utc_now()
    db.commit()
    conversation_id = conversation.id

    def cleanup_incomplete_conversation(reason: str) -> None:
        try:
            db.rollback()
            incomplete_conversation = db.get(Conversation, conversation_id)
            if incomplete_conversation is not None:
                db.delete(incomplete_conversation)
                db.commit()
                logger.info("Removed incomplete research conversation %s after %s", conversation_id, reason)
        except Exception:
            db.rollback()
            logger.exception("Failed to remove incomplete research conversation %s", conversation_id)

    async def event_stream():
        event_queue: q.Queue = q.Queue()

        yield _sse("log", agent="System", event="status", message="Starting crew research...")

        handlers = register_crew_handlers(event_queue)
        loop = asyncio.get_event_loop()

        try:
            crew_future = loop.run_in_executor(get_executor(), run_crew, topic)

            while not crew_future.done():
                if await _request.is_disconnected():
                    cancel_requested = crew_future.cancel()
                    logger.info(
                        "Client disconnected; requested best-effort research cancellation for conversation %s (accepted=%s)",
                        conversation_id,
                        cancel_requested,
                    )
                    cleanup_incomplete_conversation("client disconnect during research")
                    return
                try:
                    event = event_queue.get(timeout=0.1)
                    yield _sse(event["type"], **{k: v for k, v in event.items() if k != "type"})
                except q.Empty:
                    continue

            # Drain remaining events
            while not event_queue.empty():
                try:
                    event = event_queue.get_nowait()
                    yield _sse(event["type"], **{k: v for k, v in event.items() if k != "type"})
                except q.Empty:
                    break

            raw_report = crew_future.result()

        except Exception as e:
            logger.exception("CrewAI research failed")
            cleanup_incomplete_conversation("research failure")
            yield _sse("error", message="Research failed. Please try again.")
            return
        finally:
            unregister_handlers(handlers)

        yield _sse("log", agent="System", event="status", message="Polishing report with Gemini...")

        polished_parts: list[str] = []
        try:
            for text_chunk in stream_polish(raw_report):
                if await _request.is_disconnected():
                    logger.info("Client disconnected during report polishing for conversation %s", conversation_id)
                    cleanup_incomplete_conversation("client disconnect during polishing")
                    return
                polished_parts.append(text_chunk)
                yield _sse("token", text=text_chunk)
        except Exception as e:
            logger.exception("Gemini polish failed")
            cleanup_incomplete_conversation("polish failure")
            yield _sse("error", message="Report polishing failed. Please try again.")
            return

        polished_report = "".join(polished_parts).strip()
        if polished_report:
            try:
                report = Report(
                    user_id=current_user.id,
                    conversation_id=conversation_id,
                    raw_content=raw_report,
                    polished_content=polished_report,
                )
                db.add(report)
                db.flush()
                db.add(
                    Message(
                        user_id=current_user.id,
                        conversation_id=conversation_id,
                        role="assistant",
                        kind="research_report",
                        content=polished_report,
                    )
                )
                conversation_to_update = db.get(Conversation, conversation_id)
                if conversation_to_update is None:
                    raise RuntimeError("Research conversation was removed before persistence completed")
                conversation_to_update.updated_at = utc_now()
                index_report_chunks(db, report)
                db.commit()
            except Exception:
                db.rollback()
                logger.exception("Report persistence failed")
                cleanup_incomplete_conversation("persistence failure")
                yield _sse("error", message="Report persistence failed. Please try again.")
                return

            yield _sse("done", conversation_id=str(conversation_id))

    return StreamingResponse(event_stream(), media_type="text/event-stream")
