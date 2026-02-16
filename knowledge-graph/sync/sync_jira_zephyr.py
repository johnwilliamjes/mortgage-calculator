"""Sync Jira + Zephyr Scale data into the QA Knowledge Graph.

Usage:
    # From JSON files (dummy data or Jira export):
    python sync_jira_zephyr.py --from-file

    # From live Jira + Zephyr APIs (full sync):
    python sync_jira_zephyr.py

    # Delta sync — only changes from last N days:
    python sync_jira_zephyr.py --since 7d
    python sync_jira_zephyr.py --since 1d
    python sync_jira_zephyr.py --since 30d

    # Custom JSON paths:
    python sync_jira_zephyr.py --jira-file data/my_export.json --zephyr-file data/my_tests.json
"""

import argparse
import asyncio
import logging
import sys
from pathlib import Path

import aiohttp

from config import JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT, ZEPHYR_API_TOKEN
from db import (
    create_pool, resolve_app_id, upsert_requirement,
    upsert_test, insert_test_result, upsert_requirement_test_link,
    update_test_stats,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("sync")

DATA_DIR = Path(__file__).parent / "data"


async def sync_from_files(jira_file: str, zephyr_file: str):
    """Sync from local JSON files — no API calls needed."""
    from jira_client import load_from_file as load_jira
    from zephyr_client import load_from_file as load_zephyr

    pool = await create_pool()
    logger.info("Connected to PostgreSQL")

    try:
        # ── Phase 1: Jira issues → requirements ──
        logger.info("Phase 1: Loading Jira issues from file...")
        project, requirements = load_jira(jira_file)
        app_key = project.get("key", "UNKNOWN")
        app_name = project.get("name", app_key)
        app_id = await resolve_app_id(pool, app_key, app_name)

        req_id_map = {}
        for req in requirements:
            req_db_id = await upsert_requirement(pool, req, app_id)
            req_id_map[req.jira_key] = req_db_id
        logger.info(f"Upserted {len(req_id_map)} requirements")

        # ── Phase 2: Zephyr test cases → tests ──
        logger.info("Phase 2: Loading Zephyr test cases from file...")
        test_cases, executions = load_zephyr(zephyr_file)

        test_id_map = {}
        link_pairs = []
        for tc in test_cases:
            test_db_id = await upsert_test(pool, tc, app_id)
            test_id_map[tc.test_key] = test_db_id
            for jira_key in tc.linked_jira_keys:
                link_pairs.append((jira_key, tc.test_key))
        logger.info(f"Upserted {len(test_id_map)} tests")

        # ── Phase 3: Traceability links ──
        logger.info("Phase 3: Syncing requirement-test links...")
        link_count = 0
        for jira_key, test_key in link_pairs:
            req_id = req_id_map.get(jira_key)
            test_id = test_id_map.get(test_key)
            if req_id and test_id:
                await upsert_requirement_test_link(pool, req_id, test_id, "linked")
                link_count += 1
            else:
                logger.debug(f"Skipping link {jira_key}<->{test_key}: missing IDs")
        logger.info(f"Synced {link_count} requirement-test links")

        # ── Phase 4: Test executions → history ──
        logger.info("Phase 4: Loading test executions...")
        exec_count = 0
        for ex in executions:
            test_db_id = test_id_map.get(ex.test_key)
            if test_db_id:
                await insert_test_result(pool, test_db_id, ex)
                exec_count += 1
            else:
                logger.debug(f"Skipping execution for unknown test {ex.test_key}")
        logger.info(f"Inserted {exec_count} test execution results")

        # ── Phase 5: Recalculate test stats ──
        logger.info("Phase 5: Updating test stats...")
        for test_key, test_db_id in test_id_map.items():
            await update_test_stats(pool, test_db_id)
        logger.info("Test stats updated")

    finally:
        await pool.close()

    logger.info("Sync complete!")


async def sync_from_api(since: str = None):
    """Sync from live Jira + Zephyr Scale APIs.

    Args:
        since: Only sync changes from last N days, e.g. "7d", "1d", "30d".
               If None, does a full sync.
    """
    from jira_client import JiraClient
    from zephyr_client import ZephyrClient

    if not JIRA_EMAIL or not JIRA_API_TOKEN:
        logger.error("JIRA_EMAIL and JIRA_API_TOKEN must be set in .env")
        sys.exit(1)

    # Build JQL with --since filter
    jql_filter = None
    if since:
        days = _parse_since(since)
        jql_filter = f'project = "{JIRA_PROJECT}" AND updated >= -{days}d ORDER BY updated DESC'
        logger.info(f"Delta sync: only changes from last {days} day(s)")
    else:
        logger.info("Full sync: pulling all issues")

    pool = await create_pool()
    logger.info("Connected to PostgreSQL")

    try:
        async with aiohttp.ClientSession() as session:
            # ── Phase 1: Jira issues → requirements ──
            logger.info("Phase 1: Fetching Jira issues from API...")
            jira = JiraClient(session)
            try:
                issues = await jira.fetch_issues(jql=jql_filter)
                logger.info(f"Fetched {len(issues)} Jira issues")
            except Exception as e:
                logger.error(f"Jira fetch failed: {e}")
                issues = []

            req_id_map = {}
            for issue in issues:
                req = jira.parse_issue(issue)
                app_id = await resolve_app_id(pool, req.app_key, req.app_key)
                req_db_id = await upsert_requirement(pool, req, app_id)
                req_id_map[req.jira_key] = req_db_id
            logger.info(f"Upserted {len(req_id_map)} requirements")

            # ── Phase 2–4: Zephyr (if token available) ──
            if ZEPHYR_API_TOKEN:
                logger.info("Phase 2: Fetching Zephyr Scale test cases from API...")
                zephyr = ZephyrClient(session)
                try:
                    test_cases_raw = await zephyr.fetch_test_cases()
                    logger.info(f"Fetched {len(test_cases_raw)} test cases")
                except Exception as e:
                    logger.error(f"Zephyr test cases fetch failed: {e}")
                    test_cases_raw = []

                test_id_map = {}
                link_pairs = []
                for tc_raw in test_cases_raw:
                    tc_key = tc_raw.get("key", "")
                    linked_keys = await zephyr.fetch_test_case_links(tc_key)
                    tc = zephyr.parse_test_case(tc_raw, linked_keys)
                    app_id = await resolve_app_id(pool, tc.app_key, tc.app_key)
                    test_db_id = await upsert_test(pool, tc, app_id)
                    test_id_map[tc.test_key] = test_db_id
                    for jira_key in tc.linked_jira_keys:
                        link_pairs.append((jira_key, tc.test_key))
                logger.info(f"Upserted {len(test_id_map)} tests")

                # Phase 3: Links
                logger.info("Phase 3: Syncing requirement-test links...")
                link_count = 0
                for jira_key, test_key in link_pairs:
                    req_id = req_id_map.get(jira_key)
                    test_id = test_id_map.get(test_key)
                    if req_id and test_id:
                        await upsert_requirement_test_link(pool, req_id, test_id, "linked")
                        link_count += 1
                logger.info(f"Synced {link_count} requirement-test links")

                # Phase 4: Executions
                logger.info("Phase 4: Fetching test executions from API...")
                try:
                    executions_raw = await zephyr.fetch_test_executions()
                    logger.info(f"Fetched {len(executions_raw)} test executions")
                except Exception as e:
                    logger.error(f"Zephyr executions fetch failed: {e}")
                    executions_raw = []

                exec_count = 0
                for ex_raw in executions_raw:
                    ex = zephyr.parse_test_execution(ex_raw)
                    test_db_id = test_id_map.get(ex.test_key)
                    if test_db_id:
                        await insert_test_result(pool, test_db_id, ex)
                        exec_count += 1
                logger.info(f"Inserted {exec_count} test execution results")

                # Phase 5: Stats
                logger.info("Phase 5: Updating test stats...")
                for test_db_id in test_id_map.values():
                    await update_test_stats(pool, test_db_id)
                logger.info("Test stats updated")
            else:
                logger.warning("ZEPHYR_API_TOKEN not set — skipping Zephyr sync")

    finally:
        await pool.close()

    logger.info("Sync complete!")


def _parse_since(since_str: str) -> int:
    """Parse a --since value like '7d', '1d', '30d' into number of days."""
    since_str = since_str.strip().lower()
    if since_str.endswith("d"):
        try:
            return int(since_str[:-1])
        except ValueError:
            pass
    # Try plain number
    try:
        return int(since_str)
    except ValueError:
        logger.error(f"Invalid --since value: '{since_str}'. Use format like '7d' or '30d'")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Sync Jira + Zephyr → Knowledge Graph")
    parser.add_argument(
        "--from-file", action="store_true",
        help="Load from JSON files instead of live APIs",
    )
    parser.add_argument(
        "--since",
        help="Only sync changes from last N days (e.g. 7d, 1d, 30d)",
    )
    parser.add_argument(
        "--jira-file", default=str(DATA_DIR / "sample_jira_export.json"),
        help="Path to Jira JSON export file",
    )
    parser.add_argument(
        "--zephyr-file", default=str(DATA_DIR / "sample_zephyr_export.json"),
        help="Path to Zephyr JSON export file",
    )
    args = parser.parse_args()

    if args.from_file:
        asyncio.run(sync_from_files(args.jira_file, args.zephyr_file))
    else:
        asyncio.run(sync_from_api(since=args.since))


if __name__ == "__main__":
    main()
