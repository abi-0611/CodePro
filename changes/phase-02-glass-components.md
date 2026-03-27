# PHASE 2 — Glass Cards, Surfaces & Core Components

## Context
Working inside `admin-frontend/` only. Phase 1 (design tokens) is already done.
Now we upgrade the card, button, badge, and input styles to match the main site's glass-morphism
and polished component style.

## Target file
`admin-frontend/src/styles/admin.css`

---

## Instructions

### Step 1 — Replace `.admin-card`
Find the existing `.admin-card { … }` rule and replace it with:

```css
.admin-card {
  background: var(--glass-bg);
  background-image: linear-gradient(135deg, var(--glass-highlight), transparent 55%);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(22px) saturate(165%);
  -webkit-backdrop-filter: blur(22px) saturate(165%);
  transition: box-shadow var(--duration-base) var(--ease-spring),
              transform var(--duration-base) var(--ease-spring);
  overflow: hidden;
  padding: 1.5rem;
}

.admin-card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-3px);
}
```

### Step 2 — Add `.admin-card-flat` (no hover lift — for form containers)

```css
.admin-card-flat {
  background: var(--glass-bg);
  background-image: linear-gradient(135deg, var(--glass-highlight), transparent 55%);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(22px) saturate(165%);
  -webkit-backdrop-filter: blur(22px) saturate(165%);
  overflow: hidden;
  padding: 1.5rem;
}
```

### Step 3 — Replace `.admin-stat-card`

```css
.admin-stat-card {
  background: var(--glass-bg);
  background-image: linear-gradient(135deg, var(--glass-highlight), transparent 55%);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(22px) saturate(165%);
  -webkit-backdrop-filter: blur(22px) saturate(165%);
  padding: 1.25rem 1.5rem;
  transition: transform var(--duration-base) var(--ease-spring),
              box-shadow var(--duration-base) var(--ease-spring);
}

.admin-stat-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--shadow-card-hover);
}
```

### Step 4 — Replace button rules

```css
/* ── Primary button ── */
.admin-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.375rem;
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  border: none;
  background: var(--color-primary);
  color: #fff;
  position: relative;
  overflow: hidden;
  transition: background var(--duration-fast) ease,
              transform var(--duration-fast) ease,
              box-shadow var(--duration-fast) ease;
}

.admin-btn-primary::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.22) 50%, transparent 60%);
  background-size: 200% 100%;
  animation: admin-shimmer 2.8s infinite;
  pointer-events: none;
}

.admin-btn-primary:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(var(--color-primary-rgb), 0.40);
}

.admin-btn-primary:active {
  transform: translateY(0);
  box-shadow: none;
}

.admin-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* ── Secondary / ghost button ── */
.admin-btn-secondary,
.admin-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-pill);
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  border: 1px solid var(--border-color);
  background: var(--glass-bg);
  color: var(--text-primary);
  transition: background var(--duration-fast) ease,
              border-color var(--duration-fast) ease,
              transform var(--duration-fast) ease;
}

.admin-btn-secondary:hover,
.admin-btn:hover {
  background: var(--color-surface-alt);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

/* ── Danger button ── */
.admin-btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-pill);
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  border: 1px solid #fecaca;
  background: #fee2e2;
  color: #dc2626;
  transition: background var(--duration-fast) ease,
              transform var(--duration-fast) ease;
}

.admin-btn-danger:hover {
  background: #dc2626;
  color: #fff;
  transform: translateY(-1px);
}
```

### Step 5 — Replace `.admin-input`

```css
.admin-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-input);
  background: var(--color-surface);
  color: var(--text-primary);
  font-size: 0.875rem;
  line-height: 1.5;
  transition: border-color var(--duration-fast) ease,
              box-shadow var(--duration-fast) ease;
}

.admin-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.14);
}

.admin-input.error {
  border-color: #ef4444;
}
```

### Step 6 — Add shimmer & gradient animations at the bottom of the file

```css
/* ── Shimmer (button shine) ── */
@keyframes admin-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}

/* ── Gradient text ── */
.admin-gradient-text {
  background: linear-gradient(135deg, var(--color-primary) 0%, #f59e0b 50%, var(--color-primary) 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: admin-gradient-shift 4s ease infinite;
}

@keyframes admin-gradient-shift {
  0%, 100% { background-position:   0% 50%; }
  50%       { background-position: 100% 50%; }
}

/* ── Toast ── */
.admin-toast {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  min-width: 300px;
  padding: 1rem 1.25rem;
  border-radius: var(--radius-card);
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: admin-slide-in-right 0.35s var(--ease-spring);
}

.admin-toast.success { background:#f0fdf4; border-left:4px solid #22c55e; color:#15803d; }
.admin-toast.error   { background:#fef2f2; border-left:4px solid #ef4444; color:#dc2626; }
.admin-toast.info    { background:#eff6ff; border-left:4px solid #3b82f6; color:#1d4ed8; }

@keyframes admin-slide-in-right {
  from { transform: translateX(110%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
```

### Step 7 — Badge styles

```css
.admin-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.65rem;
  border-radius: var(--radius-pill);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  border: 1px solid transparent;
}

.admin-badge-success { background:#f0fdf4; color:#16a34a; border-color:#bbf7d0; }
.admin-badge-warning { background:#fffbeb; color:#d97706; border-color:#fde68a; }
.admin-badge-danger  { background:#fef2f2; color:#dc2626; border-color:#fecaca; }
.admin-badge-info    { background:#eff6ff; color:#2563eb; border-color:#bfdbfe; }
.admin-badge-muted   { background:var(--color-surface-alt); color:var(--text-secondary); border-color:var(--border-color); }
```

## Done signal
When finished, reply: **"Phase 2 complete — glass cards and components upgraded."**
