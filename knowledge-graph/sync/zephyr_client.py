"""Zephyr Scale Cloud API v2 client + JSON file loader."""

import json
import logging
from pathlib import Path

import aiohttp

from config import ZEPHYR_BASE_URL, ZEPHYR_API_TOKEN, JIRA_PROJECT
from models import TestCase, TestExecution

logger = logging.getLogger(__name__)


class ZephyrClient:
    """Fetches test cases and executions from Zephyr Scale Cloud API v2."""

    def __init__(self, session: aiohttp.ClientSession):
        self.session = session
        self.base_url = ZEPHYR_BASE_URL.rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {ZEPHYR_API_TOKEN}",
            "Accept": "application/json",
        }

    async def _paginate(self, url: str, params: dict) -> list[dict]:
        """Generic paginated GET for Zephyr Scale v2 API."""
        all_values = []
        start_at = 0
        max_results = params.get("maxResults", 50)

        while True:
            params["startAt"] = start_at
            params["maxResults"] = max_results
            async with self.session.get(url, headers=self.headers, params=params) as resp:
                if resp.status == 401:
                    logger.error("Zephyr Scale auth failed — check ZEPHYR_API_TOKEN")
                    raise RuntimeError("Zephyr Scale 401 Unauthorized")
                if resp.status != 200:
                    body = await resp.text()
                    logger.error(f"Zephyr API error ({resp.status}): {body}")
                    raise RuntimeError(f"Zephyr API error {resp.status}")
                data = await resp.json()

            values = data.get("values", [])
            all_values.extend(values)

            if data.get("isLast", True) or not values:
                break
            start_at += len(values)

        return all_values

    async def fetch_test_cases(self, project_key: str = None) -> list[dict]:
        """Fetch all test cases for the project."""
        project_key = project_key or JIRA_PROJECT
        url = f"{self.base_url}/testcases"
        return await self._paginate(url, {"projectKey": project_key})

    async def fetch_test_executions(self, project_key: str = None) -> list[dict]:
        """Fetch all test executions for the project."""
        project_key = project_key or JIRA_PROJECT
        url = f"{self.base_url}/testexecutions"
        return await self._paginate(url, {"projectKey": project_key})

    async def fetch_test_case_links(self, test_case_key: str) -> list[str]:
        """Fetch Jira issue keys linked to a test case."""
        url = f"{self.base_url}/testcases/{test_case_key}/links"
        try:
            async with self.session.get(url, headers=self.headers) as resp:
                if resp.status != 200:
                    return []
                data = await resp.json()
            return [
                link.get("key", link.get("issueKey", ""))
                for link in data.get("issueLinks", data.get("values", []))
                if link
            ]
        except Exception as e:
            logger.warning(f"Could not fetch links for {test_case_key}: {e}")
            return []

    @staticmethod
    def parse_test_case(tc: dict, linked_keys: list[str] = None) -> TestCase:
        """Map Zephyr Scale test case JSON to TestCase."""
        status_name = ""
        if isinstance(tc.get("status"), dict):
            status_name = tc["status"].get("name", "")
        return TestCase(
            test_key=tc.get("key", ""),
            name=tc.get("name", "Untitled"),
            test_type=tc.get("test_type", "manual"),
            status="active" if status_name != "Deprecated" else "deprecated",
            app_key=tc.get("project", {}).get("key", JIRA_PROJECT)
                    if isinstance(tc.get("project"), dict) else JIRA_PROJECT,
            linked_jira_keys=linked_keys or [],
        )

    @staticmethod
    def parse_test_execution(ex: dict) -> TestExecution:
        """Map Zephyr Scale test execution JSON to TestExecution."""
        # Handle both API format and file format
        status_raw = ""
        if isinstance(ex.get("testExecutionStatus"), dict):
            status_raw = ex["testExecutionStatus"].get("name", "")
        else:
            status_raw = ex.get("status", "")

        result_map = {
            "pass": "pass", "fail": "fail", "blocked": "blocked",
            "not executed": "not_executed", "in progress": "in_progress",
        }
        result = result_map.get(status_raw.lower(), status_raw.lower())

        test_key = ""
        if isinstance(ex.get("testCase"), dict):
            test_key = ex["testCase"].get("key", "")
        else:
            test_key = ex.get("test_case_key", "")

        return TestExecution(
            test_key=test_key,
            result=result,
            duration_ms=ex.get("executionTime", ex.get("execution_time_ms")),
            error_message=ex.get("comment"),
            run_at=ex.get("executionDate", ex.get("executed_on")),
            build_id=ex.get("environment", {}).get("name", "")
                     if isinstance(ex.get("environment"), dict)
                     else ex.get("environment", ""),
        )


def load_from_file(file_path: str) -> tuple[list[TestCase], list[TestExecution]]:
    """Load Zephyr test cases and executions from a JSON export file."""
    data = json.loads(Path(file_path).read_text(encoding="utf-8"))

    test_cases = []
    for tc in data.get("test_cases", []):
        linked = tc.get("linked_issues", [])
        test_cases.append(ZephyrClient.parse_test_case(tc, linked))

    executions = []
    for ex in data.get("test_executions", []):
        executions.append(ZephyrClient.parse_test_execution(ex))

    logger.info(
        f"Loaded {len(test_cases)} test cases, "
        f"{len(executions)} executions from {file_path}"
    )
    return test_cases, executions
