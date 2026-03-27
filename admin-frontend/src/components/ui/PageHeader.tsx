interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'primary' | 'secondary';
  };
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  const btnClass = `admin-btn ${action?.variant === 'secondary' ? 'admin-btn-secondary' : 'admin-btn-primary'}`;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
      <div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
          {title}
        </h1>
        {description && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #6b7280)', marginTop: '0.25rem' }}>
            {description}
          </p>
        )}
      </div>
      {action && (
        action.href ? (
          <a href={action.href} className={btnClass} style={{ textDecoration: 'none' }}>
            {action.label}
          </a>
        ) : (
          <button className={btnClass} onClick={action.onClick}>
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
