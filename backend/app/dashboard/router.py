from typing import Any, Dict
from fastapi import APIRouter, Depends
from app.auth.dependencies import require_admin, require_student, require_teacher
from app.common.responses import success_response
from app.dashboard import service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/admin")
def get_admin_dashboard(
    _: Dict[str, Any] = Depends(require_admin),
):
    """
    [Admin only] System-wide analytics, user registration activity, and top course metrics.
    """
    data = service.get_admin_dashboard_stats()
    return success_response(data=data, message="Admin dashboard data retrieved successfully.")


@router.get("/teacher")
def get_teacher_dashboard(
    current_user: Dict[str, Any] = Depends(require_teacher),
):
    """
    [Teacher / Admin] Course performance metrics, pending submissions to grade, and student averages.
    """
    data = service.get_teacher_dashboard_stats(teacher_id=current_user["id"])
    return success_response(data=data, message="Teacher dashboard data retrieved successfully.")


@router.get("/student")
def get_student_dashboard(
    current_user: Dict[str, Any] = Depends(require_student),
):
    """
    [Student / Admin] Enrolled courses, syllabus progress, pending assignments, and recent grades.
    """
    data = service.get_student_dashboard_stats(student_id=current_user["id"])
    return success_response(data=data, message="Student dashboard data retrieved successfully.")
