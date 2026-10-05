import uuid
from fastapi.testclient import TestClient


def test_list_courses_public(client: TestClient):
    response = client.get("/api/courses")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "items" in data["data"]
    assert data["data"]["total_records"] >= 5
    # All items returned publicly must be PUBLISHED
    for course in data["data"]["items"]:
        assert course["status"] == "PUBLISHED"


def test_create_course_teacher(client: TestClient, teacher_headers: dict):
    payload = {
        "title": f"Distributed Systems Engineering {uuid.uuid4().hex[:6]}",
        "description": "Comprehensive study of consensus algorithms, replication, and CAP theorem.",
        "category_id": 1,
        "duration_hours": 36,
        "level": "ADVANCED",
        "status": "PUBLISHED",
    }
    response = client.post("/api/courses", json=payload, headers=teacher_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["title"] == payload["title"]
    assert data["data"]["teacher_id"] == 2  # Alan Turing


def test_get_course_by_id(client: TestClient):
    response = client.get("/api/courses/1")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["id"] == 1
    assert data["data"]["category_name"] == "Computer Science"
    assert data["data"]["teacher_name"] == "Alan Turing"


def test_get_course_not_found(client: TestClient):
    response = client.get("/api/courses/999999")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert "not found" in data["message"].lower()


def test_update_own_course(client: TestClient, teacher_headers: dict):
    # Course 1 is taught by Alan Turing (teacher_id=2)
    update_payload = {
        "duration_hours": 48,
        "level": "ADVANCED",
    }
    response = client.put("/api/courses/1", json=update_payload, headers=teacher_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["duration_hours"] == 48


def test_course_filtering_and_pagination(client: TestClient):
    response = client.get("/api/courses?category_id=1&level=INTERMEDIATE&page=1&page_size=2")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]["items"]) <= 2
    assert data["data"]["page"] == 1
    assert data["data"]["page_size"] == 2
