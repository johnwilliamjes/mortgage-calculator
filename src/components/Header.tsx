import { useState } from 'react';

const headerStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #1a73e8 0%, #1557b0 100%)',
  color: '#fff',
  padding: '16px 24px',
  marginBottom: '24px',
  borderRadius: '8px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.4rem',
  fontWeight: 700,
  letterSpacing: '-0.02em',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  opacity: 0.85,
  marginTop: '2px',
};

const badgeStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.2)',
  padding: '4px 12px',
  borderRadius: '16px',
  fontSize: '0.75rem',
  fontWeight: 500,
  cursor: 'pointer',
};

export default function Header() {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <header style={headerStyle}>
      <div>
        <div style={titleStyle}>Mortgage Calculator</div>
        <div style={subtitleStyle}>Compare loans, view amortization, plan your home purchase</div>
      </div>
      <div style={{ position: 'relative' }}>
        <span style={badgeStyle} onClick={() => setShowInfo(!showInfo)}>
          SpecGuard
        </span>
        {showInfo && (
          <div style={{
            position: 'absolute', right: 0, top: '100%', marginTop: 8,
            background: '#fff', color: '#333', padding: 12, borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '0.8rem',
            width: 240, zIndex: 10,
          }}>
            Built with SpecGuard spec-driven development. Every change follows an 8-step verified pipeline.
          </div>
        )}
      </div>
    </header>
  );
}
