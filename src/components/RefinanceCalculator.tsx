import { useState } from 'react';
import type { RefinanceInput, RefinanceResult } from '../types/mortgage';
import { calculateRefinanceBreakEven, formatCurrency } from '../utils/mortgage';

const sectionStyle: React.CSSProperties = { marginBottom: 20 };
const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 4,
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
};
const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  fontSize: '0.9rem',
  width: '100%',
  maxWidth: 200,
};
const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 0',
  borderBottom: '1px solid var(--border)',
  fontSize: '0.9rem',
};
const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
};

export default function RefinanceCalculator() {
  const [currentBalance, setCurrentBalance] = useState('280000');
  const [currentRate, setCurrentRate] = useState('6.5');
  const [remainingMonths, setRemainingMonths] = useState('360');
  const [currentMonthlyPI, setCurrentMonthlyPI] = useState('1769');
  const [newRate, setNewRate] = useState('5.5');
  const [newTermYears, setNewTermYears] = useState('30');
  const [closingCosts, setClosingCosts] = useState('5000');

  const input: RefinanceInput = {
    currentBalance: parseFloat(currentBalance) || 0,
    currentRate: parseFloat(currentRate) || 0,
    remainingMonths: parseInt(remainingMonths, 10) || 0,
    currentMonthlyPI: parseFloat(currentMonthlyPI) || 0,
    newRate: parseFloat(newRate) || 0,
    newTermYears: parseInt(newTermYears, 10) || 30,
    closingCosts: parseFloat(closingCosts) || 0,
  };

  const result: RefinanceResult | null =
    input.currentBalance > 0 && input.currentMonthlyPI > 0 && input.remainingMonths > 0
      ? calculateRefinanceBreakEven(input)
      : null;

  return (
    <div>
      <h3 style={{ fontSize: '0.95rem', marginBottom: 12, color: 'var(--text)' }}>Current loan</h3>
      <div style={gridStyle}>
        <div style={sectionStyle}>
          <label style={labelStyle}>Balance ($)</label>
          <input
            type="number"
            style={inputStyle}
            value={currentBalance}
            onChange={(e) => setCurrentBalance(e.target.value)}
            min="0"
            step="1000"
          />
        </div>
        <div style={sectionStyle}>
          <label style={labelStyle}>Interest rate (%)</label>
          <input
            type="number"
            style={inputStyle}
            value={currentRate}
            onChange={(e) => setCurrentRate(e.target.value)}
            min="0"
            step="0.125"
          />
        </div>
        <div style={sectionStyle}>
          <label style={labelStyle}>Remaining months</label>
          <input
            type="number"
            style={inputStyle}
            value={remainingMonths}
            onChange={(e) => setRemainingMonths(e.target.value)}
            min="1"
          />
        </div>
        <div style={sectionStyle}>
          <label style={labelStyle}>Current monthly P&I ($)</label>
          <input
            type="number"
            style={inputStyle}
            value={currentMonthlyPI}
            onChange={(e) => setCurrentMonthlyPI(e.target.value)}
            min="0"
            step="10"
          />
        </div>
      </div>

      <h3 style={{ fontSize: '0.95rem', marginBottom: 12, marginTop: 20, color: 'var(--text)' }}>Refinance offer</h3>
      <div style={gridStyle}>
        <div style={sectionStyle}>
          <label style={labelStyle}>New rate (%)</label>
          <input
            type="number"
            style={inputStyle}
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            min="0"
            step="0.125"
          />
        </div>
        <div style={sectionStyle}>
          <label style={labelStyle}>New term (years)</label>
          <input
            type="number"
            style={inputStyle}
            value={newTermYears}
            onChange={(e) => setNewTermYears(e.target.value)}
            min="1"
            max="30"
          />
        </div>
        <div style={sectionStyle}>
          <label style={labelStyle}>Closing costs ($)</label>
          <input
            type="number"
            style={inputStyle}
            value={closingCosts}
            onChange={(e) => setClosingCosts(e.target.value)}
            min="0"
            step="500"
          />
        </div>
      </div>

      {result && (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '2px solid var(--border)' }}>
          <div style={rowStyle}>
            <span style={labelStyle}>New monthly P&I</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(result.newMonthlyPI)}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Monthly savings</span>
            <span style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(result.monthlySavings)}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Break-even (months)</span>
            <span style={{ fontWeight: 600 }}>{result.breakEvenMonths}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Interest saved (life of new loan)</span>
            <span style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(result.interestSaved)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
