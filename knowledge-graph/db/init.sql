-- Knowledge Graph Schema for QA Automation
-- PostgreSQL 17 + pgvector

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- Core Tables
-- ============================================

CREATE TABLE applications (
    id              SERIAL PRIMARY KEY,
    app_key         VARCHAR(50) UNIQUE NOT NULL,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    team_owner      VARCHAR(100),
    repo_url        VARCHAR(500),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE endpoints (
    id              SERIAL PRIMARY KEY,
    app_id          INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    method          VARCHAR(10) NOT NULL,
    path            VARCHAR(500) NOT NULL,
    description     TEXT,
    auth_required   BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(app_id, method, path)
);

CREATE TABLE requirements (
    id              SERIAL PRIMARY KEY,
    jira_key        VARCHAR(20) UNIQUE NOT NULL,
    summary         TEXT NOT NULL,
    description     TEXT,
    priority        VARCHAR(20) DEFAULT 'Medium',
    status          VARCHAR(30) DEFAULT 'Open',
    app_id          INTEGER REFERENCES applications(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    embedding       vector(1536)
);

CREATE TABLE tests (
    id              SERIAL PRIMARY KEY,
    test_key        VARCHAR(100) UNIQUE NOT NULL,
    name            VARCHAR(300) NOT NULL,
    file_path       VARCHAR(500),
    test_type       VARCHAR(50) DEFAULT 'e2e',
    status          VARCHAR(30) DEFAULT 'active',
    last_result     VARCHAR(20),
    last_run_at     TIMESTAMPTZ,
    flaky_count     INTEGER DEFAULT 0,
    avg_duration_ms INTEGER,
    app_id          INTEGER REFERENCES applications(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    embedding       vector(1536)
);

CREATE TABLE test_results_history (
    id              SERIAL PRIMARY KEY,
    test_id         INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    result          VARCHAR(20) NOT NULL,
    duration_ms     INTEGER,
    error_message   TEXT,
    run_at          TIMESTAMPTZ DEFAULT NOW(),
    build_id        VARCHAR(100)
);

-- ============================================
-- Relationship Tables (Graph Edges)
-- ============================================

CREATE TABLE requirement_covered_by_test (
    id              SERIAL PRIMARY KEY,
    requirement_id  INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    test_id         INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    coverage_type   VARCHAR(30) DEFAULT 'full',
    UNIQUE(requirement_id, test_id)
);

CREATE TABLE test_hits_endpoint (
    id              SERIAL PRIMARY KEY,
    test_id         INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    endpoint_id     INTEGER NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    hit_count       INTEGER DEFAULT 1,
    UNIQUE(test_id, endpoint_id)
);

CREATE TABLE endpoint_depends_on_endpoint (
    id              SERIAL PRIMARY KEY,
    source_endpoint_id  INTEGER NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    target_endpoint_id  INTEGER NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    dependency_type     VARCHAR(30) DEFAULT 'sync',
    UNIQUE(source_endpoint_id, target_endpoint_id)
);

CREATE TABLE requirement_has_design (
    id              SERIAL PRIMARY KEY,
    requirement_id  INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    design_url      VARCHAR(500) NOT NULL,
    design_type     VARCHAR(50) DEFAULT 'figma',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_endpoints_app_id ON endpoints(app_id);
CREATE INDEX idx_requirements_app_id ON requirements(app_id);
CREATE INDEX idx_requirements_status ON requirements(status);
CREATE INDEX idx_tests_app_id ON tests(app_id);
CREATE INDEX idx_tests_flaky ON tests(flaky_count DESC);
CREATE INDEX idx_test_results_test_id ON test_results_history(test_id);
CREATE INDEX idx_test_results_run_at ON test_results_history(run_at DESC);
CREATE INDEX idx_rct_requirement ON requirement_covered_by_test(requirement_id);
CREATE INDEX idx_rct_test ON requirement_covered_by_test(test_id);
CREATE INDEX idx_the_test ON test_hits_endpoint(test_id);
CREATE INDEX idx_the_endpoint ON test_hits_endpoint(endpoint_id);
CREATE INDEX idx_dep_source ON endpoint_depends_on_endpoint(source_endpoint_id);
CREATE INDEX idx_dep_target ON endpoint_depends_on_endpoint(target_endpoint_id);

-- Vector indexes (IVFFlat — activate once embeddings are populated)
-- CREATE INDEX idx_requirements_embedding ON requirements USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
-- CREATE INDEX idx_tests_embedding ON tests USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
