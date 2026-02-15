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
