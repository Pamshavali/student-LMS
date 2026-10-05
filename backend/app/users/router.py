from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Query, status
from app.auth.dependencies import get_current_user, require_admin
from app.common.exceptions import ForbiddenException
from app.common.responses import create_pagination_result, success_response
from app.users import service
from app.users.schemas import UserCreate, UserStatusUpdate, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("")
def get_all_users(
    role: Optional[str] = Query(None, pattern="^(ADMIN|TEACHER|STUDENT)$"),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    _: Dict[str, Any] = Depends(require_admin),
):
    """
    [Admin only] Retrieve a paginated list of system users.
    Supports filtering by role, status, and substring search on names/email.
    """
    records, total = service.list_users(
        role=role,
        search=search,
        is_active=is_active,
        page=page,
        page_size=page_size,
    )
    return create_pagination_result(
        items=records,
        page=page,
        page_size=page_size,
        total_records=total,
        message="Users retrieved successfully."
    )


@router.get("/{user_id}")
def get_user(
    user_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Retrieve user by ID. Permitted to Admins or the target user themselves.
    """
    if current_user["role"] != "ADMIN" and current_user["id"] != user_id:
        raise ForbiddenException("You are not authorized to view another user's profile.")
    
    user = service.get_user_by_id(user_id)
    return success_response(data=user, message="User retrieved successfully.")


@router.post("", status_code=status.HTTP_201_CREATED)
def create_user_endpoint(
    payload: UserCreate,
    _: Dict[str, Any] = Depends(require_admin),
):
    """
    [Admin only] Create a user directly with any role.
    """
    user_id = service.create_user(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        plain_password=payload.password,
        role=payload.role,
        phone=payload.phone,
    )
    created_user = service.get_user_by_id(user_id)
    return success_response(
        data=created_user,
        message="User created successfully.",
        status_code=status.HTTP_201_CREATED
    )


@router.put("/{user_id}")
def update_user_endpoint(
    user_id: int,
    payload: UserUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Update user profile. Users can update their own details, but only Admins can change roles.
    """
    is_admin = current_user["role"] == "ADMIN"
    if not is_admin and current_user["id"] != user_id:
        raise ForbiddenException("You are not authorized to modify another user's profile.")

    update_dict = payload.model_dump(exclude_unset=True)

    # Disallow privilege escalation
    if not is_admin and "role" in update_dict:
        del update_dict["role"]

    updated = service.update_user(user_id, update_dict)
    return success_response(data=updated, message="User updated successfully.")


@router.patch("/{user_id}/status")
def update_user_status_endpoint(
    user_id: int,
    payload: UserStatusUpdate,
    _: Dict[str, Any] = Depends(require_admin),
):
    """
    [Admin only] Activate or deactivate a user account.
    """
    updated = service.set_user_status(user_id, payload.is_active)
    state = "activated" if payload.is_active else "deactivated"
    return success_response(data=updated, message=f"User account {state} successfully.")


@router.delete("/{user_id}")
def delete_user_endpoint(
    user_id: int,
    _: Dict[str, Any] = Depends(require_admin),
):
    """
    [Admin only] Permanently delete a user.
    """
    service.delete_user(user_id)
    return success_response(data=None, message="User deleted successfully.")
