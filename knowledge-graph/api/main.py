"""FastAPI Knowledge Graph API for QA Automation."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Query, HTTPException
from database import get_pool, close_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()
    yield
    await close_pool()


app = FastAPI(
    title="QA Knowledge Graph API",
    description="Query the QA knowledge graph: requirements, tests, endpoints, and their relationships.",
    version="1.0.0",
    lifespan=lifespan,
)


# ── Health ────────────────────────────────────────────────────────────

@app.get("/health", tags=["system"])
async def health():
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.fetchval("SELECT 1")
    return {"status": "healthy", "database": "connected"}


# ── Coverage Gaps ─────────────────────────────────────────────────────

@app.get("/qa/coverage-gaps", tags=["qa"])
async def coverage_gaps():
    """Requirements that have NO test coverage."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT r.jira_key, r.summary, r.priority, r.status,
                   a.name AS app_name
            FROM requirements r
            JOIN applications a ON a.id = r.app_id
            LEFT JOIN requirement_covered_by_test rct ON rct.requirement_id = r.id
            WHERE rct.id IS NULL
            ORDER BY
                CASE r.priority
                    WHEN 'Critical' THEN 1
                    WHEN 'High' THEN 2
                    WHEN 'Medium' THEN 3
                    WHEN 'Low' THEN 4
                END,
                r.jira_key
        """)
    return {
        "total_gaps": len(rows),
        "gaps": [dict(r) for r in rows],
    }


# ── Impact Analysis ───────────────────────────────────────────────────

@app.get("/qa/impact/{jira_key}", tags=["qa"])
async def impact_analysis(jira_key: str):
    """Given a Jira ticket, return which tests cover it and what endpoints they hit."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        req = await conn.fetchrow("""
            SELECT r.id, r.jira_key, r.summary, r.priority, r.status,
                   a.name AS app_name
            FROM requirements r
            JOIN applications a ON a.id = r.app_id
            WHERE r.jira_key = $1
        """, jira_key)

        if not req:
            raise HTTPException(404, f"Requirement {jira_key} not found")

        tests = await conn.fetch("""
            SELECT t.test_key, t.name, t.file_path, t.last_result,
                   t.flaky_count, rct.coverage_type
            FROM requirement_covered_by_test rct
            JOIN tests t ON t.id = rct.test_id
            WHERE rct.requirement_id = $1
            ORDER BY t.test_key
        """, req["id"])

        test_ids = [t["test_key"] for t in tests]

        endpoints = await conn.fetch("""
            SELECT DISTINCT e.method, e.path, e.description, a.name AS app_name
            FROM requirement_covered_by_test rct
            JOIN test_hits_endpoint the ON the.test_id = rct.test_id
            JOIN endpoints e ON e.id = the.endpoint_id
            JOIN applications a ON a.id = e.app_id
            WHERE rct.requirement_id = $1
            ORDER BY a.name, e.path
        """, req["id"])

    return {
        "requirement": dict(req),
        "tests": [dict(t) for t in tests],
        "endpoints_exercised": [dict(e) for e in endpoints],
        "summary": f"{len(tests)} test(s) covering {jira_key}, hitting {len(endpoints)} endpoint(s)",
    }


# ── Dependency Map ────────────────────────────────────────────────────

@app.get("/qa/dependencies/{app_key}", tags=["qa"])
async def dependency_map(app_key: str):
    """Show cross-app dependencies for a given application."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        app = await conn.fetchrow(
            "SELECT id, name FROM applications WHERE app_key = $1", app_key
        )
        if not app:
            raise HTTPException(404, f"Application {app_key} not found")

        # Endpoints in this app that depend on other apps' endpoints
        outbound = await conn.fetch("""
            SELECT
                se.method AS source_method, se.path AS source_path,
                te.method AS target_method, te.path AS target_path,
                ta.name AS target_app, dep.dependency_type
            FROM endpoint_depends_on_endpoint dep
            JOIN endpoints se ON se.id = dep.source_endpoint_id
            JOIN endpoints te ON te.id = dep.target_endpoint_id
            JOIN applications ta ON ta.id = te.app_id
            WHERE se.app_id = $1
            ORDER BY ta.name, te.path
        """, app["id"])

        # Other apps' endpoints that depend on this app's endpoints
        inbound = await conn.fetch("""
            SELECT
                se.method AS source_method, se.path AS source_path,
                sa.name AS source_app,
                te.method AS target_method, te.path AS target_path,
                dep.dependency_type
            FROM endpoint_depends_on_endpoint dep
            JOIN endpoints se ON se.id = dep.source_endpoint_id
            JOIN endpoints te ON te.id = dep.target_endpoint_id
            JOIN applications sa ON sa.id = se.app_id
            WHERE te.app_id = $1
            ORDER BY sa.name, se.path
        """, app["id"])

    return {
        "app": dict(app),
        "depends_on": [dict(r) for r in outbound],
        "depended_on_by": [dict(r) for r in inbound],
        "summary": f"{app['name']} depends on {len(outbound)} external endpoint(s), "
                   f"and {len(inbound)} external endpoint(s) depend on it",
    }


# ── Flaky Tests ───────────────────────────────────────────────────────

@app.get("/qa/flaky-tests", tags=["qa"])
async def flaky_tests(min_flaky: int = Query(1, ge=0)):
    """Tests with high flaky counts, plus recent failure history."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT t.test_key, t.name, t.file_path, t.flaky_count,
                   t.last_result, t.avg_duration_ms,
                   a.name AS app_name
            FROM tests t
            JOIN applications a ON a.id = t.app_id
            WHERE t.flaky_count >= $1
            ORDER BY t.flaky_count DESC
        """, min_flaky)

        results = []
        for row in rows:
            recent = await conn.fetch("""
                SELECT result, duration_ms, error_message, run_at, build_id
                FROM test_results_history
                WHERE test_id = (SELECT id FROM tests WHERE test_key = $1)
                ORDER BY run_at DESC
                LIMIT 5
            """, row["test_key"])
            entry = dict(row)
            entry["recent_runs"] = [dict(r) for r in recent]
            results.append(entry)

    return {
        "total_flaky": len(results),
        "tests": results,
    }


# ── App Summary ───────────────────────────────────────────────────────

@app.get("/qa/app-summary", tags=["qa"])
async def app_summary():
    """Overview of all applications with test and endpoint counts."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT
                a.app_key, a.name, a.team_owner,
                COUNT(DISTINCT e.id) AS endpoint_count,
                COUNT(DISTINCT t.id) AS test_count,
                COUNT(DISTINCT r.id) AS requirement_count
            FROM applications a
            LEFT JOIN endpoints e ON e.app_id = a.id
            LEFT JOIN tests t ON t.app_id = a.id
            LEFT JOIN requirements r ON r.app_id = a.id
            GROUP BY a.id, a.app_key, a.name, a.team_owner
            ORDER BY a.name
        """)
    return {"apps": [dict(r) for r in rows]}


# ── Search ────────────────────────────────────────────────────────────

@app.get("/qa/search", tags=["qa"])
async def search(q: str = Query(..., min_length=1)):
    """Text search across requirements and tests. Uses ILIKE (pgvector semantic search ready when embeddings populated)."""
    pool = await get_pool()
    pattern = f"%{q}%"
    async with pool.acquire() as conn:
        reqs = await conn.fetch("""
            SELECT r.jira_key, r.summary, r.priority, r.status,
                   a.name AS app_name
            FROM requirements r
            JOIN applications a ON a.id = r.app_id
            WHERE r.summary ILIKE $1 OR r.description ILIKE $1
            ORDER BY r.jira_key
        """, pattern)

        tests = await conn.fetch("""
            SELECT t.test_key, t.name, t.file_path, t.last_result,
                   a.name AS app_name
            FROM tests t
            JOIN applications a ON a.id = t.app_id
            WHERE t.name ILIKE $1 OR t.file_path ILIKE $1
            ORDER BY t.test_key
        """, pattern)

    return {
        "query": q,
        "requirements": [dict(r) for r in reqs],
        "tests": [dict(t) for t in tests],
        "total_results": len(reqs) + len(tests),
    }
