from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from app.assignments.service import get_assignment_by_id
from app.auth.dependencies import get_current_user, require_student, require_teacher
from app.common.exceptions import ForbiddenException
from app.common.responses import success_response
from app.courses.service import get_course_by_id
from app.submissions import service
from app.submissions.schemas import SubmissionCreate, SubmissionGrade

router = APIRouter(tags=["Submissions"])


@router.post("/assignments/{assignment_id}/submissions", status_code=status.HTTP_201_CREATED)
def submit_assignment_endpoint(
    assignment_id: int,
    payload: SubmissionCreate,
    current_user: Dict[str, Any] = Depends(require_student),
):
    """
    [Student] Submit coursework for an assignment.
    Automatically assigns status 'SUBMITTED' or 'LATE' based on current time vs due date.
    """
    sub_id = service.submit_assignment(
        assignment_id=assignment_id,
        student_id=current_user["id"],
        submission_text=payload.submission_text,
        submission_url=payload.submission_url,
    )
    data = service.get_submission_by_id(sub_id)
    return success_response(
        data=data,
        message="Assignment submitted successfully.",
        status_code=status.HTTP_201_CREATED
    )


@router.get("/assignments/{assignment_id}/submissions")
def list_assignment_submissions_endpoint(
    assignment_id: int,
    current_user: Dict[str, Any] = Depends(require_teacher),
):
    """
    [Teacher / Admin] View all student submissions for an assignment.
    Teachers can only view submissions for courses they teach.
    """
    assignment = get_assignment_by_id(assignment_id)
    course = get_course_by_id(assignment["course_id"])
    if current_user["role"] != "ADMIN" and course["teacher_id"] != current_user["id"]:
        raise ForbiddenException("You can only view submissions for courses you teach.")

    submissions = service.list_submissions_for_assignment(assignment_id)
    return success_response(data=submissions, message="Submissions retrieved successfully.")


@router.get("/submissions/my-submissions")
def get_my_submissions_endpoint(
    current_user: Dict[str, Any] = Depends(require_student),
):
    """
    [Student] View all coursework submissions and grades for the current student.
    """
    submissions = service.get_student_submissions(student_id=current_user["id"])
    return success_response(data=submissions, message="Student submissions retrieved successfully.")


@router.get("/submissions/{submission_id}")
def get_submission_endpoint(
    submission_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    View submission details. Accessible to the student who submitted, course teacher, or admin.
    """
    submission = service.get_submission_by_id(submission_id)
    is_owner_student = current_user["id"] == submission["student_id"]
    is_admin = current_user["role"] == "ADMIN"
    is_course_teacher = current_user["role"] == "TEACHER" and submission["teacher_id"] == current_user["id"]

    if not (is_owner_student or is_admin or is_course_teacher):
        raise ForbiddenException("You are not authorized to view this submission.")

    return success_response(data=submission, message="Submission retrieved successfully.")


@router.put("/submissions/{submission_id}/grade")
def grade_submission_endpoint(
    submission_id: int,
    payload: SubmissionGrade,
    current_user: Dict[str, Any] = Depends(require_teacher),
):
    """
    [Teacher / Admin] Grade a student submission, award marks, and add feedback.
    Validates that marks <= max_marks.
    """
    submission = service.get_submission_by_id(submission_id)
    if current_user["role"] != "ADMIN" and submission["teacher_id"] != current_user["id"]:
        raise ForbiddenException("You can only grade submissions for courses you teach.")

    graded = service.grade_submission(
        submission_id=submission_id,
        marks=payload.marks,
        feedback=payload.feedback,
    )
    return success_response(data=graded, message="Submission graded successfully.")
