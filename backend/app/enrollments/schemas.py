from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class EnrollmentCreate(BaseModel):
    course_id: int
    student_id: Optional[int] = None  # Admins can enroll any student; students default to themselves


class EnrollmentProgressUpdate(BaseModel):
    progress: float = Field(..., ge=0.0, le=100.0)
    status: Optional[str] = Field(None, pattern="^(ACTIVE|COMPLETED|DROPPED)$")


class EnrollmentResponse(BaseModel):
    id: int
    student_id: int
    course_id: int
    enrollment_date: Optional[datetime] = None
    status: str
    progress: float
    course_title: Optional[str] = None
    course_description: Optional[str] = None
    teacher_name: Optional[str] = None
    student_name: Optional[str] = None
    student_email: Optional[str] = None
