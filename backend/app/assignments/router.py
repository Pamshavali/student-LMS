from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from app.assignments import service
from app.assignments.schemas import AssignmentCreate, AssignmentUpdate
from app.auth.dependencies import get_current_user, require_teacher
from app.common.exceptions import ForbiddenException
from app.common.responses import success_response
from app.courses.service import get_course_by_id

router = APIRouter(tags=["Assignments"])


@router.post("/courses/{course_id}/assignments", status_code=status.HTTP_201_CREATED)
def create_assignment_endpoint(
    course_id: int,
    payload: AssignmentCreate,
    current_user: Dict[str, Any] = Depends(require_teacher),
):
    """
    [Teacher / Admin] Create a coursework assignment for a course.
    """
    course = get_course_by_id(course_id)
    if current_user["role"] != "ADMIN" and course["teacher_id"] != current_user["id"]:
        raise ForbiddenException("You can only create assignments for courses you teach.")

    assignment_id = service.create_assignment(
        course_id=course_id,
        title=payload.title,
        description=payload.description,
        due_date=payload.due_date,
        max_marks=payload.max_marks,
    )
    created = service.get_assignment_by_id(assignment_id)
    return success_response(
        data=created,
        message="Assignment created successfully.",
        status_code=status.HTTP_201_CREATED
    )


@router.get("/courses/{course_id}/assignments")
def get_course_assignments_endpoint(
    course_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Get all assignments for a course.
    Students see their own submission status and grades embedded.
    """
    student_id = current_user["id"] if current_user["role"] == "STUDENT" else None
    assignments = service.list_assignments_by_course(course_id, student_id=student_id)
    return success_response(data=assignments, message="Assignments retrieved successfully.")


@router.get("/assignments/{assignment_id}")
def get_assignment_endpoint(
    assignment_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Get assignment details. Includes current student's submission if caller is a student.
    """
    student_id = current_user["id"] if current_user["role"] == "STUDENT" else None
    assignment = service.get_assignment_by_id(assignment_id, student_id=student_id)
    return success_response(data=assignment, message="Assignment retrieved successfully.")


@router.put("/assignments/{assignment_id}")
def update_assignment_endpoint(
    assignment_id: int,
    payload: AssignmentUpdate,
    current_user: Dict[str, Any] = Depends(require_teacher),
):
    """
    [Teacher / Admin] Update an assignment.
    """
    existing = service.get_assignment_by_id(assignment_id)
    if current_user["role"] != "ADMIN" and existing["teacher_id"] != current_user["id"]:
        raise ForbiddenException("You can only modify assignments for courses you teach.")

    updated = service.update_assignment(assignment_id, payload.model_dump(exclude_unset=True))
    return success_response(data=updated, message="Assignment updated successfully.")


@router.delete("/assignments/{assignment_id}")
def delete_assignment_endpoint(
    assignment_id: int,
    current_user: Dict[str, Any] = Depends(require_teacher),
):
    """
    [Teacher / Admin] Delete an assignment.
    """
    existing = service.get_assignment_by_id(assignment_id)
    if current_user["role"] != "ADMIN" and existing["teacher_id"] != current_user["id"]:
        raise ForbiddenException("You can only delete assignments for courses you teach.")

    service.delete_assignment(assignment_id)
    return success_response(data=None, message="Assignment deleted successfully.")
