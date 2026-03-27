# PHASE 1 — Design Tokens & CSS Foundation

## Context
You are working inside `admin-frontend/` only. Do NOT touch any files outside this folder.
The main site (`src/styles/global.css`) has a polished design system. Your job is to port that
design system into the admin frontend so both share the same visual language.

## Target file
`admin-frontend/src/styles/admin.css`

## Instructions

### Step 1 — Replace the `:root` block
Find the existing `:root { … }` block and **replace it entirely** with the following:

```css
:root {
  /* ── Brand colours (identical to main site) ── */
  --color-primary:        #b45309;
  --color-primary-dark:   #92400e;
  --color-primary-light:  #fef3c7;
  --color-primary-rgb:    180, 83, 9;

  /* ── Semantic surface colours (light mode) ── */
  --color-ink:            #0f0f0f;
  --color-muted:          rgba(15,15,15,0.65);
  --color-subtle:         rgba(15,15,15,0.38);
  --color-paper:          #f7f7f9;
  --color-surface:        #ffffff;
  --color-surface-alt:    #f0f4ff;
  --color-border:         rgba(15,15,15,0.10);

  /* ── Admin layout ── */
  --sidebar-width:        260px;
  --header-height:        64px;
  --bg-page:              #f5f5f7;
  --bg-sidebar:           #0f172a;
  --bg-sidebar-hover:     #1e293b;
  --bg-card:              #ffffff;
  --text-primary:         #0f0f0f;
  --text-secondary:       rgba(15,15,15,0.65);
  --text-sidebar:         #94a3b8;
  --text-sidebar-active:  #ffffff;
  --border-color:         rgba(15,15,15,0.10);

  /* ── Glassmorphism ── */
  --glass-bg:             color-mix(in srgb, var(--color-surface) 55%, transparent);
  --glass-border:         color-mix(in srgb, var(--color-border) 80%, transparent);
  --glass-highlight:      color-mix(in srgb, var(--color-surface) 35%, transparent);
  --glass-inset:          color-mix(in srgb, var(--color-surface) 22%, transparent);

  /* ── Shape & depth ── */
  --radius-card:          18px;
  --radius-pill:          999px;
  --radius-input:         12px;
  --shadow-card:          0 4px 24px rgba(0,0,0,0.07);
  --shadow-card-hover:    0 18px 55px rgba(0,0,0,0.13);
  --shadow-sidebar:       4px 0 24px rgba(0,0,0,0.12);

  /* ── Motion ── */
  --ease-spring:          cubic-bezier(0.16,1,0.3,1);
  --ease-out:             cubic-bezier(0.0,0,0.2,1);
  --duration-fast:        150ms;
  --duration-base:        300ms;
  --duration-slow:        600ms;

  /* ── Grid background ── */
  --grid-cell:            48px;
}
```

### Step 2 — Add dark-mode overrides
Directly **after** the `:root` block, insert:

```css
[data-theme="dark"] {
  --color-ink:          #f7f7f9;
  --color-muted:        rgba(247,247,249,0.65);
  --color-subtle:       rgba(247,247,249,0.38);
  --color-paper:        #0d1117;
  --color-surface:      #161b22;
  --color-surface-alt:  #1c2128;
  --color-border:       rgba(247,247,249,0.10);

  --bg-page:            #0d1117;
  --bg-card:            #161b22;
  --text-primary:       #f7f7f9;
  --text-secondary:     rgba(247,247,249,0.65);
  --border-color:       rgba(247,247,249,0.10);

  --glass-bg:           color-mix(in srgb, var(--color-surface) 68%, transparent);
  --glass-border:       color-mix(in srgb, var(--color-border) 90%, transparent);
  --glass-highlight:    color-mix(in srgb, var(--color-ink) 18%, transparent);
  --glass-inset:        color-mix(in srgb, var(--color-ink) 10%, transparent);
}
```

### Step 3 — Update `body` base styles
Replace the existing `body { … }` rule with:

```css
body {
  font-family: "Inter", system-ui, sans-serif;
  background-color: var(--bg-page);
  color: var(--text-primary);
  margin: 0;
  overflow-x: hidden;
  transition: background-color var(--duration-base) ease,
              color var(--duration-base) ease;

  /* Same subtle grid as the main site */
  background-image:
    linear-gradient(var(--color-border) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-border) 1px, transparent 1px);
  background-size: var(--grid-cell) var(--grid-cell);
  background-position: center top;
}

h1, h2, h3, h4, h5, h6 {
  font-family: "Space Grotesk", system-ui, sans-serif;
  line-height: 1.12;
  letter-spacing: -0.02em;
}
```

### Step 4 — Add font import at the top of the file
Make sure these lines appear **at the very top** of `admin.css` (before all rules):

```css
@import "@fontsource/space-grotesk/400.css";
@import "@fontsource/space-grotesk/700.css";
@import "@fontsource/inter/400.css";
@import "@fontsource/inter/600.css";
@import "tailwindcss";
```

(Keep any existing `@import` lines that are already there; just ensure these four are present.)

### Step 5 — Verify
After saving, confirm:
- No duplicate `:root` blocks exist.
- The file still contains `.admin-sidebar`, `.admin-card`, `.admin-input`, `.admin-btn-primary` rules (do NOT delete those; only the `:root` / `body` / font imports should change in this phase).

## Done signal
When finished, reply: **"Phase 1 complete — design tokens applied."**
