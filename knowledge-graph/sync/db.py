"""Database layer — asyncpg pool + UPSERT functions."""

import logging
from urllib.parse import urlparse
from datetime import datetime

import asyncpg

from config import DATABASE_URL
from models import Requirement, TestCase, TestExecution

logger = logging.getLogger(__name__)

# ── Connection Pool ──────────────────────────────────────────────────

async def create_pool() -> asyncpg.Pool:
    parsed = urlparse(DATABASE_URL)
    return await asyncpg.create_pool(
        host=parsed.hostname or "localhost",
        port=parsed.port or 5433,
        user=parsed.username or "kguser",
        password=parsed.password or "kgpass",
        database=parsed.path.lstrip("/") or "knowledgegraph",
        min_size=2,
        max_size=5,
    )


# ── Application Resolution ──────────────────────────────────────────

_app_cache: dict[str, int] = {}


async def resolve_app_id(pool: asyncpg.Pool, app_key: str, name: str = None) -> int:
    """Get or create application row. Caches results."""
    if app_key in _app_cache:
        return _app_cache[app_key]
    async with pool.acquire() as conn:
        app_id = await conn.fetchval(
            """INSERT INTO applications (app_key, name)
               VALUES ($1, $2)
               ON CONFLICT (app_key) DO UPDATE SET updated_at = NOW()
               RETURNING id""",
            app_key, name or app_key,
        )
    _app_cache[app_key] = app_id
    return app_id


# ── Upsert Requirements ─────────────────────────────────────────────

async def upsert_requirement(pool: asyncpg.Pool, req: Requirement, app_id: int) -> int:
    """Upsert a requirement row. Returns the row id."""
    async with pool.acquire() as conn:
        row_id = await conn.fetchval(
            """INSERT INTO requirements (jira_key, summary, description, priority, status, app_id)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT (jira_key) DO UPDATE SET
                   summary = EXCLUDED.summary,
                   description = EXCLUDED.description,
                   priority = EXCLUDED.priority,
                   status = EXCLUDED.status,
                   app_id = EXCLUDED.app_id,
                   updated_at = NOW()
               RETURNING id""",
            req.jira_key, req.summary, req.description,
            req.priority, req.status, app_id,
        )
    return row_id


# ── Upsert Tests ────────────────────────────────────────────────────

async def upsert_test(pool: asyncpg.Pool, tc: TestCase, app_id: int) -> int:
    """Upsert a test row. Returns the row id."""
    async with pool.acquire() as conn:
        row_id = await conn.fetchval(
            """INSERT INTO tests (test_key, name, test_type, status, app_id)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (test_key) DO UPDATE SET
                   name = EXCLUDED.name,
                   test_type = EXCLUDED.test_type,
                   status = EXCLUDED.status,
                   app_id = EXCLUDED.app_id
               RETURNING id""",
            tc.test_key, tc.name, tc.test_type, tc.status, app_id,
        )
    return row_id


# ── Insert Test Execution History ────────────────────────────────────

async def insert_test_result(pool: asyncpg.Pool, test_db_id: int, ex: TestExecution):
    """Insert a test execution result, skipping duplicates."""
    run_at = None
    if ex.run_at:
        if isinstance(ex.run_at, str):
            run_at = datetime.fromisoformat(ex.run_at.replace("Z", "+00:00"))
        else:
            run_at = ex.run_at

    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO test_results_history
                   (test_id, result, duration_ms, error_message, run_at, build_id)
               SELECT $1, $2, $3, $4, $5, $6
               WHERE NOT EXISTS (
                   SELECT 1 FROM test_results_history
                   WHERE test_id = $1 AND run_at = $5
               )""",
            test_db_id, ex.result, ex.duration_ms,
            ex.error_message, run_at, ex.build_id,
        )


# ── Upsert Requirement ↔ Test Link ──────────────────────────────────

async def upsert_requirement_test_link(
    pool: asyncpg.Pool, req_id: int, test_id: int, coverage_type: str = "linked"
):
    """Upsert a requirement-covered-by-test relationship."""
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO requirement_covered_by_test
                   (requirement_id, test_id, coverage_type)
               VALUES ($1, $2, $3)
               ON CONFLICT (requirement_id, test_id) DO UPDATE SET
                   coverage_type = EXCLUDED.coverage_type""",
            req_id, test_id, coverage_type,
        )


# ── Update Test Stats ────────────────────────────────────────────────

async def update_test_stats(pool: asyncpg.Pool, test_db_id: int):
    """Recalculate last_result, flaky_count, avg_duration from history."""
    async with pool.acquire() as conn:
        await conn.execute(
            """UPDATE tests SET
                   last_result = (
                       SELECT result FROM test_results_history
                       WHERE test_id = $1 ORDER BY run_at DESC NULLS LAST LIMIT 1
                   ),
                   flaky_count = (
                       SELECT COUNT(*) FROM test_results_history
                       WHERE test_id = $1 AND result = 'fail'
                   ),
                   avg_duration_ms = (
                       SELECT AVG(duration_ms)::int FROM test_results_history
                       WHERE test_id = $1 AND duration_ms IS NOT NULL
                   ),
                   last_run_at = (
                       SELECT MAX(run_at) FROM test_results_history
                       WHERE test_id = $1
                   )
               WHERE id = $1""",
            test_db_id,
        )
