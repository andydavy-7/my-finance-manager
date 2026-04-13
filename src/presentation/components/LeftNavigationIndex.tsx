import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  id: string;
  number: number;
  label: string;
}

const items: NavItem[] = [
  { id: 'upload', number: 1, label: 'Upload Statements' },
  { id: 'transactions', number: 2, label: 'Transactions' },
  { id: 'breakdown', number: 3, label: 'Category Breakdown' },
  { id: 'reconciliation', number: 4, label: 'Reconciliation' }
];

const navItemBase = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 24px',
  color: 'var(--color-text-secondary)',
  fontSize: 14,
  fontWeight: 500,
  textDecoration: 'none',
  transition: 'var(--transition)',
  borderLeft: '2px solid transparent',
  cursor: 'pointer' as const
};

export function LeftNavigationIndex() {
  const [activeId, setActiveId] = useState('upload');
  const location = useLocation();
  const navigate = useNavigate();
  const isAnalyticsRoute = location.pathname === '/analytics';

  useEffect(() => {
    if (isAnalyticsRoute) return;
    const sections = items.map((i) => document.getElementById(i.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveId(e.target.id);
        }
      },
      { rootMargin: '-100px 0px -66%', threshold: 0 }
    );
    sections.forEach((el) => (el ? observer.observe(el) : undefined));
    return () => observer.disconnect();
  }, [isAnalyticsRoute]);

  const scrollTo = (id: string) => {
    if (isAnalyticsRoute) {
      navigate('/');
      // After navigation the element won't exist yet; user can scroll manually
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <aside
      style={{
        width: 240,
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        position: 'fixed' as const,
        top: 64,
        left: 0,
        bottom: 0,
        overflowY: 'auto' as const,
        padding: '24px 0'
      }}
    >
      <nav>
        {items.map(({ id, number, label }) => {
          const isActive = !isAnalyticsRoute && activeId === id;
          return (
            <button
              key={id}
              type="button"
              style={{
                ...navItemBase,
                width: '100%',
                border: 'none',
                background: isActive ? 'var(--color-accent-light)' : 'transparent',
                textAlign: 'left',
                font: 'inherit',
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                borderLeftColor: isActive ? 'var(--color-accent)' : 'transparent'
              }}
              onClick={() => scrollTo(id)}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  background: isActive ? 'var(--color-accent)' : 'var(--color-border-subtle)',
                  color: isActive ? '#fff' : 'var(--color-text-tertiary)',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {number}
              </span>
              {label}
            </button>
          );
        })}

        <div style={{ margin: '16px 24px', borderTop: '1px solid var(--color-border)' }} />

        <button
          type="button"
          style={{
            ...navItemBase,
            width: '100%',
            border: 'none',
            background: isAnalyticsRoute ? 'var(--color-accent-light)' : 'transparent',
            textAlign: 'left',
            font: 'inherit',
            color: isAnalyticsRoute ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            borderLeftColor: isAnalyticsRoute ? 'var(--color-accent)' : 'transparent'
          }}
          onClick={() => navigate('/analytics')}
        >
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: isAnalyticsRoute ? 'var(--color-accent)' : 'var(--color-border-subtle)',
              color: isAnalyticsRoute ? '#fff' : 'var(--color-text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </span>
          Analytics
        </button>
      </nav>
    </aside>
  );
}
