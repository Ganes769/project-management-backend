from fastapi import APIRouter, Depends, Header, HTTPException, Response, status

from .. import crud
from ..dependency import projectDep, sessionDep, taskDep
from ..models import (
    SubtaskProgress,
    TaskCreate,
    TaskPriority,
    TaskRead,
    TaskReadWithProject,
    TaskStatus,
    TaskUpdate,
)
from ..undo import UndoEntry, get_undo_stack

router = APIRouter(tags=["tasks"])


def session_id_dep(
    x_session_id: str | None = Header(default=None, alias="X-Session-Id"),
) -> str:
    if not x_session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing X-Session-Id header",
        )
    return x_session_id


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
def delete_task(
    task_id: int,
    session: sessionDep,
    session_id: str = Depends(session_id_dep),
) -> Response:
    snapshot = crud.delete_task(task_id, session)
    get_undo_stack(session_id).push(
        UndoEntry(kind="task_delete", payload=snapshot)
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/tasks/{task_id}/subtasks/progress",
    response_model=SubtaskProgress,
)
def get_subtask_progress(task_id: int, session: sessionDep):
    progress = crud.compute_subtask_progress(task_id, session)
    if progress is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This task has no subtasks",
        )
    return progress


@router.get(
    "/tasks/{task_id}/subtasks",
    response_model=list[TaskRead],
)
def list_subtasks(task_id: int, session: sessionDep):
    task = crud.get_task(task_id, session)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    return crud.list_subtasks(task_id, session)


@router.post(
    "/tasks/{task_id}/subtasks",
    response_model=TaskRead,
    status_code=status.HTTP_201_CREATED,
)
def create_subtask(
    task_id: int,
    payload: TaskCreate,
    session: sessionDep,
):
    parent = crud.get_task(task_id, session)
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    return crud.create_subtask(parent, payload, session)


@router.get(
    "/tasks/{task_id}/dependencies",
    response_model=list[TaskRead],
)
def list_task_dependencies(task_id: int, session: sessionDep):
    return crud.list_dependencies(task_id, session)


@router.post(
    "/tasks/{task_id}/dependencies/{depends_on_id}",
    response_model=TaskRead,
    status_code=status.HTTP_201_CREATED,
)
def add_task_dependency(
    task_id: int,
    depends_on_id: int,
    session: sessionDep,
):
    crud.add_dependency(task_id, depends_on_id, session)
    dep = crud.get_task(depends_on_id, session)
    return dep


@router.delete(
    "/tasks/{task_id}/dependencies/{depends_on_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_task_dependency(
    task_id: int,
    depends_on_id: int,
    session: sessionDep,
) -> Response:
    crud.remove_dependency(task_id, depends_on_id, session)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/undo", response_model=TaskRead)
def undo_last(
    session: sessionDep,
    session_id: str = Depends(session_id_dep),
):
    """Pop the most recent reversible action and apply its inverse."""
    stack = get_undo_stack(session_id)
    entry = stack.pop()
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nothing to undo",
        )

    if entry.kind == "task_delete":
        return crud.restore_task(entry.payload, session)

    stack.push(entry)
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"No handler for undo kind: {entry.kind}",
    )
