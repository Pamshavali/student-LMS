from fastapi.testclient import TestClient


def test_student_accessing_admin_api_forbidden(client: TestClient, student_headers: dict):
    # Student attempts to access Admin user management
    response = client.get("/api/users", headers=student_headers)
    assert response.status_code == 403
    assert response.json()["success"] is False
    assert "administrator" in response.json()["message"].lower()

    # Student attempts to access Admin dashboard
    dash_res = client.get("/api/dashboard/admin", headers=student_headers)
    assert dash_res.status_code == 403


def test_student_creating_course_forbidden(client: TestClient, student_headers: dict):
    payload = {
        "title": "Hacker 101 Course",
        "description": "Unauthorized course creation attempt by a student account.",
        "category_id": 1,
    }
    response = client.post("/api/courses", json=payload, headers=student_headers)
    assert response.status_code == 403
    assert "teacher" in response.json()["message"].lower()


def test_teacher_modifying_another_teachers_course_forbidden(
    client: TestClient,
    teacher_headers: dict,
    other_teacher_headers: dict,
):
    # Course 2 is taught by Ada Lovelace (id=3).
    # Alan Turing (id=2, teacher_headers) attempts to update Course 2.
    update_payload = {"title": "Attempted Course Takeover"}
    response = client.put("/api/courses/2", json=update_payload, headers=teacher_headers)
    assert response.status_code == 403
    assert "assigned to teach" in response.json()["message"].lower()


def test_teacher_grading_another_teachers_submission_forbidden(
    client: TestClient,
    other_teacher_headers: dict,
):
    # Submission 1 is for Course 1 (taught by Alan Turing, id=2).
    # Ada Lovelace (id=3, other_teacher_headers) attempts to grade it.
    payload = {"marks": 50.0, "feedback": "Unauthorized grading attempt."}
    response = client.put("/api/submissions/1/grade", json=payload, headers=other_teacher_headers)
    assert response.status_code == 403


def test_unauthorized_api_access(client: TestClient):
    # Accessing protected endpoints without any token
    routes = [
        "/api/auth/me",
        "/api/dashboard/student",
        "/api/dashboard/teacher",
        "/api/dashboard/admin",
        "/api/enrollments/my-courses",
    ]
    for route in routes:
        res = client.get(route)
        assert res.status_code == 401
        assert res.json()["success"] is False
