"""AI-powered task plan generation with pluggable providers.

Supported providers (set AI_PROVIDER in .env):
  - ollama  — local LLM via Ollama (free, no API key)
  - gemini  — Google Gemini (needs GEMINI_API_KEY)
  - mock    — deterministic offline plan for demos / tests
"""

from __future__ import annotations

import logging
from collections import deque
from collections.abc import Iterable

import httpx
from fastapi import HTTPException, status
from pydantic import BaseModel, Field, ValidationError
from sqlmodel import Session

from . import crud
from .config import get_settings
from .models import Project, ProjectCreate, Task, TaskDependency, TaskPriority

logger = logging.getLogger(__name__)


class GeneratedTask(BaseModel):
    key: str = Field(description="Stable identifier within this plan (e.g. 'T1').")
    title: str = Field(description="Imperative, concrete task title.")
    detail: str | None = Field(
        default=None, description="Optional 1-2 sentence detail."
    )
    priority: TaskPriority = Field(
        default=TaskPriority.medium,
        description="One of low | medium | high | urgent.",
    )
    depends_on: list[str] = Field(
        default_factory=list,
        description="`key`s of tasks that must complete before this one.",
    )


class TaskPlan(BaseModel):
    tasks: list[GeneratedTask]


class GeneratePlanRequest(BaseModel):
    description: str = Field(min_length=10, max_length=4000)


class NewProjectPlanRequest(BaseModel):
    name: str = Field(min_length=2)
    description: str = Field(min_length=10, max_length=4000)


class CreateProjectWithPlanRequest(BaseModel):
    name: str = Field(min_length=2)
    description: str | None = None
    plan: TaskPlan


SYSTEM_PROMPT = """You are a senior engineering project manager.

Given a project brief, produce a small, concrete plan of 5 to 10 actionable
tasks. Use stable keys 'T1', 'T2', ... for cross-task references.

Each task has:
- `title`: short, imperative ("Set up CI", not "CI setup is needed")
- `detail` (optional): 1-2 sentences of context
- `priority`: low | medium | high | urgent
- `depends_on`: keys of tasks that must complete before this one

Rules:
- Dependencies must reference other tasks in the same plan only.
- The graph must be acyclic.
- Prefer a shape that allows some parallel work (a DAG, not a single chain).
- Don't duplicate tasks that already exist in the project.

Respond with JSON matching the TaskPlan schema only.
"""


def _format_existing(tasks: Iterable[Task]) -> str:
    items = [f"- {t.title} ({t.status})" for t in tasks]
    return "\n".join(items) if items else "(no existing tasks)"


def _validate_plan(plan: TaskPlan) -> None:
    if not plan.tasks:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI returned an empty plan.",
        )

    keys = {t.key for t in plan.tasks}
    if len(keys) != len(plan.tasks):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI returned duplicate task keys.",
        )

    in_degree: dict[str, int] = {t.key: 0 for t in plan.tasks}
    out_edges: dict[str, list[str]] = {t.key: [] for t in plan.tasks}

    for t in plan.tasks:
        if t.key in t.depends_on:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Task {t.key} depends on itself.",
            )
        unknown = [d for d in t.depends_on if d not in keys]
        if unknown:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Task {t.key} depends on unknown keys: {unknown}",
            )
        for d in t.depends_on:
            in_degree[t.key] += 1
            out_edges[d].append(t.key)

    queue: deque[str] = deque(k for k, deg in in_degree.items() if deg == 0)
    processed = 0
    while queue:
        node = queue.popleft()
        processed += 1
        for nxt in out_edges[node]:
            in_degree[nxt] -= 1
            if in_degree[nxt] == 0:
                queue.append(nxt)

    if processed != len(plan.tasks):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI plan contains a dependency cycle.",
        )


def _parse_plan_json(raw: str, provider: str) -> TaskPlan:
    try:
        return TaskPlan.model_validate_json(raw)
    except ValidationError as exc:
        logger.exception("%s returned invalid JSON for TaskPlan", provider)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"{provider} returned an invalid plan: {exc}",
        ) from exc


def _mock_plan(name: str) -> TaskPlan:
    """Deterministic offline plan — useful when cloud quotas are exhausted."""
    return TaskPlan(
        tasks=[
            GeneratedTask(
                key="T1",
                title=f"Define requirements for {name}",
                detail="Document goals, constraints, and success criteria.",
                priority=TaskPriority.high,
            ),
            GeneratedTask(
                key="T2",
                title="Set up project scaffolding",
                detail="Initialize repo, CI, and local dev environment.",
                priority=TaskPriority.high,
                depends_on=["T1"],
            ),
            GeneratedTask(
                key="T3",
                title="Implement core feature",
                detail="Build the main user-facing functionality.",
                priority=TaskPriority.high,
                depends_on=["T2"],
            ),
            GeneratedTask(
                key="T4",
                title="Add automated tests",
                detail="Unit and integration tests for critical paths.",
                priority=TaskPriority.medium,
                depends_on=["T3"],
            ),
            GeneratedTask(
                key="T5",
                title="Write documentation",
                detail="README, API docs, and deployment notes.",
                priority=TaskPriority.low,
                depends_on=["T3"],
            ),
            GeneratedTask(
                key="T6",
                title="Deploy to staging",
                detail="Smoke-test the full flow in a staging environment.",
                priority=TaskPriority.urgent,
                depends_on=["T4", "T5"],
            ),
        ]
    )


def _ollama_plan(user_msg: str) -> TaskPlan:
    settings = get_settings()
    url = f"{settings.ollama_base_url.rstrip('/')}/api/chat"

    try:
        response = httpx.post(
            url,
            json={
                "model": settings.ollama_model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_msg},
                ],
                "stream": False,
                "format": TaskPlan.model_json_schema(),
            },
            timeout=120.0,
        )
        response.raise_for_status()
    except httpx.ConnectError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Ollama is not running. Install from https://ollama.com, then run: "
                f"ollama pull {settings.ollama_model}"
            ),
        ) from exc
    except httpx.HTTPStatusError as exc:
        body = exc.response.text
        if "not found" in body.lower():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    f"Ollama model {settings.ollama_model!r} is not installed. "
                    f"Run `ollama list` to see available models, then set OLLAMA_MODEL "
                    f"in .env (you have gemma3:latest) or run: "
                    f"ollama pull {settings.ollama_model}"
                ),
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Ollama request failed: {body}",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Ollama request failed: {exc}",
        ) from exc

    raw = response.json().get("message", {}).get("content")
    if not raw:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Ollama returned an empty response.",
        )
    return _parse_plan_json(raw, "Ollama")


def _gemini_plan(user_msg: str) -> TaskPlan:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Gemini is selected but GEMINI_API_KEY is not set. "
                "Set AI_PROVIDER=ollama for local generation, or add a Gemini key."
            ),
        )

    from google import genai
    from google.genai import errors as genai_errors
    from google.genai import types as genai_types

    client = genai.Client(api_key=settings.gemini_api_key)

    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=user_msg,
            config=genai_types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=TaskPlan,
            ),
        )
    except genai_errors.APIError as exc:
        logger.exception("Gemini request failed")
        detail = str(exc)
        if "429" in detail or "RESOURCE_EXHAUSTED" in detail:
            detail += (
                " Try AI_PROVIDER=ollama in .env for free local generation, "
                "or AI_PROVIDER=mock for an offline demo plan."
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini request failed: {detail}",
        ) from exc

    raw = response.text
    if not raw:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gemini returned an empty response.",
        )
    return _parse_plan_json(raw, "Gemini")


def _call_llm(user_msg: str, *, project_name: str) -> TaskPlan:
    settings = get_settings()
    provider = settings.ai_provider

    if provider == "mock":
        return _mock_plan(project_name)
    if provider == "ollama":
        return _ollama_plan(user_msg)
    if provider == "gemini":
        return _gemini_plan(user_msg)

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=f"Unknown AI_PROVIDER: {provider!r}. Use ollama, gemini, or mock.",
    )


def generate_plan(project: Project, description: str) -> TaskPlan:
    user_msg = (
        f"Project name: {project.name}\n"
        f"Project description: {project.description or '(none)'}\n"
        f"Existing tasks:\n{_format_existing(project.tasks)}\n\n"
        f"User brief:\n{description.strip()}\n"
    )
    plan = _call_llm(user_msg, project_name=project.name)
    _validate_plan(plan)
    return plan


def generate_plan_for_new_project(name: str, description: str) -> TaskPlan:
    user_msg = (
        f"Project name: {name}\n"
        f"Project description:\n{description.strip()}\n\n"
        f"Existing tasks:\n(none — this is a brand new project)\n"
    )
    plan = _call_llm(user_msg, project_name=name)
    _validate_plan(plan)
    return plan


def create_project_with_plan(
    name: str,
    description: str | None,
    plan: TaskPlan,
    session: Session,
) -> Project:
    _validate_plan(plan)
    project = crud.create_project(
        ProjectCreate(name=name, description=description),
        session,
    )
    import_task_plan(project, plan, session)
    refreshed = crud.get_project(project.project_id, session)
    if refreshed is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Project was created but could not be reloaded.",
        )
    return refreshed


def import_task_plan(
    project: Project, plan: TaskPlan, session: Session
) -> list[Task]:
    _validate_plan(plan)

    key_to_task: dict[str, Task] = {}
    for proposed in plan.tasks:
        task = Task(
            title=proposed.title,
            detail=proposed.detail,
            priority=proposed.priority,
            project_id=project.project_id,
        )
        session.add(task)
        session.flush()
        key_to_task[proposed.key] = task

    for proposed in plan.tasks:
        task = key_to_task[proposed.key]
        for dep_key in proposed.depends_on:
            dep_task = key_to_task.get(dep_key)
            if dep_task is None or task.id is None or dep_task.id is None:
                continue
            session.add(
                TaskDependency(
                    task_id=task.id,
                    depends_on_id=dep_task.id,
                )
            )

    session.commit()
    for task in key_to_task.values():
        session.refresh(task)
    return list(key_to_task.values())
