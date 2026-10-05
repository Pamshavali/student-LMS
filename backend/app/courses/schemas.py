from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CourseBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    category_id: int
    duration_hours: Optional[int] = Field(None, ge=1, le=1000)
    level: str = Field("BEGINNER", pattern="^(BEGINNER|INTERMEDIATE|ADVANCED)$")
    status: str = Field("DRAFT", pattern="^(DRAFT|PUBLISHED|ARCHIVED)$")


class CourseCreate(CourseBase):
    teacher_id: Optional[int] = None  # Admins can specify teacher_id, Teachers default to themselves


class CourseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=10)
    category_id: Optional[int] = None
    teacher_id: Optional[int] = None  # Admins can reassign teacher
    duration_hours: Optional[int] = Field(None, ge=1, le=1000)
    level: Optional[str] = Field(None, pattern="^(BEGINNER|INTERMEDIATE|ADVANCED)$")
    status: Optional[str] = Field(None, pattern="^(DRAFT|PUBLISHED|ARCHIVED)$")


class CoursePublishStatus(BaseModel):
    status: str = Field(..., pattern="^(DRAFT|PUBLISHED|ARCHIVED)$")


class CourseResponse(BaseModel):
    id: int
    title: str
    description: str
    category_id: int
    category_name: Optional[str] = None
    teacher_id: int
    teacher_name: Optional[str] = None
    teacher_email: Optional[str] = None
    duration_hours: Optional[int] = None
    level: str
    status: str
    total_enrolled: Optional[int] = 0
    total_modules: Optional[int] = 0
    total_assignments: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
