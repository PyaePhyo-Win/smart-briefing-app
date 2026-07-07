import logging

from google import genai

from config import settings

logger = logging.getLogger(__name__)

_client = genai.Client(api_key=settings.gemini_api_key)

POLISH_PROMPT = (
    "You are a senior editor. Polish the following research report. "
    "Improve clarity, fix formatting, ensure proper Markdown "
    "(headings, bold, bullet lists). Preserve all facts. "
    "Output ONLY the polished Markdown.\n\n"
    "---\n\n{report}"
)


def stream_polish(raw_report: str):
    """Yield text chunks from Gemini polish streaming."""
    response = _client.models.generate_content_stream(
        model=settings.polish_model,
        contents=POLISH_PROMPT.format(report=raw_report),
    )
    for chunk in response:
        if chunk.text:
            yield chunk.text
