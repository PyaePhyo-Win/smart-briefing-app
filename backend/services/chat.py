import logging
from collections.abc import AsyncIterator

from google import genai
import tiktoken

from config import settings

logger = logging.getLogger(__name__)

_client = genai.Client(api_key=settings.gemini_api_key)

MAX_HISTORY_MESSAGES = 8
_TOKEN_ENCODING = tiktoken.get_encoding("cl100k_base")

SYSTEM_INSTRUCTIONS = """You are Smart Briefing's direct chat assistant.
Answer clearly and concisely in Markdown.
Use the provided retrieved report excerpts when they are available.
If retrieved excerpts are empty and the user asks about a report or prior research, explicitly say no relevant report context was found and that you can still help with general questions.
Do not invent report details that are not present in the retrieved excerpts.
"""


def _format_history(history: list[dict[str, str]]) -> str:
    formatted: list[str] = []
    for item in history[-MAX_HISTORY_MESSAGES:]:
        role = item.get("role", "user")
        content = item.get("content", "").strip()
        if not content:
            continue
        label = "User" if role == "user" else "Assistant"
        formatted.append(f"{label}: {content}")
    return "\n\n".join(formatted) or "No prior conversation."


def _format_context(chunks: list[str]) -> str:
    if not chunks:
        return "[No relevant report excerpts were found.]"
    return "\n\n".join(f"Excerpt {index + 1}:\n{chunk.strip()}" for index, chunk in enumerate(chunks) if chunk.strip())


def _format_chat_summary(chat_summary: str) -> str:
    summary = chat_summary.strip()
    return summary or "[No compressed conversation memory yet.]"


def estimate_token_count(text: str) -> int:
    """Estimate prompt tokens for observability only; this does not enforce a budget."""
    return len(_TOKEN_ENCODING.encode(text))


def build_chat_prompt(
    message: str,
    history: list[dict[str, str]],
    context_chunks: list[str],
    chat_summary: str = "",
) -> str:
    prompt = f"""{SYSTEM_INSTRUCTIONS}

Retrieved report excerpts:
---
{_format_context(context_chunks)}
---

Compressed conversation memory:
---
{_format_chat_summary(chat_summary)}
---

Recent conversation (raw sliding window):
---
{_format_history(history)}
---

Current user message:
{message.strip()}
"""
    logger.info(
        "Built chat prompt with estimated_tokens=%s raw_history_messages=%s rag_chunks=%s summary_chars=%s",
        estimate_token_count(prompt),
        min(len(history), MAX_HISTORY_MESSAGES),
        len(context_chunks),
        len(chat_summary.strip()),
    )
    return prompt


async def stream_chat(
    message: str,
    history: list[dict[str, str]],
    context_chunks: list[str],
    chat_summary: str = "",
) -> AsyncIterator[str]:
    """Yield text chunks from Gemini direct chat streaming."""
    response = await _client.aio.models.generate_content_stream(
        model=settings.chat_model,
        contents=build_chat_prompt(message, history, context_chunks, chat_summary),
    )
    async for chunk in response:
        if chunk.text:
            yield chunk.text
