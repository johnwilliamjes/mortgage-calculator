# SpecGuard Functional Testing Strategy

## Overview
Step 6 (Functional Validation) requires **automated E2E tests using Playwright** as the standard. Manual verification is fallback only for MVP or non-testable scenarios.

**Default Tool:** **Playwright** — cross-browser, fast, reliable, TypeScript support

---

## Testing Tiers

### Tier 1: Automated E2E Tests with Playwright (Standard)
**When to use:** UI changes, user flows, calculation verification

**Requirements:**
- Tests must be **runnable** (not just documented)
- Tests must be **repeatable** (same result every run)
- Tests must produce **evidence** (screenshots, logs, video)

**Example:**
```typescript
// tests/e2e/mortgage-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Mortgage Calculator Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('calculates monthly payment for 30-year fixed', async ({ page }) => {
    await page.fill('[data-testid="loan-amount"]', '300000');
    await page.fill('[data-testid="interest-rate"]', '6.5');
    await page.selectOption('[data-testid="loan-term"]', '30');
    await page.click('[data-testid="calculate-btn"]');

    const payment = page.locator('[data-testid="monthly-payment"]');
    await expect(payment).toContainText('$1,896');
  });
});
```

---

### Tier 2: Integration Tests
**When to use:** Calculation engine verification, component integration

### Tier 3: Manual Verification (Fallback)
**When to use:** MVP/prototype, complex visual scenarios

---

## Playwright Setup

```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install

# Create test directory structure
mkdir -p tests/e2e

# Run tests
npx playwright test

# Run with browser visible
npx playwright test --headed

# Generate HTML report
npx playwright show-report
```

## Playwright Configuration

See `playwright.config.ts` in project root.

---

## Step 6 Output Template

```markdown
## Step 6 — Functional Validation [✅ COMPLETE]
**Role:** QA Functional

**Test Type:** Automated E2E (Playwright) ✅

**Scenarios Executed:**
| Scenario | Result | Evidence | Test File |
|----------|--------|----------|-----------|
| Basic mortgage calculation | ✅ PASS | test output | `tests/e2e/mortgage-flow.spec.ts` |

**Regression Confirmation:**
- ✅ Existing flows still work

**Evidence:**
- Test output: `playwright-report/index.html`
```
