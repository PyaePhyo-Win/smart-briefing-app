from google import genai

from config import settings

_client = genai.Client(api_key=settings.gemini_api_key)

MAX_HISTORY_MESSAGES = 12

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


def build_chat_prompt(message: str, history: list[dict[str, str]], context_chunks: list[str]) -> str:
    return f"""{SYSTEM_INSTRUCTIONS}

Retrieved report excerpts:
---
{_format_context(context_chunks)}
---

Recent conversation:
---
{_format_history(history)}
---

Current user message:
{message.strip()}
"""


def stream_chat(message: str, history: list[dict[str, str]], context_chunks: list[str]):
    """Yield text chunks from Gemini direct chat streaming."""
    response = _client.models.generate_content_stream(
        model=settings.chat_model,
        contents=build_chat_prompt(message, history, context_chunks),
    )
    for chunk in response:
        if chunk.text:
            yield chunk.text
