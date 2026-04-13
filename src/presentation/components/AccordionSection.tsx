import { useState, type ReactNode } from 'react';

interface AccordionSectionProps {
  id: string;
  number: number;
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

const styles = {
  section: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden' as const,
    boxShadow: 'var(--shadow-sm)',
    transition: 'var(--transition)'
  },
  header: {
    padding: '20px 24px',
    cursor: 'pointer' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    userSelect: 'none' as const
  },
  headerHover: {
    background: 'var(--color-accent-light)'
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  number: {
    width: 28,
    height: 28,
    borderRadius: 6,
    background: 'var(--color-accent)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-mono)'
  },
  title: { fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' },
  toggle: { width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  content: { padding: '32px 24px' }
};

export function AccordionSection({
  id,
  number,
  title,
  children,
  defaultExpanded = true
}: AccordionSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section id={id} style={styles.section}>
      <div
        style={styles.header}
        onClick={() => setExpanded((e) => !e)}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-accent-light)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
      >
        <div style={styles.headerLeft}>
          <span style={styles.number}>{number}</span>
          <h2 style={styles.title}>{title}</h2>
        </div>
        <div style={styles.toggle}>
          <svg
            width={16}
            height={16}
            fill="none"
            stroke="var(--color-text-secondary)"
            viewBox="0 0 24 24"
            style={{ transform: expanded ? undefined : 'rotate(-90deg)', transition: 'var(--transition)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {expanded && <div style={styles.content}>{children}</div>}
    </section>
  );
}
