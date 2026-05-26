from fastapi.testclient import TestClient
from release_tracker.main import app

client = TestClient(app)


def test_get_project():
    response = client.get("/projects")
    assert response.status_code == 200
    assert len(response.json()) == 3
