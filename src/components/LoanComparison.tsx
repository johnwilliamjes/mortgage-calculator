import { useState } from 'react';
import type { MortgageInput, MortgageResult } from '../types/mortgage';
import { calculateMortgage, formatCurrency } from '../utils/mortgage';

interface Props {
  currentInput: MortgageInput;
  currentResult: MortgageResult;
}

interface ComparisonScenario {
  label: string;
  input: MortgageInput;
  result: MortgageResult;
}

export default function LoanComparison({ currentInput, currentResult }: Props) {
  const [scenarios, setScenarios] = useState<ComparisonScenario[]>([]);

  const addScenario = (type: 'term15' | 'term20' | 'lowRate') => {
    let modifiedInput: MortgageInput;
    let label: string;

    switch (type) {
      case 'term15':
        modifiedInput = { ...currentInput, loanTermYears: 15 };
        label = '15-Year Fixed';
        break;
      case 'term20':
        modifiedInput = { ...currentInput, loanTermYears: 20 };
        label = '20-Year Fixed';
        break;
      case 'lowRate':
        modifiedInput = { ...currentInput, interestRate: currentInput.interestRate - 1 };
        label = `${(currentInput.interestRate - 1).toFixed(2)}% Rate`;
        break;
    }

    const result = calculateMortgage(modifiedInput);
    setScenarios((prev) => [...prev, { label, input: modifiedInput, result }]);
  };

  const removeScenario = (index: number) => {
    setScenarios((prev) => prev.filter((_, i) => i !== index));
  };

  const allScenarios: ComparisonScenario[] = [
    {
      label: `Current (${currentInput.loanTermYears}yr @ ${currentInput.interestRate}%)`,
      input: currentInput,
      result: currentResult,
    },
    ...scenarios,
  ];

  return (
    <div>
      <div className="comparison-controls">
        <button onClick={() => addScenario('term15')} disabled={scenarios.length >= 3}>
          + Compare 15yr
        </button>
        <button onClick={() => addScenario('term20')} disabled={scenarios.length >= 3}>
          + Compare 20yr
        </button>
        <button onClick={() => addScenario('lowRate')} disabled={scenarios.length >= 3}>
          + Compare -1% Rate
        </button>
      </div>

      <div className="comparison-grid">
        {allScenarios.map((scenario, index) => (
          <div key={index} className="comparison-card">
            <h3>{scenario.label}</h3>
            <div className="detail-row">
              <span className="detail-label">Monthly P&I</span>
              <span>{formatCurrency(scenario.result.monthlyBreakdown.principalAndInterest)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Total Monthly</span>
              <span style={{ fontWeight: 600 }}>
                {formatCurrency(scenario.result.monthlyBreakdown.totalMonthly)}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Total Interest</span>
              <span style={{ color: '#ea4335' }}>
                {formatCurrency(scenario.result.totalInterest)}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Total Cost</span>
              <span>{formatCurrency(scenario.result.totalPayment)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Loan Amount</span>
              <span>{formatCurrency(scenario.result.loanAmount)}</span>
            </div>
            {index > 0 && (
              <>
                <div className="detail-row" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #dadce0' }}>
                  <span className="detail-label">vs Current (monthly)</span>
                  <span style={{
                    color: scenario.result.monthlyBreakdown.totalMonthly > currentResult.monthlyBreakdown.totalMonthly
                      ? '#ea4335' : '#34a853',
                    fontWeight: 600,
                  }}>
                    {scenario.result.monthlyBreakdown.totalMonthly > currentResult.monthlyBreakdown.totalMonthly ? '+' : ''}
                    {formatCurrency(scenario.result.monthlyBreakdown.totalMonthly - currentResult.monthlyBreakdown.totalMonthly)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">vs Current (interest)</span>
                  <span style={{
                    color: scenario.result.totalInterest > currentResult.totalInterest
                      ? '#ea4335' : '#34a853',
                    fontWeight: 600,
                  }}>
                    {scenario.result.totalInterest > currentResult.totalInterest ? '+' : ''}
                    {formatCurrency(scenario.result.totalInterest - currentResult.totalInterest)}
                  </span>
                </div>
                <button className="remove-btn" onClick={() => removeScenario(index - 1)}>
                  Remove
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
