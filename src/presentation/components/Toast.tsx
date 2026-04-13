import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

/**
 * Toast notification component for user feedback
 *
 * @param message - The message to display
 * @param type - The type of toast (success, error, info)
 * @param onClose - Callback when toast should close
 * @param duration - How long to show the toast in milliseconds (default: 3000)
 *
 * @example
 * <Toast
 *   message="Data saved successfully"
 *   type="success"
 *   onClose={() => setShowToast(false)}
 * />
 */
export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: { bg: 'var(--color-success)', border: 'var(--color-success)' },
    error: { bg: 'var(--color-error)', border: 'var(--color-error)' },
    info: { bg: 'var(--color-accent)', border: 'var(--color-accent)' }
  };

  const color = colors[type];

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        background: color.bg,
        color: '#fff',
        padding: '12px 20px',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minWidth: 250,
        maxWidth: 400,
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 18,
          lineHeight: 1,
          padding: 0,
          width: 20,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
