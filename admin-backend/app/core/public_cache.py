import hashlib
import json
import time
from typing import Any

from app.core.redis import get_redis


_REDIS_RETRY_BACKOFF_SECONDS = 5
_next_retry_at = 0.0


def _version_key(namespace: str) -> str:
    return f"public-cache-version:{namespace}"


def _cache_key(namespace: str, version: int, key_data: dict[str, Any]) -> str:
    serialized = json.dumps(key_data, sort_keys=True, separators=(",", ":"), default=str)
    digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
    return f"public-cache:{namespace}:v{version}:{digest}"


async def _get_namespace_version(redis_client: Any, namespace: str) -> int:
    raw_version = await redis_client.get(_version_key(namespace))
    if raw_version is None:
        return 0
    try:
        return int(raw_version)
    except (TypeError, ValueError):
        return 0


async def _get_cache_client() -> Any:
    global _next_retry_at

    now = time.monotonic()
    if now < _next_retry_at:
        return None

    redis_client = await get_redis()
    if redis_client is None:
        _next_retry_at = now + _REDIS_RETRY_BACKOFF_SECONDS
        return None

    _next_retry_at = 0.0
    return redis_client


async def get_cached_json(namespace: str, key_data: dict[str, Any]) -> tuple[bool, Any]:
    redis_client = await _get_cache_client()
    if redis_client is None:
        return False, None

    try:
        version = await _get_namespace_version(redis_client, namespace)
        payload = await redis_client.get(_cache_key(namespace, version, key_data))
    except Exception:
        return False, None

    if payload is None:
        return False, None
    return True, json.loads(payload)


async def set_cached_json(namespace: str, key_data: dict[str, Any], value: Any, ttl_seconds: int) -> None:
    if ttl_seconds <= 0:
        return

    redis_client = await _get_cache_client()
    if redis_client is None:
        return

    try:
        version = await _get_namespace_version(redis_client, namespace)
        await redis_client.set(
            _cache_key(namespace, version, key_data),
            json.dumps(value, separators=(",", ":")),
            ex=ttl_seconds,
        )
    except Exception:
        return


async def invalidate_cache_namespace(namespace: str) -> None:
    redis_client = await _get_cache_client()
    if redis_client is None:
        return

    try:
        await redis_client.incr(_version_key(namespace))
    except Exception:
        return