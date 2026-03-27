import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: ReactNode;
  htmlFor?: string;
}

export default function FormField({ label, required, error, helpText, children, htmlFor }: FormFieldProps) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <label
        htmlFor={htmlFor}
        style={{
          display: 'block',
          fontSize: '0.8rem',
          fontWeight: 500,
          marginBottom: '0.35rem',
          color: 'var(--text-primary, #111)',
        }}
      >
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>{error}</p>
      )}
      {!error && helpText && (
        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #6b7280)', marginTop: '0.25rem' }}>{helpText}</p>
      )}
    </div>
  );
}
