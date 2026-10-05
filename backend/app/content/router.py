from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from app.auth.dependencies import get_current_user, require_teacher
from app.common.exceptions import ForbiddenException
from app.common.responses import success_response
from app.content import service
from app.content.schemas import CourseContentCreate, CourseContentUpdate
from app.courses.service import get_course_by_id

router = APIRouter(tags=["Course Content"])


@router.post("/courses/{course_id}/content", status_code=status.HTTP_201_CREATED)
def create_course_content_endpoint(
    course_id: int,
    payload: CourseContentCreate,
    current_user: Dict[str, Any] = Depends(require_teacher),
):
    """
    [Teacher / Admin] Add a syllabus module or lecture resource to a course.
    """
    course = get_course_by_id(course_id)
    if current_user["role"] != "ADMIN" and course["teacher_id"] != current_user["id"]:
        raise ForbiddenException("You can only add content to your own courses.")

    content_id = service.create_content(
        course_id=course_id,
        title=payload.title,
        description=payload.description,
        content_type=payload.content_type,
        content_url=payload.content_url,
        order_index=payload.order_index,
    )
    created = service.get_content_by_id(content_id)
    return success_response(
        data=created,
        message="Course content module added successfully.",
        status_code=status.HTTP_201_CREATED
    )


@router.get("/courses/{course_id}/content")
def get_course_content_endpoint(
    course_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Get all syllabus modules for a course.
    Accessible to enrolled students, course teacher, or admins.
    """
    # Verify course exists
    get_course_by_id(course_id)
    modules = service.list_content_by_course(course_id)
    return success_response(data=modules, message="Course content retrieved successfully.")


@router.put("/content/{content_id}")
def update_course_content_endpoint(
    content_id: int,
    payload: CourseContentUpdate,
    current_user: Dict[str, Any] = Depends(require_teacher),
):
    """
    [Teacher / Admin] Update a content module.
    """
    existing = service.get_content_by_id(content_id)
    if current_user["role"] != "ADMIN" and existing["teacher_id"] != current_user["id"]:
        raise ForbiddenException("You can only modify content from your own courses.")

    updated = service.update_content(content_id, payload.model_dump(exclude_unset=True))
    return success_response(data=updated, message="Course content module updated successfully.")


@router.delete("/content/{content_id}")
def delete_course_content_endpoint(
    content_id: int,
    current_user: Dict[str, Any] = Depends(require_teacher),
):
    """
    [Teacher / Admin] Delete a content module.
    """
    existing = service.get_content_by_id(content_id)
    if current_user["role"] != "ADMIN" and existing["teacher_id"] != current_user["id"]:
        raise ForbiddenException("You can only delete content from your own courses.")

    service.delete_content(content_id)
    return success_response(data=None, message="Course content module deleted successfully.")
