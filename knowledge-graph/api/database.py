"""Async database connection pool using asyncpg."""

import os
import asyncpg

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://kguser:kgpass@postgres:5432/knowledgegraph"
)


def _parse_dsn(url: str) -> dict:
    """Parse a postgresql:// DSN into asyncpg connect kwargs."""
    from urllib.parse import urlparse
    parsed = urlparse(url)
    return {
        "host": parsed.hostname or "postgres",
        "port": parsed.port or 5432,
        "user": parsed.username or "kguser",
        "password": parsed.password or "kgpass",
        "database": parsed.path.lstrip("/") or "knowledgegraph",
    }


_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        params = _parse_dsn(DATABASE_URL)
        _pool = await asyncpg.create_pool(**params, min_size=2, max_size=10)
    return _pool


async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
