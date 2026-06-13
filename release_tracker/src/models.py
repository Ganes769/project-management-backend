from datetime import UTC, date, datetime
from enum import StrEnum
from typing import Annotated

from pydantic import StringConstraints
from sqlalchemy import Column, DateTime
from sqlmodel import Field, Relationship, SQLModel


def utc_now()-> datetime:
    return datetime.now(UTC)

ProjectName = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=2),
]
TaskTitle = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=2),
]
class TaskStatus(StrEnum):
    planned = "planned"
    in_progress = "in_progress"
    blocked = "blocked"
    done = "done"


class TaskPriority(StrEnum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class ProjectBase(SQLModel):
    name: ProjectName = Field(unique=True)
    description: str | None = None


class Project(ProjectBase, table=True):
    __tablename__ = "projects"
    project_id: int | None = Field(default=None, primary_key=True)
    slug: str = Field(unique=True)
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    tasks: list["Task"] = Relationship(back_populates="project")


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(SQLModel):
    name: ProjectName | None = None
    description: str | None = None


class ProjectRead(ProjectBase):
    project_id: int
    slug: str
    created_at: datetime


class TaskBase(SQLModel):
    title: TaskTitle
    detail: str | None = None
    status: TaskStatus = TaskStatus.planned
    priority: TaskPriority = TaskPriority.medium
    due_date: date | None = None


class Task(TaskBase, table=True):
    __tablename__ = "tasks"
    id: int | None = Field(default=None, primary_key=True)
    project_id: int | None = Field(
        default=None,
        foreign_key="projects.project_id",
        index=True,
    )
    project: Project | None = Relationship(back_populates="tasks")


class TaskCreate(TaskBase):
    pass


class TaskUpdate(SQLModel):
    title: TaskTitle | None = None
    detail: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_date: date | None = None


class TaskRead(TaskBase):
    id: int
    project_id: int


class ProjectReadWithTasks(ProjectRead):
    tasks: list[TaskRead] = []


class TaskReadWithProject(TaskRead):
    project: ProjectRead | None = None


class TaskRef(SQLModel):
    id: int
    title: str


class TaskInOrder(TaskRead):
    depends_on: list[TaskRef] = []


class TaskDependency(SQLModel, table=True):
    __tablename__ = "task_dependencies"
    task_id: int = Field(
        foreign_key="tasks.id",
        primary_key=True,
        ondelete="CASCADE",
    )
    depends_on_id: int = Field(
        foreign_key="tasks.id",
        primary_key=True,
        ondelete="CASCADE",
    )