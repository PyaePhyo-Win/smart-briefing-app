import logging
import os
from concurrent.futures import ThreadPoolExecutor

from crewai import Crew, Process, Task

from agents.analyst import build_analyst
from agents.writer import build_writer
from config import settings

logger = logging.getLogger(__name__)

_EXECUTOR = ThreadPoolExecutor(max_workers=settings.max_crew_workers)


def get_executor() -> ThreadPoolExecutor:
    """Return the shared thread-pool executor for crew runs."""
    return _EXECUTOR


def run_crew(topic: str, run_id: str | None = None) -> str:
    """Run the research crew synchronously. Intended to be called from an executor."""
    logger.info("Starting CrewAI research for topic: %s", topic)
    os.environ.setdefault("CREWAI_TRACING_ENABLED", "false")

    analyst = build_analyst()
    writer = build_writer()

    research_task = Task(
        description=(
            f"Research the topic: {topic}. "
            "Use the Unified Search Engine to find the latest, most relevant "
            "information. Collect hard facts, statistics, dates, and key points."
        ),
        expected_output=(
            "A comprehensive collection of facts, statistics, and key points "
            "about the topic."
        ),
        agent=analyst,
    )

    write_task = Task(
        description=(
            "Take the researched facts and craft a beautifully structured "
            "Markdown report. Use headings (##, ###), bullet lists, bold text "
            "for emphasis, and a clean logical flow. "
            "Include an introduction, key findings, and a conclusion section."
        ),
        expected_output="A beautifully formatted Markdown document with proper hierarchy.",
        agent=writer,
    )

    crew = Crew(
        agents=[analyst, writer],
        tasks=[research_task, write_task],
        process=Process.sequential,
        verbose=True,
        share_crew=False,
        tracing=False,
    )

    from services.streaming import set_active_run

    set_active_run(run_id)
    try:
        result = crew.kickoff()
        output = str(result)
        logger.info("CrewAI research completed (%d chars)", len(output))
        return output
    finally:
        set_active_run(None)
