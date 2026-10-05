from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient


def test_assignment_lifecycle_and_grading(
    client: TestClient,
    teacher_headers: dict,
    student_headers: dict,
):
    # 1. Teacher creates assignment for Course 1 (which Alex Johnson is enrolled in)
    future_due = (datetime.now(timezone.utc) + timedelta(days=10)).isoformat()
    assign_payload = {
        "title": "B-Tree Index Benchmark Challenge",
        "description": "Benchmark query performance before and after adding composite indexes on InnoDB.",
        "due_date": future_due,
        "max_marks": 100.0,
    }
    create_res = client.post("/api/courses/1/assignments", json=assign_payload, headers=teacher_headers)
    assert create_res.status_code == 201
    assignment_id = create_res.json()["data"]["id"]

    # 2. Student views course assignments
    list_res = client.get("/api/courses/1/assignments", headers=student_headers)
    assert list_res.status_code == 200
    assignments = list_res.json()["data"]
    assert any(a["id"] == assignment_id for a in assignments)

    # 3. Student submits solution
    sub_payload = {
        "submission_text": "Completed the benchmark. Added composite index on (student_id, course_id).",
        "submission_url": "https://github.com/alex-student/btree-benchmark",
    }
    submit_res = client.post(f"/api/assignments/{assignment_id}/submissions", json=sub_payload, headers=student_headers)
    assert submit_res.status_code == 201
    sub_data = submit_res.json()["data"]
    assert sub_data["status"] == "SUBMITTED"
    submission_id = sub_data["id"]

    # 4. Teacher views submissions
    subs_res = client.get(f"/api/assignments/{assignment_id}/submissions", headers=teacher_headers)
    assert subs_res.status_code == 200
    assert any(s["id"] == submission_id for s in subs_res.json()["data"])

    # 5. Teacher attempts to award marks greater than max_marks (100) -> should fail 400
    invalid_grade_res = client.put(
        f"/api/submissions/{submission_id}/grade",
        json={"marks": 125.0, "feedback": "Too generous!"},
        headers=teacher_headers,
    )
    assert invalid_grade_res.status_code == 400

    # 6. Teacher grades submission with valid marks and feedback
    grade_res = client.put(
        f"/api/submissions/{submission_id}/grade",
        json={"marks": 96.0, "feedback": "Flawless execution analysis and benchmark results!"},
        headers=teacher_headers,
    )
    assert grade_res.status_code == 200
    graded_data = grade_res.json()["data"]
    assert graded_data["status"] == "GRADED"
    assert float(graded_data["marks"]) == 96.0

    # 7. Student checks their submission and sees grade & feedback
    student_sub_res = client.get(f"/api/submissions/{submission_id}", headers=student_headers)
    assert student_sub_res.status_code == 200
    student_view = student_sub_res.json()["data"]
    assert student_view["status"] == "GRADED"
    assert float(student_view["marks"]) == 96.0
    assert "Flawless" in student_view["feedback"]


def test_late_submission_status(
    client: TestClient,
    teacher_headers: dict,
    student_headers: dict,
):
    # Teacher creates assignment with past due date
    past_due = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
    assign_payload = {
        "title": "Expired Homework Challenge",
        "description": "This assignment was due two days ago.",
        "due_date": past_due,
        "max_marks": 50.0,
    }
    create_res = client.post("/api/courses/1/assignments", json=assign_payload, headers=teacher_headers)
    assert create_res.status_code == 201
    assignment_id = create_res.json()["data"]["id"]

    # Student submits late
    sub_payload = {
        "submission_text": "Submitting after the official deadline.",
    }
    submit_res = client.post(f"/api/assignments/{assignment_id}/submissions", json=sub_payload, headers=student_headers)
    assert submit_res.status_code == 201
    assert submit_res.json()["data"]["status"] == "LATE"
