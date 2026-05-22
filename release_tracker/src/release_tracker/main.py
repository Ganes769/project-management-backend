from fastapi import FastAPI

app = FastAPI(title="Release tracker")


@app.get("/projects")
def list_projects() -> list[dict]:
    return [{"id": 1, "name": "payment"}]
