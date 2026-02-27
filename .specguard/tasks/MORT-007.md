# Task: MORT-007 — School District Tax

## Meta
- **Created:** 2026-02-22
- **Task ID:** MORT-007
- **Status:** In Progress
- **Current Step:** 5 — Unit Validation

---

## Step 1 — Requirement Clarification [✅ COMPLETE]
**Role:** Business Analyst

**Problem Statement:**
In many US jurisdictions, property taxes are split between general property tax and school district tax. The app only has a single "Property Tax (%)" field. Users in areas with separate school levies cannot accurately model their monthly PITI.

**Business Rules:**
1. Add an optional "School Tax (%)" input to the Loan Details form.
2. School tax is calculated like property tax: (home price × rate / 100) / 12 per month.
3. School tax is added to the monthly breakdown and displayed separately in the payment summary.
4. School tax is included in the total monthly payment and escrow total.
5. Default value: 0% (optional; many areas bundle school tax into property tax).

**Acceptance Criteria:**
- [x] School Tax (%) input visible in Loan Details form.
- [x] At 0%, school tax adds $0; monthly total unchanged from current behavior.
- [x] At non-zero rate, school tax appears in Monthly Payment breakdown.
- [x] School tax is included in total monthly and escrow.
- [x] Clear button resets school tax to 0%.

**Out of Scope:**
- Splitting property tax into general vs school (keep single property tax field).
- District-specific school tax lookup.

**Open Questions:** None.

**Completed:** 2026-02-22

---

## Step 2 — Impact Analysis [✅ COMPLETE]
**Role:** System Analyst

**Impacted Files:**
| File | Reason |
|------|--------|
| `src/types/mortgage.ts` | Add schoolTaxRate to MortgageInput, schoolTax to MonthlyBreakdown |
| `src/utils/mortgage.ts` | Add calculateMonthlySchoolTax, include in calculateMonthlyBreakdown |
| `src/components/MortgageForm.tsx` | Add School Tax (%) input, initial value, handleClear |
| `src/components/PaymentSummary.tsx` | Display school tax row when > 0, include in escrow |

**Impacted Business Logic:**
- MortgageInput, MonthlyBreakdown type extensions.
- calculateMonthlyBreakdown adds school tax to total and breakdown.
- PaymentSummary rendering for new line item.

**Impacted Tests:** None (no existing MortgageForm or calculation unit tests).

**Missing Test Coverage:**
- Unit: school tax calculation at 0 and non-zero rates.
- E2E: form field, summary display.

**Regression Risk Areas:**
- Existing calculations unchanged when schoolTaxRate = 0.
- Optional field; backward compatible.

**Dependencies:** None.

**Completed:** 2026-02-22

---

## Step 3 — Design Update [✅ COMPLETE]
**Role:** System Analyst / Architect

**Current Behavior:**
- MortgageInput has propertyTaxRate, insuranceRate; no school tax.
- MonthlyBreakdown has propertyTax, homeInsurance, pmi, totalMonthly.
- Property tax calculated as (homePrice × propertyTaxRate/100) / 12.

**Proposed Behavior:**
- MortgageInput: Add schoolTaxRate: number (default 0).
- MonthlyBreakdown: Add schoolTax: number.
- New helper: calculateMonthlySchoolTax(homePrice, rate) → (homePrice * rate/100) / 12.
- calculateMonthlyBreakdown: call calculateMonthlySchoolTax, add to totalMonthly, include in returned breakdown.
- MortgageForm: Add School Tax (%) input (default "0"), in row with Property Tax.
- PaymentSummary: Add School Tax row when schoolTax > 0; escrowTotal += schoolTax.
- initialValues: Add schoolTaxRate: '0'.

**Logic Changes:**
| Location | File | Change |
|----------|------|--------|
| MortgageInput | mortgage.ts types | Add schoolTaxRate: number |
| MonthlyBreakdown | mortgage.ts types | Add schoolTax: number |
| calculateMonthlySchoolTax | mortgage.ts utils | New function |
| calculateMonthlyBreakdown | mortgage.ts utils | Add school tax calc, include in total |
| MortgageForm | MortgageForm.tsx | Add schoolTaxRate state, input, initialValues |
| PaymentSummary | PaymentSummary.tsx | Add School Tax row, update escrow |

**Edge Cases:**
- [ ] schoolTaxRate = 0 → schoolTax = 0, no extra row in summary.
- [ ] schoolTaxRate invalid/NaN → treat as 0.
- [ ] Clear resets school tax to 0.

**Test Scenarios:**
- Unit: school tax 0 → no impact on total.
- Unit: school tax 1% on 300k → $250/month.
- E2E: enter school tax, verify summary shows it.

**Design Decision:**
- Optional separate field (default 0) keeps simple for users who don't need it.
- Same calculation pattern as property tax for consistency.
- Display only when > 0 to avoid clutter.

**Completed:** 2026-02-22

---

## Step 4 — Implementation [✅ COMPLETE]
**Role:** Developer

**Code Changes:**
| File | Change Summary |
|------|----------------|
| src/types/mortgage.ts | Added schoolTaxRate to MortgageInput, schoolTax to MonthlyBreakdown |
| src/utils/mortgage.ts | Added calculateMonthlySchoolTax, updated calculateMonthlyBreakdown |
| src/components/MortgageForm.tsx | Added School Tax (%) input, schoolTaxRate state, initialValues |
| src/components/PaymentSummary.tsx | Added School Tax row when > 0, included in escrow total |

**Implementation Notes:**
- Form layout: 3-column grid for Property Tax | School Tax | Insurance.
- School tax uses purple (#9c27b0) in summary for visual distinction.
- Default 0% keeps existing behavior for users who don't need it.

**Deviation Log:** None.

**Completed:** 2026-02-22

---

## Step 5–8 — [⏳ PENDING]

---

## Audit Trail
| Step | Status | Date |
|------|--------|------|
| 1 | ✅ | 2026-02-22 |
| 2 | ✅ | 2026-02-22 |
| 3 | ✅ | 2026-02-22 |
| 4 | ✅ | 2026-02-22 |
| 5 | ⏳ | |
| 6 | ⏳ | |
| 7 | ⏳ | |
| 8 | ⏳ | |
