import { useState } from 'react';
import type { AmortizationRow } from '../types/mortgage';
import { formatCurrency } from '../utils/mortgage';

interface Props {
  schedule: AmortizationRow[];
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.82rem',
};

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  textAlign: 'left',
  borderBottom: '2px solid #dadce0',
  color: '#5f6368',
  fontWeight: 600,
  fontSize: '0.78rem',
  position: 'sticky',
  top: 0,
  background: '#fff',
};

const tdStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderBottom: '1px solid #f1f3f4',
  color: '#202124',
};

const toggleStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '12px',
};

const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 14px',
  border: `1px solid ${active ? '#1a73e8' : '#dadce0'}`,
  borderRadius: '16px',
  background: active ? '#e8f0fe' : 'transparent',
  color: active ? '#1a73e8' : '#5f6368',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontWeight: 500,
});

type ViewMode = 'monthly' | 'yearly';

export default function AmortizationTable({ schedule }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('yearly');
  const [showAll, setShowAll] = useState(false);

  if (schedule.length === 0) return null;

  const yearlyData = [];
  for (let i = 11; i < schedule.length; i += 12) {
    const yearStart = i - 11;
    let yearPrincipal = 0;
    let yearInterest = 0;
    for (let j = yearStart; j <= i; j++) {
      yearPrincipal += schedule[j].principal;
      yearInterest += schedule[j].interest;
    }
    yearlyData.push({
      year: Math.floor(i / 12) + 1,
      principal: yearPrincipal,
      interest: yearInterest,
      payment: yearPrincipal + yearInterest,
      remainingBalance: schedule[i].remainingBalance,
    });
  }

  const monthlyDisplay = showAll ? schedule : schedule.slice(0, 24);

  return (
    <div>
      <div style={toggleStyle}>
        <button
          style={toggleBtnStyle(viewMode === 'yearly')}
          onClick={() => setViewMode('yearly')}
        >
          Yearly
        </button>
        <button
          style={toggleBtnStyle(viewMode === 'monthly')}
          onClick={() => setViewMode('monthly')}
        >
          Monthly
        </button>
      </div>

      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            {viewMode === 'yearly' ? (
              <tr>
                <th style={thStyle}>Year</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Principal</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Interest</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Balance</th>
              </tr>
            ) : (
              <tr>
                <th style={thStyle}>Month</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Payment</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Principal</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Interest</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Balance</th>
              </tr>
            )}
          </thead>
          <tbody>
            {viewMode === 'yearly'
              ? yearlyData.map((row) => (
                  <tr key={row.year}>
                    <td style={tdStyle}>{row.year}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(row.principal)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(row.interest)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(row.remainingBalance)}</td>
                  </tr>
                ))
              : monthlyDisplay.map((row) => (
                  <tr key={row.month}>
                    <td style={tdStyle}>{row.month}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(row.payment)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(row.principal)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(row.interest)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(row.remainingBalance)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {viewMode === 'monthly' && !showAll && schedule.length > 24 && (
        <button
          onClick={() => setShowAll(true)}
          style={{
            marginTop: 8,
            padding: '6px 16px',
            border: '1px solid #dadce0',
            borderRadius: '6px',
            background: 'none',
            color: '#1a73e8',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          Show all {schedule.length} months
        </button>
      )}
    </div>
  );
}
