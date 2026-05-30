from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlmodel import Session

from . import crud
from .database import get_session
from .models import Project

sessionDep=Annotated[Session,Depends(get_session)]
def get_project_or_404(project_id:int,session:Session)->Project:
    project=crud.get_project(project_id,sessionDep)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Project not found")
    return project
projectDep=Annotated[Project,Depends(get_project_or_404)]