import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course
from app.schemas.course import CourseCreate, CourseUpdate


async def get_course_by_id(db: AsyncSession, course_id: uuid.UUID) -> Course | None:
    result = await db.execute(select(Course).where(Course.id == course_id))
    return result.scalars().first()


async def get_course_by_slug(db: AsyncSession, slug: str) -> Course | None:
    result = await db.execute(select(Course).where(Course.slug == slug))
    return result.scalars().first()


async def get_all_courses(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    published_only: bool = False,
    category: str | None = None,
) -> list[Course]:
    query = select(Course).order_by(Course.order, Course.title)
    if published_only:
        query = query.where(Course.is_published.is_(True))
    if category:
        query = query.where(Course.category == category)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_courses_count(
    db: AsyncSession, published_only: bool = False, category: str | None = None
) -> int:
    query = select(func.count(Course.id))
    if published_only:
        query = query.where(Course.is_published.is_(True))
    if category:
        query = query.where(Course.category == category)
    result = await db.execute(query)
    return result.scalar() or 0


async def create_course(db: AsyncSession, course_in: CourseCreate) -> Course:
    data = course_in.model_dump()
    data["updated_at"] = datetime.now(timezone.utc)
    course = Course(**data)
    db.add(course)
    try:
        await db.commit()
        await db.refresh(course)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="A course with this slug already exists")
    return course


async def update_course(db: AsyncSession, course: Course, updates: CourseUpdate) -> Course:
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(course, field, value)
    course.updated_at = datetime.now(timezone.utc)
    db.add(course)
    try:
        await db.commit()
        await db.refresh(course)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Slug conflict")
    return course


async def delete_course(db: AsyncSession, course: Course) -> None:
    await db.delete(course)
    await db.commit()


async def reorder_courses(db: AsyncSession, order_map: dict[str, int]) -> list[Course]:
    for slug, order_val in order_map.items():
        result = await db.execute(select(Course).where(Course.slug == slug))
        course = result.scalars().first()
        if course:
            course.order = order_val
            course.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return await get_all_courses(db)


async def toggle_publish(db: AsyncSession, course: Course) -> Course:
    course.is_published = not course.is_published
    course.updated_at = datetime.now(timezone.utc)
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course
