"""FastMCP server wrapping the existing FastAPI QA Knowledge Graph API.

Converts every FastAPI route into an MCP tool so Cursor AI (or any
MCP client) can call the same endpoints without code duplication.

Usage (stdio transport for Cursor):
    python mcp_server.py
"""

import os
import sys

# Add api/ directory to Python path so main.py's imports resolve
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))

# Default to local Postgres (port 5433 mapped by docker-compose)
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://kguser:kgpass@localhost:5433/knowledgegraph",
)

from fastmcp import FastMCP  # noqa: E402
from main import app  # noqa: E402  — the FastAPI app

mcp = FastMCP.from_fastapi(app=app)

if __name__ == "__main__":
    mcp.run(transport="stdio")
