export type LoanType = 'fixed' | 'arm' | 'fha';

export interface MortgageInput {
  loanAmount: number;
  interestRate: number;
  loanTermYears: number;
  loanType: LoanType;
  downPayment: number;
  propertyTaxRate: number;
  insuranceRate: number;
  homePrice: number;
}

export interface MonthlyBreakdown {
  principalAndInterest: number;
  propertyTax: number;
  homeInsurance: number;
  pmi: number;
  totalMonthly: number;
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
}

export interface MortgageResult {
  monthlyBreakdown: MonthlyBreakdown;
  amortizationSchedule: AmortizationRow[];
  totalPayment: number;
  totalInterest: number;
  loanAmount: number;
}

/** Extra payment options for payoff simulator */
export interface ExtraPaymentsInput {
  oneTimeAmount: number;
  oneTimeMonth: number;
  recurringExtra: number;
}

/** Result of amortization with extra payments */
export interface PayoffSimulatorResult {
  schedule: AmortizationRow[];
  payoffMonth: number;
  totalInterestPaid: number;
  interestSaved: number;
  monthsSaved: number;
  pmiDroppedMonth: number | null;
}

/** Inputs for refinance break-even calculator */
export interface RefinanceInput {
  currentBalance: number;
  currentRate: number;
  remainingMonths: number;
  currentMonthlyPI: number;
  newRate: number;
  newTermYears: number;
  closingCosts: number;
}

/** Result of refinance break-even calculation */
export interface RefinanceResult {
  newMonthlyPI: number;
  monthlySavings: number;
  breakEvenMonths: number;
  totalInterestCurrent: number;
  totalInterestNew: number;
  interestSaved: number;
}
