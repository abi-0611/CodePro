import os
import unittest
from unittest.mock import AsyncMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost/test")
os.environ.setdefault("SECRET_KEY", "test-secret")

from app.core.public_cache import get_cached_json, invalidate_cache_namespace, set_cached_json
import app.core.public_cache as public_cache


class FakeRedis:
    def __init__(self):
        self.store: dict[str, str] = {}

    async def get(self, key: str):
        return self.store.get(key)

    async def set(self, key: str, value: str, ex: int | None = None):
        self.store[key] = value
        return True

    async def incr(self, key: str):
        current = int(self.store.get(key, "0")) + 1
        self.store[key] = str(current)
        return current


class PublicCacheTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        public_cache._next_retry_at = 0.0

    async def test_set_and_get_cached_json_round_trip(self):
        fake_redis = FakeRedis()

        with patch("app.core.public_cache.get_redis", new=AsyncMock(return_value=fake_redis)):
            await set_cached_json("courses", {"path": "/api/courses"}, {"total": 1}, ttl_seconds=60)
            hit, payload = await get_cached_json("courses", {"path": "/api/courses"})

        self.assertTrue(hit)
        self.assertEqual(payload, {"total": 1})

    async def test_invalidate_cache_namespace_changes_visible_version(self):
        fake_redis = FakeRedis()

        with patch("app.core.public_cache.get_redis", new=AsyncMock(return_value=fake_redis)):
            await set_cached_json("contact", {"path": "/api/contact"}, {"name": "CodePro"}, ttl_seconds=60)
            first_hit, first_payload = await get_cached_json("contact", {"path": "/api/contact"})
            await invalidate_cache_namespace("contact")
            second_hit, second_payload = await get_cached_json("contact", {"path": "/api/contact"})

        self.assertTrue(first_hit)
        self.assertEqual(first_payload, {"name": "CodePro"})
        self.assertFalse(second_hit)
        self.assertIsNone(second_payload)

    async def test_redis_failures_are_temporarily_backed_off(self):
        redis_lookup = AsyncMock(return_value=None)

        with patch("app.core.public_cache.get_redis", new=redis_lookup):
            first_hit, first_payload = await get_cached_json("courses", {"path": "/api/courses"})
            second_hit, second_payload = await get_cached_json("courses", {"path": "/api/courses"})

        self.assertFalse(first_hit)
        self.assertIsNone(first_payload)
        self.assertFalse(second_hit)
        self.assertIsNone(second_payload)
        redis_lookup.assert_awaited_once()