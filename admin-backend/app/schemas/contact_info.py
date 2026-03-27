import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class ContactInfoBase(BaseModel):
    institute_name: str | None = None
    site_tagline: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    google_maps_url: str | None = None
    whatsapp_url: str | None = None
    facebook_url: str | None = None
    instagram_url: str | None = None
    youtube_url: str | None = None
    linkedin_url: str | None = None
    working_hours: str | None = None
    brochure_pdf_url: str | None = None


class ContactInfoCreate(BaseModel):
    institute_name: str
    phone: str
    email: EmailStr
    address: str
    site_tagline: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    google_maps_url: str | None = None
    whatsapp_url: str | None = None
    facebook_url: str | None = None
    instagram_url: str | None = None
    youtube_url: str | None = None
    linkedin_url: str | None = None
    working_hours: str | None = None
    brochure_pdf_url: str | None = None


class ContactInfoUpdate(ContactInfoBase):
    pass


class ContactInfoOut(ContactInfoBase):
    id: uuid.UUID
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class SocialLinksOut(BaseModel):
    instagram: str | None = None
    facebook: str | None = None
    youtube: str | None = None
    linkedin: str | None = None
    whatsapp: str | None = None
