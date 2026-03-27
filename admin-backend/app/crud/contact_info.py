from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.contact_info import ContactInfo
from app.schemas.contact_info import ContactInfoCreate, ContactInfoUpdate


async def get_contact_info(db: AsyncSession) -> ContactInfo | None:
    result = await db.execute(select(ContactInfo).limit(1))
    return result.scalars().first()


async def create_contact_info(db: AsyncSession, data: ContactInfoCreate) -> ContactInfo:
    contact = ContactInfo(**data.model_dump())
    contact.updated_at = datetime.now(timezone.utc)
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return contact


async def update_contact_info(
    db: AsyncSession, contact: ContactInfo, updates: ContactInfoUpdate
) -> ContactInfo:
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contact, field, value)
    contact.updated_at = datetime.now(timezone.utc)
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return contact


async def upsert_contact_info(db: AsyncSession, data: ContactInfoCreate) -> ContactInfo:
    existing = await get_contact_info(db)
    if existing:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(existing, field, value)
        existing.updated_at = datetime.now(timezone.utc)
        db.add(existing)
        await db.commit()
        await db.refresh(existing)
        return existing
    return await create_contact_info(db, data)
