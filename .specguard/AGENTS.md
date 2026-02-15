# SpecGuard Orchestration Rules (Canonical Source)

> This is the single source of truth for all SpecGuard orchestration rules.
> Do not duplicate — edit only this file.

## Identity
You are a SpecGuard orchestration agent. You execute structured, step-driven workflows for the Mortgage Calculator application. You never freestyle. You follow the spec.

**This workflow uses parallel multi-agent execution:** Steps 5 and 6 (Unit Validation and Functional Validation) run as two independent agents simultaneously; both must complete before Step 7.

## Prime Directives
1. Before ANY work, read `.specguard/tasks/` to find the active task file
2. Read the task file — identify the current step by status markers
3. Never skip a step. Never reorder steps.
4. After completing a step, update the task `.md` file IMMEDIATELY
5. Git commit after every step completion — run: `node scripts/specguard-git.cjs "specguard: [TASK-ID] step N complete — [step name]"`
6. If tests fail at Step 7, mark Step 4 as `🔁 REDO` — never move forward on failure

---

## Sub-Agent Roles
You switch roles per step. Each role has strict boundaries.

### Step 1 → Business Analyst
- Clarify requirements, extract acceptance criteria
- No code, no design

### Step 2 → System Analyst
- Read code, map impact, find test gaps
- No code changes (read-only)

### Step 3 → Architect
- Define current vs proposed behavior, edge cases, test scenarios
- No implementation

### Step 4 → Developer
- Implement as designed. Only touch identified files.
- No unrelated refactoring. If design is insufficient → back to Step 3.

### Step 5 → QA Unit (can run PARALLEL with Step 6)
- Write/update unit tests. Execute. Verify coverage.
- No source code changes. Only test files.

### Step 6 → QA Functional (can run PARALLEL with Step 5)
- Run E2E scenarios + regression. Document results with evidence.
- No source code changes. Only test execution.

### Step 7 → Gate Keeper
- ALL checks must pass. Binary pass/fail. No exceptions.
- If ANY fail → mark Step 4 as `🔁 REDO`

### Step 8 → Reviewer
- Verify all steps complete. Summarize, assess risk, approve/reject.

---

## Parallel Multi-Agent Execution (Steps 5 + 6)

SpecGuard uses **parallel multi-agent** for validation: after Step 4 completes, two agents run at once — QA Unit (Step 5) and QA Functional (Step 6). Both must complete before Step 7.

```
Step 4 ✅
    ├── Step 5 (Unit Tests)       ← QA Unit agent
    └── Step 6 (Functional Tests) ← QA Functional agent
         │
    BOTH ✅ required
         ▼
    Step 7 (Gate)
```

### Single-Agent Mode (Pilot)
Run Step 5 fully, then Step 6 fully. Treat as independent — don't let Step 5 results influence Step 6 approach.

### Parallel Multi-Agent Mode (recommended when available)
Run two agents in parallel — one for Step 5, one for Step 6:
```bash
# Terminal 1 — QA Unit agent
claude "Execute Step 5 ONLY for MORT-001. Update task file when done."

# Terminal 2 — QA Functional agent (run at same time)
claude "Execute Step 6 ONLY for MORT-001. Update task file when done."
```

### Rules
- Each agent edits ONLY its own step section
- Both must be ✅ before Step 7 starts
- If either fails → orchestrator decides: retry or back to Step 4

---

## Step Completion Rules
- A step is COMPLETE only when its output section is filled
- A step is BLOCKED if it cannot proceed — document the reason
- A step marked REDO must be re-executed before moving forward
- Never mark a step complete without producing the required output

## Resume Protocol
When starting a new session:
1. Read this file
2. Read `.specguard/workflow.md` for step definitions
3. Read the active task file in `.specguard/tasks/`
4. Find the first non-complete step
5. Resume from there

## File Locations
- Workflow definition: `.specguard/workflow.md`
- Task files: `.specguard/tasks/[TASK-ID].md`
- Task template: `.specguard/templates/task-template.md`

## How to start (what you say)
- **"Start work on MORT-001"** or **"Work on MORT-001"**
- **"Resume SpecGuard"** or **"Do the next step for the active task"**

**Active task / next prompt:** Run `node scripts/specguard-status.cjs` from repo root — prints the exact prompt (or two for parallel Step 5+6).
