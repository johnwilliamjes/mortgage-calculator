import { useState } from 'react';
import './App.css';
import Header from './components/Header';
import MortgageForm from './components/MortgageForm';
import PaymentSummary from './components/PaymentSummary';
import AmortizationTable from './components/AmortizationTable';
import PaymentChart from './components/PaymentChart';
import LoanComparison from './components/LoanComparison';
import { calculateMortgage } from './utils/mortgage';
import type { MortgageInput, MortgageResult } from './types/mortgage';

type Tab = 'summary' | 'amortization' | 'chart' | 'compare';

export default function App() {
  const [result, setResult] = useState<MortgageResult | null>(null);
  const [input, setInput] = useState<MortgageInput | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('summary');

  const handleCalculate = (mortgageInput: MortgageInput) => {
    const mortgageResult = calculateMortgage(mortgageInput);
    setResult(mortgageResult);
    setInput(mortgageInput);
  };

  return (
    <div className="app">
      <Header />
      <div className="app-grid">
        <div>
          <MortgageForm onCalculate={handleCalculate} />
        </div>

        <div className="right-panel">
          {result && input ? (
            <>
              <PaymentSummary result={result} />

              <div className="card">
                <div className="tabs">
                  <button
                    className={`tab-btn ${activeTab === 'amortization' ? 'active' : ''}`}
                    onClick={() => setActiveTab('amortization')}
                  >
                    Amortization
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'chart' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chart')}
                  >
                    Chart
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
                    onClick={() => setActiveTab('compare')}
                  >
                    Compare
                  </button>
                </div>

                <div style={{ padding: '16px 0' }}>
                  {activeTab === 'amortization' && (
                    <AmortizationTable schedule={result.amortizationSchedule} />
                  )}
                  {activeTab === 'chart' && (
                    <PaymentChart schedule={result.amortizationSchedule} />
                  )}
                  {activeTab === 'compare' && (
                    <LoanComparison currentInput={input} currentResult={result} />
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: '#5f6368' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🏠</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>Enter your loan details</div>
              <div style={{ fontSize: '0.85rem', marginTop: '8px' }}>
                Fill in the form and click Calculate to see your mortgage breakdown
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
