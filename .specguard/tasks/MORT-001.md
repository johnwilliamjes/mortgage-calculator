# Task: MORT-001 — Build Mortgage Calculator Application

## Meta
- **Created:** 2026-02-14
- **Task ID:** MORT-001
- **Status:** In Progress
- **Current Step:** 5 — Unit Validation

---

## Step 1 — Requirement Clarification [✅ COMPLETE]
**Role:** Business Analyst

**Problem Statement:**
Users need a web-based mortgage calculator that provides accurate monthly payment breakdowns, amortization schedules, and loan comparison capabilities. No such tool exists in the current application.

**Business Rules:**
1. Calculate monthly PITI (Principal, Interest, Tax, Insurance) payments using standard amortization formulas
2. Support Fixed Rate, Adjustable Rate (ARM), and FHA loan types
3. Include PMI calculation when down payment is less than 20%
4. Generate month-by-month amortization schedules
5. Allow side-by-side comparison of up to 3 loan scenarios
6. Display payment breakdown via interactive charts
7. Responsive design for mobile and desktop

**Acceptance Criteria:**
- [x] User can input: home price, down payment, interest rate, loan term (15/20/30yr), loan type, property tax rate, insurance rate
- [x] Monthly payment displays PITI breakdown with PMI when applicable
- [x] Amortization table shows monthly and yearly views
- [x] Chart displays principal vs interest over loan life
- [x] Comparison tool shows differences between scenarios
- [x] Works on mobile (responsive layout at 480px, 800px breakpoints)

**Out of Scope:**
- User accounts/authentication
- Saving calculations to a database
- Real-time interest rate feeds
- Pre-approval workflows

**Open Questions:**
None — all requirements are clear.

**Completed:** 2026-02-14

---

## Step 2 — Impact Analysis [✅ COMPLETE]
**Role:** System Analyst

**Impacted Files:**
| File | Reason |
|------|--------|
| `src/types/mortgage.ts` | New type definitions for MortgageInput, MonthlyBreakdown, AmortizationRow, MortgageResult |
| `src/utils/mortgage.ts` | Core calculation engine: monthly PI, property tax, insurance, PMI, amortization schedule |
| `src/components/MortgageForm.tsx` | Input form component with loan parameters |
| `src/components/PaymentSummary.tsx` | Monthly PITI breakdown display |
| `src/components/AmortizationTable.tsx` | Monthly/yearly amortization schedule table |
| `src/components/PaymentChart.tsx` | Recharts area chart for payment visualization |
| `src/components/LoanComparison.tsx` | Side-by-side loan comparison tool |
| `src/components/Header.tsx` | Application header |
| `src/App.tsx` | Main app shell with tab navigation |
| `src/App.css` | Layout and component styles |
| `src/index.css` | Global styles and CSS variables |
| `src/main.tsx` | React DOM entry point |
| `index.html` | HTML entry point |
| `package.json` | Dependencies: React, Recharts, Vite, Vitest, Playwright |
| `tsconfig.json` | TypeScript configuration |
| `vite.config.ts` | Vite build configuration |
| `vitest.config.ts` | Vitest test configuration |

**Impacted Business Logic:**
- All new — mortgage calculation engine with: monthly PI formula, property tax/insurance/PMI calculations, amortization schedule generation, currency formatting

**Impacted Tests:**
- No existing tests (greenfield project)

**Missing Test Coverage:**
- Unit tests needed for all calculation functions in `src/utils/mortgage.ts`
- E2E tests needed for form submission and result display

**Regression Risk Areas:**
- None (greenfield application)

**Dependencies:**
- React 18, Recharts (chart library), Vite (bundler), Vitest (test runner), Playwright (E2E)

**Completed:** 2026-02-14

---

## Step 3 — Design Update [✅ COMPLETE]
**Role:** System Analyst / Architect

**Current Behavior:**
No application exists — this is a greenfield build.

**Proposed Behavior:**
Single-page React application with:
1. Left panel: MortgageForm with all loan inputs
2. Right panel: PaymentSummary (PITI breakdown) + tabbed view (Amortization / Chart / Compare)
3. Responsive: stacks vertically on mobile (< 800px)

**Logic Changes:**
| Function/Method | File | Change |
|----------------|------|--------|
| `calculateMonthlyPI()` | `src/utils/mortgage.ts` | New — standard amortization formula M = P[r(1+r)^n]/[(1+r)^n-1] |
| `calculateMonthlyPropertyTax()` | `src/utils/mortgage.ts` | New — (homePrice * taxRate%) / 12 |
| `calculateMonthlyInsurance()` | `src/utils/mortgage.ts` | New — (homePrice * insuranceRate%) / 12 |
| `calculateMonthlyPMI()` | `src/utils/mortgage.ts` | New — 0.7% annual PMI when LTV > 80% |
| `calculateMonthlyBreakdown()` | `src/utils/mortgage.ts` | New — combines all monthly costs into PITI |
| `generateAmortizationSchedule()` | `src/utils/mortgage.ts` | New — month-by-month schedule with running totals |
| `calculateMortgage()` | `src/utils/mortgage.ts` | New — orchestrates all calculations, returns MortgageResult |
| `formatCurrency()` | `src/utils/mortgage.ts` | New — Intl.NumberFormat USD formatting |

**Edge Cases:**
- [x] Zero principal → return 0 monthly payment, empty schedule
- [x] Zero interest rate → divide principal evenly across months
- [x] Exactly 20% down payment → no PMI
- [x] Very small loan amounts → calculations remain accurate
- [x] Final payment adjusts to zero out remaining balance

**Test Scenarios:**
- [x] Monthly PI calculation for known values (30yr/6.5%, 15yr/6.0%)
- [x] Property tax and insurance monthly calculations
- [x] PMI inclusion/exclusion at 80% LTV boundary
- [x] Amortization schedule length matches term (360 months for 30yr)
- [x] Amortization ends with zero balance
- [x] First payment: interest > principal; last payment: principal > interest
- [x] Total principal paid equals loan amount
- [x] Currency formatting correctness

**Design Decision:**
Chose Vite + React + TypeScript for fast development and type safety. Recharts for charts (lightweight, React-native). All calculations in a pure utility module for easy unit testing. No state management library needed — React useState is sufficient for this scope.

**Completed:** 2026-02-14

---

## Step 4 — Implementation [✅ COMPLETE]
**Role:** Developer

**Code Changes:**
| File | Change Summary |
|------|---------------|
| `src/types/mortgage.ts` | Created type definitions: LoanType, MortgageInput, MonthlyBreakdown, AmortizationRow, MortgageResult |
| `src/utils/mortgage.ts` | Created calculation engine with all 8 functions per design |
| `src/components/Header.tsx` | Created app header with gradient styling and SpecGuard badge |
| `src/components/MortgageForm.tsx` | Created input form with all 7 fields, data-testid attributes for E2E |
| `src/components/PaymentSummary.tsx` | Created PITI breakdown display with color-coded items and totals |
| `src/components/AmortizationTable.tsx` | Created table with monthly/yearly toggle, sticky header, show-all button |
| `src/components/PaymentChart.tsx` | Created Recharts stacked area chart (principal vs interest by year) |
| `src/components/LoanComparison.tsx` | Created comparison tool: add 15yr/20yr/-1% scenarios, difference display |
| `src/App.tsx` | Created main shell: two-column grid, tab navigation, empty state |
| `src/App.css` | Created styles: grid layout, tabs, cards, comparison, responsive breakpoints |
| `src/index.css` | Created global styles: reset, CSS variables, typography |
| `src/main.tsx` | Created React DOM entry point |
| `index.html` | Created HTML shell with viewport meta |
| `package.json` | Created with all dependencies and scripts |
| `tsconfig.json` | Created TypeScript config |
| `vite.config.ts` | Created Vite config with React plugin |
| `vitest.config.ts` | Created Vitest config for unit tests |

**Implementation Notes:**
- All calculation functions are pure (no side effects) for easy testing
- Used inline styles for components to keep the project self-contained
- Amortization table uses sticky header and virtual scrolling via max-height
- Comparison tool limits to 3 additional scenarios to prevent UI clutter
- Responsive breakpoints at 800px (stack to single column) and 480px (tighter padding)

**Deviation Log:**
None — implementation follows design exactly.

**Completed:** 2026-02-14

---

## Step 5 — Unit Validation [⏳ PENDING]
**Role:** QA Engineer / Developer

**New Tests Written:**
| Test | Description |
|------|------------|
| `calculateMonthlyPI - 30yr at 6.5%` | Verifies known value ~$1,770 |
| `calculateMonthlyPI - 15yr at 6.0%` | Verifies known value ~$2,363 |
| `calculateMonthlyPI - zero principal` | Returns 0 |
| `calculateMonthlyPI - zero rate` | Divides evenly across months |
| `calculateMonthlyPI - small loan` | Reasonable range check |
| `calculateMonthlyPropertyTax` | $350k home at 1.2% = $350/mo |
| `calculateMonthlyPropertyTax - zero rate` | Returns 0 |
| `calculateMonthlyInsurance` | $350k home at 0.35% = ~$102/mo |
| `calculateMonthlyPMI - LTV > 80%` | Returns PMI ~$175/mo |
| `calculateMonthlyPMI - LTV <= 80%` | Returns 0 |
| `calculateMonthlyPMI - exactly 20% down` | Returns 0 |
| `calculateMonthlyBreakdown - complete PITI` | All components present |
| `calculateMonthlyBreakdown - includes PMI` | PMI when < 20% down |
| `amortization - 30yr row count` | 360 rows |
| `amortization - 15yr row count` | 180 rows |
| `amortization - ends at zero` | Final balance ≈ 0 |
| `amortization - first payment interest > principal` | Verified |
| `amortization - last payment principal > interest` | Verified |
| `amortization - empty for zero principal` | Empty array |
| `amortization - total principal = loan` | Verified |
| `calculateMortgage - complete result` | All fields populated |
| `formatCurrency - standard` | $1,234.56 |
| `formatCurrency - zero` | $0.00 |
| `formatCurrency - large number` | $1,000,000.00 |

**Updated Tests:**
| Test | What Changed |
|------|-------------|
| N/A | Greenfield — all tests are new |

**Execution Result:**
```
[paste test output here]
```

**Coverage Confirmation:**
<!-- Is all impacted logic covered? -->

**Completed:** —

---

## Step 6 — Functional Validation [⏳ PENDING]
**Role:** QA Functional

**Test Type:** ⏳ Automated E2E / Integration / Manual

**Scenarios Executed:**
| Scenario | Result | Evidence | Test File |
|----------|--------|----------|-----------|
| | ✅/❌ | | |

**Test Execution:**
```
[paste test execution results or manual verification steps]
```

**Regression Confirmation:**
- ✅ N/A — greenfield application

**Evidence:**
- Test output: `[path to test results]`

**Completed:** —

---

## Step 7 — Verification Gate [⏳ PENDING]
**Role:** System (Automated)

| Check | Result | Details |
|-------|--------|---------|
| Unit tests pass | ⏳ | |
| Functional tests pass | ⏳ | |
| No lint errors | ⏳ | |
| No security warnings | ⏳ | |
| Build succeeds | ⏳ | |

**Gate Result:** ⏳ PENDING
**Action if failed:** Mark Step 4 as 🔁 REDO

**Completed:** —

---

## Step 8 — Review & Sign-Off [⏳ PENDING]
**Role:** Reviewer

**Change Summary:**
<!-- One paragraph: what changed and why -->

**Validation Evidence:**
<!-- Link to test results -->

**Risk Assessment:**
<!-- Low / Medium / High — with explanation -->

**Rollback Strategy:**
<!-- How to undo if something goes wrong -->

**Approval:** ⏳ PENDING

**Completed:** —

---

## Audit Trail
| Step | Status | Date | Notes |
|------|--------|------|-------|
| 1 | ✅ | 2026-02-14 | Requirements clarified — mortgage calculator with PITI, amortization, comparison |
| 2 | ✅ | 2026-02-14 | Impact analysis complete — 17 files identified, greenfield project |
| 3 | ✅ | 2026-02-14 | Design complete — 8 utility functions, 6 React components, responsive layout |
| 4 | ✅ | 2026-02-14 | Implementation complete — all components built, TypeScript compiles, build succeeds |
| 5 | ⏳ | | |
| 6 | ⏳ | | |
| 7 | ⏳ | | |
| 8 | ⏳ | | |
