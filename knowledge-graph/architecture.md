# QA Knowledge Graph — Architecture Diagrams

## 1. Entity-Relationship Diagram (Knowledge Graph Schema)

```mermaid
erDiagram
    APPLICATIONS ||--o{ ENDPOINTS : has
    APPLICATIONS ||--o{ TESTS : has
    APPLICATIONS ||--o{ REQUIREMENTS : has

    REQUIREMENTS ||--o{ REQUIREMENT_COVERED_BY_TEST : covered_by
    TESTS ||--o{ REQUIREMENT_COVERED_BY_TEST : covers

    TESTS ||--o{ TEST_HITS_ENDPOINT : hits
    ENDPOINTS ||--o{ TEST_HITS_ENDPOINT : hit_by

    ENDPOINTS ||--o{ ENDPOINT_DEPENDS_ON_ENDPOINT : depends_on
    ENDPOINTS ||--o{ ENDPOINT_DEPENDS_ON_ENDPOINT : depended_by

    TESTS ||--o{ TEST_RESULTS_HISTORY : has_runs

    APPLICATIONS {
        int id PK
        string app_key
        string name
        string team_owner
    }
    REQUIREMENTS {
        int id PK
        string jira_key
        string summary
        string priority
        string status
    }
    TESTS {
        int id PK
        string test_key
        string name
        string file_path
        string last_result
        int flaky_count
    }
    ENDPOINTS {
        int id PK
        string method
        string path
        string description
    }
    TEST_RESULTS_HISTORY {
        int id PK
        string result
        int duration_ms
        string error_message
    }
```

## 2. Data Flow Diagram

```mermaid
flowchart TD
    subgraph Sources["Data Sources (Future)"]
        JIRA[Jira API]
        ZEPHYR[Zephyr API]
        CI[CI/CD Pipeline]
    end

    subgraph Sync["Sync Layer (To Build)"]
        SCRIPT[Sync Script]
    end

    subgraph Storage["PostgreSQL + pgvector"]
        APPS[(applications)]
        REQ[(requirements)]
        TESTS[(tests)]
        EP[(endpoints)]
        EDGES[(relationship tables)]
        HISTORY[(test_results_history)]
    end

    subgraph API["FastAPI :8000"]
        COV[/qa/coverage-gaps/]
        IMP[/qa/impact/jira_key/]
        DEP[/qa/dependencies/app_key/]
        FLAKY[/qa/flaky-tests/]
        SUM[/qa/app-summary/]
        SEARCH[/qa/search?q=/]
    end

    subgraph Consumer["Consumers"]
        CURSOR[Cursor Agent]
        SWAGGER[Swagger UI]
        CURL[curl / scripts]
    end

    JIRA -->|requirements, tickets| SCRIPT
    ZEPHYR -->|test cases, results| SCRIPT
    CI -->|test runs, flaky data| SCRIPT

    SCRIPT -->|INSERT/UPDATE| APPS
    SCRIPT -->|INSERT/UPDATE| REQ
    SCRIPT -->|INSERT/UPDATE| TESTS
    SCRIPT -->|INSERT/UPDATE| EP
    SCRIPT -->|INSERT/UPDATE| EDGES
    SCRIPT -->|INSERT/UPDATE| HISTORY

    APPS --- REQ
    APPS --- TESTS
    APPS --- EP
    REQ --- EDGES
    TESTS --- EDGES
    EP --- EDGES
    TESTS --- HISTORY

    REQ -->|SQL joins| COV
    REQ -->|SQL joins| IMP
    EP -->|SQL joins| DEP
    TESTS -->|SQL joins| FLAKY
    APPS -->|SQL joins| SUM
    REQ -->|ILIKE| SEARCH

    COV -->|JSON| CURSOR
    IMP -->|JSON| CURSOR
    DEP -->|JSON| CURSOR
    FLAKY -->|JSON| CURSOR
    SUM -->|JSON| SWAGGER
    SEARCH -->|JSON| CURL
```

## 3. Graph Traversal — How Queries Walk the Graph

```mermaid
flowchart LR
    subgraph "coverage-gaps"
        R1[Requirement] -.->|LEFT JOIN| T1[Test]
        T1 -->|NULL = gap| GAP[No Coverage]
    end
```

```mermaid
flowchart LR
    subgraph "impact/{jira_key}"
        R2[Requirement<br>QA-101] -->|covered_by| T2[Tests]
        T2 -->|hits| E2[Endpoints]
    end
```

```mermaid
flowchart LR
    subgraph "dependencies/{app_key}"
        E3[App Endpoints] -->|depends_on| E4[External Endpoints]
        E5[External Endpoints] -->|depends_on| E6[App Endpoints]
    end
```

## 4. Current vs Future State

```mermaid
flowchart LR
    subgraph NOW["✅ Built Now"]
        SEED[seed.sql<br>dummy data] --> PG[(PostgreSQL)]
        PG --> FAPI[FastAPI]
        FAPI --> AGENT[Cursor Agent<br>via .cursor/rules]
    end

    subgraph FUTURE["🔲 Next Step"]
        JIRA2[Jira API] --> SYNC[Sync Script]
        ZEPH2[Zephyr API] --> SYNC
        SYNC -->|replaces seed.sql| PG2[(PostgreSQL)]
    end
```
