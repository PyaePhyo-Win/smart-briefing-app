from crewai import Agent

from config import settings


def build_writer() -> Agent:
    """Build and return the Technical Writer agent."""
    return Agent(
        role="Technical Writer",
        goal=(
            "Take gathered facts and structure them into a beautifully clean, "
            "thorough Markdown report"
        ),
        backstory=(
            "You are a master of documentation. You transform raw research into "
            "well-organized Markdown with clear headers, bullet points, bolded "
            "key terms, and a professional tone."
        ),
        llm=settings.crew_llm,
        verbose=True,
        allow_delegation=False,
    )
