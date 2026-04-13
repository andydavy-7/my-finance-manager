import { useState } from 'react';
import { useTransactionStore } from '../../application/stores/transactionStore';

/**
 * SaveCommitButton Component
 *
 * Button for saving/committing monthly data. Changes text based on context:
 * - "Save & Commit" for drafts
 * - "Save Changes" when editing a committed month
 * - "Saving…" while operation is in progress
 *
 * @example
 * <SaveCommitButton />
 */
export function SaveCommitButton() {
  const { currentMonth, saveCurrentMonth, isDraft, isEditing } = useTransactionStore();
  const [saving, setSaving] = useState(false);

  const canSave = currentMonth && ((!currentMonth.isCommitted && isDraft()) || isEditing);

  const handleClick = () => {
    if (!canSave || saving) return;
    if (!currentMonth) return;
    setSaving(true);
    try {
      saveCurrentMonth();
    } finally {
      setSaving(false);
    }
  };

  const buttonText = isEditing ? 'Save Changes' : saving ? 'Saving…' : 'Save & Commit';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!canSave || saving}
      style={{
        background: canSave ? 'var(--color-accent)' : 'var(--color-border-subtle)',
        color: canSave ? '#fff' : 'var(--color-text-tertiary)',
        border: 'none',
        borderRadius: 6,
        padding: '10px 20px',
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        fontWeight: 500,
        cursor: canSave ? 'pointer' : 'not-allowed'
      }}
    >
      {buttonText}
    </button>
  );
}
