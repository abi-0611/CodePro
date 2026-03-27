import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onDismiss: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'info', onDismiss, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  const icons: Record<string, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  return (
    <div className={`admin-toast ${type}`} onClick={onDismiss} role="alert" style={{ cursor: 'pointer' }}>
      <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{icons[type]}</span>
      <span style={{ flex: 1, fontSize: '0.875rem' }}>{message}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '1rem' }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
