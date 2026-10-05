from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from app.auth.dependencies import get_current_user, require_admin, require_student, require_teacher
from app.common.exceptions import ForbiddenException
from app.common.responses import success_response
from app.courses.service import get_course_by_id
from app.enrollments import service
from app.enrollments.schemas import EnrollmentCreate, EnrollmentProgressUpdate

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])


@router.post("", status_code=status.HTTP_201_CREATED)
def enroll_course(
    payload: EnrollmentCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Enroll a student in a course using an ACID transaction.
    Students can enroll themselves; Admins can enroll any student.
    """
    target_student_id = current_user["id"]
    if current_user["role"] == "ADMIN" and payload.student_id:
        target_student_id = payload.student_id
    elif current_user["role"] != "STUDENT" and not current_user["role"] == "ADMIN":
        raise ForbiddenException("Only students and administrators can enroll in courses.")

    enrollment_id = service.enroll_student(
        student_id=target_student_id,
        course_id=payload.course_id
    )
    data = service.get_enrollment_by_id(enrollment_id)
    return success_response(
        data=data,
        message="Successfully enrolled in course.",
        status_code=status.HTTP_201_CREATED
    )


@router.get("/my-courses")
def get_my_enrolled_courses(
    current_user: Dict[str, Any] = Depends(require_student),
):
    """
    [Student] Get all courses currently enrolled by the authenticated student.
    """
    enrollments = service.get_student_enrollments(student_id=current_user["id"])
    return success_response(data=enrollments, message="Enrolled courses retrieved successfully.")


@router.get("/course/{course_id}")
def get_students_for_course(
    course_id: int,
    current_user: Dict[str, Any] = Depends(require_teacher),
):
    """
    [Teacher / Admin] Get list of all enrolled students for a specific course.
    Teachers can only view rosters for courses they instruct.
    """
    course = get_course_by_id(course_id)
    if current_user["role"] != "ADMIN" and course["teacher_id"] != current_user["id"]:
        raise ForbiddenException("You can only view enrollment rosters for your own courses.")

    records = service.get_course_enrollments(course_id)
    return success_response(data=records, message="Course enrollment roster retrieved successfully.")


@router.patch("/{enrollment_id}/progress")
def update_progress_endpoint(
    enrollment_id: int,
    payload: EnrollmentProgressUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Update student course progress (0% - 100%).
    """
    enrollment = service.get_enrollment_by_id(enrollment_id)
    is_owner_student = current_user["id"] == enrollment["student_id"]
    is_admin = current_user["role"] == "ADMIN"

    # Teachers can also update their student's progress
    course = get_course_by_id(enrollment["course_id"])
    is_course_teacher = current_user["role"] == "TEACHER" and course["teacher_id"] == current_user["id"]

    if not (is_owner_student or is_admin or is_course_teacher):
        raise ForbiddenException("You are not authorized to update progress on this enrollment.")

    updated = service.update_enrollment_progress(
        enrollment_id=enrollment_id,
        progress=payload.progress,
        status=payload.status
    )
    return success_response(data=updated, message="Progress updated successfully.")


@router.delete("/{enrollment_id}")
def drop_enrollment_endpoint(
    enrollment_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Drop an enrollment. Permitted to the enrolled student or an Admin.
    """
    enrollment = service.get_enrollment_by_id(enrollment_id)
    if current_user["role"] != "ADMIN" and enrollment["student_id"] != current_user["id"]:
        raise ForbiddenException("You are not authorized to cancel this enrollment.")

    service.delete_enrollment(enrollment_id)
    return success_response(data=None, message="Enrollment cancelled successfully.")
