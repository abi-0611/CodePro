# PHASE 6 — Dashboard & Courses List Page Polish

## Context
Working inside `admin-frontend/` only. Phases 1–5 are done.
This phase polishes the Dashboard (`dashboard/index.astro`) and the Courses list
(`dashboard/courses/index.astro`) with the main site's animation classes, glass surfaces,
gradient stat numbers, category pills with colour, and interactive table rows.

---

## Part A — Dashboard (`admin-frontend/src/pages/dashboard/index.astro`)

### A1 — Stats grid
Wrap all four stat-card divs in an outer container with a grid + gap, and add
`admin-reveal delay-N` + `admin-card-lift` to each:

```html
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:1.25rem;margin-bottom:2rem">

  <div class="admin-stat-card admin-card-lift admin-reveal delay-1">
    <div style="font-size:0.72rem;color:var(--text-secondary);margin-bottom:0.35rem;text-transform:uppercase;letter-spacing:0.06em;font-weight:600">Total Courses</div>
    <div style="font-family:'Space Grotesk',sans-serif;font-size:2.25rem;font-weight:800;background:linear-gradient(135deg,var(--color-primary),#f59e0b);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent"
         data-count-to="{totalCourses}" data-suffix="">0</div>
  </div>

  <div class="admin-stat-card admin-card-lift admin-reveal delay-2">
    <div style="font-size:0.72rem;color:var(--text-secondary);margin-bottom:0.35rem;text-transform:uppercase;letter-spacing:0.06em;font-weight:600">Published</div>
    <div style="font-family:'Space Grotesk',sans-serif;font-size:2.25rem;font-weight:800;color:#22c55e"
         data-count-to="{publishedCourses}" data-suffix="">0</div>
  </div>

  <div class="admin-stat-card admin-card-lift admin-reveal delay-3">
    <div style="font-size:0.72rem;color:var(--text-secondary);margin-bottom:0.35rem;text-transform:uppercase;letter-spacing:0.06em;font-weight:600">Drafts</div>
    <div style="font-family:'Space Grotesk',sans-serif;font-size:2.25rem;font-weight:800;color:var(--text-secondary)"
         data-count-to="{draftCourses}" data-suffix="">0</div>
  </div>

  <div class="admin-stat-card admin-card-lift admin-reveal delay-4">
    <div style="font-size:0.72rem;color:var(--text-secondary);margin-bottom:0.35rem;text-transform:uppercase;letter-spacing:0.06em;font-weight:600">Content Sections</div>
    <div style="font-family:'Space Grotesk',sans-serif;font-size:2.25rem;font-weight:800;background:linear-gradient(135deg,#3b82f6,#8b5cf6);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent"
         data-count-to="{totalSections}" data-suffix="">0</div>
  </div>

</div>
```

Replace the Astro interpolation `{totalCourses}` etc. with the correct Astro variable
references (they already exist in the frontmatter). The `data-count-to` attribute is picked
up by the animation script from Phase 3.

### A2 — Quick Actions cards
Each `<a>` quick-action card should have `admin-card admin-card-lift admin-reveal delay-N`:

```html
<a href="…" class="admin-card admin-card-lift admin-reveal delay-1"
   style="text-decoration:none;display:flex;align-items:center;gap:0.75rem;">
  …existing icon + text…
</a>
```

### A3 — Content Health card + Recent Activity card
Both two-column cards at the bottom of the page should get `admin-card admin-reveal`:

```html
<div class="admin-card admin-reveal" style="…existing inline styles minus background/border-radius…">
```

---

## Part B — Courses List (`admin-frontend/src/pages/dashboard/courses/index.astro`)

### B1 — Header
Add `admin-reveal` to the page title / description `<div>`:

```html
<div class="admin-reveal" style="…">
  <h1 …>Courses</h1>
  <p …>Manage your course catalog</p>
</div>
```

### B2 — Stat pills
The three stat boxes (Total / Published / Draft) should get `admin-card-lift admin-reveal delay-N`:

```html
<div class="admin-card admin-card-lift admin-reveal delay-1" style="padding:0.75rem 1.25rem;…">
```

### B3 — Category filter tabs
Replace the existing plain filter buttons with pill-style buttons that animate on click.
In the `<div id="filter-tabs">`, update each `<button class="filter-tab">` to:

```html
<button
  class="filter-tab"
  data-category="all"
  style="
    padding: 0.4rem 1.1rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-pill);
    background: var(--glass-bg);
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 500;
    white-space: nowrap;
    transition: all 0.2s ease;
  "
>All</button>
```

And in the inline `<script>` where `.active` is set, also update the button style:

```js
// activate
btn.style.background = 'var(--color-primary)';
btn.style.color      = '#fff';
btn.style.borderColor = 'var(--color-primary)';
btn.style.transform  = 'translateY(-1px)';
btn.style.boxShadow  = '0 4px 12px rgba(var(--color-primary-rgb),0.35)';

// deactivate others
otherBtn.style.background  = 'var(--glass-bg)';
otherBtn.style.color       = 'var(--text-secondary)';
otherBtn.style.borderColor = 'var(--border-color)';
otherBtn.style.transform   = '';
otherBtn.style.boxShadow   = '';
```

### B4 — Course table wrapper
Wrap the entire table card div with `admin-reveal`:

```html
<div class="admin-card admin-reveal" style="padding:0;overflow:hidden">
```

### B5 — Table row hover
Inside `<style>` in `courses/index.astro`, enhance `.course-row`:

```css
.course-row {
  border-bottom: 1px solid var(--border-color);
  transition: background var(--duration-fast) ease,
              transform  var(--duration-fast) ease;
}
.course-row:hover {
  background: color-mix(in srgb, var(--color-primary) 4%, transparent) !important;
}

/* Dragging state */
.course-row.dragging {
  opacity: 0.45;
  background: color-mix(in srgb, var(--color-primary) 8%, transparent) !important;
}

.course-row.drag-over {
  border-top: 2px solid var(--color-primary);
  transform: translateY(2px);
}
```

### B6 — Confirm dialog glass effect
In the `#confirm-dialog` inner card div, replace inline styles with:

```html
<div style="
  background: var(--glass-bg);
  backdrop-filter: blur(22px) saturate(165%);
  -webkit-backdrop-filter: blur(22px) saturate(165%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  box-shadow: var(--shadow-card-hover);
  animation: admin-bounce-in 0.35s var(--ease-spring);
">
```

---

## Done signal
When finished, reply: **"Phase 6 complete — dashboard and courses list polished."**
