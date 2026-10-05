import math
from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

DataT = TypeVar("DataT")


class ApiResponse(BaseModel, Generic[DataT]):
    success: bool = True
    message: str = "Operation completed successfully"
    status_code: int = 200
    data: Optional[DataT] = None


class PaginatedData(BaseModel, Generic[DataT]):
    items: List[DataT] = Field(default_factory=list)
    page: int = 1
    page_size: int = 10
    total_records: int = 0
    total_pages: int = 1


class PaginatedResponse(BaseModel, Generic[DataT]):
    success: bool = True
    message: str = "Data retrieved successfully"
    status_code: int = 200
    data: PaginatedData[DataT]


def success_response(
    data: Optional[Any] = None,
    message: str = "Success",
    status_code: int = 200
) -> dict:
    return {
        "success": True,
        "message": message,
        "status_code": status_code,
        "data": data,
    }


def error_response(
    message: str = "An error occurred",
    status_code: int = 400,
    errors: Optional[Any] = None
) -> dict:
    return {
        "success": False,
        "message": message,
        "status_code": status_code,
        "errors": errors,
    }


def create_pagination_result(
    items: List[Any],
    page: int,
    page_size: int,
    total_records: int,
    message: str = "Records retrieved successfully"
) -> dict:
    total_pages = math.ceil(total_records / page_size) if page_size > 0 else 1
    return {
        "success": True,
        "message": message,
        "status_code": 200,
        "data": {
            "items": items,
            "page": page,
            "page_size": page_size,
            "total_records": total_records,
            "total_pages": max(1, total_pages),
        }
    }
