
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Response, status
from sqlmodel import Session

from database import get_session

from . import crud
from .models import Project, ProjectCreate, ProjectRead, ProjectUpdate

sessionDep=Annotated[Session,Depends(get_session)]
app = FastAPI(title="Release tracker")

@app.get ("/projects",response_model=list[ProjectRead])
def list_projects(session:sessionDep):  # noqa: F811
   return crud.list_projects(session)



@app.get("/projects/{id}", response_model=ProjectRead)
def get_project(id: int, session: sessionDep):  # noqa: F811
    return crud.get_project(id,session)


@app.post("/projects", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    session: sessionDep,
):
    return crud.create_project( payload,session)

@app.delete("/project/{project_id}",status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, session: sessionDep):
 return crud.delete_project(project_id,session)
@app.patch("/projects/{projexct_id}",response_model=ProjectRead)
def update_project(session:sessionDep,project_id:int,payload:ProjectUpdate):
  return crud.update_project(session,project_id,payload)
@app.get("/")
def read_root()->dict[str,str]:
    return {
        "app":"release Tracker"}