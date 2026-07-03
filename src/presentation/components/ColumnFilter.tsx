import { useMemo, useState } from 'react';

export interface FilterOptionItem {
  key: string;
  label: string;
}

interface ColumnFilterProps {
  title: string;
  options: FilterOptionItem[];
  /** Committed selection. Empty set means "no filter" (all rows pass). */
  selected: Set<string>;
  searchable?: boolean;
  align?: 'left' | 'right';
  onApply: (next: Set<string>) => void;
  onClose: () => void;
}

/**
 * Excel-style column filter popover: a checklist of the column's distinct
 * values. Tick the values to keep; untick to hide. Applying a selection that
 * covers every option is treated as "no filter" (empty set) so the funnel icon
 * clears itself.
 */
export function ColumnFilter({
  title,
  options,
  selected,
  searchable = false,
  align = 'left',
  onApply,
  onClose,
}: ColumnFilterProps) {
  const allKeys = useMemo(() => options.map((o) => o.key), [options]);
  // Working copy: if nothing is committed, start with everything checked.
  const [working, setWorking] = useState<Set<string>>(
    () => (selected.size === 0 ? new Set(allKeys) : new Set(selected))
  );
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, searchable, query]);

  const allVisibleChecked = visible.length > 0 && visible.every((o) => working.has(o.key));

  const toggle = (key: string) => {
    setWorking((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setWorking((prev) => {
      const next = new Set(prev);
      if (allVisibleChecked) visible.forEach((o) => next.delete(o.key));
      else visible.forEach((o) => next.add(o.key));
      return next;
    });
  };

  const apply = () => {
    // Covering every option == no filter.
    if (working.size === allKeys.length) onApply(new Set());
    else onApply(new Set(working));
    onClose();
  };

  const clear = () => {
    onApply(new Set());
    onClose();
  };

  return (
    <>
      {/* click-outside overlay (cancels without applying) */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: '100%',
          [align]: 0,
          marginTop: 4,
          zIndex: 41,
          width: 240,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          textTransform: 'none',
          fontWeight: 400,
        }}
      >
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
            Filter {title}
          </div>
          {searchable && (
            <input
              type="text"
              autoFocus
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                fontSize: 13,
                background: 'var(--color-bg)',
              }}
            />
          )}
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderBottom: '1px solid var(--color-border-subtle)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <input type="checkbox" checked={allVisibleChecked} onChange={toggleAllVisible} />
          Select all{searchable && query.trim() ? ' (matches)' : ''}
        </label>

        <div style={{ maxHeight: 240, overflowY: 'auto' }}>
          {visible.length === 0 ? (
            <div style={{ padding: '12px', fontSize: 13, color: 'var(--color-text-tertiary)' }}>No matches</div>
          ) : (
            visible.map((o) => (
              <label
                key={o.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <input type="checkbox" checked={working.has(o.key)} onChange={() => toggle(o.key)} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={o.label}>
                  {o.label}
                </span>
              </label>
            ))
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderTop: '1px solid var(--color-border-subtle)' }}>
          <button
            type="button"
            onClick={apply}
            style={{
              flex: 1,
              padding: '6px 12px',
              border: 'none',
              borderRadius: 6,
              background: 'var(--color-accent)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Apply
          </button>
          <button
            type="button"
            onClick={clear}
            style={{
              padding: '6px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </>
  );
}

/** Small funnel icon; filled/accent when a filter is active on the column. */
export function FilterIcon({ active }: { active: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" style={{ display: 'block' }}>
      <path
        d="M1.5 2.5h13L9.5 8.5v4l-3 1.5v-5.5z"
        fill={active ? 'var(--color-accent)' : 'none'}
        stroke={active ? 'var(--color-accent)' : 'currentColor'}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
