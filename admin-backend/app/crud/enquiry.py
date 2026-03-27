from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enquiry import Enquiry
from app.schemas.enquiry import EnquiryCreate


async def create_enquiry(db: AsyncSession, data: EnquiryCreate) -> Enquiry:
    enquiry = Enquiry(**data.model_dump())
    db.add(enquiry)
    await db.commit()
    await db.refresh(enquiry)
    return enquiry


async def get_enquiries(
    db: AsyncSession, skip: int = 0, limit: int = 20, status_filter: str | None = None
) -> list[Enquiry]:
    query = select(Enquiry).order_by(Enquiry.created_at.desc())
    if status_filter:
        query = query.where(Enquiry.status == status_filter)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_enquiries_count(db: AsyncSession, status_filter: str | None = None) -> int:
    query = select(func.count(Enquiry.id))
    if status_filter:
        query = query.where(Enquiry.status == status_filter)
    result = await db.execute(query)
    return result.scalar() or 0
