from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user
from app.crud.contact_info import get_contact_info, upsert_contact_info, update_contact_info
from app.database import get_db
from app.models.user import AdminUser
from app.schemas.contact_info import (
    ContactInfoCreate,
    ContactInfoOut,
    ContactInfoUpdate,
    SocialLinksOut,
)

router = APIRouter(prefix="/api/contact", tags=["contact"])


@router.get("/", response_model=ContactInfoOut)
async def get_contact(db: AsyncSession = Depends(get_db)):
    """Get contact info (public)."""
    contact = await get_contact_info(db)
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact info not configured yet")
    return contact


@router.put("/", response_model=ContactInfoOut)
async def update_contact(
    body: ContactInfoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_active_user),
):
    """Update contact info (upsert, protected)."""
    existing = await get_contact_info(db)
    if existing:
        return await update_contact_info(db, existing, body)
    # Create from update data — ensure required fields
    data = body.model_dump(exclude_unset=True)
    if not all(k in data for k in ("institute_name", "phone", "email", "address")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="First-time setup requires institute_name, phone, email, and address",
        )
    create_data = ContactInfoCreate(**data)
    return await upsert_contact_info(db, create_data)


@router.get("/social-links", response_model=SocialLinksOut)
async def get_social_links(db: AsyncSession = Depends(get_db)):
    """Get only social media links (public)."""
    contact = await get_contact_info(db)
    if not contact:
        return SocialLinksOut()
    return SocialLinksOut(
        instagram=contact.instagram_url,
        facebook=contact.facebook_url,
        youtube=contact.youtube_url,
        linkedin=contact.linkedin_url,
        whatsapp=contact.whatsapp_url,
    )
