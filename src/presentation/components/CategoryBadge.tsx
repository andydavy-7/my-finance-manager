import { getCategoryById, categories, Category } from '../../data/categories';

interface CategoryBadgeProps {
  categoryId: string;
  onClick?: () => void;
}

const styles = {
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: '9999px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 0.15s ease'
  } as React.CSSProperties
};

/**
 * Displays a color-coded category badge
 * Clickable to trigger category change
 */
export function CategoryBadge({ categoryId, onClick }: CategoryBadgeProps) {
  const category = getCategoryById(categoryId);

  if (!category) return null;

  return (
    <span
      style={{
        ...styles.badge,
        backgroundColor: `${category.color}20`,
        color: category.color,
        border: `1px solid ${category.color}40`
      }}
      onClick={onClick}
      onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
      onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
    >
      {category.name}
    </span>
  );
}

interface CategorySelectorProps {
  currentCategoryId: string;
  onSelect: (categoryId: string) => void;
  onClose: () => void;
}

const selectorStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  } as React.CSSProperties,
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    minWidth: '280px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
  } as React.CSSProperties,
  title: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#1e293b'
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px'
  } as React.CSSProperties,
  option: {
    padding: '10px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    textAlign: 'center',
    transition: 'transform 0.1s ease'
  } as React.CSSProperties
};

/**
 * Modal for selecting a new category
 */
export function CategorySelector({ currentCategoryId, onSelect, onClose }: CategorySelectorProps) {
  const handleSelect = (category: Category) => {
    onSelect(category.id);
    onClose();
  };

  return (
    <div style={selectorStyles.overlay} onClick={onClose}>
      <div style={selectorStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={selectorStyles.title}>Select Category</div>
        <div style={selectorStyles.grid}>
          {categories.map(category => (
            <div
              key={category.id}
              style={{
                ...selectorStyles.option,
                backgroundColor: category.id === currentCategoryId
                  ? category.color
                  : `${category.color}15`,
                color: category.id === currentCategoryId
                  ? '#fff'
                  : category.color,
                border: `1px solid ${category.color}40`
              }}
              onClick={() => handleSelect(category)}
              onMouseOver={(e) => {
                if (category.id !== currentCategoryId) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {category.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
