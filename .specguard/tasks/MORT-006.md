# Task: MORT-006 — Add Clear Button to Loan Form

## Meta
- **Created:** 2026-02-22
- **Task ID:** MORT-006
- **Status:** In Progress
- **Current Step:** 4 — Implementation

---

## Step 1 — Requirement Clarification [✅ COMPLETE]
**Role:** Business Analyst

**Problem Statement:**
Users have no way to reset the loan form and clear calculated results. After entering values and viewing results, they must manually clear each field or refresh the page to start over.

**Business Rules:**
1. A Clear button is displayed next to the Calculate button in the Loan Details form.
2. Clicking Clear resets all form fields to their default initial values (Home Price 350000, Down Payment 70000, Interest 6.5%, Loan Term 30 years, Loan Type Fixed, Property Tax 1.2%, Insurance 0.35%).
3. Clicking Clear also clears the right-panel results (summary, amortization, chart, compare, payoff, refinance) and returns the panel to the "Enter your loan details" placeholder state.
4. Clear is a secondary action — styled distinctly from the primary Calculate button.

**Acceptance Criteria:**
- [x] Clear button is visible in the Loan Details form next to Calculate.
- [x] Clicking Clear resets all form inputs to default values.
- [x] Clicking Clear clears the results panel and shows the placeholder state.
- [x] Clear button has a distinct secondary styling (e.g., gray vs blue).

**Out of Scope:**
- Confirmation dialog before clearing.
- Clearing individual fields.
- Persisting "last used" values as new defaults.

**Open Questions:** None.

**Completed:** 2026-02-22

---

## Step 2 — Impact Analysis [✅ COMPLETE]
**Role:** System Analyst

**Impacted Files:**
| File | Reason |
|------|--------|
| `src/components/MortgageForm.tsx` | Add Clear button, handleClear handler, onClear callback prop, initialValues constant |
| `src/App.tsx` | Add handleClear, pass onClear to MortgageForm, clear result and input state |

**Impacted Business Logic:**
- Form state management in MortgageForm (useState for all inputs).
- App-level state for `result` and `input` — both set to null on Clear.

**Impacted Tests:**
| Test Area | Coverage |
|-----------|----------|
| Unit tests | No existing MortgageForm unit tests |
| E2E tests | No existing E2E tests for form flow |

**Missing Test Coverage:**
- Clear button visibility and click behavior.
- Form reset assertion (fields return to default values).
- Results panel clears and shows placeholder.

**Regression Risk Areas:**
- Calculate flow must remain unaffected.
- MortgageForm used without onClear (optional prop) must not break.

**Dependencies:** None.

**Completed:** 2026-02-22

---

## Step 3 — Design Update [✅ COMPLETE]
**Role:** System Analyst / Architect

**Current Behavior:**
- MortgageForm (`src/components/MortgageForm.tsx`) holds local state for homePrice, downPayment, interestRate, loanTerm, loanType, propertyTaxRate, insuranceRate. It exposes only `onCalculate`. A single Calculate button submits the form.
- App (`src/App.tsx`) holds `result` and `input` state, passes `onCalculate` to MortgageForm, and conditionally renders results vs placeholder based on `result && input`.

**Proposed Behavior:**
- MortgageForm: Add optional `onClear?: () => void` prop. Introduce `initialValues` constant with default field values. Add `handleClear` that (1) resets all local state to `initialValues`, (2) calls `onClear?.()`. Add a Clear button (type="button") beside Calculate in a flex row; style with gray background (#5f6368).
- App: Add `handleClear` that sets `setResult(null)` and `setInput(null)`. Pass `onClear={handleClear}` to MortgageForm.

**Logic Changes:**
| Function/Method | File | Change |
|----------------|------|--------|
| Props interface | MortgageForm.tsx | Add optional `onClear?: () => void` |
| (new) initialValues | MortgageForm.tsx | Constant with default strings for all fields |
| (new) handleClear | MortgageForm.tsx | Reset all useState; call onClear?.() |
| (new) handleClear | App.tsx | setResult(null); setInput(null) |
| Form buttons | MortgageForm.tsx | Wrap Calculate + Clear in flex div; add Clear button |
| MortgageForm usage | App.tsx | Pass onClear={handleClear} |

**Edge Cases:**
- [x] Clear when no results displayed — no-op for results; form still resets.
- [x] MortgageForm used without onClear — optional chaining prevents errors.
- [x] Rapid double-click on Clear — idempotent; no adverse effect.

**Test Scenarios:**
- Unit: MortgageForm with onClear mock — handleClear resets all fields and calls onClear.
- E2E: Fill form → Calculate → Click Clear → verify form defaults, placeholder visible.
- E2E: Click Clear with no results → form resets, placeholder shown.

**Design Decision:**
- Single source of truth for defaults via `initialValues` avoids duplication and drift.
- Optional `onClear` keeps MortgageForm usable in isolation; App owns results panel so it provides the callback to clear that state.
- Gray secondary button follows common UI convention (primary = blue, secondary = neutral).

**Completed:** 2026-02-22

---

## Step 4 — Implementation [✅ COMPLETE]
**Role:** Developer

**Code Changes:**
| File | Change Summary |
|------|----------------|
| src/components/MortgageForm.tsx | Added onClear prop, initialValues, handleClear, Clear button with data-testid="clear-btn" |
| src/App.tsx | Added handleClear, passed onClear to MortgageForm |

**Implementation Notes:**
- Clear button uses `style={{ ...buttonStyle, flex: 1, background: '#5f6368' }}` for secondary styling.
- Both buttons in flex container with `flex: 1` for equal width.

**Deviation Log:** None. Implementation matches design.

**Completed:** 2026-02-22

---

## Step 5 — Unit Validation [⏳ PENDING]
**Role:** QA Engineer / Developer

**New Tests Written:**
| Test | Description |
|------|-------------|
| | |

**Updated Tests:**
| Test | What Changed |
|------|-------------|
| | |

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
- [ ] [Flow name] — [test reference or manual verification]

**Evidence:**
- Test output: `[path to test results]`
- Screenshots: `[path to screenshots]`
- Test files: `[list of test files]`

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
| 1 | ✅ | 2026-02-22 | Requirement clarification |
| 2 | ✅ | 2026-02-22 | Impact analysis |
| 3 | ✅ | 2026-02-22 | Design update |
| 4 | ✅ | 2026-02-22 | Implementation (retroactive) |
| 5 | ⏳ | | |
| 6 | ⏳ | | |
| 7 | ⏳ | | |
| 8 | ⏳ | | |
