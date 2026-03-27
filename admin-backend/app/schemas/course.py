import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class FAQItem(BaseModel):
    q: str
    a: str


class CourseBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    short_description: str = Field(..., min_length=10)
    description: str | None = None
    duration: str
    mode: str
    level: str
    icon: str = Field(..., max_length=10)
    price: str
    badge: str | None = None
    order: int = 99
    category: str
    next_batch: str | None = None
    curriculum: list[str] = Field(..., min_length=1)
    curriculum_topics: list[list[str]] | None = None
    highlights: list[str] | None = None
    faqs: list[FAQItem] | None = None
    featured: bool = False
    is_published: bool = True


class CourseCreate(CourseBase):
    slug: str = Field(..., min_length=3, max_length=100)

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        import re

        if not re.match(r"^[a-z0-9-]{3,100}$", v):
            raise ValueError("Slug must be 3-100 lowercase alphanumeric chars and hyphens only")
        return v


class CourseUpdate(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=255)
    short_description: str | None = Field(None, min_length=10)
    description: str | None = None
    duration: str | None = None
    mode: str | None = None
    level: str | None = None
    icon: str | None = Field(None, max_length=10)
    price: str | None = None
    badge: str | None = None
    order: int | None = None
    category: str | None = None
    next_batch: str | None = None
    curriculum: list[str] | None = None
    curriculum_topics: list[list[str]] | None = None
    highlights: list[str] | None = None
    faqs: list[FAQItem] | None = None
    featured: bool | None = None
    is_published: bool | None = None


class CourseOut(CourseBase):
    id: uuid.UUID
    slug: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class CourseListOut(BaseModel):
    courses: list[CourseOut]
    total: int
    skip: int = 0
    limit: int = 20
    has_more: bool = False


class CourseReorderItem(BaseModel):
    slug: str
    order: int


class CourseReorderRequest(BaseModel):
    order: list[CourseReorderItem]
