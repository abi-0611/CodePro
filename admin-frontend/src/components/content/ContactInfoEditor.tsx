import { useState, useCallback } from 'react';

interface ContactInfoEditorProps {
  initialData: Record<string, any>;
  promoBannerText?: string;
}

export default function ContactInfoEditor({ initialData, promoBannerText = '' }: ContactInfoEditorProps) {
  const [form, setForm] = useState({
    institute_name: initialData.institute_name || '',
    tagline: initialData.tagline || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    address: initialData.address || '',
    city: initialData.city || '',
    state: initialData.state || '',
    pincode: initialData.pincode || '',
    working_hours: initialData.working_hours || '9:00 AM - 6:00 PM IST, Monday to Saturday',
    website_url: initialData.website_url || '',
    google_maps_url: initialData.google_maps_url || '',
    whatsapp_url: initialData.whatsapp_url || '',
    brochure_pdf_url: initialData.brochure_pdf_url || '',
    instagram_url: initialData.instagram_url || '',
    facebook_url: initialData.facebook_url || '',
    youtube_url: initialData.youtube_url || '',
    linkedin_url: initialData.linkedin_url || '',
  });

  const [promoText, setPromoText] = useState(promoBannerText);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMap, setShowMap] = useState(false);

  const update = (key: string, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.institute_name.trim()) errs.institute_name = 'Institute name is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';
    const urlFields = ['website_url', 'google_maps_url', 'whatsapp_url', 'brochure_pdf_url', 'instagram_url', 'facebook_url', 'youtube_url', 'linkedin_url'];
    for (const field of urlFields) {
      const val = (form as any)[field];
      if (val && !/^https?:\/\/.+/.test(val)) errs[field] = 'Must start with http:// or https://';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveMsg(null);

    try {
      // Save contact info
      const contactRes = await fetch('/admin/api/proxy/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!contactRes.ok) {
        const data = await contactRes.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to save contact info');
      }

      // Save promo text separately (meta section)
      if (promoText !== promoBannerText) {
        await fetch('/admin/api/proxy/content/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: [{ section: 'meta', key: 'promo_text', value: promoText, content_type: 'text' }] }),
        });
      }

      setSaveMsg({ type: 'success', text: '✓ Changes saved' });
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err: any) {
      setSaveMsg({ type: 'error', text: err.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  }, [form, promoText, promoBannerText]);

  const testLinks = () => {
    const urlFields = ['website_url', 'google_maps_url', 'whatsapp_url', 'instagram_url', 'facebook_url', 'youtube_url', 'linkedin_url'];
    for (const field of urlFields) {
      const val = (form as any)[field];
      if (val && /^https?:\/\/.+/.test(val)) {
        window.open(val, '_blank', 'noopener');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header with save */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        {saveMsg && (
          <span style={{ fontSize: '0.8rem', fontWeight: 500, color: saveMsg.type === 'success' ? '#22c55e' : '#ef4444' }}>
            {saveMsg.text}
          </span>
        )}
        <button type="button" onClick={handleSave} className="admin-btn-primary" disabled={saving}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
          {saving && <span className="admin-spinner" />}
          Save Changes
        </button>
      </div>

      {/* Section A: Core Contact */}
      <SectionCard title="📍 Institute Information">
        <Field label="Institute Name" value={form.institute_name} onChange={v => update('institute_name', v)} required error={errors.institute_name} />
        <Field label="Site Tagline" value={form.tagline} onChange={v => update('tagline', v)} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Phone Number" value={form.phone} onChange={v => update('phone', v)} help="+91 prefix recommended" />
          <Field label="Email Address" value={form.email} onChange={v => update('email', v)} error={errors.email} />
        </div>
        <Field label="Full Address" value={form.address} onChange={v => update('address', v)} textarea rows={3} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <Field label="City" value={form.city} onChange={v => update('city', v)} />
          <Field label="State" value={form.state} onChange={v => update('state', v)} />
          <Field label="Pincode" value={form.pincode} onChange={v => update('pincode', v)} />
        </div>
        <Field label="Working Hours" value={form.working_hours} onChange={v => update('working_hours', v)} />
      </SectionCard>

      {/* Section B: URLs */}
      <SectionCard title="🔗 URLs & Links">
        <UrlField label="Website URL" value={form.website_url} onChange={v => update('website_url', v)} error={errors.website_url} />
        <UrlField label="Google Maps URL" value={form.google_maps_url} onChange={v => update('google_maps_url', v)} error={errors.google_maps_url} />
        <UrlField label="WhatsApp URL" value={form.whatsapp_url} onChange={v => update('whatsapp_url', v)} error={errors.whatsapp_url}
          help="Format: https://wa.me/CountryCodePhoneNumber (no spaces, no +)" />
        <UrlField label="Brochure PDF URL" value={form.brochure_pdf_url} onChange={v => update('brochure_pdf_url', v)} error={errors.brochure_pdf_url}
          help="Optional — external hosted PDF link" />
      </SectionCard>

      {/* Section C: Social Media */}
      <SectionCard title="📱 Social Media">
        <UrlField label="Instagram URL" value={form.instagram_url} onChange={v => update('instagram_url', v)} error={errors.instagram_url} />
        <UrlField label="Facebook URL" value={form.facebook_url} onChange={v => update('facebook_url', v)} error={errors.facebook_url} />
        <UrlField label="YouTube URL" value={form.youtube_url} onChange={v => update('youtube_url', v)} error={errors.youtube_url} />
        <UrlField label="LinkedIn URL" value={form.linkedin_url} onChange={v => update('linkedin_url', v)} error={errors.linkedin_url} />
        <button type="button" onClick={testLinks}
          style={{ alignSelf: 'flex-start', padding: '0.4rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--color-primary)' }}>
          🔗 Test All Links
        </button>
      </SectionCard>

      {/* Section D: Promo Banner */}
      <SectionCard title="📢 Notification Banner">
        <Field label="Banner Text" value={promoText} onChange={setPromoText}
          help="Shown at the top of the website. Leave empty to hide the banner." />
        {promoText && (
          <div style={{ padding: '0.6rem 1rem', background: 'var(--color-primary)', color: 'white', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center', fontWeight: 500 }}>
            {promoText}
          </div>
        )}
      </SectionCard>

      {/* Section E: Google Maps Preview */}
      {form.google_maps_url && (
        <SectionCard title="🗺️ Google Maps Preview">
          {!showMap ? (
            <button type="button" onClick={() => setShowMap(true)}
              style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>
              Preview Map
            </button>
          ) : (
            <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <iframe
                src={form.google_maps_url.replace('/maps/', '/maps/embed?')}
                width="100%" height="300" style={{ border: 0 }}
                loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps Preview"
              />
            </div>
          )}
        </SectionCard>
      )}
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
  label, value, onChange, textarea, rows, maxLength, required, help, error, style,
}: {
  label: string; value: string; onChange: (v: string) => void;
  textarea?: boolean; rows?: number; maxLength?: number; required?: boolean; help?: string; error?: string;
  style?: React.CSSProperties;
}) {
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div style={style}>
      <label style={{ display: 'block', fontWeight: 500, fontSize: '0.8rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      <Tag className="admin-input" value={value} onChange={(e: any) => onChange(e.target.value)}
        {...(textarea ? { rows: rows || 3 } : {})} maxLength={maxLength}
        style={error ? { borderColor: '#ef4444' } : undefined} />
      {error && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem' }}>{error}</div>}
      {help && !error && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'block' }}>{help}</span>}
    </div>
  );
}

function UrlField({
  label, value, onChange, error, help,
}: {
  label: string; value: string; onChange: (v: string) => void; error?: string; help?: string;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontWeight: 500, fontSize: '0.8rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input className="admin-input" value={value} onChange={e => onChange(e.target.value)}
          placeholder="https://..." style={{ flex: 1, ...(error ? { borderColor: '#ef4444' } : {}) }} />
        {value && /^https?:\/\/.+/.test(value) && (
          <a href={value} target="_blank" rel="noopener noreferrer"
            style={{ padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'white', textDecoration: 'none', fontSize: '0.8rem', flexShrink: 0 }}
            title="Open link">↗</a>
        )}
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem' }}>{error}</div>}
      {help && !error && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'block' }}>{help}</span>}
    </div>
  );
}
