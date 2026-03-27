import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user
from app.crud.site_content import (
    bulk_update_content,
    delete_content,
    get_all_sections,
    get_content_by_key,
    get_content_by_section,
    get_full_site_config,
    upsert_content,
)
from app.database import get_db
from app.models.user import AdminUser
from app.schemas.site_content import (
    BulkUpdateResponse,
    SectionOut,
    SiteContentBulkUpdate,
    SiteContentOut,
    SiteContentUpdate,
)

router = APIRouter(prefix="/api/content", tags=["content"])


@router.get("/")
async def list_sections(db: AsyncSession = Depends(get_db)):
    """List all distinct content section names (public)."""
    sections = await get_all_sections(db)
    return {"sections": sections}


@router.get("/all")
async def get_all_content(db: AsyncSession = Depends(get_db)):
    """Get full site configuration grouped by section (public)."""
    return await get_full_site_config(db)


@router.get("/{section}", response_model=SectionOut)
async def get_section_content(section: str, db: AsyncSession = Depends(get_db)):
    """Get all content for a specific section (public)."""
    items = await get_content_by_section(db, section)
    return SectionOut(section=section, items=items)


@router.get("/{section}/{key}", response_model=SiteContentOut)
async def get_content_item(section: str, key: str, db: AsyncSession = Depends(get_db)):
    """Get a single content item by section and key (public)."""
    content = await get_content_by_key(db, section, key)
    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
    return content


@router.put("/{section}/{key}", response_model=SiteContentOut)
async def update_content_item(
    section: str,
    key: str,
    body: SiteContentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_active_user),
):
    """Update or create a content item (upsert, protected)."""
    content = await upsert_content(
        db,
        section=section,
        key=key,
        value=body.value,
        value_json=body.value_json,
        content_type=body.content_type or "text",
        label=body.label,
        description=body.description,
    )
    return content


@router.post("/bulk", response_model=BulkUpdateResponse)
async def bulk_update(
    body: SiteContentBulkUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_active_user),
):
    """Bulk update/upsert content items (protected)."""
    items = [item.model_dump() for item in body.updates]
    results = await bulk_update_content(db, items)
    return BulkUpdateResponse(updated=len(results), items=results)


@router.delete("/{content_id}")
async def delete_content_item(
    content_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_active_user),
):
    """Delete a content item by UUID (protected)."""
    await delete_content(db, content_id)
    return {"message": "Deleted"}
