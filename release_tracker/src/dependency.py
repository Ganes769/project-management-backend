from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlmodel import Session

from . import crud
from .database import get_session
from .models import Project,Task

sessionDep = Annotated[Session, Depends(get_session)]


def get_project_or_404(project_id: int, session: sessionDep) -> Project:
    project = crud.get_project(project_id, session)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    return project


projectDep = Annotated[Project, Depends(get_project_or_404)]


def get_task_or_404(task_id: int, session: sessionDep) -> Task:
    task = crud.get_task(task_id, session)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    return task


taskDep = Annotated[Task, Depends(get_task_or_404)]