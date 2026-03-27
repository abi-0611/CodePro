interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizes = { sm: '1rem', md: '1.5rem', lg: '2.5rem' };
const borders = { sm: '2px', md: '3px', lg: '4px' };

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem' }}>
      <div
        style={{
          width: sizes[size],
          height: sizes[size],
          border: `${borders[size]} solid var(--border-color, #e5e7eb)`,
          borderTopColor: 'var(--color-primary, #b45309)',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
        }}
      />
      {text && (
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #6b7280)' }}>{text}</span>
      )}
    </div>
  );
}
