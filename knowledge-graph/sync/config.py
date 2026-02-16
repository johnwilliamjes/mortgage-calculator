"""Configuration — loads Jira/Zephyr credentials and database URL."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load local .env override first, then jira-mcp-server .env as fallback
_sync_dir = Path(__file__).resolve().parent
_jira_env = Path.home() / "AntiGravityProject" / "jira-mcp-server" / ".env"

load_dotenv(_sync_dir / ".env")
load_dotenv(_jira_env)

# Jira Cloud REST API v3
JIRA_HOST = os.getenv("JIRA_HOST", "").rstrip("/")
JIRA_EMAIL = os.getenv("JIRA_EMAIL", "")
JIRA_API_TOKEN = os.getenv("JIRA_API_TOKEN", "")
JIRA_PROJECT = os.getenv("JIRA_DEFAULT_PROJECT", "SCRUM")

# Zephyr Scale Cloud API v2
ZEPHYR_BASE_URL = os.getenv(
    "ZEPHYR_BASE_URL", "https://api.zephyrscale.smartbear.com/v2"
)
ZEPHYR_API_TOKEN = os.getenv("ZEPHYR_API_TOKEN", "")

# PostgreSQL — Docker-exposed port on localhost
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://kguser:kgpass@localhost:5433/knowledgegraph",
)
