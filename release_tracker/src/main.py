from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel


class ProjectRead(BaseModel):
    id: int
    name: str
    slug: str


app = FastAPI(title="Release tracker")


@app.get("/projects/{id}", response_model=list[ProjectRead])
def get_projects(id: int):
    projects = mock_database.get(id)
    if not projects:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Project not found")
    return projects


# @app.get("/projects")
# def list_projects() -> list[ProjectRead]:
#     return list(mock_database.values())
@app.get ("/projects",response_model=list[ProjectRead])
def list_slug(slug:str|None):
    projects=list(mock_database.values())
    if slug is None:
        return projects
    return [project for project in projects if project.slug==slug]    


mock_database: dict[int, ProjectRead] = {
    1: ProjectRead(id=1, name="Frontend Redesign", slug="frontend-redesign"),
    2: ProjectRead(id=2, name="Payment API", slug="payment-api"),
    3: ProjectRead(id=3, name="Analytics Service", slug="analytics-service"),
}
