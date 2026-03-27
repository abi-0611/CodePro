import { useState } from 'react';

interface CoursePreviewProps {
  course: {
    title?: string;
    short_description?: string;
    icon?: string;
    category?: string;
    badge?: string;
    duration?: string;
    level?: string;
    mode?: string;
    curriculum?: string[];
    highlights?: string[];
    faqs?: { q: string; a: string }[];
    is_published?: boolean;
    slug?: string;
  };
}

type ViewMode = 'card' | 'list' | 'full';

export default function CoursePreview({ course }: CoursePreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Preview Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        background: 'var(--bg-page)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Live Preview</span>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {(['card', 'list', 'full'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.7rem',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                background: viewMode === mode ? 'var(--color-primary)' : 'white',
                color: viewMode === mode ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: viewMode === mode ? 600 : 400,
                textTransform: 'capitalize',
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {viewMode === 'card' && <CardView course={course} />}
        {viewMode === 'list' && <ListView course={course} />}
        {viewMode === 'full' && <FullView course={course} />}
      </div>

      {/* Preview Live link */}
      {course.slug && course.is_published && (
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <a
            href={`/courses/${course.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.8rem',
              color: 'var(--color-primary)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Preview Live ↗
          </a>
        </div>
      )}
    </div>
  );
}

function CardView({ course }: { course: CoursePreviewProps['course'] }) {
  return (
    <div style={{
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '1.5rem',
      background: 'white',
      position: 'relative',
    }}>
      {course.badge && (
        <span style={{
          position: 'absolute',
          top: '0.75rem',
          right: '0.75rem',
          background: 'var(--color-primary)',
          color: 'white',
          padding: '0.2rem 0.6rem',
          borderRadius: '999px',
          fontSize: '0.65rem',
          fontWeight: 600,
        }}>{course.badge}</span>
      )}
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{course.icon || '📚'}</div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
        {course.title || 'Course Title'}
      </h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
        {course.short_description || 'Short description will appear here...'}
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.7rem' }}>
        {course.duration && <span style={{ padding: '0.2rem 0.5rem', background: '#f3f4f6', borderRadius: '4px' }}>⏱ {course.duration}</span>}
        {course.level && <span style={{ padding: '0.2rem 0.5rem', background: '#f3f4f6', borderRadius: '4px' }}>📊 {course.level}</span>}
        {course.mode && <span style={{ padding: '0.2rem 0.5rem', background: '#f3f4f6', borderRadius: '4px' }}>🖥 {course.mode}</span>}
      </div>
    </div>
  );
}

function ListView({ course }: { course: CoursePreviewProps['course'] }) {
  return (
    <div style={{
      display: 'flex',
      gap: '1rem',
      alignItems: 'center',
      padding: '1rem',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      background: 'white',
    }}>
      <div style={{ fontSize: '1.75rem', flexShrink: 0 }}>{course.icon || '📚'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.2rem' }}>{course.title || 'Course Title'}</h4>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {course.short_description || 'Short description...'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
        {course.category && (
          <span style={{ padding: '0.15rem 0.5rem', background: '#fef3c7', color: '#92400e', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 500 }}>
            {course.category}
          </span>
        )}
        {course.badge && (
          <span style={{ padding: '0.15rem 0.5rem', background: 'var(--color-primary)', color: 'white', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 500 }}>
            {course.badge}
          </span>
        )}
      </div>
    </div>
  );
}

function FullView({ course }: { course: CoursePreviewProps['course'] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '2rem' }}>{course.icon || '📚'}</span>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{course.title || 'Course Title'}</h3>
          {course.category && (
            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: '#fef3c7', color: '#92400e', borderRadius: '4px', fontWeight: 500 }}>
              {course.category}
            </span>
          )}
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {course.short_description || 'Description preview...'}
      </p>

      {/* Quick info */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
        {course.duration && <span>⏱ {course.duration}</span>}
        {course.level && <span>📊 {course.level}</span>}
        {course.mode && <span>🖥 {course.mode}</span>}
      </div>

      {/* Curriculum */}
      {course.curriculum && course.curriculum.filter(m => m.trim()).length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Curriculum</h4>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {course.curriculum.filter(m => m.trim()).map((m, i) => (
              <li key={i} style={{ marginBottom: '0.2rem' }}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Highlights */}
      {course.highlights && course.highlights.filter(h => h.trim()).length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Highlights</h4>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {course.highlights.filter(h => h.trim()).map((h, i) => (
              <li key={i} style={{ marginBottom: '0.2rem' }}>✓ {h}</li>
            ))}
          </ul>
        </div>
      )}

      {/* FAQs */}
      {course.faqs && course.faqs.filter(f => f.q.trim()).length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>FAQs</h4>
          {course.faqs.filter(f => f.q.trim()).map((faq, i) => (
            <div key={i} style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>Q: {faq.q}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>A: {faq.a || '—'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
