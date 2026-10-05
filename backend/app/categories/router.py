from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from app.auth.dependencies import require_admin
from app.categories import service
from app.categories.schemas import CategoryCreate, CategoryUpdate
from app.common.responses import success_response

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("")
def get_categories():
    """
    Get all course categories with course counts.
    """
    data = service.list_categories()
    return success_response(data=data, message="Categories retrieved successfully.")


@router.get("/{category_id}")
def get_category(category_id: int):
    """
    Get category details by ID.
    """
    data = service.get_category_by_id(category_id)
    return success_response(data=data, message="Category retrieved successfully.")


@router.post("", status_code=status.HTTP_201_CREATED)
def create_category_endpoint(
    payload: CategoryCreate,
    _: Dict[str, Any] = Depends(require_admin),
):
    """
    [Admin only] Create a new course category.
    """
    cat_id = service.create_category(name=payload.name, description=payload.description)
    created = service.get_category_by_id(cat_id)
    return success_response(
        data=created,
        message="Category created successfully.",
        status_code=status.HTTP_201_CREATED
    )


@router.put("/{category_id}")
def update_category_endpoint(
    category_id: int,
    payload: CategoryUpdate,
    _: Dict[str, Any] = Depends(require_admin),
):
    """
    [Admin only] Update an existing category.
    """
    updated = service.update_category(category_id, payload.model_dump(exclude_unset=True))
    return success_response(data=updated, message="Category updated successfully.")


@router.delete("/{category_id}")
def delete_category_endpoint(
    category_id: int,
    _: Dict[str, Any] = Depends(require_admin),
):
    """
    [Admin only] Delete a category.
    """
    service.delete_category(category_id)
    return success_response(data=None, message="Category deleted successfully.")
