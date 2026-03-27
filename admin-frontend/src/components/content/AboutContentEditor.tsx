import { useState, useCallback } from 'react';
import { useAutoSave, SaveStatusIndicator } from '../../lib/autosave';

interface AboutContentEditorProps {
  initialData: {
    about: Record<string, any>;
  };
}

function getVal(section: Record<string, any>, key: string, fallback = ''): string {
  return section[key] ?? section[`${key}_json`] ?? fallback;
}

interface Trainer {
  name: string;
  designation: string;
  exp: string;
  linkedin: string;
  photo_url: string;
}

interface Certification {
  name: string;
  logo_url: string;
}

export default function AboutContentEditor({ initialData }: AboutContentEditorProps) {
  const about = initialData.about || {};

  const [header, setHeader] = useState({
    about_eyebrow: getVal(about, 'about_eyebrow', 'About'),
    about_h1: getVal(about, 'about_h1', 'Built for practical learning'),
    about_tagline: getVal(about, 'about_tagline'),
  });

  const [story, setStory] = useState({
    story_para_1: getVal(about, 'story_para_1'),
    story_para_2: getVal(about, 'story_para_2'),
    story_para_3: getVal(about, 'story_para_3'),
    founding_year: getVal(about, 'founding_year', '2022'),
  });

  const [mission, setMission] = useState({
    mission_text: getVal(about, 'mission_text'),
    vision_text: getVal(about, 'vision_text'),
  });

  const [stats, setStats] = useState({
    stat1_value: getVal(about, 'stat1_value', '500+'),
    stat1_label: getVal(about, 'stat1_label', 'Students Trained'),
    stat2_value: getVal(about, 'stat2_value', '8+'),
    stat2_label: getVal(about, 'stat2_label', 'Courses Offered'),
    stat3_value: getVal(about, 'stat3_value', '95%'),
    stat3_label: getVal(about, 'stat3_label', 'Satisfaction Rate'),
    stat4_value: getVal(about, 'stat4_value', '3+'),
    stat4_label: getVal(about, 'stat4_label', 'Years Experience'),
  });

  const [trainers, setTrainers] = useState<Trainer[]>(() => {
    try {
      const raw = about.trainers_json || about.trainers;
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { /* ignore */ }
    return Array.from({ length: 4 }, () => ({ name: '', designation: 'B.Tech Graduate & Trainer', exp: '3 years teaching experience', linkedin: '', photo_url: '' }));
  });

  const [certs, setCerts] = useState<Certification[]>(() => {
    try {
      const raw = about.certifications_json || about.certifications;
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { /* ignore */ }
    return Array.from({ length: 4 }, () => ({ name: '', logo_url: '' }));
  });

  const [saveError, setSaveError] = useState<string | null>(null);

  const buildPayload = useCallback(() => {
    const updates: { section: string; key: string; value?: string; value_json?: unknown; content_type: string }[] = [];
    for (const [key, value] of Object.entries(header)) {
      updates.push({ section: 'about', key, value, content_type: 'text' });
    }
    for (const [key, value] of Object.entries(story)) {
      updates.push({ section: 'about', key, value, content_type: 'text' });
    }
    for (const [key, value] of Object.entries(mission)) {
      updates.push({ section: 'about', key, value, content_type: 'text' });
    }
    for (const [key, value] of Object.entries(stats)) {
      updates.push({ section: 'about', key, value, content_type: 'text' });
    }
    updates.push({ section: 'about', key: 'trainers', value_json: trainers, content_type: 'json' });
    updates.push({ section: 'about', key: 'certifications', value_json: certs, content_type: 'json' });
    return { updates };
  }, [header, story, mission, stats, trainers, certs]);

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
    { header, story, mission, stats, trainers, certs },
    { delay: 30000, onSave: handleSave, onSaveError: (err) => setSaveError(err.message) },
  );

  const updateTrainer = (i: number, key: keyof Trainer, val: string) => {
    setTrainers(prev => prev.map((t, idx) => idx === i ? { ...t, [key]: val } : t));
  };
  const updateCert = (i: number, key: keyof Certification, val: string) => {
    setCerts(prev => prev.map((c, idx) => idx === i ? { ...c, [key]: val } : c));
  };

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
        <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem' }}>{saveError}</div>
      )}

      {/* Section A: Page Header */}
      <SectionCard title="📄 Page Header">
        <Field label="Eyebrow Text" value={header.about_eyebrow} onChange={v => setHeader(p => ({ ...p, about_eyebrow: v }))} />
        <Field label="H1 Headline" value={header.about_h1} onChange={v => setHeader(p => ({ ...p, about_h1: v }))} required />
        <Field label="Tagline" value={header.about_tagline} onChange={v => setHeader(p => ({ ...p, about_tagline: v }))} textarea rows={2} />
      </SectionCard>

      {/* Section B: Story */}
      <SectionCard title="📖 Our Story">
        <Field label="Story Paragraph 1" value={story.story_para_1} onChange={v => setStory(p => ({ ...p, story_para_1: v }))} textarea rows={5} />
        <Field label="Story Paragraph 2" value={story.story_para_2} onChange={v => setStory(p => ({ ...p, story_para_2: v }))} textarea rows={5} />
        <Field label="Story Paragraph 3" value={story.story_para_3} onChange={v => setStory(p => ({ ...p, story_para_3: v }))} textarea rows={5} />
        <Field label="Founding Year" value={story.founding_year} onChange={v => setStory(p => ({ ...p, founding_year: v }))} />
      </SectionCard>

      {/* Section C: Mission & Vision */}
      <SectionCard title="🎯 Mission & Vision">
        <Field label="Mission Text" value={mission.mission_text} onChange={v => setMission(p => ({ ...p, mission_text: v }))} textarea rows={4} />
        <Field label="Vision Text" value={mission.vision_text} onChange={v => setMission(p => ({ ...p, vision_text: v }))} textarea rows={4} />
      </SectionCard>

      {/* Section D: Stats */}
      <SectionCard title="📊 About Page Stats">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={{ display: 'flex', gap: '0.5rem' }}>
              <Field label={`Stat ${n} Value`} value={(stats as any)[`stat${n}_value`]}
                onChange={v => setStats(p => ({ ...p, [`stat${n}_value`]: v }))} style={{ flex: '0 0 100px' }} />
              <Field label={`Stat ${n} Label`} value={(stats as any)[`stat${n}_label`]}
                onChange={v => setStats(p => ({ ...p, [`stat${n}_label`]: v }))} style={{ flex: 1 }} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Section E: Trainers */}
      <SectionCard title="👥 Team Members">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {trainers.map((trainer, i) => (
            <div key={i} className="admin-card" style={{ padding: '1rem', background: 'var(--bg-page)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Trainer {i + 1}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <Field label="Name" value={trainer.name} onChange={v => updateTrainer(i, 'name', v)} required />
                <Field label="Designation" value={trainer.designation} onChange={v => updateTrainer(i, 'designation', v)} />
                <Field label="Experience" value={trainer.exp} onChange={v => updateTrainer(i, 'exp', v)} />
                <Field label="LinkedIn URL" value={trainer.linkedin} onChange={v => updateTrainer(i, 'linkedin', v)} />
                <Field label="Photo URL" value={trainer.photo_url} onChange={v => updateTrainer(i, 'photo_url', v)} help="Use a hosted image URL" />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Section F: Certifications */}
      <SectionCard title="🏆 Certifications & Accreditations">
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>These show in the certification logos strip on the About page</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {certs.map((cert, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
              <Field label={`Cert ${i + 1} Name`} value={cert.name} onChange={v => updateCert(i, 'name', v)} style={{ flex: 1 }} />
              <Field label="Logo URL" value={cert.logo_url} onChange={v => updateCert(i, 'logo_url', v)} style={{ flex: 1 }} />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="admin-card" style={{ padding: '1.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>{children}</div>
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
      <Tag className="admin-input" value={value} onChange={(e: any) => onChange(e.target.value)}
        {...(textarea ? { rows: rows || 3 } : {})} maxLength={maxLength} />
      {help && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'block' }}>{help}</span>}
    </div>
  );
}
