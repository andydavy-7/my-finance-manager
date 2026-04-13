interface Tab {
  id: string;
  label: string;
  disabled?: boolean;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const styles = {
  container: {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#fff',
    padding: '6px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    marginBottom: '24px'
  } as React.CSSProperties,
  tab: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    backgroundColor: 'transparent',
    color: '#64748b'
  } as React.CSSProperties,
  activeTab: {
    backgroundColor: '#3b82f6',
    color: '#fff'
  } as React.CSSProperties,
  disabledTab: {
    opacity: 0.5,
    cursor: 'not-allowed'
  } as React.CSSProperties
};

export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div style={styles.container}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          style={{
            ...styles.tab,
            ...(activeTab === tab.id ? styles.activeTab : {}),
            ...(tab.disabled ? styles.disabledTab : {})
          }}
          onClick={() => !tab.disabled && onTabChange(tab.id)}
          disabled={tab.disabled}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
