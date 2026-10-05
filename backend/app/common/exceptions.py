from typing import Any, Optional
from fastapi import HTTPException, status


class AppException(HTTPException):
    """
    Base application exception returning consistent JSON error payloads.
    """
    def __init__(
        self,
        status_code: int,
        message: str,
        errors: Optional[Any] = None
    ):
        super().__init__(status_code=status_code, detail=message)
        self.message = message
        self.errors = errors


class BadRequestException(AppException):
    def __init__(self, message: str = "Bad Request", errors: Optional[Any] = None):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, message=message, errors=errors)


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Authentication required or invalid credentials"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, message=message)


class ForbiddenException(AppException):
    def __init__(self, message: str = "You do not have permission to perform this action"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, message=message)


class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, message=message)


class ConflictException(AppException):
    def __init__(self, message: str = "Resource already exists or constraint violation"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, message=message)


class InternalServerErrorException(AppException):
    def __init__(self, message: str = "An unexpected internal server error occurred"):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, message=message)
