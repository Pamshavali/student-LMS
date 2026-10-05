from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, EmailStr, Field
from app.auth.dependencies import get_current_user
from app.auth.jwt_handler import create_access_token
from app.common.exceptions import ConflictException, ForbiddenException, UnauthorizedException
from app.common.responses import success_response
from app.common.security import hash_password, verify_password
from app.database import execute_query, fetch_one

router = APIRouter(prefix="/auth", tags=["Authentication"])


# -----------------------------------------------------------------------------
# PYDANTIC SCHEMAS
# -----------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    role: str = Field("STUDENT", pattern="^(ADMIN|TEACHER|STUDENT)$")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class UserProfileResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    role: str
    phone: Optional[str] = None
    is_active: bool


# -----------------------------------------------------------------------------
# AUTH ENDPOINTS
# -----------------------------------------------------------------------------
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest):
    """
    Registers a new user in the LMS using RAW SQL.
    Validates duplicate email and hashes password with bcrypt.
    """
    # 1. RAW SQL check for duplicate email
    existing_user_query = "SELECT id FROM users WHERE email = %s;"
    existing = fetch_one(existing_user_query, (payload.email.lower().strip(),))
    if existing:
        raise ConflictException("A user with this email address already exists.")

    # 2. Hash password securely
    hashed_pw = hash_password(payload.password)

    # 3. RAW SQL insert statement
    insert_query = """
        INSERT INTO users (first_name, last_name, email, password_hash, phone, role, is_active)
        VALUES (%s, %s, %s, %s, %s, %s, TRUE);
    """
    user_id = execute_query(
        insert_query,
        (
            payload.first_name.strip(),
            payload.last_name.strip(),
            payload.email.lower().strip(),
            hashed_pw,
            payload.phone.strip() if payload.phone else None,
            payload.role,
        )
    )

    # 4. Generate JWT Access Token
    token = create_access_token({
        "user_id": user_id,
        "email": payload.email.lower().strip(),
        "role": payload.role,
    })

    return success_response(
        data={
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "first_name": payload.first_name.strip(),
                "last_name": payload.last_name.strip(),
                "email": payload.email.lower().strip(),
                "role": payload.role,
                "phone": payload.phone,
                "is_active": True,
            }
        },
        message="Registration successful.",
        status_code=status.HTTP_201_CREATED,
    )


@router.post("/login")
def login(payload: LoginRequest):
    """
    Authenticates a user using RAW SQL and returns a signed JWT.
    """
    # 1. RAW SQL query to fetch user credentials
    query = """
        SELECT id, first_name, last_name, email, password_hash, role, is_active, phone
        FROM users
        WHERE email = %s;
    """
    user = fetch_one(query, (payload.email.lower().strip(),))

    if not user:
        raise UnauthorizedException("Invalid email or password.")

    if not user.get("is_active"):
        raise ForbiddenException("Your account is deactivated. Please contact the administrator.")

    # 2. Verify password with bcrypt
    if not verify_password(payload.password, user["password_hash"]):
        raise UnauthorizedException("Invalid email or password.")

    # 3. Generate JWT Token
    token = create_access_token({
        "user_id": user["id"],
        "email": user["email"],
        "role": user["role"],
    })

    return success_response(
        data={
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "email": user["email"],
                "role": user["role"],
                "phone": user.get("phone"),
                "is_active": user["is_active"],
            }
        },
        message="Login successful."
    )


@router.get("/me")
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns the currently authenticated user's profile.
    """
    return success_response(
        data={
            "id": current_user["id"],
            "first_name": current_user["first_name"],
            "last_name": current_user["last_name"],
            "email": current_user["email"],
            "role": current_user["role"],
            "phone": current_user.get("phone"),
            "is_active": current_user["is_active"],
            "created_at": current_user.get("created_at"),
            "updated_at": current_user.get("updated_at"),
        },
        message="User profile retrieved successfully."
    )
