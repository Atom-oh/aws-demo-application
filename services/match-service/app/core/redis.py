"""Redis client for caching."""

import json
from typing import Any, Optional
from collections.abc import AsyncGenerator

import redis.asyncio as redis

from app.core.config import settings


class RedisClient:
    """Async Redis client wrapper with caching utilities."""

    def __init__(self) -> None:
        self._client: Optional[redis.Redis] = None

    async def connect(self) -> None:
        """Initialize Redis connection."""
        self._client = redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )

    async def disconnect(self) -> None:
        """Close Redis connection."""
        if self._client:
            await self._client.close()

    @property
    def client(self) -> redis.Redis:
        """Get Redis client instance."""
        if self._client is None:
            raise RuntimeError("Redis client not initialized")
        return self._client

    # String operations for match details
    async def get_match_detail(
        self, job_id: str, resume_id: str
    ) -> Optional[dict[str, Any]]:
        """Get cached match detail."""
        key = f"match:detail:{job_id}:{resume_id}"
        data = await self.client.get(key)
        if data:
            return json.loads(data)
        return None

    async def set_match_detail(
        self,
        job_id: str,
        resume_id: str,
        detail: dict[str, Any],
        ttl: Optional[int] = None,
    ) -> None:
        """Cache match detail."""
        key = f"match:detail:{job_id}:{resume_id}"
        await self.client.set(
            key,
            json.dumps(detail),
            ex=ttl or settings.redis_cache_ttl,
        )

    async def delete_match_detail(self, job_id: str, resume_id: str) -> None:
        """Delete cached match detail."""
        key = f"match:detail:{job_id}:{resume_id}"
        await self.client.delete(key)

    # ZSET operations for top matches by job
    async def get_top_matches_for_job(
        self, job_id: str, limit: int = 10
    ) -> list[tuple[str, float]]:
        """Get top matches for a job (resume_id, score pairs)."""
        key = f"match:job:{job_id}:top"
        return await self.client.zrevrange(key, 0, limit - 1, withscores=True)

    async def add_match_to_job_ranking(
        self, job_id: str, resume_id: str, score: float
    ) -> None:
        """Add or update match in job ranking."""
        key = f"match:job:{job_id}:top"
        await self.client.zadd(key, {resume_id: score})
        await self.client.expire(key, settings.redis_cache_ttl)

    async def remove_match_from_job_ranking(
        self, job_id: str, resume_id: str
    ) -> None:
        """Remove match from job ranking."""
        key = f"match:job:{job_id}:top"
        await self.client.zrem(key, resume_id)

    # ZSET operations for user recommendations
    async def get_recommended_jobs_for_user(
        self, user_id: str, limit: int = 10
    ) -> list[tuple[str, float]]:
        """Get recommended jobs for a user (job_id, score pairs)."""
        key = f"match:user:{user_id}:recommended"
        return await self.client.zrevrange(key, 0, limit - 1, withscores=True)

    async def add_recommendation_for_user(
        self, user_id: str, job_id: str, score: float
    ) -> None:
        """Add or update job recommendation for user."""
        key = f"match:user:{user_id}:recommended"
        await self.client.zadd(key, {job_id: score})
        await self.client.expire(key, settings.redis_cache_ttl)

    async def remove_recommendation_for_user(
        self, user_id: str, job_id: str
    ) -> None:
        """Remove job recommendation for user."""
        key = f"match:user:{user_id}:recommended"
        await self.client.zrem(key, job_id)

    async def clear_user_recommendations(self, user_id: str) -> None:
        """Clear all recommendations for a user."""
        key = f"match:user:{user_id}:recommended"
        await self.client.delete(key)

    # Health check
    async def ping(self) -> bool:
        """Check Redis connectivity."""
        try:
            await self.client.ping()
            return True
        except Exception:
            return False


redis_client = RedisClient()


async def get_redis() -> AsyncGenerator[RedisClient, None]:
    """Dependency for getting Redis client."""
    yield redis_client
