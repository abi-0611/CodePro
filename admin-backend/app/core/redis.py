"""Redis connection pool & rate-limiting helpers.

Works across multiple uvicorn workers because state lives in Redis, not memory.
Gracefully falls back to pass-through (no limiting) if Redis is unreachable,
so the API never crashes because of a Redis outage.
"""

import logging

import redis.asyncio as redis

from app.config import settings

logger = logging.getLogger(__name__)

_pool: redis.Redis | None = None


async def get_redis() -> redis.Redis | None:
    """Return a shared async Redis connection, or None if unavailable."""
    global _pool
    if _pool is not None:
        return _pool
    try:
        _pool = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
        await _pool.ping()
        logger.info("Redis connected: %s", settings.REDIS_URL)
        return _pool
    except Exception:
        logger.warning("Redis unavailable — rate limiting disabled")
        _pool = None
        return None


async def close_redis() -> None:
    global _pool
    if _pool:
        await _pool.aclose()
        _pool = None


async def check_rate_limit(key: str, limit: int, window_seconds: int) -> bool:
    """Increment a counter in Redis; return True if under the limit.

    Returns True (allow) when Redis is unreachable to avoid blocking
    legitimate requests.
    """
    r = await get_redis()
    if r is None:
        return True  # fail-open
    try:
        pipe = r.pipeline()
        pipe.incr(key)
        pipe.expire(key, window_seconds)
        results = await pipe.execute()
        current = results[0]
        return current <= limit
    except Exception:
        return True  # fail-open
