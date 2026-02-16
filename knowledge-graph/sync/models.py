"""Intermediate data models between API responses and DB writes."""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Application:
    app_key: str
    name: str
    description: Optional[str] = None
    team_owner: Optional[str] = None


@dataclass
class Requirement:
    jira_key: str
    summary: str
    description: Optional[str] = None
    priority: str = "Medium"
    status: str = "Open"
    app_key: str = ""


@dataclass
class TestCase:
    test_key: str
    name: str
    test_type: str = "manual"
    status: str = "active"
    app_key: str = ""
    linked_jira_keys: list[str] = field(default_factory=list)


@dataclass
class TestExecution:
    test_key: str
    result: str
    duration_ms: Optional[int] = None
    error_message: Optional[str] = None
    run_at: Optional[str] = None
    build_id: Optional[str] = None
