
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Response, status
from sqlmodel import Session, select

from .database import get_session
from .models import Project, ProjectCreate, ProjectRead, ProjectUpdate

sessionDep=Annotated[Session,Depends(get_session)]
def slugify(value:str)-> str:
   cleaned= "".join(c for  c in value.lower() if c.isalnum() or c=="")
   return "-".join(cleaned.split()) or "Project"
def list_projects(session:sessionDep):
    statement=select(Project).order_by(Project.name)
    project=session.exec(statement).all()
    return list(project)
def get_project(id: int, session: sessionDep):
    projects = session.get(Project, id)

    if not projects:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    return projects
def create_project(payload: ProjectCreate, session: sessionDep) -> Project:
    project = Project.model_validate(payload, update={"slug": slugify(payload.name)})
    session.add(project)
    session.commit()
    session.refresh(project)
    return project
def delete_project(project_id:int,session:sessionDep):
    project=session.get(Project,project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Project not found")
    session.delete(project)
    session.commit()
    return  Response(status_code=status.HTTP_204_NO_CONTENT)
def update_project(
    session: Session, project: Project, payload: ProjectUpdate
) -> Project:
    updated_fields = payload.model_dump(exclude_unset=True)
    project.sqlmodel_update(updated_fields)

    if "name" in updated_fields and updated_fields["name"] is not None:
        project.slug = slugify(updated_fields["name"])

    session.add(project)
    session.commit()
    session.refresh(project)
    return project