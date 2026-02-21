import { useState, useEffect } from 'react';

const THEME_KEY = 'mortgage-calculator-theme';

function getStoredTheme(): 'light' | 'dark' {
  try {
    const s = localStorage.getItem(THEME_KEY);
    if (s === 'dark' || s === 'light') return s;
  } catch (_) {}
  return 'light';
}

function setStoredTheme(theme: 'light' | 'dark') {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (_) {}
}

const headerStyle: React.CSSProperties = {
  background: 'var(--header-bg)',
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
  const [theme, setTheme] = useState<'light' | 'dark'>(getStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    setStoredTheme(theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <header style={headerStyle}>
      <div>
        <div style={titleStyle}>Mortgage Calculator</div>
        <div style={subtitleStyle}>Compare loans, view amortization, plan your home purchase</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            ...badgeStyle,
            border: 'none',
          }}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <span style={badgeStyle} onClick={() => setShowInfo(!showInfo)}>
          SpecGuard
        </span>
        {showInfo && (
          <div style={{
            position: 'absolute', right: 0, top: '100%', marginTop: 8,
            background: 'var(--card-bg)', color: 'var(--text)', padding: 12, borderRadius: 8,
            boxShadow: 'var(--shadow)', fontSize: '0.8rem',
            width: 240, zIndex: 10, border: '1px solid var(--border)',
          }}>
            Built with SpecGuard spec-driven development. Every change follows an 8-step verified pipeline.
          </div>
        )}
      </div>
    </header>
  );
}
