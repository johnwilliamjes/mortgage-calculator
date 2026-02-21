import { useState } from 'react';
import type { AmortizationRow } from '../types/mortgage';
import { formatCurrency, amortizationToCSV } from '../utils/mortgage';

interface Props {
  schedule: AmortizationRow[];
  /** Optional filename stem for CSV export (e.g. "amortization-350000-6.5-30yr") */
  exportFilename?: string;
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.82rem',
};

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  textAlign: 'left',
  borderBottom: '2px solid var(--border)',
  color: 'var(--text-secondary)',
  fontWeight: 600,
  fontSize: '0.78rem',
  position: 'sticky',
  top: 0,
  background: 'var(--card-bg)',
};

const tdStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderBottom: '1px solid var(--border)',
  color: 'var(--text)',
};

const toggleStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '12px',
};

const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 14px',
  border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
  borderRadius: '16px',
  background: active ? 'var(--primary)' : 'transparent',
  color: active ? '#fff' : 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontWeight: 500,
});

type ViewMode = 'monthly' | 'yearly';

function downloadCSV(schedule: AmortizationRow[], filenameStem: string) {
  const csv = amortizationToCSV(schedule);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameStem || 'amortization'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AmortizationTable({ schedule, exportFilename = 'amortization' }: Props) {
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
      <div style={{ ...toggleStyle, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
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
        <button
          type="button"
          onClick={() => downloadCSV(schedule, exportFilename)}
          style={{
            padding: '6px 14px',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            background: 'var(--card-bg)',
            color: 'var(--primary)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 500,
          }}
        >
          Export CSV
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
            border: '1px solid var(--border)',
            borderRadius: '6px',
            background: 'none',
            color: 'var(--primary)',
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
