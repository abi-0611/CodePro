# PHASE 4 — Sidebar, Topbar & Responsive Layout Overhaul

## Context
Working inside `admin-frontend/` only. Phases 1–3 are done.
This phase upgrades the sidebar, topbar, and overall layout to be fully responsive
(mobile / tablet / desktop) and visually consistent with the main site's glass style.

---

## Step 1 — Replace sidebar CSS in `admin-frontend/src/styles/admin.css`

Find and **replace** all rules that start with `.admin-sidebar`, `.admin-topbar`, `.admin-main`,
`.admin-content`, `.admin-sidebar-*`. Replace the entire block with:

```css
/* ════════════════════════════════════════════════
   LAYOUT — Sidebar + Main
   ════════════════════════════════════════════════ */

.admin-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--bg-sidebar);
  color: var(--text-sidebar);
  display: flex;
  flex-direction: column;
  z-index: 50;
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: var(--shadow-sidebar);
  transition: transform var(--duration-base) var(--ease-spring);
  scrollbar-width: none;
}
.admin-sidebar::-webkit-scrollbar { display: none; }

.admin-sidebar-logo {
  padding: 1.375rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  min-height: 64px;
}

.admin-sidebar-nav {
  flex: 1;
  padding: 1rem 0 1rem;
}

.admin-sidebar-section {
  padding: 0.6rem 1.5rem 0.3rem;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.10em;
  color: rgba(148,163,184,0.55);
}

.admin-sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 1.5rem;
  font-size: 0.875rem;
  color: var(--text-sidebar);
  text-decoration: none;
  transition:
    background var(--duration-fast) ease,
    color      var(--duration-fast) ease,
    border-left-color var(--duration-fast) ease;
  border-left: 3px solid transparent;
  border-radius: 0 var(--radius-input) var(--radius-input) 0;
  margin-right: 0.75rem;
  position: relative;
}

.admin-sidebar-link:hover {
  background: rgba(255,255,255,0.06);
  color: #fff;
}

.admin-sidebar-link.active {
  background: rgba(255,255,255,0.09);
  color: #fff;
  border-left-color: var(--color-primary);
  font-weight: 600;
}

/* Active glow pulse on the left border */
.admin-sidebar-link.active::before {
  content: '';
  position: absolute;
  left: -3px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  border-radius: 999px;
  background: var(--color-primary);
  box-shadow: 0 0 8px rgba(var(--color-primary-rgb), 0.7);
}

.admin-sidebar-user {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.8rem;
}

/* ── Main area ── */
.admin-main {
  margin-left: var(--sidebar-width);
  min-height: 100vh;
  transition: margin-left var(--duration-base) var(--ease-spring);
}

/* ── Topbar ── */
.admin-topbar {
  position: sticky;
  top: 0;
  height: var(--header-height);
  background: rgba(245,245,247,0.80);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  z-index: 40;
  transition: background var(--duration-base) ease;
}

[data-theme="dark"] .admin-topbar {
  background: rgba(13,17,23,0.80);
}

/* ── Content area ── */
.admin-content {
  padding: 2rem;
  max-width: 1400px;
}

/* ════════════════════════════════════════════════
   MOBILE — sidebar off-canvas
   ════════════════════════════════════════════════ */

@media (max-width: 768px) {
  .admin-sidebar {
    transform: translateX(-100%);
  }

  .admin-sidebar.open {
    transform: translateX(0);
  }

  .admin-main {
    margin-left: 0;
  }

  .admin-content {
    padding: 1rem;
  }
}

/* ── Sidebar backdrop overlay (mobile) ── */
.admin-sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 49;
  backdrop-filter: blur(2px);
  animation: admin-fade-in 0.2s ease;
}

.admin-sidebar-overlay.visible {
  display: block;
}

@keyframes admin-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ── Mobile hamburger button ── */
.admin-hamburger {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background var(--duration-fast) ease;
}

.admin-hamburger:hover { background: var(--color-surface-alt); }

.admin-hamburger-line {
  display: block;
  width: 22px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 2px;
  transition: transform var(--duration-base) var(--ease-spring),
              opacity   var(--duration-base) ease;
}

.admin-hamburger.open .admin-hamburger-line:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.admin-hamburger.open .admin-hamburger-line:nth-child(2) {
  opacity: 0;
}
.admin-hamburger.open .admin-hamburger-line:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

@media (max-width: 768px) {
  .admin-hamburger { display: flex; }
}
```

---

## Step 2 — Update `AdminLayout.astro` for mobile sidebar

Open `admin-frontend/src/layouts/AdminLayout.astro`.

### 2a — Add a backdrop overlay div right after `<body>`:
```html
<div class="admin-sidebar-overlay" id="sidebar-overlay" aria-hidden="true"></div>
```

### 2b — Replace the existing hamburger `<button>` in the topbar with:
```html
<button
  id="sidebar-toggle"
  class="admin-hamburger md:hidden"
  aria-label="Toggle navigation"
  aria-expanded="false"
>
  <span class="admin-hamburger-line"></span>
  <span class="admin-hamburger-line"></span>
  <span class="admin-hamburger-line"></span>
</button>
```

### 2c — Replace the existing mobile-toggle `<script>` with:
```html
<script>
  const sidebar  = document.getElementById('admin-sidebar');
  const toggle   = document.getElementById('sidebar-toggle');
  const overlay  = document.getElementById('sidebar-overlay');

  function openSidebar() {
    sidebar?.classList.add('open');
    overlay?.classList.add('visible');
    toggle?.classList.add('open');
    toggle?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('visible');
    toggle?.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  toggle?.addEventListener('click', () => {
    const isOpen = sidebar?.classList.contains('open');
    isOpen ? closeSidebar() : openSidebar();
  });

  overlay?.addEventListener('click', closeSidebar);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });

  // Close on nav link click (mobile)
  sidebar?.querySelectorAll('.admin-sidebar-link').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) closeSidebar();
    });
  });

  // Logout button
  document.getElementById('admin-logout-btn')?.addEventListener('click', async () => {
    await fetch('/admin/api/admin-auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  });
</script>
```

---

## Step 3 — Add scroll progress bar to topbar

In `AdminLayout.astro`, inside the `<header class="admin-topbar">`, insert as the **first child**:

```html
<div
  id="admin-scroll-progress"
  style="position:absolute;bottom:0;left:0;height:2px;width:0%;background:linear-gradient(90deg,var(--color-primary),#f59e0b);transition:width 0.1s linear;"
  aria-hidden="true"
></div>
```

Add to the existing `<script>`:
```js
window.addEventListener('scroll', () => {
  const bar = document.getElementById('admin-scroll-progress');
  if (!bar) return;
  const scrollTop  = window.scrollY;
  const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
  const progress   = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
  bar.style.width  = `${progress}%`;
}, { passive: true });
```

---

## Done signal
When finished, reply: **"Phase 4 complete — sidebar and layout are responsive."**
