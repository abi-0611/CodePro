import { useState, useEffect, useCallback, type FormEvent } from 'react';

interface FAQItem {
  q: string;
  a: string;
}

interface CourseFormData {
  title: string;
  slug: string;
  short_description: string;
  description: string;
  icon: string;
  category: string;
  badge: string;
  curriculum: string[];
  curriculum_topics: string[][];
  highlights: string[];
  faqs: FAQItem[];
  duration: string;
  mode: string;
  level: string;
  price: string;
  order: number;
  next_batch: string;
  featured: boolean;
  is_published: boolean;
}

interface CourseOut extends CourseFormData {
  id: string;
  created_at: string;
  updated_at: string;
}

interface CourseFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<CourseOut>;
}

const CATEGORIES = ['Frontend', 'Full Stack', 'Programming', 'Testing', 'Business', 'Design'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Beginner → Intermediate', 'All Levels'];
const MODES = ['Online / Offline', 'Online', 'Offline', 'Hybrid'];
const BADGE_OPTIONS = ['None', 'Popular', 'Best Value', 'New'];
const EMOJI_GRID = ['💻', '⚛️', '🐍', '☕', '🧪', '📊', '🎨', '🌐', '📱', '🔧', '🚀', '📚', '🔒', '🤖', '⚡', '🛠️'];

const emptyForm: CourseFormData = {
  title: '',
  slug: '',
  short_description: '',
  description: '',
  icon: '',
  category: '',
  badge: '',
  curriculum: [''],
  curriculum_topics: [[]],
  highlights: [''],
  faqs: [{ q: '', a: '' }],
  duration: '',
  mode: '',
  level: '',
  price: '',
  order: 1,
  next_batch: '',
  featured: false,
  is_published: false,
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 100);
}

export default function CourseForm({ mode, initialData }: CourseFormProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<CourseFormData>(() => {
    if (initialData) {
      return {
        ...emptyForm,
        ...initialData,
        curriculum: initialData.curriculum?.length ? initialData.curriculum : [''],
        curriculum_topics: initialData.curriculum_topics?.length ? initialData.curriculum_topics : [[]],
        highlights: initialData.highlights?.length ? initialData.highlights : [''],
        faqs: initialData.faqs?.length ? initialData.faqs : [{ q: '', a: '' }],
      };
    }
    return { ...emptyForm };
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === 'edit');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [customBadge, setCustomBadge] = useState('');

  // Track unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Auto-generate slug from title in create mode
  useEffect(() => {
    if (mode === 'create' && !slugManuallyEdited && formData.title) {
      setFormData(prev => ({ ...prev, slug: generateSlug(prev.title) }));
    }
  }, [formData.title, mode, slugManuallyEdited]);

  const updateField = useCallback(<K extends keyof CourseFormData>(key: K, value: CourseFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  }, [errors]);

  // --- Curriculum helpers ---
  const addModule = () => {
    updateField('curriculum', [...formData.curriculum, '']);
    setFormData(prev => ({ ...prev, curriculum_topics: [...prev.curriculum_topics, []] }));
  };
  const removeModule = (i: number) => {
    updateField('curriculum', formData.curriculum.filter((_, idx) => idx !== i));
    setFormData(prev => ({
      ...prev,
      curriculum_topics: prev.curriculum_topics.filter((_, idx) => idx !== i),
    }));
  };
  const updateModule = (i: number, val: string) => {
    updateField('curriculum', formData.curriculum.map((m, idx) => (idx === i ? val : m)));
  };
  const moveModule = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= formData.curriculum.length) return;
    const newCurr = [...formData.curriculum];
    [newCurr[i], newCurr[j]] = [newCurr[j], newCurr[i]];
    const newTopics = [...formData.curriculum_topics];
    [newTopics[i], newTopics[j]] = [newTopics[j], newTopics[i]];
    setFormData(prev => ({ ...prev, curriculum: newCurr, curriculum_topics: newTopics }));
    setIsDirty(true);
  };
  const addTopic = (moduleIdx: number) => {
    const newTopics = [...formData.curriculum_topics];
    if (!newTopics[moduleIdx]) newTopics[moduleIdx] = [];
    if (newTopics[moduleIdx].length >= 3) return;
    newTopics[moduleIdx] = [...newTopics[moduleIdx], ''];
    setFormData(prev => ({ ...prev, curriculum_topics: newTopics }));
    setIsDirty(true);
  };
  const updateTopic = (moduleIdx: number, topicIdx: number, val: string) => {
    const newTopics = [...formData.curriculum_topics];
    newTopics[moduleIdx] = [...(newTopics[moduleIdx] || [])];
    newTopics[moduleIdx][topicIdx] = val;
    setFormData(prev => ({ ...prev, curriculum_topics: newTopics }));
    setIsDirty(true);
  };
  const removeTopic = (moduleIdx: number, topicIdx: number) => {
    const newTopics = [...formData.curriculum_topics];
    newTopics[moduleIdx] = newTopics[moduleIdx].filter((_, idx) => idx !== topicIdx);
    setFormData(prev => ({ ...prev, curriculum_topics: newTopics }));
    setIsDirty(true);
  };

  // --- Highlights helpers ---
  const addHighlight = () => {
    if (formData.highlights.length >= 4) return;
    updateField('highlights', [...formData.highlights, '']);
  };
  const removeHighlight = (i: number) => {
    updateField('highlights', formData.highlights.filter((_, idx) => idx !== i));
  };
  const updateHighlight = (i: number, val: string) => {
    updateField('highlights', formData.highlights.map((h, idx) => (idx === i ? val : h)));
  };

  // --- FAQ helpers ---
  const addFaq = () => {
    updateField('faqs', [...formData.faqs, { q: '', a: '' }]);
  };
  const removeFaq = (i: number) => {
    updateField('faqs', formData.faqs.filter((_, idx) => idx !== i));
  };
  const updateFaq = (i: number, field: 'q' | 'a', val: string) => {
    updateField('faqs', formData.faqs.map((f, idx) => (idx === i ? { ...f, [field]: val } : f)));
  };
  const moveFaq = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= formData.faqs.length) return;
    const newFaqs = [...formData.faqs];
    [newFaqs[i], newFaqs[j]] = [newFaqs[j], newFaqs[i]];
    updateField('faqs', newFaqs);
  };

  // --- Validation ---
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.title.trim()) errs.title = 'Title is required';
    if (!formData.slug.match(/^[a-z0-9-]{3,100}$/)) errs.slug = 'Slug must be 3-100 lowercase chars and hyphens only';
    if (!formData.short_description.trim()) errs.short_description = 'Short description required';
    if (formData.short_description.length > 0 && formData.short_description.length < 10) errs.short_description = 'Must be at least 10 characters';
    if (!formData.icon) errs.icon = 'Icon emoji required';
    if (!formData.category) errs.category = 'Category required';
    if (formData.curriculum.filter(m => m.trim()).length === 0) errs.curriculum = 'At least one curriculum module required';
    if (!formData.duration) errs.duration = 'Duration required';
    if (!formData.mode) errs.mode = 'Mode required';
    if (!formData.level) errs.level = 'Level required';

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      // Switch to first tab with errors
      const tabFields: string[][] = [
        ['title', 'slug', 'short_description', 'icon', 'category'],
        ['curriculum'],
        [],
        ['duration', 'mode', 'level'],
      ];
      for (let t = 0; t < tabFields.length; t++) {
        if (tabFields[t].some(f => errs[f])) {
          setActiveTab(t);
          break;
        }
      }
      return false;
    }
    return true;
  };

  // --- Error counts per tab ---
  const getTabErrorCount = (tabIdx: number): number => {
    const tabFields: string[][] = [
      ['title', 'slug', 'short_description', 'icon', 'category'],
      ['curriculum'],
      [],
      ['duration', 'mode', 'level'],
    ];
    return tabFields[tabIdx]?.filter(f => errors[f]).length || 0;
  };

  // --- Submit ---
  const handleSubmit = async (e: FormEvent, asDraft = false) => {
    e.preventDefault();
    if (asDraft) {
      setFormData(prev => ({ ...prev, is_published: false }));
    }
    if (!asDraft && !validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      ...formData,
      is_published: asDraft ? false : formData.is_published,
      curriculum: formData.curriculum.filter(m => m.trim()),
      curriculum_topics: formData.curriculum_topics.map(topics => topics.filter(t => t.trim())),
      highlights: formData.highlights.filter(h => h.trim()),
      faqs: formData.faqs.filter(f => f.q.trim() && f.a.trim()),
    };

    const url =
      mode === 'create'
        ? '/admin/api/proxy/courses'
        : `/admin/api/proxy/courses/${initialData?.slug || formData.slug}`;
    const method = mode === 'create' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsDirty(false);
        window.location.href = '/admin/dashboard/courses';
      } else {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.detail || data.error || 'Failed to save course');
        if (res.status === 409) {
          setErrors(prev => ({ ...prev, slug: 'This slug is already taken' }));
          setActiveTab(0);
        }
      }
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = ['Basic Info', 'Curriculum', 'Details & FAQs', 'Settings'];

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid var(--border-color)', overflowX: 'auto' }}>
        {tabs.map((tab, i) => {
          const errCount = getTabErrorCount(i);
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(i)}
              style={{
                padding: '0.75rem 1.25rem',
                border: 'none',
                background: activeTab === i
                  ? 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 12%, transparent), color-mix(in srgb, var(--color-primary) 6%, transparent))'
                  : 'none',
                cursor: 'pointer',
                fontWeight: activeTab === i ? 700 : 400,
                fontSize: '0.875rem',
                color: activeTab === i ? 'var(--color-primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === i ? '2px solid var(--color-primary)' : '2px solid transparent',
                marginBottom: '-2px',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderRadius: activeTab === i ? 'var(--radius-input) var(--radius-input) 0 0' : '0',
                transition: 'all 0.2s ease',
              }}
            >
              {tab}
              {errCount > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '999px',
                  fontSize: '0.65rem',
                  padding: '0.1rem 0.45rem',
                  fontWeight: 700,
                }}>{errCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Basic Info */}
      {activeTab === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <FieldWrap label="Title" required error={errors.title}>
            <input
              className="admin-input"
              value={formData.title}
              onChange={e => updateField('title', e.target.value)}
              maxLength={255}
              placeholder="e.g. React Development"
            />
          </FieldWrap>

          <FieldWrap label="Slug" required error={errors.slug} help={`Preview: /courses/${formData.slug || '...'}`}>
            <input
              className="admin-input"
              value={formData.slug}
              onChange={e => { setSlugManuallyEdited(true); updateField('slug', e.target.value); }}
              placeholder="auto-generated-from-title"
              disabled={mode === 'edit'}
              style={mode === 'edit' ? { opacity: 0.6 } : undefined}
            />
          </FieldWrap>

          <FieldWrap label="Short Description" required error={errors.short_description}>
            <textarea
              className="admin-input"
              value={formData.short_description}
              onChange={e => updateField('short_description', e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Brief course description (max 300 chars)"
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'right', display: 'block' }}>
              {formData.short_description.length}/300
            </span>
          </FieldWrap>

          <FieldWrap label="Long Description">
            <textarea
              className="admin-input"
              value={formData.description}
              onChange={e => updateField('description', e.target.value)}
              rows={5}
              placeholder="Detailed course description"
            />
          </FieldWrap>

          <FieldWrap label="Icon (Emoji)" required error={errors.icon}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                className="admin-input"
                value={formData.icon}
                onChange={e => updateField('icon', e.target.value)}
                maxLength={10}
                style={{ width: '80px', textAlign: 'center', fontSize: '1.5rem' }}
                placeholder="🚀"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                {showEmojiPicker ? 'Close' : 'Pick Emoji'}
              </button>
              {showEmojiPicker && (
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                  {EMOJI_GRID.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => { updateField('icon', emoji); setShowEmojiPicker(false); }}
                      style={{
                        fontSize: '1.25rem',
                        padding: '0.35rem',
                        border: formData.icon === emoji ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                        borderRadius: '6px',
                        background: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FieldWrap>

          <FieldWrap label="Category" required error={errors.category}>
            <select
              className="admin-input"
              value={formData.category}
              onChange={e => updateField('category', e.target.value)}
            >
              <option value="">Select category...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FieldWrap>

          <FieldWrap label="Badge">
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                className="admin-input"
                value={BADGE_OPTIONS.includes(formData.badge) || formData.badge === '' ? formData.badge || 'None' : 'custom'}
                onChange={e => {
                  const v = e.target.value;
                  if (v === 'None') updateField('badge', '');
                  else if (v === 'custom') updateField('badge', customBadge);
                  else updateField('badge', v);
                }}
                style={{ flex: 1 }}
              >
                {BADGE_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                <option value="custom">Custom...</option>
              </select>
              {!BADGE_OPTIONS.includes(formData.badge) && formData.badge !== '' && (
                <input
                  className="admin-input"
                  value={formData.badge}
                  onChange={e => { setCustomBadge(e.target.value); updateField('badge', e.target.value); }}
                  placeholder="Custom badge text"
                  style={{ flex: 1 }}
                />
              )}
            </div>
          </FieldWrap>
        </div>
      )}

      {/* Tab 2: Curriculum */}
      {activeTab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {errors.curriculum && (
            <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 500 }}>{errors.curriculum}</div>
          )}
          {formData.curriculum.map((mod, i) => (
            <div key={i} className="admin-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '1.5rem' }}>{i + 1}.</span>
                <input
                  className="admin-input"
                  value={mod}
                  onChange={e => updateModule(i, e.target.value)}
                  placeholder="Module name, e.g. 'Introduction to React'"
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={() => moveModule(i, -1)} disabled={i === 0}
                  style={{ padding: '0.3rem 0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'white', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1, fontSize: '0.75rem' }}>↑</button>
                <button type="button" onClick={() => moveModule(i, 1)} disabled={i === formData.curriculum.length - 1}
                  style={{ padding: '0.3rem 0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'white', cursor: i === formData.curriculum.length - 1 ? 'default' : 'pointer', opacity: i === formData.curriculum.length - 1 ? 0.3 : 1, fontSize: '0.75rem' }}>↓</button>
                {formData.curriculum.length > 1 && (
                  <button type="button" onClick={() => removeModule(i)}
                    style={{ padding: '0.3rem 0.5rem', border: '1px solid #fecaca', borderRadius: '4px', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
                )}
              </div>
              {/* Topics */}
              <div style={{ marginLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {(formData.curriculum_topics[i] || []).map((topic, ti) => (
                  <div key={ti} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>·</span>
                    <input
                      className="admin-input"
                      value={topic}
                      onChange={e => updateTopic(i, ti, e.target.value)}
                      placeholder="Topic, e.g. 'Core concepts & patterns'"
                      style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                    />
                    <button type="button" onClick={() => removeTopic(i, ti)}
                      style={{ padding: '0.2rem 0.4rem', border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>
                  </div>
                ))}
                {(!formData.curriculum_topics[i] || formData.curriculum_topics[i].length < 3) && (
                  <button type="button" onClick={() => addTopic(i)}
                    style={{ alignSelf: 'flex-start', padding: '0.25rem 0.6rem', fontSize: '0.75rem', border: '1px dashed var(--border-color)', borderRadius: '4px', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    + Add topic
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="button" onClick={addModule}
            style={{
              padding: '0.6rem 1rem',
              border: '2px dashed var(--border-color)',
              borderRadius: '8px',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.85rem',
              color: 'var(--color-primary)',
            }}>
            + Add Module
          </button>
        </div>
      )}

      {/* Tab 3: Details & FAQs */}
      {activeTab === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Highlights */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Highlights <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>(max 4)</span></label>
              {formData.highlights.length < 4 && (
                <button type="button" onClick={addHighlight}
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'white', cursor: 'pointer', color: 'var(--color-primary)' }}>
                  + Add
                </button>
              )}
            </div>
            {formData.highlights.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  className="admin-input"
                  value={h}
                  onChange={e => updateHighlight(i, e.target.value)}
                  placeholder="e.g. 'Industry-ready skills'"
                  style={{ flex: 1 }}
                />
                {formData.highlights.length > 1 && (
                  <button type="button" onClick={() => removeHighlight(i)}
                    style={{ padding: '0.3rem 0.5rem', border: '1px solid #fecaca', borderRadius: '4px', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
                )}
              </div>
            ))}
          </div>

          {/* FAQs */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>FAQs</label>
              <button type="button" onClick={addFaq}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'white', cursor: 'pointer', color: 'var(--color-primary)' }}>
                + Add FAQ
              </button>
            </div>
            {formData.faqs.map((faq, i) => (
              <div key={i} className="admin-card" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Q{i + 1}</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }}>
                    <button type="button" onClick={() => moveFaq(i, -1)} disabled={i === 0}
                      style={{ padding: '0.2rem 0.4rem', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'white', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1, fontSize: '0.7rem' }}>↑</button>
                    <button type="button" onClick={() => moveFaq(i, 1)} disabled={i === formData.faqs.length - 1}
                      style={{ padding: '0.2rem 0.4rem', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'white', cursor: i === formData.faqs.length - 1 ? 'default' : 'pointer', opacity: i === formData.faqs.length - 1 ? 0.3 : 1, fontSize: '0.7rem' }}>↓</button>
                    <button type="button" onClick={() => removeFaq(i)}
                      style={{ padding: '0.2rem 0.4rem', border: '1px solid #fecaca', borderRadius: '4px', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>
                  </div>
                </div>
                <input
                  className="admin-input"
                  value={faq.q}
                  onChange={e => updateFaq(i, 'q', e.target.value)}
                  placeholder="Question"
                  style={{ marginBottom: '0.5rem' }}
                />
                <textarea
                  className="admin-input"
                  value={faq.a}
                  onChange={e => updateFaq(i, 'a', e.target.value)}
                  rows={3}
                  placeholder="Answer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Settings */}
      {activeTab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <FieldWrap label="Duration" required error={errors.duration}>
            <input
              className="admin-input"
              value={formData.duration}
              onChange={e => updateField('duration', e.target.value)}
              placeholder="e.g. 8 weeks"
            />
          </FieldWrap>

          <FieldWrap label="Mode" required error={errors.mode}>
            <select className="admin-input" value={formData.mode} onChange={e => updateField('mode', e.target.value)}>
              <option value="">Select mode...</option>
              {MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </FieldWrap>

          <FieldWrap label="Level" required error={errors.level}>
            <select className="admin-input" value={formData.level} onChange={e => updateField('level', e.target.value)}>
              <option value="">Select level...</option>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </FieldWrap>

          <FieldWrap label="Price">
            <input
              className="admin-input"
              value={formData.price}
              onChange={e => updateField('price', e.target.value)}
              placeholder="e.g. ₹15,000 or Contact for pricing"
            />
          </FieldWrap>

          <FieldWrap label="Display Order">
            <input
              className="admin-input"
              type="number"
              min={1}
              max={99}
              value={formData.order}
              onChange={e => updateField('order', parseInt(e.target.value) || 1)}
            />
          </FieldWrap>

          <FieldWrap label="Next Batch">
            <input
              className="admin-input"
              value={formData.next_batch}
              onChange={e => updateField('next_batch', e.target.value)}
              placeholder="e.g. Starts soon"
            />
          </FieldWrap>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '2rem', paddingTop: '0.5rem' }}>
            <ToggleField label="Featured" checked={formData.featured} onChange={v => updateField('featured', v)} />
            <ToggleField label="Published" checked={formData.is_published} onChange={v => updateField('is_published', v)} />
          </div>
        </div>
      )}

      {/* Submit error */}
      {submitError && (
        <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem' }}>
          {submitError}
        </div>
      )}

      {/* Sticky Save Bar */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--glass-border)',
        padding: '1rem 0',
        display: 'flex',
        gap: '0.75rem',
        justifyContent: 'flex-end',
        zIndex: 10,
      }}>
        <button
          type="button"
          onClick={(e) => handleSubmit(e as unknown as FormEvent, true)}
          disabled={isSubmitting}
          className="admin-btn-secondary"
        >
          Save as Draft
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="admin-btn-primary"
          style={{ padding: '0.625rem 1.5rem', fontSize: '0.875rem' }}
        >
          {isSubmitting && <span className="admin-spinner" />}
          {mode === 'create' ? 'Create Course' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

// --- Helper sub-components ---

function FieldWrap({
  label,
  required,
  error,
  help,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontWeight: 500, fontSize: '0.8rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {children}
      {error && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</div>}
      {help && !error && <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginTop: '0.25rem' }}>{help}</div>}
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.875rem' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: '2.75rem',
          height: '1.5rem',
          borderRadius: '999px',
          background: checked ? '#22c55e' : '#d1d5db',
          position: 'relative',
          transition: 'background 0.2s',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: '1.125rem',
          height: '1.125rem',
          borderRadius: '999px',
          background: 'white',
          position: 'absolute',
          top: '0.1875rem',
          left: checked ? '1.4375rem' : '0.1875rem',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
      <span style={{ fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '0.75rem', color: checked ? '#22c55e' : 'var(--text-secondary)' }}>
        {checked ? 'On' : 'Off'}
      </span>
    </label>
  );
}
