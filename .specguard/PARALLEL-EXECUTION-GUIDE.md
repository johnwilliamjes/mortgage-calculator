# Parallel Execution Guide — Claude Code

## How to Run Steps 5+6 in Parallel

SpecGuard supports **parallel multi-agent execution** where two agents work simultaneously on Steps 5 (Unit Validation) and 6 (Functional Validation).

---

## Prerequisites

1. **Claude Code CLI installed** — `claude` command available in your terminal
2. **Task at Step 4 complete** — Implementation must be done before parallel steps
3. **Two terminal windows** — One for each agent

---

## Step-by-Step Instructions

### 1. Check if task is ready for parallel execution

```bash
node scripts/specguard-status.cjs
```

### 2. Get the exact commands

```bash
node scripts/specguard-parallel.cjs MORT-001
```

### 3. Open two terminals

**Terminal 1 (QA Unit Agent):**
```bash
cd C:\Users\johnw\TestingAPP
claude "Read .specguard/tasks/MORT-001.md and execute Step 5 ONLY. Update ONLY the '## Step 5 — Unit Validation' section. Do NOT touch Step 6. When done, commit: specguard: MORT-001 step 5 complete — Unit Validation"
```

**Terminal 2 (QA Functional Agent) — run at the SAME TIME:**
```bash
cd C:\Users\johnw\TestingAPP
claude "Read .specguard/tasks/MORT-001.md and execute Step 6 ONLY. Update ONLY the '## Step 6 — Functional Validation' section. Do NOT touch Step 5. When done, commit: specguard: MORT-001 step 6 complete — Functional Validation"
```

### 4. Wait for both to complete

### 5. Verify both steps are complete

```bash
node scripts/specguard-status.cjs
```

### 6. Continue to Step 7

```bash
claude "Continue with MORT-001"
```

---

## Git Merge Behavior

Both agents commit to the same file but different sections — Git merges automatically with zero conflicts.
