"""Jira REST API v3 client + JSON file loader."""

import json
import base64
import logging
from pathlib import Path

import aiohttp

from config import JIRA_HOST, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT
from models import Requirement

logger = logging.getLogger(__name__)


class JiraClient:
    """Fetches issues from Jira Cloud REST API v3."""

    def __init__(self, session: aiohttp.ClientSession):
        self.session = session
        self.base_url = JIRA_HOST.rstrip("/")
        auth_str = base64.b64encode(
            f"{JIRA_EMAIL}:{JIRA_API_TOKEN}".encode()
        ).decode()
        self.headers = {
            "Authorization": f"Basic {auth_str}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    async def fetch_issues(self, jql: str = None, max_results: int = 50) -> list[dict]:
        """Fetch all issues with automatic pagination."""
        if jql is None:
            jql = f'project = "{JIRA_PROJECT}" ORDER BY created DESC'

        all_issues = []
        start_at = 0

        while True:
            payload = {
                "jql": jql,
                "maxResults": max_results,
                "startAt": start_at,
                "fields": [
                    "summary", "description", "priority",
                    "status", "project", "issuetype",
                ],
            }
            url = f"{self.base_url}/rest/api/3/search/jql"
            async with self.session.post(url, headers=self.headers, json=payload) as resp:
                if resp.status == 401:
                    logger.error("Jira auth failed — check JIRA_EMAIL and JIRA_API_TOKEN")
                    raise RuntimeError("Jira 401 Unauthorized")
                if resp.status != 200:
                    body = await resp.text()
                    logger.error(f"Jira search failed ({resp.status}): {body}")
                    raise RuntimeError(f"Jira API error {resp.status}")
                data = await resp.json()

            issues = data.get("issues", [])
            all_issues.extend(issues)

            total = data.get("total", 0)
            start_at += len(issues)
            if start_at >= total or not issues:
                break

        return all_issues

    @staticmethod
    def parse_issue(issue: dict) -> Requirement:
        """Map a Jira issue JSON to a Requirement."""
        fields = issue.get("fields", {})
        return Requirement(
            jira_key=issue["key"],
            summary=fields.get("summary", ""),
            description=_extract_text(fields.get("description")),
            priority=fields.get("priority", {}).get("name", "Medium")
                     if fields.get("priority") else "Medium",
            status=fields.get("status", {}).get("name", "Open")
                   if fields.get("status") else "Open",
            app_key=fields.get("project", {}).get("key", JIRA_PROJECT)
                    if fields.get("project") else JIRA_PROJECT,
        )


def load_from_file(file_path: str) -> tuple[dict, list[Requirement]]:
    """Load Jira issues from a JSON export file.

    Returns (project_info, list_of_requirements).
    """
    data = json.loads(Path(file_path).read_text(encoding="utf-8"))
    project = data.get("project", {"key": JIRA_PROJECT, "name": JIRA_PROJECT})

    requirements = []
    for issue in data.get("issues", []):
        requirements.append(JiraClient.parse_issue(issue))

    logger.info(f"Loaded {len(requirements)} issues from {file_path}")
    return project, requirements


def _extract_text(description_field) -> str:
    """Extract plain text from Jira v3 ADF or plain string descriptions."""
    if description_field is None:
        return ""
    if isinstance(description_field, str):
        return description_field
    # ADF (Atlassian Document Format) — walk the tree
    texts = []

    def walk(node):
        if isinstance(node, dict):
            if node.get("type") == "text":
                texts.append(node.get("text", ""))
            for child in node.get("content", []):
                walk(child)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(description_field)
    return " ".join(texts)
