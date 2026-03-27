import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class SiteContentBase(BaseModel):
    section: str = Field(..., max_length=100)
    key: str = Field(..., max_length=100)
    value: str | None = None
    value_json: dict | list | None = None
    content_type: Literal["text", "json", "html", "url"] = "text"
    label: str | None = None
    description: str | None = None


class SiteContentCreate(SiteContentBase):
    pass


class SiteContentUpdate(BaseModel):
    value: str | None = None
    value_json: dict | list | None = None
    label: str | None = None
    description: str | None = None
    content_type: str | None = None


class SiteContentOut(SiteContentBase):
    id: uuid.UUID
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class SectionOut(BaseModel):
    section: str
    items: list[SiteContentOut]


class BulkUpdateItem(BaseModel):
    section: str
    key: str
    value: str | None = None
    value_json: Any | None = None
    content_type: str = "text"


class SiteContentBulkUpdate(BaseModel):
    updates: list[BulkUpdateItem]


class BulkUpdateResponse(BaseModel):
    updated: int
    items: list[SiteContentOut]
