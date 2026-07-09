from google import genai

from config import settings

_client = genai.Client(api_key=settings.gemini_api_key)

MAX_HISTORY_MESSAGES = 12

SYSTEM_INSTRUCTIONS = """You are Smart Briefing's direct chat assistant.
Answer clearly and concisely in Markdown.
Use the provided report context when it is available.
If the report context is empty and the user asks about a report or prior research, explicitly say the report context is empty and that you can still help with general questions.
Do not invent report details that are not present in the report context.
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


def build_chat_prompt(message: str, history: list[dict[str, str]], report_context: str | None) -> str:
    report = (report_context or "").strip()
    report_section = report if report else "[Report context is empty.]"

    return f"""{SYSTEM_INSTRUCTIONS}

Report context:
---
{report_section}
---

Recent conversation:
---
{_format_history(history)}
---

Current user message:
{message.strip()}
"""


def stream_chat(message: str, history: list[dict[str, str]], report_context: str | None):
    """Yield text chunks from Gemini direct chat streaming."""
    response = _client.models.generate_content_stream(
        model=settings.chat_model,
        contents=build_chat_prompt(message, history, report_context),
    )
    for chunk in response:
        if chunk.text:
            yield chunk.text
