import { useState } from 'react';
import type { MortgageInput, LoanType } from '../types/mortgage';

interface Props {
  onCalculate: (input: MortgageInput) => void;
  onClear?: () => void;
}

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  fontSize: '0.85rem',
  color: '#5f6368',
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid #dadce0',
  borderRadius: '6px',
  fontSize: '0.95rem',
  color: '#202124',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  background: '#fff',
};

const buttonStyle: React.CSSProperties = {
  padding: '12px',
  background: '#1a73e8',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.2s',
  marginTop: '4px',
};

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
};

const initialValues = {
  homePrice: '350000',
  downPayment: '70000',
  interestRate: '6.5',
  loanTerm: '30',
  loanType: 'fixed' as LoanType,
  propertyTaxRate: '1.2',
  schoolTaxRate: '0',
  insuranceRate: '0.35',
};

export default function MortgageForm({ onCalculate, onClear }: Props) {
  const [homePrice, setHomePrice] = useState(initialValues.homePrice);
  const [downPayment, setDownPayment] = useState(initialValues.downPayment);
  const [interestRate, setInterestRate] = useState(initialValues.interestRate);
  const [loanTerm, setLoanTerm] = useState(initialValues.loanTerm);
  const [loanType, setLoanType] = useState<LoanType>(initialValues.loanType);
  const [propertyTaxRate, setPropertyTaxRate] = useState(initialValues.propertyTaxRate);
  const [schoolTaxRate, setSchoolTaxRate] = useState(initialValues.schoolTaxRate);
  const [insuranceRate, setInsuranceRate] = useState(initialValues.insuranceRate);

  const handleClear = () => {
    setHomePrice(initialValues.homePrice);
    setDownPayment(initialValues.downPayment);
    setInterestRate(initialValues.interestRate);
    setLoanTerm(initialValues.loanTerm);
    setLoanType(initialValues.loanType);
    setPropertyTaxRate(initialValues.propertyTaxRate);
    setSchoolTaxRate(initialValues.schoolTaxRate);
    setInsuranceRate(initialValues.insuranceRate);
    onClear?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hp = parseFloat(homePrice) || 0;
    const dp = parseFloat(downPayment) || 0;

    onCalculate({
      homePrice: hp,
      downPayment: dp,
      loanAmount: hp - dp,
      interestRate: parseFloat(interestRate) || 0,
      loanTermYears: parseInt(loanTerm) || 30,
      loanType,
      propertyTaxRate: parseFloat(propertyTaxRate) || 0,
      schoolTaxRate: parseFloat(schoolTaxRate) || 0,
      insuranceRate: parseFloat(insuranceRate) || 0,
    });
  };

  const downPaymentPct = homePrice && downPayment
    ? ((parseFloat(downPayment) / parseFloat(homePrice)) * 100).toFixed(1)
    : '0';

  return (
    <div className="card">
      <h2>Loan Details</h2>
      <form onSubmit={handleSubmit} style={formStyle}>
        <label style={labelStyle}>
          Home Price
          <input
            data-testid="home-price"
            type="number"
            style={inputStyle}
            value={homePrice}
            onChange={(e) => setHomePrice(e.target.value)}
            min="0"
            step="1000"
          />
        </label>

        <label style={labelStyle}>
          Down Payment ({downPaymentPct}%)
          <input
            data-testid="down-payment"
            type="number"
            style={inputStyle}
            value={downPayment}
            onChange={(e) => setDownPayment(e.target.value)}
            min="0"
            step="1000"
          />
        </label>

        <div style={rowStyle}>
          <label style={labelStyle}>
            Interest Rate (%)
            <input
              data-testid="interest-rate"
              type="number"
              style={inputStyle}
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              min="0"
              max="30"
              step="0.125"
            />
          </label>

          <label style={labelStyle}>
            Loan Term
            <select
              data-testid="loan-term"
              style={selectStyle}
              value={loanTerm}
              onChange={(e) => setLoanTerm(e.target.value)}
            >
              <option value="15">15 years</option>
              <option value="20">20 years</option>
              <option value="30">30 years</option>
            </select>
          </label>
        </div>

        <label style={labelStyle}>
          Loan Type
          <select
            data-testid="loan-type"
            style={selectStyle}
            value={loanType}
            onChange={(e) => setLoanType(e.target.value as LoanType)}
          >
            <option value="fixed">Fixed Rate</option>
            <option value="arm">Adjustable Rate (ARM)</option>
            <option value="fha">FHA</option>
          </select>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <label style={labelStyle}>
            Property Tax (%)
            <input
              data-testid="property-tax-rate"
              type="number"
              style={inputStyle}
              value={propertyTaxRate}
              onChange={(e) => setPropertyTaxRate(e.target.value)}
              min="0"
              max="10"
              step="0.1"
            />
          </label>
          <label style={labelStyle}>
            School Tax (%)
            <input
              data-testid="school-tax-rate"
              type="number"
              style={inputStyle}
              value={schoolTaxRate}
              onChange={(e) => setSchoolTaxRate(e.target.value)}
              min="0"
              max="10"
              step="0.1"
            />
          </label>
          <label style={labelStyle}>
            Insurance (%)
            <input
              data-testid="insurance-rate"
              type="number"
              style={inputStyle}
              value={insuranceRate}
              onChange={(e) => setInsuranceRate(e.target.value)}
              min="0"
              max="5"
              step="0.05"
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>

          <button data-testid="calculate-btn" type="submit" style={{ ...buttonStyle, flex: 1 }}>
            Calculate
          </button>
          <button
            data-testid="clear-btn"
            type="button"
            onClick={handleClear}
            style={{ ...buttonStyle, flex: 1, background: '#5f6368' }}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
