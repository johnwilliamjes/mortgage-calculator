import type { MortgageResult } from '../types/mortgage';
import { formatCurrency } from '../utils/mortgage';

interface Props {
  result: MortgageResult;
}

const summaryStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const bigNumberStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 700,
  color: '#1a73e8',
  textAlign: 'center',
  padding: '8px 0',
};

const bigLabel: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#5f6368',
  textAlign: 'center',
  marginTop: '-8px',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
  borderBottom: '1px solid #f1f3f4',
};

const dotStyle = (color: string): React.CSSProperties => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  background: color,
  display: 'inline-block',
  marginRight: 8,
});

const labelStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: '#5f6368',
  display: 'flex',
  alignItems: 'center',
};

const valueStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  fontWeight: 600,
  color: '#202124',
};

const totalRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '12px 0 4px',
  fontSize: '0.85rem',
  color: '#5f6368',
};

export default function PaymentSummary({ result }: Props) {
  const { monthlyBreakdown, totalPayment, totalInterest, loanAmount } = result;

  const items = [
    { label: 'Principal & Interest', value: monthlyBreakdown.principalAndInterest, color: '#1a73e8' },
    { label: 'Property Tax', value: monthlyBreakdown.propertyTax, color: '#34a853' },
    { label: 'Home Insurance', value: monthlyBreakdown.homeInsurance, color: '#f9ab00' },
  ];

  if (monthlyBreakdown.pmi > 0) {
    items.push({ label: 'PMI', value: monthlyBreakdown.pmi, color: '#ea4335' });
  }

  return (
    <div className="card">
      <h2>Monthly Payment</h2>
      <div style={summaryStyle}>
        <div>
          <div data-testid="monthly-payment" style={bigNumberStyle}>
            {formatCurrency(monthlyBreakdown.totalMonthly)}
          </div>
          <div style={bigLabel}>per month</div>
        </div>

        {items.map((item) => (
          <div key={item.label} style={rowStyle}>
            <span style={labelStyle}>
              <span style={dotStyle(item.color)} />
              {item.label}
            </span>
            <span style={valueStyle}>{formatCurrency(item.value)}</span>
          </div>
        ))}

        <div style={{ borderTop: '2px solid #dadce0', paddingTop: 12 }}>
          <div style={totalRowStyle}>
            <span>Loan Amount</span>
            <span style={{ fontWeight: 600, color: '#202124' }}>{formatCurrency(loanAmount)}</span>
          </div>
          <div style={totalRowStyle}>
            <span>Total Interest</span>
            <span style={{ fontWeight: 600, color: '#ea4335' }}>{formatCurrency(totalInterest)}</span>
          </div>
          <div style={totalRowStyle}>
            <span>Total Cost</span>
            <span style={{ fontWeight: 600, color: '#202124' }}>{formatCurrency(totalPayment)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
