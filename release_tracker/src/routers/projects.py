from fastapi import APIRouter, status
from sqlmodel import select

from .. import crud
from ..dependency import projectDep, sessionDep
from ..models import (
    ProjectCreate,
    ProjectRead,
    ProjectReadWithTasks,
    ProjectUpdate,
    TaskDependency,
    TaskInOrder,
    TaskRead,
    TaskRef,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectRead])
def list_projects(session: sessionDep):
    return crud.list_projects(session)


@router.get("/{project_id}", response_model=ProjectReadWithTasks)
def get_project(project: projectDep):
    return project


@router.post(
    "",
    response_model=ProjectRead,
    status_code=status.HTTP_201_CREATED,
)
def create_project(
    payload: ProjectCreate,
    session: sessionDep,
):
    return crud.create_project(payload, session)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, session: sessionDep) -> None:
    crud.delete_project(project_id, session)


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: int,
    session: sessionDep,
    payload: ProjectUpdate,
):
    return crud.update_project(session, project_id, payload)


@router.get("/{project_id}/tasks/order", response_model=list[TaskInOrder])
def get_task_order(project: projectDep, session: sessionDep):
    """Tasks in topological order, each annotated with its direct prerequisites."""
    ordered = crud.topological_order(project.project_id, session)
    if not ordered:
        return []

    task_ids = [t.id for t in ordered if t.id is not None]
    edges = session.exec(
        select(TaskDependency).where(
            TaskDependency.task_id.in_(task_ids)  # type: ignore[attr-defined]
        )
    ).all()

    deps_by_task: dict[int, list[int]] = {tid: [] for tid in task_ids}
    for edge in edges:
        deps_by_task[edge.task_id].append(edge.depends_on_id)

    task_by_id = {t.id: t for t in ordered}

    return [
        TaskInOrder(
            **TaskRead.model_validate(task).model_dump(),
            depends_on=[
                TaskRef(id=dep_id, title=task_by_id[dep_id].title)
                for dep_id in deps_by_task.get(task.id, [])
                if dep_id in task_by_id
            ],
        )
        for task in ordered
    ]
