from fastapi import APIRouter, status

from .. import crud
from ..dependency import sessionDep
from ..models import ProjectCreate, ProjectRead, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectRead])
def list_projects(session: sessionDep):
    return crud.list_projects(session)


@router.get("/{id}", response_model=ProjectRead)
def get_project(id: int, session: sessionDep):
    return crud.get_project(id, session)


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
def delete_project(project_id: int, session: sessionDep):
    return crud.delete_project(project_id, session)


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: int,
    session: sessionDep,
    payload: ProjectUpdate,
):
    return crud.update_project(session, project_id, payload)