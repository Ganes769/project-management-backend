from fastapi import APIRouter, status
from sqlmodel import select

from .. import crud
from ..ai import (
    CreateProjectWithPlanRequest,
    GeneratePlanRequest,
    NewProjectPlanRequest,
    TaskPlan,
    create_project_with_plan,
    generate_plan,
    generate_plan_for_new_project,
    import_task_plan,
)
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
def get_project(project: projectDep, session: sessionDep):
    return crud.build_project_read_with_tasks(project, session)


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


@router.post("/ai/plan", response_model=TaskPlan)
def ai_new_project_plan(payload: NewProjectPlanRequest):
    """Generate a task plan for a brand-new project (preview only)."""
    return generate_plan_for_new_project(payload.name, payload.description)


@router.post(
    "/ai/plan/commit",
    response_model=ProjectReadWithTasks,
    status_code=status.HTTP_201_CREATED,
)
def ai_new_project_commit(
    payload: CreateProjectWithPlanRequest,
    session: sessionDep,
):
    """Create a new project and materialise the reviewed task plan."""
    project = create_project_with_plan(
        payload.name,
        payload.description,
        payload.plan,
        session,
    )
    return crud.build_project_read_with_tasks(project, session)


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


@router.post("/{project_id}/ai/plan", response_model=TaskPlan)
def ai_plan(project: projectDep, payload: GeneratePlanRequest):
    """Ask the LLM for a task plan grounded in this project + a user brief.

    The plan is validated locally (cycle detection, dangling-ref check)
    before it's returned, so the frontend can render it as-is for review.
    Nothing is persisted yet -- call the commit route to materialise it.
    """
    return generate_plan(project, payload.description)


@router.post(
    "/{project_id}/ai/plan/commit",
    response_model=list[TaskRead],
    status_code=status.HTTP_201_CREATED,
)
def ai_plan_commit(
    project: projectDep,
    plan: TaskPlan,
    session: sessionDep,
):
    """Materialise a (possibly user-edited) task plan into real tasks + edges."""
    return import_task_plan(project, plan, session)
