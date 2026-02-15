# SpecGuard Workflow — Mortgage Calculator Updates

## Overview
This workflow ensures application changes are completed safely, predictably, and with full traceability — regardless of interruptions.

---

## Step 1 — Requirement Clarification

**Role:** Business Analyst
**Gate:** Cannot proceed until all required outputs are filled.

### Objective
Translate a raw change request into clear, testable requirements.

### Required Outputs
- [ ] Problem statement (what is wrong or needs to change)
- [ ] Business rules (how it should work)
- [ ] Acceptance criteria (how we know it's done)
- [ ] Out-of-scope items (what we are NOT changing)
- [ ] Open questions (anything unclear — must be resolved before Step 2)

### Rules
- No design or implementation discussion
- No code exploration
- Focus only on WHAT, not HOW

---

## Step 2 — Impact Analysis

**Role:** System Analyst
**Gate:** Cannot proceed until all impacted areas are documented.

### Objective
Understand how the existing system will be affected.

### Required Outputs
- [ ] Impacted files (list every file that will change)
- [ ] Impacted business logic (what logic paths are affected)
- [ ] Impacted tests (which existing tests cover this area)
- [ ] Missing test coverage (what is NOT tested today)
- [ ] Regression risk areas (what could break)
- [ ] Dependencies (upstream/downstream systems affected)

### Rules
- No code changes allowed
- Read-only exploration
- Must verify findings by reading actual code, not guessing

---

## Step 3 — Design Update

**Role:** System Analyst / Architect
**Gate:** Design must be approved before implementation.

### Objective
Define the minimal, safest design change.

### Required Outputs
- [ ] Current behavior (how it works today — with code references)
- [ ] Proposed behavior (how it should work after the change)
- [ ] Logic changes (specific functions/methods to modify)
- [ ] Edge cases (boundary conditions, error scenarios)
- [ ] Test scenarios (what tests need to be written or updated)

### Rules
- Design must match requirements from Step 1 exactly
- Prefer minimal change over elegant refactoring
- Document WHY this approach was chosen

---

## Step 4 — Implementation

**Role:** Developer
**Gate:** Only files identified in Step 2 may be modified.

### Objective
Apply the change as designed in Step 3.

### Required Outputs
- [ ] Code changes (list of files modified with summary)
- [ ] Implementation notes (any decisions made during coding)
- [ ] Deviation log (anything that differed from the design — must explain why)

### Rules
- Only modify files identified in Step 2
- No unrelated refactoring
- Keep changes minimal
- If design is insufficient, go back to Step 3 — do NOT improvise

---

## Step 5 — Unit Validation

**Role:** QA Engineer / Developer
**Gate:** All unit tests must pass.

### Objective
Protect business logic with unit-level validations.

### Required Outputs
- [ ] New tests written (list with descriptions)
- [ ] Updated tests (list with what changed)
- [ ] Test execution result (pass/fail with details)
- [ ] Coverage confirmation (impacted logic is covered)

### Rules
- No logic change is accepted without validation
- Tests must cover happy path, edge cases, and error scenarios from Step 3
- If tests reveal a bug in implementation, go back to Step 4

---

## Step 6 — Functional Validation

**Role:** QA Functional
**Gate:** All functional scenarios must pass.

### Objective
Ensure the user experience behaves correctly through automated E2E tests (preferred) or manual verification (fallback).

### Required Outputs
- [ ] Test type specified (Automated E2E / Integration / Manual)
- [ ] Test scenarios executed (list from Step 3 + regression)
- [ ] Results per scenario (pass/fail with evidence)
- [ ] Test execution output (if automated: test results, if manual: screenshots/logs)
- [ ] Regression confirmation (existing flows still work)
- [ ] Test file references (if automated: file paths, if manual: step-by-step instructions)

### Testing Strategy
**Standard:** Automated E2E tests with **Playwright** (required for production)
**Fallback:** Manual verification (MVP only)

**See:** `.specguard/FUNCTIONAL-TESTING-STRATEGY.md` for Playwright setup and examples

### Rules
- Must validate both the new behavior AND existing behavior
- Automated tests are preferred; manual verification acceptable for MVP/limitations
- If any automated test fails, go back to Step 4
- Do not proceed with known failures

---

## Step 7 — Verification Gate

**Role:** System (automated)
**Gate:** Binary pass/fail — no partial passes.

### Objective
Final automated check before review.

### Required Checks
- [ ] All unit tests pass
- [ ] All functional tests pass
- [ ] No linting errors introduced
- [ ] No security warnings introduced
- [ ] Code builds successfully

### Rules
- ALL checks must pass — no exceptions
- If any check fails → mark Step 4 as `🔁 REDO`
- This step is automated — no human judgment allowed
- Log all results

---

## Step 8 — Review & Sign-Off

**Role:** Reviewer
**Gate:** Explicit approval required.

### Objective
Confirm readiness for release.

### Required Outputs
- [ ] Change summary (one paragraph: what changed and why)
- [ ] Validation evidence (link to test results)
- [ ] Risk assessment (low/medium/high with explanation)
- [ ] Rollback strategy (how to undo if something goes wrong)
- [ ] Approval status (APPROVED / REJECTED with reason)

### Rules
- Reviewer must verify all previous steps are complete
- If any step is incomplete, reject and document what's missing
- Approval = ready for merge/deploy

---

## State Markers

Use these in task files:
- `⏳ PENDING` — not started
- `🔄 IN PROGRESS` — currently being worked on
- `✅ COMPLETE` — done with all outputs filled
- `🚫 BLOCKED` — cannot proceed (document reason)
- `🔁 REDO` — must be re-executed (triggered by gate failure)

---

## Recovery Rules
1. If a session ends, resume at the last non-complete step
2. If a step is BLOCKED, document why and attempt to resolve
3. No completed step is repeated unless marked REDO
4. No step is ever skipped
