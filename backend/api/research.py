import asyncio
import json
import logging
import queue as q

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator

from agents.crew_runner import get_executor, run_crew
from services.polish import stream_polish
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


@router.post("/api/research/stream")
async def research_stream(req: ResearchRequest, _request: Request):
    topic = req.topic

    async def event_stream():
        event_queue: q.Queue = q.Queue()

        yield _sse("log", agent="System", event="status", message="Starting crew research...")

        handlers = register_crew_handlers(event_queue)
        loop = asyncio.get_event_loop()

        try:
            crew_future = loop.run_in_executor(get_executor(), run_crew, topic)

            while not crew_future.done():
                # Check for client disconnect — abort early to avoid wasting LLM tokens
                if await _request.is_disconnected():
                    crew_future.cancel()
                    logger.info("Client disconnected — aborting research stream")
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
            yield _sse("error", message=f"Research agent failed: {e}")
            return
        finally:
            unregister_handlers(handlers)

        yield _sse("log", agent="System", event="status", message="Polishing report with Gemini...")

        try:
            for text_chunk in stream_polish(raw_report):
                if await _request.is_disconnected():
                    return
                yield _sse("token", text=text_chunk)
        except Exception as e:
            logger.exception("Gemini polish failed")
            yield _sse("error", message=f"Gemini polish failed: {e}")
            return

        yield _sse("done")

    return StreamingResponse(event_stream(), media_type="text/event-stream")
