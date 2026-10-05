from typing import Any, Dict, Optional
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.auth.jwt_handler import decode_access_token
from app.common.exceptions import ForbiddenException, UnauthorizedException
from app.database import fetch_one

# Auto-extracts Authorization: Bearer <token>
security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Dict[str, Any]:
    """
    FastAPI dependency that:
    1. Extracts Bearer token from Authorization header.
    2. Verifies cryptographic signature and expiration.
    3. Runs a RAW SQL query to retrieve the active user from MySQL.
    4. Validates account status (is_active).
    """
    if not credentials or not credentials.credentials:
        raise UnauthorizedException("Missing Authorization Bearer token.")

    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("user_id")

    if not user_id:
        raise UnauthorizedException("Invalid token payload: missing user identity.")

    # RAW SQL query to verify user in database
    query = """
        SELECT id, first_name, last_name, email, role, is_active, phone, created_at, updated_at
        FROM users
        WHERE id = %s;
    """
    user = fetch_one(query, (user_id,))

    if not user:
        raise UnauthorizedException("User associated with this token no longer exists.")

    if not user.get("is_active"):
        raise ForbiddenException("User account is inactive. Please contact the administrator.")

    return user


def require_admin(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    RBAC dependency: Only ADMIN role is authorized.
    """
    if current_user.get("role") != "ADMIN":
        raise ForbiddenException("Administrator role required to access this endpoint.")
    return current_user


def require_teacher(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    RBAC dependency: Either TEACHER or ADMIN role is authorized.
    """
    if current_user.get("role") not in ["TEACHER", "ADMIN"]:
        raise ForbiddenException("Teacher privileges required to access this endpoint.")
    return current_user


def require_student(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    RBAC dependency: Either STUDENT or ADMIN role is authorized.
    """
    if current_user.get("role") not in ["STUDENT", "ADMIN"]:
        raise ForbiddenException("Student privileges required to access this endpoint.")
    return current_user
