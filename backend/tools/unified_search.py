import logging
import os

import requests
from crewai.tools import tool

logger = logging.getLogger(__name__)


@tool("Unified Search Engine")
def unified_search(query: str) -> str:
    """Search the web using Serper.dev with automatic DuckDuckGo failover."""
    serper_key = os.getenv("SERPER_API_KEY")

    if serper_key:
        try:
            resp = requests.post(
                "https://google.serper.dev/search",
                json={"q": query},
                headers={
                    "X-API-KEY": serper_key,
                    "Content-Type": "application/json",
                },
                timeout=10,
            )
            if resp.status_code == 200:
                data = resp.json()
                results = []
                for item in data.get("organic", []):
                    title = item.get("title", "")
                    snippet = item.get("snippet", "")
                    link = item.get("link", "")
                    results.append(f"**{title}**\n{snippet}\nSource: {link}")
                return (
                    "\n\n".join(results) if results else "No results found via Serper."
                )
            else:
                logger.warning(
                    "Serper returned status %s — falling back to DuckDuckGo",
                    resp.status_code,
                )
        except requests.RequestException as exc:
            logger.warning("Serper request failed (%s) — falling back to DuckDuckGo", exc)
    else:
        logger.info("SERPER_API_KEY not set — using DuckDuckGo")

    try:
        from duckduckgo_search import DDGS

        with DDGS() as ddgs:
            raw = list(ddgs.text(query, max_results=5))
            results = []
            for r in raw:
                title = r.get("title", "")
                body = r.get("body", "")
                href = r.get("href", "")
                results.append(f"**{title}**\n{body}\nSource: {href}")
            return (
                "\n\n".join(results) if results else "No results found via DuckDuckGo."
            )
    except Exception as exc:
        logger.error("DuckDuckGo fallback also failed: %s", exc)
        return f"Search failed: {exc}"
