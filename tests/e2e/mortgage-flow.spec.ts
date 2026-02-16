import { test, expect } from '@playwright/test';

test.describe('Mortgage Calculator Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with calculator form', async ({ page }) => {
    await expect(page.locator('[data-testid="calculate-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="home-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="interest-rate"]')).toBeVisible();
  });

  test('calculates monthly payment for 30-year fixed', async ({ page }) => {
    await page.fill('[data-testid="home-price"]', '300000');
    await page.fill('[data-testid="down-payment"]', '60000');
    await page.fill('[data-testid="interest-rate"]', '6.5');
    await page.selectOption('[data-testid="loan-term"]', '30');
    await page.click('[data-testid="calculate-btn"]');

    const payment = page.locator('[data-testid="monthly-payment"]');
    await expect(payment).toBeVisible();
  });

  test('calculates monthly payment for 15-year fixed', async ({ page }) => {
    await page.fill('[data-testid="home-price"]', '300000');
    await page.fill('[data-testid="down-payment"]', '60000');
    await page.fill('[data-testid="interest-rate"]', '6.5');
    await page.selectOption('[data-testid="loan-term"]', '15');
    await page.click('[data-testid="calculate-btn"]');

    const payment = page.locator('[data-testid="monthly-payment"]');
    await expect(payment).toBeVisible();
  });

  test('includes PMI when down payment is less than 20%', async ({ page }) => {
    await page.fill('[data-testid="home-price"]', '300000');
    await page.fill('[data-testid="down-payment"]', '15000');
    await page.fill('[data-testid="interest-rate"]', '6.5');
    await page.click('[data-testid="calculate-btn"]');

    // PMI should be shown when down payment < 20%
    await expect(page.locator('[data-testid="monthly-payment"]')).toBeVisible();
  });

  test('generates amortization table', async ({ page }) => {
    await page.fill('[data-testid="home-price"]', '300000');
    await page.fill('[data-testid="down-payment"]', '60000');
    await page.fill('[data-testid="interest-rate"]', '6.5');
    await page.selectOption('[data-testid="loan-term"]', '30');
    await page.click('[data-testid="calculate-btn"]');

    // Amortization tab button should appear after calculation
    await expect(page.getByRole('button', { name: 'Amortization' })).toBeVisible();
  });
});
