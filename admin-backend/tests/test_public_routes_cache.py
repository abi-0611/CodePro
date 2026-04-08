import os
import unittest
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost/test")
os.environ.setdefault("SECRET_KEY", "test-secret")

from app.routers import contact_info as contact_router
from app.routers import courses as courses_router
from app.schemas.contact_info import ContactInfoOut
from app.schemas.course import CourseCreate, CourseListOut, CourseOut


def build_course_out() -> CourseOut:
    return CourseOut(
        id=uuid.uuid4(),
        slug="python-mastery",
        title="Python Mastery",
        short_description="A complete Python course for production work.",
        description="Deep dive into Python and backend development.",
        duration="12 weeks",
        mode="online",
        level="intermediate",
        icon="py",
        price="19999",
        badge="Popular",
        order=1,
        category="backend",
        next_batch="2026-05-01",
        curriculum=["Syntax", "FastAPI"],
        curriculum_topics=[["Types", "Functions"], ["Routing", "Testing"]],
        highlights=["Projects"],
        faqs=[{"q": "Is this live?", "a": "Yes"}],
        featured=True,
        is_published=True,
        created_at=datetime.now(timezone.utc),
        updated_at=None,
    )


def build_contact_out() -> ContactInfoOut:
    return ContactInfoOut(
        id=uuid.uuid4(),
        institute_name="CodePro.io",
        site_tagline="Master the code, Become a pro",
        phone="+91 91762 41244",
        email="team@codepro.io",
        address="Chennai",
        city="Chennai",
        state="Tamil Nadu",
        pincode="600126",
        google_maps_url=None,
        whatsapp_url=None,
        facebook_url=None,
        instagram_url=None,
        youtube_url=None,
        linkedin_url=None,
        working_hours=None,
        brochure_pdf_url=None,
        updated_at=None,
    )


class CourseRouteCacheTests(unittest.IsolatedAsyncioTestCase):
    async def test_list_courses_uses_cached_payload(self):
        cached_payload = {
            "courses": [],
            "total": 0,
            "skip": 0,
            "limit": 20,
            "has_more": False,
        }

        with (
            patch("app.routers.courses.get_cached_json", new=AsyncMock(return_value=(True, cached_payload))),
            patch("app.routers.courses.get_all_courses", new=AsyncMock()) as get_all_courses,
            patch("app.routers.courses.get_courses_count", new=AsyncMock()) as get_courses_count,
        ):
            result = await courses_router.list_courses(skip=0, limit=20, published_only=False, category=None, db=object())

        self.assertIsInstance(result, CourseListOut)
        self.assertEqual(result.total, 0)
        get_all_courses.assert_not_called()
        get_courses_count.assert_not_called()

    async def test_list_courses_caches_database_result_on_miss(self):
        course = build_course_out()

        with (
            patch("app.routers.courses.get_cached_json", new=AsyncMock(return_value=(False, None))),
            patch("app.routers.courses.get_all_courses", new=AsyncMock(return_value=[course])) as get_all_courses,
            patch("app.routers.courses.get_courses_count", new=AsyncMock(return_value=1)) as get_courses_count,
            patch("app.routers.courses.set_cached_json", new=AsyncMock()) as set_cached_json,
        ):
            result = await courses_router.list_courses(skip=0, limit=100, published_only=True, category=None, db=object())

        self.assertEqual(result.total, 1)
        get_all_courses.assert_awaited_once()
        get_courses_count.assert_awaited_once()
        set_cached_json.assert_awaited_once()

    async def test_create_course_invalidates_public_cache(self):
        course = build_course_out()
        course_in = CourseCreate(
            slug="python-mastery",
            title="Python Mastery",
            short_description="A complete Python course for production work.",
            description="Deep dive into Python and backend development.",
            duration="12 weeks",
            mode="online",
            level="intermediate",
            icon="py",
            price="19999",
            badge="Popular",
            order=1,
            category="backend",
            next_batch="2026-05-01",
            curriculum=["Syntax", "FastAPI"],
            curriculum_topics=[["Types", "Functions"], ["Routing", "Testing"]],
            highlights=["Projects"],
            faqs=[{"q": "Is this live?", "a": "Yes"}],
            featured=True,
            is_published=True,
        )

        with (
            patch("app.routers.courses.create_course", new=AsyncMock(return_value=course)),
            patch("app.routers.courses.invalidate_cache_namespace", new=AsyncMock()) as invalidate_cache_namespace,
        ):
            result = await courses_router.create_new_course(course_in=course_in, db=object(), current_user=object())

        self.assertEqual(result.slug, "python-mastery")
        invalidate_cache_namespace.assert_awaited_once()


class ContactRouteCacheTests(unittest.IsolatedAsyncioTestCase):
    async def test_get_contact_uses_cached_payload(self):
        cached_payload = build_contact_out().model_dump(mode="json")

        with (
            patch("app.routers.contact_info.get_cached_json", new=AsyncMock(return_value=(True, cached_payload))),
            patch("app.routers.contact_info.get_contact_info", new=AsyncMock()) as get_contact_info,
        ):
            result = await contact_router.get_contact(db=object())

        self.assertEqual(result.institute_name, "CodePro.io")
        get_contact_info.assert_not_called()

    async def test_update_contact_invalidates_public_cache(self):
        existing = build_contact_out()
        updated = build_contact_out()

        with (
            patch("app.routers.contact_info.get_contact_info", new=AsyncMock(return_value=existing)),
            patch("app.routers.contact_info.update_contact_info", new=AsyncMock(return_value=updated)),
            patch("app.routers.contact_info.invalidate_cache_namespace", new=AsyncMock()) as invalidate_cache_namespace,
        ):
            result = await contact_router.update_contact(body=contact_router.ContactInfoUpdate(phone="+91 99999 99999"), db=object(), current_user=object())

        self.assertEqual(result.institute_name, "CodePro.io")
        invalidate_cache_namespace.assert_awaited_once()