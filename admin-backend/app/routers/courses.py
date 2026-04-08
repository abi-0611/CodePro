import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.public_cache import get_cached_json, invalidate_cache_namespace, set_cached_json
from app.core.dependencies import get_current_active_user
from app.crud.course import (
    create_course,
    delete_course,
    get_all_courses,
    get_course_by_id,
    get_course_by_slug,
    get_courses_count,
    reorder_courses,
    toggle_publish,
    update_course,
)
from app.database import get_db
from app.models.user import AdminUser
from app.schemas.course import (
    CourseCreate,
    CourseListOut,
    CourseOut,
    CourseReorderRequest,
    CourseUpdate,
)

router = APIRouter(prefix="/api/courses", tags=["courses"])

COURSES_CACHE_NAMESPACE = "public-courses"


@router.get("/", response_model=CourseListOut)
async def list_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    published_only: bool = False,
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """List all courses (public). Supports filtering and pagination."""
    cache_key = {
        "view": "list",
        "skip": skip,
        "limit": limit,
        "published_only": published_only,
        "category": category,
    }
    cache_hit, cached_payload = await get_cached_json(COURSES_CACHE_NAMESPACE, cache_key)
    if cache_hit:
        return CourseListOut.model_validate(cached_payload)

    courses = await get_all_courses(db, skip=skip, limit=limit, published_only=published_only, category=category)
    total = await get_courses_count(db, published_only=published_only, category=category)
    response = CourseListOut(
        courses=courses,
        total=total,
        skip=skip,
        limit=limit,
        has_more=(skip + limit) < total,
    )
    await set_cached_json(
        COURSES_CACHE_NAMESPACE,
        cache_key,
        response.model_dump(mode="json"),
        settings.PUBLIC_CACHE_TTL_SECONDS,
    )
    return response


@router.get("/{slug}", response_model=CourseOut)
async def get_course(slug: str, db: AsyncSession = Depends(get_db)):
    """Get a single course by slug (public)."""
    cache_hit, cached_payload = await get_cached_json(COURSES_CACHE_NAMESPACE, {"view": "slug", "slug": slug})
    if cache_hit:
        return CourseOut.model_validate(cached_payload)

    course = await get_course_by_slug(db, slug)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    await set_cached_json(
        COURSES_CACHE_NAMESPACE,
        {"view": "slug", "slug": slug},
        CourseOut.model_validate(course).model_dump(mode="json"),
        settings.PUBLIC_CACHE_TTL_SECONDS,
    )
    return course


@router.get("/id/{course_id}", response_model=CourseOut)
async def get_course_by_uuid(course_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get a single course by UUID (public)."""
    cache_hit, cached_payload = await get_cached_json(
        COURSES_CACHE_NAMESPACE,
        {"view": "id", "course_id": str(course_id)},
    )
    if cache_hit:
        return CourseOut.model_validate(cached_payload)

    course = await get_course_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    await set_cached_json(
        COURSES_CACHE_NAMESPACE,
        {"view": "id", "course_id": str(course_id)},
        CourseOut.model_validate(course).model_dump(mode="json"),
        settings.PUBLIC_CACHE_TTL_SECONDS,
    )
    return course


@router.post("/", response_model=CourseOut, status_code=status.HTTP_201_CREATED)
async def create_new_course(
    course_in: CourseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_active_user),
):
    """Create a new course (protected)."""
    course = await create_course(db, course_in)
    await invalidate_cache_namespace(COURSES_CACHE_NAMESPACE)
    return course


@router.put("/{slug}", response_model=CourseOut)
async def update_existing_course(
    slug: str,
    updates: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_active_user),
):
    """Update an existing course by slug (protected)."""
    course = await get_course_by_slug(db, slug)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    updated_course = await update_course(db, course, updates)
    await invalidate_cache_namespace(COURSES_CACHE_NAMESPACE)
    return updated_course


@router.delete("/{slug}")
async def delete_existing_course(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_active_user),
):
    """Delete a course by slug (protected)."""
    course = await get_course_by_slug(db, slug)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    await delete_course(db, course)
    await invalidate_cache_namespace(COURSES_CACHE_NAMESPACE)
    return {"message": "Course deleted", "slug": slug}


@router.post("/reorder")
async def reorder(
    body: CourseReorderRequest,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_active_user),
):
    """Reorder courses (protected)."""
    order_map = {item.slug: item.order for item in body.order}
    await reorder_courses(db, order_map)
    await invalidate_cache_namespace(COURSES_CACHE_NAMESPACE)
    return {"message": "Reordered successfully"}


@router.post("/{slug}/toggle-publish", response_model=CourseOut)
async def toggle_course_publish(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_active_user),
):
    """Toggle published status of a course (protected)."""
    course = await get_course_by_slug(db, slug)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    updated_course = await toggle_publish(db, course)
    await invalidate_cache_namespace(COURSES_CACHE_NAMESPACE)
    return updated_course
