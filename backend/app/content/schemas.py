from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CourseContentBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    content_type: str = Field("ARTICLE", pattern="^(VIDEO|DOCUMENT|ARTICLE|LINK)$")
    content_url: Optional[str] = None
    order_index: int = Field(1, ge=1)


class CourseContentCreate(CourseContentBase):
    pass


class CourseContentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = None
    content_type: Optional[str] = Field(None, pattern="^(VIDEO|DOCUMENT|ARTICLE|LINK)$")
    content_url: Optional[str] = None
    order_index: Optional[int] = Field(None, ge=1)


class CourseContentResponse(BaseModel):
    id: int
    course_id: int
    title: str
    description: Optional[str] = None
    content_type: str
    content_url: Optional[str] = None
    order_index: int
    created_at: Optional[datetime] = None
