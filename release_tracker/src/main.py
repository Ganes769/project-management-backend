import re
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Response, status
from sqlmodel import Session, select

from .database import get_session
from .models import Project, ProjectCreate, ProjectRead, ProjectUpdate

app = FastAPI(title="Release tracker")
def slugify(value:str)-> str:
   cleaned= "".join(c for  c in value.lower() if c.isalnum() or c=="")
   return "-".join(cleaned.split()) or "Project"
sessionDep=Annotated[Session,Depends(get_session)]
@app.get ("/projects",response_model=list[ProjectRead])
def list_projects(session:sessionDep):
    statement=select(Project).order_by(Project.name)
    project=session.exec(statement).all()
    return list(project)



@app.get("/projects/{id}", response_model=ProjectRead)
def get_projects(id: int, session: sessionDep):
    projects = session.get(Project, id)

    if not projects:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    return projects


@app.post("/projects", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, session: sessionDep) -> Project:
    project = Project.model_validate(payload, update={"slug": slugify(payload.name)})
    session.add(project)
    session.commit()
    session.refresh(project)
    return project

@app.delete("project/{project_id}",status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id:int,session:sessionDep):
    project=Project.get(Project,project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Project not found")
    session.delete(project)
    session.commit()
    return  Response(status_code=status.HTTP_204_NO_CONTENT)