from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SubmissionCreate(BaseModel):
    submission_text: Optional[str] = None
    submission_url: Optional[str] = None


class SubmissionGrade(BaseModel):
    marks: float = Field(..., ge=0.0)
    feedback: Optional[str] = None


class SubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    assignment_title: Optional[str] = None
    course_id: Optional[int] = None
    course_title: Optional[str] = None
    student_id: int
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    submission_text: Optional[str] = None
    submission_url: Optional[str] = None
    submitted_at: Optional[datetime] = None
    marks: Optional[float] = None
    feedback: Optional[str] = None
    status: str
    max_marks: Optional[float] = None
    due_date: Optional[datetime] = None
