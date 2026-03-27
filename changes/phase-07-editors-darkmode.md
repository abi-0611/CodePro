# PHASE 7 — Content Editors, Course Form & Dark Mode Toggle

## Context
Working inside `admin-frontend/` only. Phases 1–6 are done.
This phase polishes the React content-editor components, the course create/edit pages,
and wires a working dark-mode toggle into the topbar — matching the main site's ThemeToggle.

---

## Part A — Dark Mode Toggle

### A1 — Create `admin-frontend/src/components/AdminThemeToggle.astro`

```astro
---
// No props
---
<button
  id="admin-theme-toggle"
  class="admin-theme-toggle"
  type="button"
  aria-label="Toggle theme"
  title="Toggle theme"
  style="
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: var(--radius-pill);
    border: 1px solid var(--border-color);
    background: var(--glass-bg);
    color: var(--text-primary);
    cursor: pointer;
    transition: background var(--duration-fast) ease,
                transform  var(--duration-fast) ease;
  "
>
  <!-- Sun icon (shown in dark mode) -->
  <svg id="admin-icon-sun" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
       viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round" style="display:none">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41
             M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
  </svg>
  <!-- Moon icon (shown in light mode) -->
  <svg id="admin-icon-moon" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
       viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
</button>

<script is:inline>
  const root   = document.documentElement;
  const toggle = document.getElementById('admin-theme-toggle');
  const sun    = document.getElementById('admin-icon-sun');
  const moon   = document.getElementById('admin-icon-moon');

  function applyTheme(theme) {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      if (sun)  sun.style.display  = 'block';
      if (moon) moon.style.display = 'none';
    } else {
      root.removeAttribute('data-theme');
      if (sun)  sun.style.display  = 'none';
      if (moon) moon.style.display = 'block';
    }
    localStorage.setItem('admin-theme', theme);
  }

  // Init from storage or system pref
  const stored = localStorage.getItem('admin-theme');
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(stored ?? (sysDark ? 'dark' : 'light'));

  toggle?.addEventListener('click', () => {
    const isDark = root.getAttribute('data-theme') === 'dark';
    applyTheme(isDark ? 'light' : 'dark');
  });

  // Hover micro-interaction
  toggle?.addEventListener('mouseenter', () => {
    toggle.style.transform = 'rotate(20deg) scale(1.1)';
  });
  toggle?.addEventListener('mouseleave', () => {
    toggle.style.transform = '';
  });
</script>
```

### A2 — Add it to the topbar in `AdminLayout.astro`

Inside `<header class="admin-topbar">`, import and add the component next to the "View Live Site" link:

```astro
---
import AdminThemeToggle from '../components/AdminThemeToggle.astro';
---
…
<div style="display:flex;align-items:center;gap:0.75rem">
  <AdminThemeToggle />
  <a href="/" target="_blank" rel="noopener"
     style="font-size:0.8rem;color:var(--color-primary);text-decoration:none;font-weight:500">
    View Live Site →
  </a>
</div>
```

---

## Part B — Shared editor style additions

Add this block to `admin-frontend/src/styles/admin.css` (append at end):

```css
/* ════════════════════════════════════════════════
   CONTENT EDITORS — Section cards
   ════════════════════════════════════════════════ */

.admin-editor-section {
  background: var(--glass-bg);
  background-image: linear-gradient(135deg, var(--glass-highlight), transparent 55%);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(22px) saturate(165%);
  -webkit-backdrop-filter: blur(22px) saturate(165%);
  padding: 1.5rem;
  margin-bottom: 1.25rem;
  transition: box-shadow var(--duration-base) var(--ease-spring);
}

.admin-editor-section:focus-within {
  box-shadow: var(--shadow-card-hover), 0 0 0 2px rgba(var(--color-primary-rgb), 0.18);
}

.admin-editor-section h3 {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ── Save status indicator ── */
.admin-save-status {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-pill);
  transition: all var(--duration-fast) ease;
}
.admin-save-status.idle    { opacity: 0; }
.admin-save-status.pending { background:#fffbeb; color:#d97706; border:1px solid #fde68a; }
.admin-save-status.saving  { background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe; }
.admin-save-status.saved   { background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; }
.admin-save-status.error   { background:#fef2f2; color:#dc2626; border:1px solid #fecaca; }

/* ── Tag / badge chips ── */
.admin-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-pill);
  font-size: 0.78rem;
  font-weight: 600;
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary-dark);
  border: 1px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
  cursor: default;
  transition: all var(--duration-fast) ease;
}

.admin-chip button {
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  font-size: 0.9rem;
  line-height: 1;
  padding: 0;
  opacity: 0.6;
  transition: opacity var(--duration-fast) ease;
}

.admin-chip button:hover { opacity: 1; }

/* ── Drag handle ── */
.admin-drag-handle {
  cursor: grab;
  color: var(--text-secondary);
  opacity: 0.5;
  transition: opacity var(--duration-fast) ease;
  user-select: none;
}

.admin-drag-handle:hover { opacity: 1; }
.admin-drag-handle:active { cursor: grabbing; }

/* ── Textarea auto-resize helper ── */
.admin-textarea-auto {
  resize: vertical;
  min-height: 80px;
}
```

---

## Part C — Course Form tabs (`CourseForm.tsx`)

Open `admin-frontend/src/components/courses/CourseForm.tsx`.

### C1 — Tab navigation
Find the tab navigation `<button>` elements (there are 4: Basic Info, Curriculum, Details & FAQs, Settings).

Replace the inline style for **active** tab state with:
```ts
style={{
  padding: '0.75rem 1.25rem',
  border: 'none',
  background: activeTab === i
    ? `linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 12%, transparent), color-mix(in srgb, var(--color-primary) 6%, transparent))`
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
```

### C2 — Submit / Save-as-Draft buttons
Replace the save bar at the bottom with glass-style buttons:

```tsx
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
```

---

## Part D — Page wrappers for editor pages

For each of these pages, wrap the main `<div>` container with an `admin-reveal` class:

- `dashboard/home-content.astro`
- `dashboard/about-content.astro`
- `dashboard/contact.astro`
- `dashboard/security.astro`
- `dashboard/courses/new.astro`
- `dashboard/courses/[slug]/edit.astro`

Example change:
```html
<!-- Before -->
<div style="display:flex;flex-direction:column;gap:1.5rem;max-width:860px">

<!-- After -->
<div class="admin-reveal" style="display:flex;flex-direction:column;gap:1.5rem;max-width:860px">
```

---

## Done signal
When finished, reply: **"Phase 7 complete — editors, forms, and dark mode wired."**
