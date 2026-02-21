import { useState, useMemo } from 'react';
import type { MortgageInput, MortgageResult } from '../types/mortgage';
import {
  generateAmortizationScheduleWithExtras,
  formatCurrency,
} from '../utils/mortgage';

interface Props {
  input: MortgageInput;
  result: MortgageResult;
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
  borderBottom: '1px solid var(--border)',
};
const labelStyle: React.CSSProperties = { color: 'var(--text-secondary)', fontSize: '0.9rem' };
const valueStyle: React.CSSProperties = { fontWeight: 600, color: 'var(--text)' };
const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  fontSize: '0.9rem',
  width: '100%',
};

export default function PayoffSimulator({ input }: Props) {
  const [oneTimeAmount, setOneTimeAmount] = useState('');
  const [oneTimeMonth, setOneTimeMonth] = useState('');
  const [recurringExtra, setRecurringExtra] = useState('');

  const loanAmount = input.homePrice - input.downPayment;
  const extras = useMemo(
    () => ({
      oneTimeAmount: parseFloat(oneTimeAmount) || 0,
      oneTimeMonth: parseInt(oneTimeMonth, 10) || 0,
      recurringExtra: parseFloat(recurringExtra) || 0,
    }),
    [oneTimeAmount, oneTimeMonth, recurringExtra]
  );

  const payoffResult = useMemo(() => {
    if (loanAmount <= 0) return null;
    return generateAmortizationScheduleWithExtras(
      loanAmount,
      input.interestRate,
      input.loanTermYears,
      input.homePrice,
      extras
    );
  }, [loanAmount, input.interestRate, input.loanTermYears, input.homePrice, extras]);

  const hasExtras = extras.oneTimeAmount > 0 || extras.recurringExtra > 0;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          One-time extra payment ($)
        </label>
        <input
          type="number"
          style={inputStyle}
          value={oneTimeAmount}
          onChange={(e) => setOneTimeAmount(e.target.value)}
          min="0"
          step="100"
          placeholder="0"
        />
        <label style={{ display: 'block', marginTop: 6, marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          In month #
        </label>
        <input
          type="number"
          style={inputStyle}
          value={oneTimeMonth}
          onChange={(e) => setOneTimeMonth(e.target.value)}
          min="1"
          max={input.loanTermYears * 12}
          placeholder="e.g. 12"
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Recurring extra principal per month ($)
        </label>
        <input
          type="number"
          style={inputStyle}
          value={recurringExtra}
          onChange={(e) => setRecurringExtra(e.target.value)}
          min="0"
          step="50"
          placeholder="0"
        />
      </div>

      {payoffResult && hasExtras && (
        <div style={{ marginTop: 16, padding: '12px 0', borderTop: '2px solid var(--border)' }}>
          <div style={rowStyle}>
            <span style={labelStyle}>Payoff month</span>
            <span style={valueStyle}>{payoffResult.payoffMonth}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Months saved</span>
            <span style={{ ...valueStyle, color: 'var(--success)' }}>{payoffResult.monthsSaved}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Interest saved</span>
            <span style={{ ...valueStyle, color: 'var(--success)' }}>{formatCurrency(payoffResult.interestSaved)}</span>
          </div>
          {payoffResult.pmiDroppedMonth != null && (
            <div style={rowStyle}>
              <span style={labelStyle}>PMI drops (month)</span>
              <span style={valueStyle}>{payoffResult.pmiDroppedMonth}</span>
            </div>
          )}
        </div>
      )}

      {!hasExtras && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 12 }}>
          Enter a one-time and/or recurring extra payment to see payoff impact.
        </p>
      )}
    </div>
  );
}
