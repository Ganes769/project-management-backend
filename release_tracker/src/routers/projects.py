from fastapi import APIRouter, status

from .. import crud
from ..dependency import projectDep, sessionDep
from ..models import (
    ProjectCreate,
    ProjectRead,
    ProjectReadWithTasks,
    ProjectUpdate,
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
