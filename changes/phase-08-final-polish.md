# PHASE 8 — Final Responsive Polish, Accessibility & QA

## Context
Working inside `admin-frontend/` only. Phases 1–7 are done.
This final phase handles tablet breakpoints, touch targets, reduced-motion safety,
skip-links, `prefers-color-scheme` init, and cross-component consistency checks.

---

## Part A — Tablet breakpoint (768px–1024px)

Append to `admin-frontend/src/styles/admin.css`:

```css
/* ════════════════════════════════════════════════
   TABLET BREAKPOINT (768–1024px)
   ════════════════════════════════════════════════ */

@media (min-width: 768px) and (max-width: 1024px) {

  :root {
    --sidebar-width: 220px;
  }

  .admin-content {
    padding: 1.5rem;
  }

  /* Collapse sidebar to icon-only on narrow tablets */
  .admin-sidebar-link span:last-child {
    font-size: 0.8rem;
  }

  /* Stack course form grid */
  .admin-course-grid-2col {
    grid-template-columns: 1fr !important;
  }

  /* Edit page — hide live preview sidebar on tablet */
  .course-preview-sidebar {
    display: none;
  }
}

/* ════════════════════════════════════════════════
   TOUCH TARGETS — minimum 44 × 44 px
   ════════════════════════════════════════════════ */

@media (max-width: 1024px) {
  .admin-btn-primary,
  .admin-btn-secondary,
  .admin-btn,
  .admin-btn-danger,
  button,
  [role="button"] {
    min-height: 44px;
  }

  .admin-sidebar-link {
    padding: 0.8rem 1.5rem;
  }

  .admin-input,
  select.admin-input,
  textarea.admin-input {
    font-size: 1rem; /* prevents iOS zoom */
  }
}

/* ════════════════════════════════════════════════
   PRINT — hide sidebar / topbar
   ════════════════════════════════════════════════ */

@media print {
  .admin-sidebar,
  .admin-topbar,
  .admin-sidebar-overlay { display: none !important; }
  .admin-main { margin-left: 0 !important; }
}
```

---

## Part B — Skip-to-content link

In `admin-frontend/src/layouts/AdminLayout.astro`, add as the **very first child of `<body>`**:

```html
<a
  href="#admin-main-content"
  style="
    position: absolute;
    top: -100px;
    left: 1rem;
    background: var(--color-primary);
    color: #fff;
    padding: 0.5rem 1rem;
    border-radius: var(--radius-pill);
    font-weight: 600;
    z-index: 200;
    transition: top 0.15s ease;
  "
  onfocus="this.style.top='1rem'"
  onblur="this.style.top='-100px'"
>
  Skip to content
</a>
```

Also ensure the `<main>` element has `id="admin-main-content"`:
```html
<main class="admin-content" id="admin-main-content">
  <slot />
</main>
```

---

## Part C — `prefers-color-scheme` init script

In `AdminLayout.astro`, add this **inline script inside `<head>`** (before any stylesheets)
to prevent flash of wrong theme:

```html
<script is:inline>
  (function () {
    var stored = localStorage.getItem('admin-theme');
    var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (sysDark ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  })();
</script>
```

---

## Part D — Page loading shimmer for data-heavy pages

Add this CSS to `admin.css`:

```css
/* ── Skeleton shimmer (loading state) ── */
@keyframes admin-skeleton-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}

.admin-skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-alt) 25%,
    color-mix(in srgb, var(--color-border) 80%, var(--color-surface)) 50%,
    var(--color-surface-alt) 75%
  );
  background-size: 800px 100%;
  animation: admin-skeleton-shimmer 1.4s ease-in-out infinite;
  border-radius: var(--radius-input);
}

.admin-skeleton-text {
  height: 1rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.admin-skeleton-title {
  height: 1.5rem;
  width: 60%;
  border-radius: 4px;
  margin-bottom: 0.75rem;
}

.admin-skeleton-card {
  height: 120px;
  border-radius: var(--radius-card);
}
```

---

## Part E — Consistent scrollbar styling

```css
/* ── Custom scrollbars (Webkit) ── */
::-webkit-scrollbar        { width: 6px; height: 6px; }
::-webkit-scrollbar-track  { background: transparent; }
::-webkit-scrollbar-thumb  {
  background: var(--border-color);
  border-radius: 999px;
  transition: background var(--duration-fast) ease;
}
::-webkit-scrollbar-thumb:hover { background: var(--color-primary); }

/* ── Firefox ── */
* { scrollbar-width: thin; scrollbar-color: var(--border-color) transparent; }
```

---

## Part F — Final consistency checks (manual review list)

After applying all CSS, verify the following by opening each page:

| Page | Check |
|---|---|
| `/admin/login` | Split layout visible on desktop; single column on mobile; button shimmer works |
| `/admin/dashboard` | Stat numbers count up on scroll; quick-action cards lift on hover |
| `/admin/dashboard/courses` | Filter pills animate; table rows glow on hover; drag-and-drop visual works |
| `/admin/dashboard/courses/new` | Tab navigation highlights with gradient bg; save bar glass effect |
| `/admin/dashboard/home-content` | Section cards pop in on scroll; save button shimmer |
| `/admin/dashboard/about-content` | Same as above |
| `/admin/dashboard/contact` | Same |
| `/admin/dashboard/security` | Password strength bar animates |
| Dark mode toggle (topbar) | Flips correctly; no flash on reload |
| Mobile (< 768px) | Sidebar slides in/out; overlay dims background; all tap targets ≥ 44 px |
| Tablet (768–1024px) | Sidebar narrower; content still readable |

---

## Part G — Final cleanup

1. Remove any duplicate CSS rules that may have been created during phases 1–7.
   Run a search for duplicate `@keyframes admin-shimmer` or `.admin-card {` blocks and keep only one.

2. Ensure `admin.css` still has the existing `.toggle-switch` rules for the publish toggle in the courses table.

3. Confirm the file order at the top of `admin.css` is:
   ```css
   @import "@fontsource/space-grotesk/400.css";
   @import "@fontsource/space-grotesk/700.css";
   @import "@fontsource/inter/400.css";
   @import "@fontsource/inter/600.css";
   @import "tailwindcss";
   ```

4. Run `npm run build` inside `admin-frontend/` and confirm there are no TypeScript or CSS errors.

---

## Done signal
When finished, reply: **"Phase 8 complete — admin frontend fully polished and production-ready."**
