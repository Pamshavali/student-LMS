from fastapi.testclient import TestClient
from app.database import execute_query


def test_successful_enrollment(client: TestClient, other_student_headers: dict):
    # Ensure test idempotency: clear prior test enrollment if present
    execute_query("DELETE FROM enrollments WHERE student_id = 6 AND course_id = 1;")
    
    payload = {"course_id": 1}
    response = client.post("/api/enrollments", json=payload, headers=other_student_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["course_id"] == 1
    assert data["data"]["student_id"] == 6
    assert data["data"]["status"] == "ACTIVE"


def test_duplicate_enrollment_rejected(client: TestClient, student_headers: dict):
    # Alex Johnson (id=4) is already enrolled in Course 1 from seed data
    payload = {"course_id": 1}
    response = client.post("/api/enrollments", json=payload, headers=student_headers)
    assert response.status_code == 409
    data = response.json()
    assert data["success"] is False
    assert "already enrolled" in data["message"].lower()


def test_enrollment_invalid_course(client: TestClient, student_headers: dict):
    payload = {"course_id": 999999}
    response = client.post("/api/enrollments", json=payload, headers=student_headers)
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False


def test_enrollment_draft_course_rejected(client: TestClient, student_headers: dict):
    # Course 6 is DRAFT in seed data
    payload = {"course_id": 6}
    response = client.post("/api/enrollments", json=payload, headers=student_headers)
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert "published" in data["message"].lower()


def test_get_my_courses(client: TestClient, student_headers: dict):
    response = client.get("/api/enrollments/my-courses", headers=student_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert len(data["data"]) >= 1


def test_update_enrollment_progress(client: TestClient, student_headers: dict):
    # Alex Johnson enrolled in Course 1 is enrollment id=1 in seed data
    payload = {"progress": 75.00}
    response = client.patch("/api/enrollments/1/progress", json=payload, headers=student_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert float(data["data"]["progress"]) == 75.00
