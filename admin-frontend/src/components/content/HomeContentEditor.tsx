import { useState, useCallback } from 'react';
import { useAutoSave, SaveStatusIndicator } from '../../lib/autosave';

interface HomeContentEditorProps {
  initialData: {
    home: Record<string, string>;
    meta: Record<string, string>;
  };
}

function getVal(section: Record<string, string>, key: string, fallback = ''): string {
  return section[key] ?? section[`${key}_json`] ?? fallback;
}

export default function HomeContentEditor({ initialData }: HomeContentEditorProps) {
  const [meta, setMeta] = useState({
    site_name: getVal(initialData.meta, 'site_name', 'CodePro.io'),
    site_tagline: getVal(initialData.meta, 'site_tagline', 'Master the code, Become a pro'),
    default_description: getVal(initialData.meta, 'default_description'),
    promo_text: getVal(initialData.meta, 'promo_text'),
    logo_url: getVal(initialData.meta, 'logo_url'),
  });

  const [home, setHome] = useState({
    hero_headline: getVal(initialData.home, 'hero_headline', 'Become job-ready with mentor-led tech programs'),
    hero_subheadline: getVal(initialData.home, 'hero_subheadline'),
    hero_badge_text: getVal(initialData.home, 'hero_badge_text', 'Job-focused training'),
    hero_cta_text: getVal(initialData.home, 'hero_cta_text', 'Explore Courses'),
    hero_cta_link: getVal(initialData.home, 'hero_cta_link', '/courses/'),
    hero_cta2_text: getVal(initialData.home, 'hero_cta2_text', 'View Highlights'),
    hero_cta2_link: getVal(initialData.home, 'hero_cta2_link', '#home-courses'),
    stat1_value: getVal(initialData.home, 'stat1_value', '500+'),
    stat1_label: getVal(initialData.home, 'stat1_label', 'Students Trained'),
    stat2_value: getVal(initialData.home, 'stat2_value', '8+'),
    stat2_label: getVal(initialData.home, 'stat2_label', 'Expert Courses'),
    stat3_value: getVal(initialData.home, 'stat3_value', '95%'),
    stat3_label: getVal(initialData.home, 'stat3_label', 'Satisfaction Rate'),
    stat4_value: getVal(initialData.home, 'stat4_value', '100%'),
    stat4_label: getVal(initialData.home, 'stat4_label', 'Placement Support'),
    section1_eyebrow: getVal(initialData.home, 'section1_eyebrow', 'Top Courses'),
    section1_title: getVal(initialData.home, 'section1_title'),
    section1_description: getVal(initialData.home, 'section1_description'),
    section1_cta_text: getVal(initialData.home, 'section1_cta_text', 'View All Courses'),
    section2_eyebrow: getVal(initialData.home, 'section2_eyebrow', 'All Programs'),
    section2_title: getVal(initialData.home, 'section2_title'),
    enquiry_headline: getVal(initialData.home, 'enquiry_headline'),
    enquiry_description: getVal(initialData.home, 'enquiry_description'),
  });

  // Tech badges as array
  const [techBadges, setTechBadges] = useState<string[]>(() => {
    try {
      const raw = initialData.home.tech_badges_json || initialData.home.tech_badges;
      if (raw) return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch { /* ignore */ }
    return ['React', 'Python', 'Java', 'Angular', 'Full Stack', 'Testing', 'Tally', 'Web Design'];
  });
  const [badgeInput, setBadgeInput] = useState('');

  // Enquiry bullets
  const [bullets, setBullets] = useState<string[]>(() => {
    try {
      const raw = initialData.home.enquiry_bullets_json || initialData.home.enquiry_bullets;
      if (raw) return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch { /* ignore */ }
    return ['Free 15-minute consultation call', 'No pushy sales — just honest guidance', 'Get a learning roadmap tailored for you', 'Flexible batch options explained clearly'];
  });

  const [saveError, setSaveError] = useState<string | null>(null);

  const buildPayload = useCallback(() => {
    const updates: { section: string; key: string; value?: string; value_json?: unknown; content_type: string }[] = [];
    for (const [key, value] of Object.entries(meta)) {
      updates.push({ section: 'meta', key, value, content_type: 'text' });
    }
    for (const [key, value] of Object.entries(home)) {
      updates.push({ section: 'home', key, value, content_type: 'text' });
    }
    updates.push({ section: 'home', key: 'tech_badges', value_json: techBadges, content_type: 'json' });
    updates.push({ section: 'home', key: 'enquiry_bullets', value_json: bullets, content_type: 'json' });
    return { updates };
  }, [meta, home, techBadges, bullets]);

  const handleSave = useCallback(async () => {
    setSaveError(null);
    const res = await fetch('/admin/api/proxy/content/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload()),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to save');
    }
  }, [buildPayload]);

  const { saveStatus, lastSaved, triggerSave } = useAutoSave(
    { meta, home, techBadges, bullets },
    {
      delay: 30000,
      onSave: handleSave,
      onSaveError: (err) => setSaveError(err.message),
    },
  );

  const updateMeta = (key: string, value: string) => setMeta(prev => ({ ...prev, [key]: value }));
  const updateHome = (key: string, value: string) => setHome(prev => ({ ...prev, [key]: value }));

  const addBadge = () => {
    const v = badgeInput.trim();
    if (v && !techBadges.includes(v)) {
      setTechBadges([...techBadges, v]);
      setBadgeInput('');
    }
  };
  const removeBadge = (i: number) => setTechBadges(techBadges.filter((_, idx) => idx !== i));

  const addBullet = () => setBullets([...bullets, '']);
  const updateBullet = (i: number, v: string) => setBullets(bullets.map((b, idx) => idx === i ? v : b));
  const removeBullet = (i: number) => setBullets(bullets.filter((_, idx) => idx !== i));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header with save */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <SaveStatusIndicator status={saveStatus} lastSaved={lastSaved} />
        <button type="button" onClick={triggerSave} className="admin-btn-primary"
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {saveStatus === 'saving' && <span className="admin-spinner" />}
          Save All
        </button>
      </div>

      {saveError && (
        <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem' }}>
          {saveError}
        </div>
      )}

      {/* Section A: Global Settings */}
      <SectionCard title="🌐 Global Settings">
        <Field label="Site Name" value={meta.site_name} onChange={v => updateMeta('site_name', v)} />
        <Field label="Site Tagline" value={meta.site_tagline} onChange={v => updateMeta('site_tagline', v)} maxLength={100} />
        <Field label="Default Meta Description" value={meta.default_description} onChange={v => updateMeta('default_description', v)} textarea rows={2} maxLength={160} />
        <Field label="Promo Banner Text" value={meta.promo_text} onChange={v => updateMeta('promo_text', v)} help="Leave empty to hide the banner" />
      </SectionCard>

      {/* Section B: Hero */}
      <SectionCard title="🦸 Hero Section">
        <Field label="Main Headline" value={home.hero_headline} onChange={v => updateHome('hero_headline', v)} textarea rows={2} required />
        <Field label="Sub-headline" value={home.hero_subheadline} onChange={v => updateHome('hero_subheadline', v)} textarea rows={3} />
        <Field label="Badge Text" value={home.hero_badge_text} onChange={v => updateHome('hero_badge_text', v)} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Primary CTA Text" value={home.hero_cta_text} onChange={v => updateHome('hero_cta_text', v)} />
          <Field label="Primary CTA Link" value={home.hero_cta_link} onChange={v => updateHome('hero_cta_link', v)} />
          <Field label="Secondary CTA Text" value={home.hero_cta2_text} onChange={v => updateHome('hero_cta2_text', v)} />
          <Field label="Secondary CTA Link" value={home.hero_cta2_link} onChange={v => updateHome('hero_cta2_link', v)} />
        </div>
      </SectionCard>

      {/* Section C: Stats */}
      <SectionCard title="📊 Stats Bar">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={{ display: 'flex', gap: '0.5rem' }}>
              <Field label={`Stat ${n} Value`} value={(home as any)[`stat${n}_value`]} onChange={v => updateHome(`stat${n}_value`, v)} style={{ flex: '0 0 100px' }} />
              <Field label={`Stat ${n} Label`} value={(home as any)[`stat${n}_label`]} onChange={v => updateHome(`stat${n}_label`, v)} style={{ flex: 1 }} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Section D: Tech Badges */}
      <SectionCard title="🏷️ Tech Badges">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
          {techBadges.map((badge, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.25rem 0.65rem', background: '#fef3c7', color: '#92400e',
              borderRadius: '999px', fontSize: '0.8rem', fontWeight: 500,
            }}>
              {badge}
              <button type="button" onClick={() => removeBadge(i)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontSize: '0.75rem', padding: 0, lineHeight: 1 }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input className="admin-input" value={badgeInput} onChange={e => setBadgeInput(e.target.value)}
            placeholder="Add badge…" style={{ flex: 1 }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBadge(); } }} />
          <button type="button" onClick={addBadge}
            style={{ padding: '0.4rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>Add</button>
        </div>
      </SectionCard>

      {/* Section E: Featured Section Labels */}
      <SectionCard title="📚 Top Courses Section">
        <Field label="Eyebrow Text" value={home.section1_eyebrow} onChange={v => updateHome('section1_eyebrow', v)} />
        <Field label="Section Title" value={home.section1_title} onChange={v => updateHome('section1_title', v)} />
        <Field label="Section Description" value={home.section1_description} onChange={v => updateHome('section1_description', v)} textarea rows={2} />
        <Field label="CTA Button Text" value={home.section1_cta_text} onChange={v => updateHome('section1_cta_text', v)} />
      </SectionCard>

      {/* Section F: Enquiry CTA */}
      <SectionCard title="📬 Enquiry Banner">
        <Field label="Headline" value={home.enquiry_headline} onChange={v => updateHome('enquiry_headline', v)} textarea rows={2} />
        <Field label="Description" value={home.enquiry_description} onChange={v => updateHome('enquiry_description', v)} textarea rows={3} />
        <div>
          <label style={{ display: 'block', fontWeight: 500, fontSize: '0.8rem', marginBottom: '0.5rem' }}>Bullet Points</label>
          {bullets.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>•</span>
              <input className="admin-input" value={b} onChange={e => updateBullet(i, e.target.value)} style={{ flex: 1 }} />
              <button type="button" onClick={() => removeBullet(i)}
                style={{ padding: '0.2rem 0.4rem', border: '1px solid #fecaca', borderRadius: '4px', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>
            </div>
          ))}
          <button type="button" onClick={addBullet}
            style={{ padding: '0.3rem 0.75rem', border: '1px dashed var(--border-color)', borderRadius: '6px', background: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--color-primary)' }}>
            + Add bullet
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

// --- Reusable sub-components ---

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="admin-card" style={{ padding: '1.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {children}
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, textarea, rows, maxLength, required, help, style,
}: {
  label: string; value: string; onChange: (v: string) => void;
  textarea?: boolean; rows?: number; maxLength?: number; required?: boolean; help?: string;
  style?: React.CSSProperties;
}) {
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div style={style}>
      <label style={{ display: 'block', fontWeight: 500, fontSize: '0.8rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      <Tag
        className="admin-input"
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        {...(textarea ? { rows: rows || 3 } : {})}
        maxLength={maxLength}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
        {help && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{help}</span>}
        {maxLength && <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>{value.length}/{maxLength}</span>}
      </div>
    </div>
  );
}
