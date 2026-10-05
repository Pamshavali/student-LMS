from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Query, status
from fastapi.security import HTTPAuthorizationCredentials
from app.auth.dependencies import get_current_user, require_teacher, security_scheme
from app.auth.jwt_handler import decode_access_token
from app.common.exceptions import ForbiddenException
from app.common.responses import create_pagination_result, success_response
from app.courses import service
from app.courses.schemas import CourseCreate, CoursePublishStatus, CourseUpdate
from app.database import fetch_one

router = APIRouter(prefix="/courses", tags=["Courses"])


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Optional[Dict[str, Any]]:
    """
    Safely resolves current user if Bearer token is provided, without rejecting public requests.
    """
    if not credentials or not credentials.credentials:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("user_id")
        if user_id:
            query = "SELECT id, first_name, last_name, email, role, is_active FROM users WHERE id = %s AND is_active = TRUE;"
            return fetch_one(query, (user_id,))
    except Exception:
        return None
    return None


@router.get("")
def list_courses_endpoint(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    teacher_id: Optional[int] = None,
    level: Optional[str] = Query(None, pattern="^(BEGINNER|INTERMEDIATE|ADVANCED)$"),
    status_filter: Optional[str] = Query(None, alias="status", pattern="^(DRAFT|PUBLISHED|ARCHIVED)$"),
    sort_by: str = Query("newest", pattern="^(newest|oldest|title|duration)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user),
):
    """
    List courses with SQL-level filtering, search, pagination, and role-based visibility.
    Anonymous/Student users only see PUBLISHED courses unless specifically querying their own context.
    """
    # Restrict unauthenticated or student users to PUBLISHED courses
    effective_status = status_filter
    if not current_user or current_user["role"] == "STUDENT":
        effective_status = "PUBLISHED"

    courses, total = service.list_courses(
        search=search,
        category_id=category_id,
        teacher_id=teacher_id,
        level=level,
        status=effective_status,
        sort_by=sort_by,
        page=page,
        page_size=page_size,
    )
    return create_pagination_result(
        items=courses,
        page=page,
        page_size=page_size,
        total_records=total,
        message="Courses retrieved successfully."
    )


@router.get("/{course_id}")
def get_course_endpoint(
    course_id: int,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user),
):
    """
    Fetch course by ID. Draft/Archived courses are visible only to the course teacher or Admins.
    """
    course = service.get_course_by_id(course_id)
    if course["status"] != "PUBLISHED":
        if not current_user:
            raise ForbiddenException("This course is currently not published.")
        if current_user["role"] != "ADMIN" and current_user["id"] != course["teacher_id"]:
            raise ForbiddenException("You do not have permission to view unpublished course details.")

    return success_response(data=course, message="Course retrieved successfully.")


@router.post("", status_code=status.HTTP_201_CREATED)
def create_course_endpoint(
    payload: CourseCreate,
    current_user: Dict[str, Any] = Depends(require_teacher),
):
    """
    [Teacher / Admin] Create a new course.
    Teachers can only create courses for themselves; Admins can assign any teacher.
    """
    assigned_teacher_id = current_user["id"]
    if current_user["role"] == "ADMIN" and payload.teacher_id:
        assigned_teacher_id = payload.teacher_id

    course_id = service.create_course(
        title=payload.title,
        description=payload.description,
        category_id=payload.category_id,
        teacher_id=assigned_teacher_id,
        duration_hours=payload.duration_hours,
        level=payload.level,
        status=payload.status,
    )
    created = service.get_course_by_id(course_id)
    return success_response(
        data=created,
        message="Course created successfully.",
        status_code=status.HTTP_201_CREATED
    )


@router.put("/{course_id}")
def update_course_endpoint(
    course_id: int,
    payload: CourseUpdate,
    current_user: Dict[str, Any] = Depends(require_teacher),
):
    """
    [Teacher / Admin] Update course details.
    Teachers may only update courses they own. Admins can update any course.
    """
    existing = service.get_course_by_id(course_id)
    if current_user["role"] != "ADMIN" and existing["teacher_id"] != current_user["id"]:
        raise ForbiddenException("You can only modify courses that you are assigned to teach.")

    update_dict = payload.model_dump(exclude_unset=True)

    # Disallow non-admins from reassigning the teacher
    if current_user["role"] != "ADMIN" and "teacher_id" in update_dict:
        del update_dict["teacher_id"]

    updated = service.update_course(course_id, update_dict)
    return success_response(data=updated, message="Course updated successfully.")


@router.patch("/{course_id}/publish")
def update_publish_status_endpoint(
    course_id: int,
    payload: CoursePublishStatus,
    current_user: Dict[str, Any] = Depends(require_teacher),
):
    """
    [Teacher / Admin] Publish, unpublish, or archive a course.
    """
    existing = service.get_course_by_id(course_id)
    if current_user["role"] != "ADMIN" and existing["teacher_id"] != current_user["id"]:
        raise ForbiddenException("You can only modify the status of your own courses.")

    updated = service.set_course_status(course_id, payload.status)
    return success_response(data=updated, message=f"Course status set to {payload.status}.")


@router.delete("/{course_id}")
def delete_course_endpoint(
    course_id: int,
    current_user: Dict[str, Any] = Depends(require_teacher),
):
    """
    [Teacher / Admin] Delete a course.
    """
    existing = service.get_course_by_id(course_id)
    if current_user["role"] != "ADMIN" and existing["teacher_id"] != current_user["id"]:
        raise ForbiddenException("You can only delete your own courses.")

    service.delete_course(course_id)
    return success_response(data=None, message="Course deleted successfully.")
