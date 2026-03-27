import re
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class EnquiryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    course: str = Field(..., min_length=1, max_length=100)
    mode: str = Field(..., min_length=1, max_length=50)
    timing: str | None = Field(None, max_length=50)
    message: str | None = Field(None, max_length=2000)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r"[\s\-\(\)]", "", v)
        if not re.match(r"^\+?\d{10,15}$", cleaned):
            raise ValueError("Phone must be 10-15 digits, optionally prefixed with +")
        return cleaned

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        # Strip HTML tags for XSS prevention
        return re.sub(r"<[^>]*>", "", v).strip()

    @field_validator("message")
    @classmethod
    def sanitize_message(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return re.sub(r"<[^>]*>", "", v).strip()


class EnquiryOut(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    phone: str
    course: str
    mode: str
    timing: str | None = None
    message: str | None = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EnquiryListOut(BaseModel):
    enquiries: list[EnquiryOut]
    total: int
    skip: int = 0
    limit: int = 20
