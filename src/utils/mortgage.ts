import type { MortgageInput, MonthlyBreakdown, AmortizationRow, MortgageResult } from '../types/mortgage';

/**
 * Calculate monthly principal and interest payment.
 * Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculateMonthlyPI(principal: number, annualRate: number, termYears: number): number {
  if (principal <= 0) return 0;
  if (annualRate <= 0) return principal / (termYears * 12);

  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  const factor = Math.pow(1 + monthlyRate, numPayments);

  return principal * (monthlyRate * factor) / (factor - 1);
}

/**
 * Calculate monthly property tax.
 */
export function calculateMonthlyPropertyTax(homePrice: number, taxRate: number): number {
  return (homePrice * (taxRate / 100)) / 12;
}

/**
 * Calculate monthly homeowner's insurance.
 */
export function calculateMonthlyInsurance(homePrice: number, insuranceRate: number): number {
  return (homePrice * (insuranceRate / 100)) / 12;
}

/**
 * Calculate monthly PMI (Private Mortgage Insurance).
 * PMI applies when down payment is less than 20% of home price.
 * Typical PMI rate: 0.5% - 1.5% of loan amount per year.
 */
export function calculateMonthlyPMI(loanAmount: number, homePrice: number): number {
  const ltv = loanAmount / homePrice;
  if (ltv <= 0.80) return 0;

  const pmiRate = 0.007; // 0.7% annual PMI rate
  return (loanAmount * pmiRate) / 12;
}

/**
 * Calculate full monthly breakdown (PITI + PMI).
 */
export function calculateMonthlyBreakdown(input: MortgageInput): MonthlyBreakdown {
  const loanAmount = input.homePrice - input.downPayment;
  const principalAndInterest = calculateMonthlyPI(loanAmount, input.interestRate, input.loanTermYears);
  const propertyTax = calculateMonthlyPropertyTax(input.homePrice, input.propertyTaxRate);
  const homeInsurance = calculateMonthlyInsurance(input.homePrice, input.insuranceRate);
  const pmi = calculateMonthlyPMI(loanAmount, input.homePrice);

  return {
    principalAndInterest: roundToTwo(principalAndInterest),
    propertyTax: roundToTwo(propertyTax),
    homeInsurance: roundToTwo(homeInsurance),
    pmi: roundToTwo(pmi),
    totalMonthly: roundToTwo(principalAndInterest + propertyTax + homeInsurance + pmi),
  };
}

/**
 * Generate full amortization schedule.
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termYears: number
): AmortizationRow[] {
  if (principal <= 0) return [];

  const monthlyPayment = calculateMonthlyPI(principal, annualRate, termYears);
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  const schedule: AmortizationRow[] = [];

  let balance = principal;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;

  for (let month = 1; month <= numPayments; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = Math.min(monthlyPayment - interestPayment, balance);
    balance = Math.max(0, balance - principalPayment);

    totalInterestPaid += interestPayment;
    totalPrincipalPaid += principalPayment;

    schedule.push({
      month,
      payment: roundToTwo(monthlyPayment),
      principal: roundToTwo(principalPayment),
      interest: roundToTwo(interestPayment),
      remainingBalance: roundToTwo(balance),
      totalInterestPaid: roundToTwo(totalInterestPaid),
      totalPrincipalPaid: roundToTwo(totalPrincipalPaid),
    });
  }

  return schedule;
}

/**
 * Calculate full mortgage result including schedule and totals.
 */
export function calculateMortgage(input: MortgageInput): MortgageResult {
  const loanAmount = input.homePrice - input.downPayment;
  const monthlyBreakdown = calculateMonthlyBreakdown(input);
  const amortizationSchedule = generateAmortizationSchedule(
    loanAmount,
    input.interestRate,
    input.loanTermYears
  );

  const totalPayment = monthlyBreakdown.principalAndInterest * input.loanTermYears * 12;
  const totalInterest = totalPayment - loanAmount;

  return {
    monthlyBreakdown,
    amortizationSchedule,
    totalPayment: roundToTwo(totalPayment),
    totalInterest: roundToTwo(totalInterest),
    loanAmount: roundToTwo(loanAmount),
  };
}

/**
 * Format a number as USD currency.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100;
}
