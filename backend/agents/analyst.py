from crewai import Agent

from config import settings
from tools.unified_search import unified_search


def build_analyst() -> Agent:
    """Build and return the Senior Research Analyst agent."""
    return Agent(
        role="Senior Research Analyst",
        goal="Search the web and harvest hard facts about the given topic",
        backstory=(
            "You are a tenacious researcher who leaves no stone unturned. "
            "You use the Unified Search Engine to find the latest, most relevant "
            "information and compile bulletproof facts."
        ),
        tools=[unified_search],
        llm=settings.crew_llm,
        verbose=True,
        allow_delegation=False,
    )
