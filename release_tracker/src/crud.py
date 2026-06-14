from collections import deque
from datetime import date
from typing import Any

from fastapi import HTTPException, status
from sqlmodel import Session, select

from .models import (
    Project,
    ProjectCreate,
    ProjectUpdate,
    Task,
    TaskCreate,
    TaskDependency,
    TaskPriority,
    TaskStatus,
    TaskUpdate,
)


def slugify(value: str) -> str:
    cleaned = "".join(c if c.isalnum() else " " for c in value.lower())
    return "-".join(cleaned.split()) or "project"


def list_projects(session: Session) -> list[Project]:
    statement = select(Project).order_by(Project.name)
    return list(session.exec(statement).all())


def get_project(project_id: int, session: Session) -> Project | None:
    return session.get(Project, project_id)


def create_project(payload: ProjectCreate, session: Session) -> Project:
    project = Project.model_validate(
        payload, update={"slug": slugify(payload.name)}
    )
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


def update_project(
    session: Session, project_id: int, payload: ProjectUpdate
) -> Project:
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    data = payload.model_dump(exclude_unset=True)
    if "name" in data:
        data["slug"] = slugify(data["name"])
    for key, value in data.items():
        setattr(project, key, value)
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


def delete_project(project_id: int, session: Session) -> None:
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    session.delete(project)
    session.commit()


def get_task(task_id: int, session: Session) -> Task | None:
    return session.get(Task, task_id)


def list_tasks(
    session: Session,
    project_id: int | None = None,
    project_slug: str | None = None,
    task_status: TaskStatus | None = None,
    over_due: bool = False,
    task_priority: TaskPriority | None = None,
) -> list[Task]:
    statement = select(Task)
    if project_id is not None:
        statement = statement.where(Task.project_id == project_id)
    if project_slug is not None:
        statement = statement.join(Project).where(Project.slug == project_slug)
    if task_status is not None:
        statement = statement.where(Task.status == task_status)
    if task_priority is not None:
        statement = statement.where(Task.priority == task_priority)
    if over_due:
        statement = (
            statement.where(Task.due_date.is_not(None))  # type: ignore[union-attr]
            .where(Task.due_date < date.today())
            .where(Task.status != TaskStatus.done)
        )
    return list(session.exec(statement).all())


def create_task(
    project: Project, payload: TaskCreate, session: Session
) -> Task:
    task = Task.model_validate(
        payload, update={"project_id": project.project_id}
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def count_unmet_dependencies(task_id: int, session: Session) -> int:
    statement = (
        select(Task)
        .join(TaskDependency, TaskDependency.depends_on_id == Task.id)
        .where(TaskDependency.task_id == task_id)
        .where(Task.status != TaskStatus.done)
    )
    return len(session.exec(statement).all())


def update_task(
    task_id: int, payload: TaskUpdate, session: Session
) -> Task:
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    data = payload.model_dump(exclude_unset=True)

    if (
        data.get("status") == TaskStatus.done
        and task.status != TaskStatus.done
        and count_unmet_dependencies(task_id, session) > 0
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This task cannot be marked done while it still has "
                "unfinished dependencies."
            ),
        )

    for key, value in data.items():
        setattr(task, key, value)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def delete_task(task_id: int, session: Session) -> dict[str, Any]:
    """Delete a task and return a snapshot the caller can use to restore it.

    The snapshot includes the task's own fields plus every TaskDependency
    edge it participates in (on either side), since CASCADE will remove
    those edges from the DB.
    """
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    edges = session.exec(
        select(TaskDependency).where(
            (TaskDependency.task_id == task_id)
            | (TaskDependency.depends_on_id == task_id)
        )
    ).all()

    snapshot: dict[str, Any] = {
        "task": task.model_dump(),
        "dependencies": [
            {"task_id": e.task_id, "depends_on_id": e.depends_on_id}
            for e in edges
        ],
    }

    session.delete(task)
    session.commit()
    return snapshot


def restore_task(snapshot: dict[str, Any], session: Session) -> Task:
    """Recreate a previously deleted task with the same id, plus its edges.

    Edges whose other endpoint has since been deleted are silently skipped,
    so undo is best-effort but never crashes.
    """
    task_data = dict(snapshot["task"])
    task_id: int = task_data["id"]

    if session.get(Task, task_id) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Task already exists; nothing to restore",
        )

    task = Task(**task_data)
    session.add(task)
    session.flush()

    for edge in snapshot.get("dependencies", []):
        other_id = (
            edge["depends_on_id"]
            if edge["task_id"] == task_id
            else edge["task_id"]
        )
        if session.get(Task, other_id) is None:
            continue
        session.add(
            TaskDependency(
                task_id=edge["task_id"],
                depends_on_id=edge["depends_on_id"],
            )
        )

    session.commit()
    session.refresh(task)
    return task

def list_dependencies(task_id: int, session: Session) -> list[Task]:
    statement = (
        select(Task)
        .join(TaskDependency, TaskDependency.depends_on_id == Task.id)
        .where(TaskDependency.task_id == task_id)
        .order_by(Task.title)
    )
    return list(session.exec(statement).all())


def list_dependents(task_id: int, session: Session) -> list[Task]:
    statement = (
        select(Task)
        .join(TaskDependency, TaskDependency.task_id == Task.id)
        .where(TaskDependency.depends_on_id == task_id)
        .order_by(Task.title)
    )
    return list(session.exec(statement).all())


def _would_create_cycle(
    task_id: int, depends_on_id: int, session: Session
) -> bool:
    """Return True if adding task_id -> depends_on_id would create a cycle.

    A cycle exists iff task_id is (transitively) reachable from depends_on_id
    by following depends_on edges.
    """
    visited: set[int] = set()
    stack: list[int] = [depends_on_id]
    while stack:
        current = stack.pop()
        if current == task_id:
            return True
        if current in visited:
            continue
        visited.add(current)
        rows = session.exec(
            select(TaskDependency.depends_on_id).where(
                TaskDependency.task_id == current
            )
        ).all()
        stack.extend(rows)
    return False


def add_dependency(
    task_id: int, depends_on_id: int, session: Session
) -> TaskDependency:
    if task_id == depends_on_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A task cannot depend on itself",
        )

    task = session.get(Task, task_id)
    dep = session.get(Task, depends_on_id)
    if not task or not dep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    if task.project_id != dep.project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dependencies must be in the same project",
        )

    existing = session.get(TaskDependency, (task_id, depends_on_id))
    if existing:
        return existing

    if _would_create_cycle(task_id, depends_on_id, session):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Adding this dependency would create a cycle",
        )

    edge = TaskDependency(task_id=task_id, depends_on_id=depends_on_id)
    session.add(edge)
    session.commit()
    session.refresh(edge)
    return edge


def remove_dependency(
    task_id: int, depends_on_id: int, session: Session
) -> None:
    edge = session.get(TaskDependency, (task_id, depends_on_id))
    if not edge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dependency not found",
        )
    session.delete(edge)
    session.commit()

def topological_order(project_id: int, session: Session) -> list[Task]:
    """Return a project's tasks in dependency execution order (Kahn's algorithm).

    For every edge X -> Y (X depends on Y), Y appears before X in the result.
    Complexity: O(V + E) where V = tasks, E = dependency edges.
    """
    tasks = list_tasks(session, project_id=project_id)
    if not tasks:
        return []

    task_by_id: dict[int, Task] = {t.id: t for t in tasks if t.id is not None}
    task_ids = list(task_by_id.keys())

    edges = session.exec(
        select(TaskDependency).where(
            TaskDependency.task_id.in_(task_ids)  # type: ignore[attr-defined]
        )
    ).all()

    in_degree: dict[int, int] = {tid: 0 for tid in task_ids}
    dependents: dict[int, list[int]] = {tid: [] for tid in task_ids}

    for edge in edges:
        if edge.depends_on_id in task_by_id:
            in_degree[edge.task_id] += 1
            dependents[edge.depends_on_id].append(edge.task_id)

    queue: deque[int] = deque(
        sorted(tid for tid, deg in in_degree.items() if deg == 0)
    )

    ordered: list[Task] = []
    while queue:
        current = queue.popleft()
        ordered.append(task_by_id[current])
        for next_id in sorted(dependents[current]):
            in_degree[next_id] -= 1
            if in_degree[next_id] == 0:
                queue.append(next_id)

    if len(ordered) < len(task_by_id):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cycle detected in task dependencies",
        )

    return ordered