import json
import logging
from typing import Literal

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator

from services.chat import MAX_HISTORY_MESSAGES, stream_chat

logger = logging.getLogger(__name__)
router = APIRouter()


class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=12000)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        return value.strip()


class ChatRequest(BaseModel):
    message: str
    history: list[ChatHistoryMessage] = Field(default_factory=list, max_length=MAX_HISTORY_MESSAGES)
    report_context: str | None = Field(default=None, max_length=50000)

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


@router.post("/api/chat/stream")
async def chat_stream(req: ChatRequest, request: Request):
    async def event_stream():
        try:
            history = [item.model_dump() for item in req.history[-MAX_HISTORY_MESSAGES:]]
            for text_chunk in stream_chat(req.message, history, req.report_context):
                if await request.is_disconnected():
                    return
                yield _sse("token", text=text_chunk)
        except Exception as exc:
            logger.exception("Gemini chat failed")
            yield _sse("error", message=f"Gemini chat failed: {exc}")
            return

        yield _sse("done")

    return StreamingResponse(event_stream(), media_type="text/event-stream")
