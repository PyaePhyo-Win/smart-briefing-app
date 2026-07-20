import logging
import queue as q
import threading
from datetime import datetime, timezone

from crewai.events.event_bus import crewai_event_bus
from crewai.events.types.agent_events import (
    AgentExecutionCompletedEvent,
    AgentExecutionStartedEvent,
)
from crewai.events.types.reasoning_events import (
    AgentReasoningCompletedEvent,
    AgentReasoningStartedEvent,
)
from crewai.events.types.task_events import (
    TaskCompletedEvent,
    TaskStartedEvent,
)
from crewai.events.types.tool_usage_events import (
    ToolUsageFinishedEvent,
    ToolUsageStartedEvent,
)

logger = logging.getLogger(__name__)
_active_run = threading.local()


def set_active_run(run_id: str | None) -> None:
    _active_run.id = run_id


def get_active_run() -> str | None:
    return getattr(_active_run, "id", None)


def register_crew_handlers(event_queue: q.Queue, run_id: str) -> list[tuple]:
    """Register CrewAI event bus handlers that push events onto *event_queue*.

    Returns a list of (event_type, handler) tuples that must be passed to
    :func:`unregister_handlers` when the stream is finished.
    """
    handlers: list[tuple] = []

    def _push(agent: str, event_name: str, message: str) -> None:
        if get_active_run() != run_id:
            return
        body = {
            "type": "log",
            "agent": agent,
            "event": event_name,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }
        event_queue.put_nowait(body)

    def _get_role(event) -> str:
        if hasattr(event, "agent_role") and event.agent_role:
            return event.agent_role
        if hasattr(event, "agent") and event.agent is not None:
            return getattr(event.agent, "role", str(event.agent))
        return "Agent"

    def on_tool_started(_source, event: ToolUsageStartedEvent) -> None:
        args = event.tool_args
        query = str(args.get("query", args.get("q", args))) if isinstance(args, dict) else str(args)
        _push(_get_role(event), "tool_started", f"Searching for: {query[:120]}")

    def on_tool_finished(_source, event: ToolUsageFinishedEvent) -> None:
        output_len = len(str(event.output)) if event.output else 0
        _push(_get_role(event), "tool_finished", f"Search completed ({output_len} chars)")

    def on_reasoning_started(_source, event: AgentReasoningStartedEvent) -> None:
        _push(
            event.agent_role,
            "reasoning_started",
            f"{event.agent_role} is analyzing (attempt {event.attempt})...",
        )

    def on_reasoning_completed(_source, event: AgentReasoningCompletedEvent) -> None:
        status = "ready" if event.ready else "needs revision"
        _push(event.agent_role, "reasoning_completed", f"{event.agent_role} analysis {status}")

    def on_task_started(_source, event: TaskStartedEvent) -> None:
        task_desc = getattr(event.task, "description", "") if event.task else ""
        desc_short = (task_desc[:100] + "...") if len(task_desc) > 100 else task_desc
        _push("System", "task_started", f"Task: {desc_short or 'Unknown task'}")

    def on_task_completed(_source, event: TaskCompletedEvent) -> None:
        role = getattr(event.task, "agent", None)
        agent_name = getattr(role, "role", "System") if role else "System"
        _push(agent_name, "task_completed", f"{agent_name} task finished")

    def on_agent_started(_source, event: AgentExecutionStartedEvent) -> None:
        _push(event.agent.role, "execution_started", f"{event.agent.role} is working...")

    def on_agent_completed(_source, event: AgentExecutionCompletedEvent) -> None:
        _push(event.agent.role, "execution_completed", f"{event.agent.role} completed")

    registrations = [
        (ToolUsageStartedEvent, on_tool_started),
        (ToolUsageFinishedEvent, on_tool_finished),
        (AgentReasoningStartedEvent, on_reasoning_started),
        (AgentReasoningCompletedEvent, on_reasoning_completed),
        (TaskStartedEvent, on_task_started),
        (TaskCompletedEvent, on_task_completed),
        (AgentExecutionStartedEvent, on_agent_started),
        (AgentExecutionCompletedEvent, on_agent_completed),
    ]

    for event_type, handler in registrations:
        crewai_event_bus.register_handler(event_type, handler)
        handlers.append((event_type, handler))

    logger.info("Registered %d event bus handlers for streaming", len(handlers))
    return handlers


def unregister_handlers(handlers: list[tuple]) -> None:
    """Unregister all handlers previously returned by :func:`register_crew_handlers`."""
    for event_type, handler in handlers:
        try:
            crewai_event_bus.off(event_type, handler)
        except Exception:
            logger.warning("Failed to unregister handler for %s", event_type.__name__)
    logger.info("Unregistered %d event bus handlers", len(handlers))
