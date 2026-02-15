# QA Knowledge Graph

PostgreSQL + pgvector knowledge graph for QA automation. Maps Jira requirements to Playwright tests to application endpoints.

## Quick Start

**Prerequisite:** Docker Desktop must be running.

```bash
cd knowledge-graph
docker compose up -d
```

Wait ~10 seconds for Postgres to initialize, then open:
- **Swagger UI:** http://localhost:8000/docs
- **Health check:** http://localhost:8000/health

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Database connectivity check |
| `GET /qa/coverage-gaps` | Requirements with no test coverage |
| `GET /qa/impact/{jira_key}` | Tests to run for a Jira ticket |
| `GET /qa/dependencies/{app_key}` | Cross-app dependency map |
| `GET /qa/flaky-tests` | Flaky test analysis with history |
| `GET /qa/app-summary` | All apps with counts |
| `GET /qa/search?q=login` | Text search across requirements and tests |

## Sample Queries

```bash
# What requirements have no tests?
curl http://localhost:8000/qa/coverage-gaps

# What tests cover QA-101?
curl http://localhost:8000/qa/impact/QA-101

# What depends on the orders app?
curl http://localhost:8000/qa/dependencies/app-orders

# Which tests are flaky?
curl http://localhost:8000/qa/flaky-tests

# Search for login-related items
curl "http://localhost:8000/qa/search?q=login"
```

## Direct Database Access

```bash
psql postgresql://kguser:kgpass@localhost:5433/knowledgegraph
```

## Stop

```bash
docker compose down        # stop containers
docker compose down -v     # stop + delete data
```
