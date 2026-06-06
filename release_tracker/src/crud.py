from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import session
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

TaskUpdate

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


def update_task(
    task_id: int, payload: TaskUpdate, session: Session
) -> Task:
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(task, key, value)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def delete_task(task_id: int, session: Session) -> None:
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    session.delete(task)
    session.commit()

def add_dependency(task_id:int,depends_on_id:int,session:Session)->TaskDependency:
    if task_id==depends_on_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="A task cannot depend on itself")
    task=session.get(Task,task_id)
    dep=session.get(Task,depends_on_id)
    if not task or not depends_on_id:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Task not found")
    task=session.get(Task,task_id)
    if task.project_id!= dep.project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dependencies must be in the same project",
        )
    existing = session.get(TaskDependency, (task_id, depends_on_id))
    if existing:
        return existing
    edge = TaskDependency(task_id=task_id, depends_on_id=depends_on_id)
    session.add(edge)
    session.commit()
    session.refresh(edge)
    return edge
