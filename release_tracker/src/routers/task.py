from fastapi import APIRouter, Response, status

from .. import crud
from ..dependency import projectDep, sessionDep, taskDep
from ..models import (
    TaskCreate,
    TaskPriority,
    TaskRead,
    TaskReadWithProject,
    TaskStatus,
    TaskUpdate,
)

router = APIRouter(tags=["tasks"])


@router.get("/tasks", response_model=list[TaskRead])
def list_tasks(
    session: sessionDep,
    project_id: int | None = None,
    project_slug: str | None = None,
    task_status: TaskStatus | None = None,
    over_due: bool = False,
    task_priority: TaskPriority | None = None,
):
    return crud.list_tasks(
        session,
        project_id=project_id,
        project_slug=project_slug,
        task_status=task_status,
        over_due=over_due,
        task_priority=task_priority,
    )


@router.get("/tasks/{task_id}", response_model=TaskReadWithProject)
def get_task(task: taskDep):
    return task


@router.post(
    "/tasks",
    response_model=TaskRead,
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    project: projectDep,
    payload: TaskCreate,
    session: sessionDep,
):
    return crud.create_task(project, payload, session)


@router.patch("/tasks/{task_id}", response_model=TaskRead)
def update_task(task_id: int, payload: TaskUpdate, session: sessionDep):
    return crud.update_task(task_id, payload, session)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, session: sessionDep) -> Response:
    crud.delete_task(task_id, session)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
