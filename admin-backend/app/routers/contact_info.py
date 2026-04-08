from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.public_cache import get_cached_json, invalidate_cache_namespace, set_cached_json
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

CONTACT_CACHE_NAMESPACE = "public-contact"


@router.get("/", response_model=ContactInfoOut | None)
async def get_contact(db: AsyncSession = Depends(get_db)):
    """Get contact info (public). Returns null if not yet configured."""
    cache_hit, cached_payload = await get_cached_json(CONTACT_CACHE_NAMESPACE, {"view": "contact"})
    if cache_hit:
        if cached_payload is None:
            return None
        return ContactInfoOut.model_validate(cached_payload)

    contact = await get_contact_info(db)
    serialized = None if contact is None else ContactInfoOut.model_validate(contact).model_dump(mode="json")
    await set_cached_json(
        CONTACT_CACHE_NAMESPACE,
        {"view": "contact"},
        serialized,
        settings.PUBLIC_CACHE_TTL_SECONDS,
    )
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
        updated = await update_contact_info(db, existing, body)
        await invalidate_cache_namespace(CONTACT_CACHE_NAMESPACE)
        return updated
    # Create from update data — ensure required fields
    data = body.model_dump(exclude_unset=True)
    if not all(k in data for k in ("institute_name", "phone", "email", "address")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="First-time setup requires institute_name, phone, email, and address",
        )
    create_data = ContactInfoCreate(**data)
    created = await upsert_contact_info(db, create_data)
    await invalidate_cache_namespace(CONTACT_CACHE_NAMESPACE)
    return created


@router.get("/social-links", response_model=SocialLinksOut)
async def get_social_links(db: AsyncSession = Depends(get_db)):
    """Get only social media links (public)."""
    cache_hit, cached_payload = await get_cached_json(CONTACT_CACHE_NAMESPACE, {"view": "social-links"})
    if cache_hit:
        return SocialLinksOut.model_validate(cached_payload)

    contact = await get_contact_info(db)
    if not contact:
        response = SocialLinksOut()
    else:
        response = SocialLinksOut(
        instagram=contact.instagram_url,
        facebook=contact.facebook_url,
        youtube=contact.youtube_url,
        linkedin=contact.linkedin_url,
        whatsapp=contact.whatsapp_url,
    )
    await set_cached_json(
        CONTACT_CACHE_NAMESPACE,
        {"view": "social-links"},
        response.model_dump(mode="json"),
        settings.PUBLIC_CACHE_TTL_SECONDS,
    )
    return response
