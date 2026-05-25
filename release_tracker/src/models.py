from datetime import UTC, datetime
from typing import Annotated

from pydantic import StringConstraints
from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel


def utc_now()-> datetime:
    return datetime.now(UTC)

ProjectName=Annotated[
    str,
    StringConstraints(strip_whitespace="true",min_length=2)
    ]
class ProjectBase(SQLModel):
    ProjectName:ProjectName=Field(unique=True)
    description:str|None=None

class Projects(ProjectBase,table=True):
    __tablename__="projects"
    id:int=Field(default=None,primary_key=True)
    slug:str=Field(unique=True)
    created_at:datetime=Field(
        default_factory=utc_now,
  sa_column=Column(DateTime(timezone=True), nullable=False),
        )
class ProjectCreate(ProjectBase):
    pass
class ProjectUpdate(SQLModel):
    name:ProjectName|None=None
    description: str | None = None
class ProjectRead(ProjectBase):
    id: int
    slug: str
    created_at: datetime