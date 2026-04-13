import { useRef, useCallback, useState } from 'react';
import { useTransactionStore, type Owner } from '../../application/stores/transactionStore';

const cardStyle = (hasFile: boolean) =>
  ({
    border: `2px dashed ${hasFile ? 'var(--color-success)' : 'var(--color-border)'}`,
    borderRadius: 8,
    padding: 32,
    textAlign: 'center' as const,
    transition: 'var(--transition)',
    cursor: 'pointer',
    background: hasFile ? 'var(--color-success-light)' : 'var(--color-bg)',
    borderStyle: hasFile ? 'solid' : 'dashed'
  }) as React.CSSProperties;

interface UploadCardProps {
  owner: Owner;
  name: string;
}

/**
 * UploadCard Component
 *
 * Drag-and-drop file upload card for bank statements.
 * Supports CSV file upload with visual feedback.
 *
 * @param owner - The owner of the statement (andrew or shammi)
 * @param name - Display name for the owner
 *
 * @example
 * <UploadCard owner="andrew" name="Andrew" />
 */
export function UploadCard({ owner, name }: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const { loadFromFile, clearStatement, loading, error } = useTransactionStore();
  const m = useTransactionStore((s) => s.currentMonth);
  const tx = owner === 'andrew' ? m?.andrewTransactions ?? [] : m?.shammiTransactions ?? [];
  const fileName = owner === 'andrew' ? m?.andrewFileName : m?.shammiFileName;
  const hasFile = tx.length > 0;

  const handleFile = useCallback(
    (file: File) => {
      if (file?.name?.toLowerCase().endsWith('.csv')) loadFromFile(owner, file);
    },
    [owner, loadFromFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      const f = e.dataTransfer?.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(true);
  };
  const onDragLeave = () => setDrag(false);
  const onChoose = () => inputRef.current?.click();
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = '';
  };

  return (
    <div
      style={{ ...cardStyle(hasFile), ...(drag ? { borderColor: 'var(--color-accent)', background: 'var(--color-accent-light)' } : {}) }}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={hasFile ? undefined : onChoose}
    >
      <div
        style={{
          width: 48,
          height: 48,
          margin: '0 auto 16px',
          borderRadius: '50%',
          background: hasFile ? 'var(--color-success)' : 'var(--color-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <svg width={24} height={24} fill="none" stroke={hasFile ? '#fff' : 'var(--color-text-secondary)'} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{name}'s Statement</div>
      {!hasFile && (
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
          Drag and drop CSV file or click to browse
        </div>
      )}

      {!hasFile && <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>No file selected</div>}
      {hasFile && (
        <>
          <div style={{ fontSize: 12, color: 'var(--color-success)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
            {fileName} • {tx.length} transactions
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); clearStatement(owner); }}
            style={{
              marginTop: 12,
              padding: '8px 16px',
              fontSize: 13,
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              background: 'var(--color-surface)',
              cursor: 'pointer',
              color: 'var(--color-error)'
            }}
          >
            Remove
          </button>
        </>
      )}

      {loading && (
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
          Processing…
        </div>
      )}
      {error && (
        <div
          style={{
            marginTop: 8,
            padding: '8px 12px',
            fontSize: 13,
            color: 'var(--color-error)',
            background: 'var(--color-error-light)',
            borderRadius: 6,
            border: '1px solid var(--color-error)'
          }}
        >
          <strong>Error:</strong> {error.message || 'Failed to load file. Please check the file format and try again.'}
        </div>
      )}

      <input ref={inputRef} type="file" accept=".csv" onChange={onInputChange} style={{ display: 'none' }} />
    </div>
  );
}

/**
 * UploadTab Component
 *
 * Container component for statement upload functionality.
 * Displays upload cards for both Andrew and Shammi.
 *
 * @example
 * <UploadTab />
 */
export function UploadTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
      <UploadCard owner="andrew" name="Andrew" />
      <UploadCard owner="shammi" name="Shammi" />
    </div>
  );
}
