# Mortgage Calculator — SpecGuard Project

## Overview
React + TypeScript mortgage calculator with PITI breakdown, amortization schedule, loan comparison, and payment charts. Built with Vite.

## SpecGuard Workflow
This project uses **SpecGuard spec-driven development**. Every code change follows an 8-step pipeline:

1. **Requirement Clarification** (Business Analyst)
2. **Impact Analysis** (System Analyst)
3. **Design Update** (Architect)
4. **Implementation** (Developer)
5. **Unit Validation** (QA Unit) — parallel with Step 6
6. **Functional Validation** (QA Functional) — parallel with Step 5
7. **Verification Gate** (Automated)
8. **Review & Sign-Off** (Reviewer)

### Quick Commands
```bash
# Check task status
node scripts/specguard-status.cjs

# Get next prompt
node scripts/specguard-prompt.cjs MORT-001

# Validate task
node scripts/specguard-validate.cjs MORT-001

# Run gate
node scripts/specguard-gate.cjs MORT-001

# Commit step
node scripts/specguard-git.cjs "specguard: MORT-001 step N complete — Step Name"
```

### Starting a New Task
```bash
cp .specguard/templates/task-template.md .specguard/tasks/MORT-XXX.md
# Edit the meta section, then: "Start work on MORT-XXX"
```

## Development
```bash
npm run dev        # Start dev server (port 5173)
npm run build      # Production build
npm test           # Run unit tests (vitest)
npm run test:e2e   # Run E2E tests (playwright)
npm run lint       # TypeScript type check
```

## Project Structure
- `src/utils/mortgage.ts` — Pure calculation functions (the core engine)
- `src/components/` — React UI components
- `src/types/mortgage.ts` — TypeScript interfaces
- `tests/unit/` — Vitest unit tests
- `tests/e2e/` — Playwright E2E tests
- `.specguard/` — SpecGuard workflow infrastructure
- `scripts/` — SpecGuard CLI tools
