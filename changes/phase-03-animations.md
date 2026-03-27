# PHASE 3 — Animations, Scroll Reveals & Micro-interactions

## Context
Working inside `admin-frontend/` only. Phases 1 and 2 are done.
This phase adds the same reveal-on-scroll, float, hover-lift, and cursor-glow animations
that exist on the main site, adapted for the admin UI.

---

## Step 1 — Add animation keyframes to `admin-frontend/src/styles/admin.css`

Append the following **at the end** of the file (before the final closing if any):

```css
/* ════════════════════════════════════════════════
   ANIMATIONS & MICRO-INTERACTIONS
   ════════════════════════════════════════════════ */

/* ── Fade + slide up (same as main site .reveal) ── */
@keyframes admin-fade-up {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes admin-fade-left {
  from { opacity: 0; transform: translateX(-28px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes admin-fade-right {
  from { opacity: 0; transform: translateX(28px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes admin-scale-in {
  from { opacity: 0; transform: scale(0.93); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes admin-float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-10px); }
}

@keyframes admin-pulse-ring {
  0%   { box-shadow: 0 0 0 0   rgba(var(--color-primary-rgb), 0.38); }
  70%  { box-shadow: 0 0 0 12px rgba(var(--color-primary-rgb), 0); }
  100% { box-shadow: 0 0 0 0   rgba(var(--color-primary-rgb), 0); }
}

@keyframes admin-spin {
  to { transform: rotate(360deg); }
}

@keyframes admin-bounce-in {
  0%   { opacity: 0; transform: scale(0.8) translateY(16px); }
  60%  { opacity: 1; transform: scale(1.04) translateY(-4px); }
  100% { transform: scale(1) translateY(0); }
}

/* ── Reveal classes (JS adds .is-visible) ── */
.admin-reveal {
  opacity: 0;
  transform: translateY(32px);
  transition:
    opacity  var(--duration-slow) var(--ease-spring),
    transform var(--duration-slow) var(--ease-spring);
}
.admin-reveal.delay-1 { transition-delay: 80ms;  }
.admin-reveal.delay-2 { transition-delay: 160ms; }
.admin-reveal.delay-3 { transition-delay: 240ms; }
.admin-reveal.delay-4 { transition-delay: 320ms; }
.admin-reveal.delay-5 { transition-delay: 400ms; }

.admin-reveal-left {
  opacity: 0;
  transform: translateX(-32px);
  transition:
    opacity  var(--duration-slow) var(--ease-spring),
    transform var(--duration-slow) var(--ease-spring);
}

.admin-reveal-right {
  opacity: 0;
  transform: translateX(32px);
  transition:
    opacity  var(--duration-slow) var(--ease-spring),
    transform var(--duration-slow) var(--ease-spring);
}

.admin-reveal-scale {
  opacity: 0;
  transform: scale(0.92);
  transition:
    opacity  0.5s var(--ease-spring),
    transform 0.5s var(--ease-spring);
}

.admin-reveal.is-visible,
.admin-reveal-left.is-visible,
.admin-reveal-right.is-visible,
.admin-reveal-scale.is-visible {
  opacity: 1 !important;
  transform: none !important;
}

/* ── Floating decorative blobs ── */
.admin-float       { animation: admin-float 4s ease-in-out infinite; }
.admin-float-slow  { animation: admin-float 7s ease-in-out infinite; }
.admin-float-delay { animation: admin-float 4s ease-in-out 1.2s infinite; }

/* ── Spinner ── */
.admin-spinner {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: admin-spin 0.6s linear infinite;
}

/* ── Card lift (hover) ── */
.admin-card-lift {
  transition:
    transform  var(--duration-base) var(--ease-spring),
    box-shadow var(--duration-base) var(--ease-spring);
}

.admin-card-lift:hover {
  transform: translateY(-6px) scale(1.015);
  box-shadow: var(--shadow-card-hover);
}

/* ── Pulse glow (primary CTA) ── */
.admin-pulse-glow {
  animation: admin-pulse-ring 2s ease-out infinite;
}

/* ── Cursor glow (desktop only — applied via JS) ── */
.admin-cursor-glow {
  position: fixed;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(
    circle,
    rgba(var(--color-primary-rgb), 0.07) 0%,
    transparent 70%
  );
  transform: translate(-50%, -50%);
  transition: left 0.12s ease, top 0.12s ease;
  z-index: 0;
  will-change: left, top;
}

/* ── Toggle switch (publish / active) ── */
.admin-toggle {
  position: relative;
  display: inline-block;
  width: 2.75rem;
  height: 1.5rem;
  cursor: pointer;
}

.admin-toggle input { display: none; }

.admin-toggle-track {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: var(--border-color);
  transition: background var(--duration-fast) ease;
}

.admin-toggle-track::after {
  content: '';
  position: absolute;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  background: #fff;
  top: 0.2rem;
  left: 0.2rem;
  transition: left var(--duration-base) var(--ease-spring);
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}

.admin-toggle input:checked + .admin-toggle-track {
  background: #22c55e;
}

.admin-toggle input:checked + .admin-toggle-track::after {
  left: 1.45rem;
}

/* ── Focus ring (global) ── */
*:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-paper), 0 0 0 4px var(--color-primary);
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .admin-reveal,
  .admin-reveal-left,
  .admin-reveal-right,
  .admin-reveal-scale {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }

  .admin-float,
  .admin-float-slow,
  .admin-float-delay,
  .admin-pulse-glow {
    animation: none !important;
  }

  .admin-cursor-glow { display: none !important; }
}
```

---

## Step 2 — Create the reveal + cursor-glow script

Create a new file: `admin-frontend/src/lib/animations.ts`

```typescript
/**
 * Scroll-reveal observer — mirrors main site's ScrollReveal.astro logic.
 * Call `initAdminAnimations()` once per page after DOM is ready.
 */
export function initAdminAnimations(): void {
  // ── Reveal on scroll ──
  const revealEls = document.querySelectorAll(
    '.admin-reveal, .admin-reveal-left, .admin-reveal-right, .admin-reveal-scale'
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    },
    { threshold: 0.10, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach((el) => observer.observe(el));

  // ── Cursor glow (desktop / fine pointer only) ──
  if (window.matchMedia('(pointer: fine)').matches) {
    const existing = document.querySelector('.admin-cursor-glow');
    if (!existing) {
      const glow = document.createElement('div');
      glow.className = 'admin-cursor-glow';
      glow.setAttribute('aria-hidden', 'true');
      document.body.appendChild(glow);

      let raf = 0;
      window.addEventListener(
        'mousemove',
        (e) => {
          if (raf) cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => {
            glow.style.left = `${e.clientX}px`;
            glow.style.top  = `${e.clientY}px`;
          });
        },
        { passive: true }
      );
    }
  }

  // ── Number counter animation ──
  const counters = document.querySelectorAll<HTMLElement>('[data-count-to]');
  const counterObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        if (el.dataset.animated === 'true') return;
        el.dataset.animated = 'true';
        animateCount(el);
        counterObs.unobserve(el);
      });
    },
    { threshold: 0.4 }
  );

  counters.forEach((el) => counterObs.observe(el));
}

function animateCount(el: HTMLElement): void {
  const target  = Number(el.dataset.countTo  ?? 0);
  const suffix  = el.dataset.suffix ?? '';
  const duration = Number(el.dataset.duration ?? 1600);

  if (!Number.isFinite(target) || target <= 0) {
    el.textContent = `${target}${suffix}`;
    return;
  }

  const start = performance.now();
  const tick = (now: number) => {
    const t    = Math.min(1, (now - start) / duration);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = `${Math.round(target * ease)}${suffix}`;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
```

---

## Step 3 — Wire animations into the AdminLayout

Open `admin-frontend/src/layouts/AdminLayout.astro`.

Add the following `<script>` block **just before the closing `</body>` tag** (keep the existing scripts):

```html
<script>
  import { initAdminAnimations } from '../lib/animations';
  document.addEventListener('DOMContentLoaded', () => initAdminAnimations());
</script>
```

---

## Step 4 — Add `.admin-reveal` to stat cards on the dashboard

Open `admin-frontend/src/pages/dashboard/index.astro`.

On every `<div class="admin-stat-card">`, add `admin-reveal delay-N` classes (N = 1, 2, 3, 4 for each card):

```html
<div class="admin-stat-card admin-reveal delay-1">…</div>
<div class="admin-stat-card admin-reveal delay-2">…</div>
<div class="admin-stat-card admin-reveal delay-3">…</div>
<div class="admin-stat-card admin-reveal delay-4">…</div>
```

Also add `admin-reveal` (no delay) to each Quick Action `<a>` card:

```html
<a … class="admin-card admin-card-lift admin-reveal delay-1 …">…</a>
```

---

## Done signal
When finished, reply: **"Phase 3 complete — animations and scroll reveals wired."**
