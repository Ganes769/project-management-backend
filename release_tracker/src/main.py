

import logging

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from .routers import projects, task

logging.basicConfig(level=logging.INFO)
app = FastAPI(title="Release tracker")

@app.exception_handler(IntegrityError)
def handle_integrity_error(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "Data conflict"},
    )

app.include_router(router=projects.router)
app.include_router(router=task.router)


@app.get("/")
def read_root() -> dict[str, str]:
    return {"app": "release Tracker"}