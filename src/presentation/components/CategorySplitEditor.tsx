import { useState, useEffect } from 'react';
import { useTransactionStore } from '../../application/stores/transactionStore';
import { categories } from '../../data/categories';
import { defaultCategorySplits } from '../../data/defaultCategorySplits';

type LocalSplit = {
  categoryId: string;
  shammiPercentage: number;
  andrewPercentage: number;
};

/**
 * CategorySplitEditor Component
 *
 * Allows editing of category split percentages for shared expenses.
 * Validates that percentages sum to 100% and provides visual feedback.
 *
 * @example
 * <CategorySplitEditor />
 */
export function CategorySplitEditor() {
  const { currentMonth, updateCategorySplit, resetCategorySplitsToDefault } = useTransactionStore();
  const storeSplits = currentMonth?.categorySplits ?? defaultCategorySplits;

  // Local state for editing
  const [localSplits, setLocalSplits] = useState<LocalSplit[]>([]);
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize local splits from store
  useEffect(() => {
    const sharedCategories = categories.filter((c) => c.splitType === 'shared');
    const initialized = sharedCategories.map((c) => {
      const s = storeSplits.find((x) => x.categoryId === c.id) ?? defaultCategorySplits.find((x) => x.categoryId === c.id);
      return {
        categoryId: c.id,
        shammiPercentage: s?.shammiPercentage ?? 50,
        andrewPercentage: s?.andrewPercentage ?? 50
      };
    });
    setLocalSplits(initialized);
    setHasUnsavedChanges(false);
    setValidationErrors(new Map());
  }, [storeSplits]);

  const canEdit = !!currentMonth;

  const validateAll = (): boolean => {
    const errors = new Map<string, string>();
    let isValid = true;

    localSplits.forEach((split) => {
      const sum = split.shammiPercentage + split.andrewPercentage;
      if (Math.abs(sum - 100) > 0.01) {
        errors.set(split.categoryId, `Must sum to 100% (currently ${sum}%)`);
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleLocalChange = (categoryId: string, shammiPercentage: number, andrewPercentage: number) => {
    setLocalSplits((prev) =>
      prev.map((split) =>
        split.categoryId === categoryId
          ? { ...split, shammiPercentage, andrewPercentage }
          : split
      )
    );
    setHasUnsavedChanges(true);

    // Validate this specific split
    const sum = shammiPercentage + andrewPercentage;
    setValidationErrors((prev) => {
      const newErrors = new Map(prev);
      if (Math.abs(sum - 100) > 0.01) {
        newErrors.set(categoryId, `Must sum to 100% (currently ${sum}%)`);
      } else {
        newErrors.delete(categoryId);
      }
      return newErrors;
    });
  };

  const handleSave = () => {
    if (!validateAll()) {
      return;
    }

    // Apply all changes to store
    localSplits.forEach((split) => {
      updateCategorySplit(split.categoryId, split.shammiPercentage, split.andrewPercentage);
    });

    setHasUnsavedChanges(false);
  };

  const handleReset = () => {
    resetCategorySplitsToDefault();
    setHasUnsavedChanges(false);
    setValidationErrors(new Map());
  };

  const hasAnyErrors = validationErrors.size > 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
          Split percentages for shared categories. Individual categories (Transport, Fuel, Personal, etc.) are paid 100% by whoever made the transaction.
        </span>
        {canEdit && (
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '6px 12px',
              fontSize: 13,
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              background: 'var(--color-surface)',
              cursor: 'pointer'
            }}
          >
            Reset to defaults
          </button>
        )}
      </div>
      {hasUnsavedChanges && (
        <div
          style={{
            padding: '10px 16px',
            background: '#FFF7ED',
            border: '1px solid #F97316',
            borderRadius: 6,
            color: '#F97316',
            fontSize: 13,
            marginBottom: 16,
            fontWeight: 500
          }}
        >
          You have unsaved changes. Click "Save Changes" to apply them.
        </div>
      )}
      {hasAnyErrors && (
        <div
          style={{
            padding: '10px 16px',
            background: 'var(--color-error-light)',
            border: '1px solid var(--color-error)',
            borderRadius: 6,
            color: 'var(--color-error)',
            fontSize: 13,
            marginBottom: 16,
            fontWeight: 500
          }}
        >
          Please fix validation errors before saving.
        </div>
      )}
      <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 8, marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-border-subtle)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                Category
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                Shammi %
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                Andrew %
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {localSplits.map((split) => {
              const category = categories.find(c => c.id === split.categoryId);
              const error = validationErrors.get(split.categoryId);
              const hasError = !!error;

              return (
                <tr key={split.categoryId} style={{ borderBottom: '1px solid var(--color-border-subtle)', background: hasError ? '#FEF2F2' : 'transparent' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        background: category?.backgroundColor ?? (category?.color ? category.color + '20' : '#f3f4f6'),
                        color: category?.color ?? '#374151'
                      }}
                    >
                      {category?.name ?? split.categoryId}
                    </span>
                    {hasError && (
                      <div style={{ fontSize: 11, color: 'var(--color-error)', marginTop: 4 }}>
                        {error}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {canEdit ? (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={split.shammiPercentage}
                        onChange={(e) => {
                          const v = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                          handleLocalChange(split.categoryId, v, 100 - v);
                        }}
                        style={{
                          width: 64,
                          padding: 6,
                          textAlign: 'right',
                          border: hasError ? '1px solid var(--color-error)' : '1px solid var(--color-border)',
                          borderRadius: 4,
                          fontFamily: 'var(--font-mono)'
                        }}
                      />
                    ) : (
                      split.shammiPercentage
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {canEdit ? (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={split.andrewPercentage}
                        onChange={(e) => {
                          const v = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                          handleLocalChange(split.categoryId, 100 - v, v);
                        }}
                        style={{
                          width: 64,
                          padding: 6,
                          textAlign: 'right',
                          border: hasError ? '1px solid var(--color-error)' : '1px solid var(--color-border)',
                          borderRadius: 4,
                          fontFamily: 'var(--font-mono)'
                        }}
                      />
                    ) : (
                      split.andrewPercentage
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: hasError ? 'var(--color-error)' : 'var(--color-text-secondary)' }}>
                    {split.shammiPercentage + split.andrewPercentage}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canEdit && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || hasAnyErrors}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 500,
              border: 'none',
              borderRadius: 6,
              background: (!hasUnsavedChanges || hasAnyErrors) ? 'var(--color-border)' : 'var(--color-accent)',
              color: (!hasUnsavedChanges || hasAnyErrors) ? 'var(--color-text-tertiary)' : '#fff',
              cursor: (!hasUnsavedChanges || hasAnyErrors) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}
