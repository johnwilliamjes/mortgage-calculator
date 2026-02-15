import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyPI,
  calculateMonthlyPropertyTax,
  calculateMonthlyInsurance,
  calculateMonthlyPMI,
  calculateMonthlyBreakdown,
  generateAmortizationSchedule,
  calculateMortgage,
  formatCurrency,
} from '../../src/utils/mortgage';
import type { MortgageInput } from '../../src/types/mortgage';

describe('calculateMonthlyPI', () => {
  it('calculates 30-year fixed at 6.5%', () => {
    const result = calculateMonthlyPI(280000, 6.5, 30);
    // Known value: ~$1,770.09
    expect(result).toBeCloseTo(1770.09, 0);
  });

  it('calculates 15-year fixed at 6.0%', () => {
    const result = calculateMonthlyPI(280000, 6.0, 15);
    // Known value: ~$2,362.71
    expect(result).toBeCloseTo(2362.71, 0);
  });

  it('returns 0 for zero principal', () => {
    expect(calculateMonthlyPI(0, 6.5, 30)).toBe(0);
  });

  it('handles zero interest rate (interest-free loan)', () => {
    const result = calculateMonthlyPI(120000, 0, 10);
    expect(result).toBeCloseTo(1000, 2); // 120000 / 120 months
  });

  it('handles small loan amounts', () => {
    const result = calculateMonthlyPI(10000, 5, 5);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(250);
  });
});

describe('calculateMonthlyPropertyTax', () => {
  it('calculates monthly property tax', () => {
    // $350,000 home, 1.2% tax rate = $4,200/year = $350/month
    expect(calculateMonthlyPropertyTax(350000, 1.2)).toBeCloseTo(350, 2);
  });

  it('returns 0 for zero tax rate', () => {
    expect(calculateMonthlyPropertyTax(350000, 0)).toBe(0);
  });
});

describe('calculateMonthlyInsurance', () => {
  it('calculates monthly insurance', () => {
    // $350,000 home, 0.35% rate = $1,225/year = $102.08/month
    expect(calculateMonthlyInsurance(350000, 0.35)).toBeCloseTo(102.08, 1);
  });
});

describe('calculateMonthlyPMI', () => {
  it('returns PMI when LTV > 80%', () => {
    // $300,000 loan on $350,000 home = 85.7% LTV
    const pmi = calculateMonthlyPMI(300000, 350000);
    expect(pmi).toBeGreaterThan(0);
    // 0.7% of $300,000 / 12 = $175/month
    expect(pmi).toBeCloseTo(175, 0);
  });

  it('returns 0 when LTV <= 80%', () => {
    // $280,000 loan on $350,000 home = 80% LTV
    expect(calculateMonthlyPMI(280000, 350000)).toBe(0);
  });

  it('returns 0 for exactly 20% down', () => {
    // $240,000 loan on $300,000 home = 80% LTV
    expect(calculateMonthlyPMI(240000, 300000)).toBe(0);
  });
});

describe('calculateMonthlyBreakdown', () => {
  const defaultInput: MortgageInput = {
    homePrice: 350000,
    downPayment: 70000,
    loanAmount: 280000,
    interestRate: 6.5,
    loanTermYears: 30,
    loanType: 'fixed',
    propertyTaxRate: 1.2,
    insuranceRate: 0.35,
  };

  it('returns complete PITI breakdown', () => {
    const breakdown = calculateMonthlyBreakdown(defaultInput);
    expect(breakdown.principalAndInterest).toBeGreaterThan(0);
    expect(breakdown.propertyTax).toBeGreaterThan(0);
    expect(breakdown.homeInsurance).toBeGreaterThan(0);
    expect(breakdown.pmi).toBe(0); // 20% down = no PMI
    expect(breakdown.totalMonthly).toBeCloseTo(
      breakdown.principalAndInterest + breakdown.propertyTax + breakdown.homeInsurance + breakdown.pmi,
      1
    );
  });

  it('includes PMI when down payment < 20%', () => {
    const lowDownInput: MortgageInput = {
      ...defaultInput,
      downPayment: 35000, // 10% down
      loanAmount: 315000,
    };
    const breakdown = calculateMonthlyBreakdown(lowDownInput);
    expect(breakdown.pmi).toBeGreaterThan(0);
  });
});

describe('generateAmortizationSchedule', () => {
  it('generates correct number of rows for 30-year loan', () => {
    const schedule = generateAmortizationSchedule(280000, 6.5, 30);
    expect(schedule).toHaveLength(360);
  });

  it('generates correct number of rows for 15-year loan', () => {
    const schedule = generateAmortizationSchedule(280000, 6.0, 15);
    expect(schedule).toHaveLength(180);
  });

  it('ends with zero balance', () => {
    const schedule = generateAmortizationSchedule(280000, 6.5, 30);
    const lastRow = schedule[schedule.length - 1];
    expect(lastRow.remainingBalance).toBeCloseTo(0, 0);
  });

  it('first payment has more interest than principal', () => {
    const schedule = generateAmortizationSchedule(280000, 6.5, 30);
    expect(schedule[0].interest).toBeGreaterThan(schedule[0].principal);
  });

  it('last payment has more principal than interest', () => {
    const schedule = generateAmortizationSchedule(280000, 6.5, 30);
    const lastRow = schedule[schedule.length - 1];
    expect(lastRow.principal).toBeGreaterThan(lastRow.interest);
  });

  it('returns empty for zero principal', () => {
    expect(generateAmortizationSchedule(0, 6.5, 30)).toHaveLength(0);
  });

  it('total principal paid equals loan amount', () => {
    const schedule = generateAmortizationSchedule(280000, 6.5, 30);
    const lastRow = schedule[schedule.length - 1];
    expect(lastRow.totalPrincipalPaid).toBeCloseTo(280000, 0);
  });
});

describe('calculateMortgage', () => {
  it('returns a complete result', () => {
    const input: MortgageInput = {
      homePrice: 350000,
      downPayment: 70000,
      loanAmount: 280000,
      interestRate: 6.5,
      loanTermYears: 30,
      loanType: 'fixed',
      propertyTaxRate: 1.2,
      insuranceRate: 0.35,
    };

    const result = calculateMortgage(input);
    expect(result.loanAmount).toBe(280000);
    expect(result.monthlyBreakdown.totalMonthly).toBeGreaterThan(0);
    expect(result.amortizationSchedule).toHaveLength(360);
    expect(result.totalInterest).toBeGreaterThan(0);
    expect(result.totalPayment).toBeGreaterThan(result.loanAmount);
  });
});

describe('formatCurrency', () => {
  it('formats as USD with 2 decimals', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats large numbers with commas', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000.00');
  });
});
