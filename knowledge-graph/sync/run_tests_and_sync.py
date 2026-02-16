"""Run Playwright tests and sync results into the Knowledge Graph.

Usage:
    python run_tests_and_sync.py

What it does:
    1. Runs 'npx playwright test --reporter=json' in the project root
    2. Parses the JSON test results
    3. Upserts test records + test_results_history into PostgreSQL
    4. Updates flaky counts and last_result stats

This is the "kick off tests" script — run it from Cursor or terminal.
"""

import asyncio
import json
import logging
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from config import JIRA_PROJECT
from db import create_pool, resolve_app_id, upsert_test, insert_test_result, update_test_stats
from models import TestCase, TestExecution

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("test-runner")

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent  # TestingAPP/


def run_playwright() -> dict:
    """Run Playwright tests and return the JSON results."""
    results_file = PROJECT_ROOT / "test-results" / "results.json"
    results_file.parent.mkdir(exist_ok=True)

    logger.info("Running Playwright tests...")
    result = subprocess.run(
        ["npx", "playwright", "test", "--reporter=json"],
        cwd=str(PROJECT_ROOT),
        capture_output=True,
        text=True,
        shell=True,
    )

    # Playwright outputs JSON to stdout with --reporter=json
    stdout = result.stdout
    if not stdout.strip():
        # Fallback: check the results file
        if results_file.exists():
            stdout = results_file.read_text(encoding="utf-8")
        else:
            logger.error(f"No test output. stderr: {result.stderr}")
            sys.exit(1)

    try:
        return json.loads(stdout)
    except json.JSONDecodeError:
        # Sometimes there's non-JSON output before the JSON blob
        # Try to find the JSON object
        start = stdout.find('{')
        if start >= 0:
            return json.loads(stdout[start:])
        logger.error(f"Could not parse test results. stdout: {stdout[:500]}")
        sys.exit(1)


def parse_playwright_results(data: dict) -> tuple[list[TestCase], list[TestExecution]]:
    """Parse Playwright JSON reporter output into our models."""
    test_cases = []
    executions = []
    build_id = f"local-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')}"

    def walk_suites(suites, file_path=""):
        """Recursively walk nested suites to find all specs."""
        for suite in suites:
            fp = suite.get("file", "") or file_path
            # Process specs at this level
            for spec in suite.get("specs", []):
                test_name = spec.get("title", "Untitled")
                test_key = _make_test_key(fp, test_name)

                test_cases.append(TestCase(
                    test_key=test_key,
                    name=test_name,
                    test_type="e2e",
                    status="active",
                    app_key="MST",
                ))

                for test in spec.get("tests", []):
                    for result in test.get("results", []):
                        status = result.get("status", "unknown")
                        result_map = {
                            "passed": "pass",
                            "failed": "fail",
                            "timedOut": "fail",
                            "skipped": "not_executed",
                        }

                        error_msg = None
                        if result.get("error"):
                            error_msg = result["error"].get("message", "")[:500]

                        executions.append(TestExecution(
                            test_key=test_key,
                            result=result_map.get(status, status),
                            duration_ms=result.get("duration"),
                            error_message=error_msg,
                            run_at=datetime.now(timezone.utc).isoformat(),
                            build_id=build_id,
                        ))

            # Recurse into child suites
            walk_suites(suite.get("suites", []), fp)

    walk_suites(data.get("suites", []))
    return test_cases, executions


def _make_test_key(file_path: str, test_name: str) -> str:
    """Generate a stable test key from file path + test name."""
    # e.g. "tests/e2e/mortgage-flow.spec.ts" + "calculates monthly payment"
    # → "e2e-mortgage-flow-calculates-monthly-payment"
    file_part = Path(file_path).stem.replace(".spec", "").replace(".", "-")
    name_part = test_name.lower()
    for ch in "()[]{}'\",.:;!?/\\":
        name_part = name_part.replace(ch, "")
    name_part = "-".join(name_part.split())[:50]
    return f"{file_part}-{name_part}"


async def sync_results(test_cases: list[TestCase], executions: list[TestExecution]):
    """Write Playwright results into the Knowledge Graph."""
    pool = await create_pool()
    logger.info("Connected to PostgreSQL")

    try:
        app_id = await resolve_app_id(pool, "MST", "My Software Team")

        # Upsert test cases
        test_id_map = {}
        for tc in test_cases:
            test_db_id = await upsert_test(pool, tc, app_id)
            test_id_map[tc.test_key] = test_db_id
        logger.info(f"Upserted {len(test_id_map)} test records")

        # Insert execution results
        exec_count = 0
        for ex in executions:
            test_db_id = test_id_map.get(ex.test_key)
            if test_db_id:
                await insert_test_result(pool, test_db_id, ex)
                exec_count += 1
        logger.info(f"Inserted {exec_count} test results")

        # Update stats
        for test_db_id in test_id_map.values():
            await update_test_stats(pool, test_db_id)
        logger.info("Test stats updated")

    finally:
        await pool.close()


def main():
    # Step 1: Run tests
    results_data = run_playwright()

    # Step 2: Parse results
    test_cases, executions = parse_playwright_results(results_data)

    passed = sum(1 for e in executions if e.result == "pass")
    failed = sum(1 for e in executions if e.result == "fail")
    logger.info(f"Test results: {passed} passed, {failed} failed, {len(executions)} total")

    # Step 3: Sync to knowledge graph
    asyncio.run(sync_results(test_cases, executions))

    logger.info("Done! Test results are now in the knowledge graph.")

    # Exit with non-zero if any tests failed
    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
