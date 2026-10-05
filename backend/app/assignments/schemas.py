from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AssignmentBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=5)
    due_date: datetime
    max_marks: float = Field(..., gt=0.0, le=1000.0)


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = Field(None, min_length=5)
    due_date: Optional[datetime] = None
    max_marks: Optional[float] = Field(None, gt=0.0, le=1000.0)


class AssignmentResponse(BaseModel):
    id: int
    course_id: int
    course_title: Optional[str] = None
    title: str
    description: str
    due_date: datetime
    max_marks: float
    total_submissions: Optional[int] = 0
    graded_submissions: Optional[int] = 0
    student_submission: Optional[dict] = None  # Populated when student views assignments
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
