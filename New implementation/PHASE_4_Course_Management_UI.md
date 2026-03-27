# PHASE 4 — Admin Dashboard: Course Management (Full CRUD UI)

## Context
This phase builds the complete **Course Management** section of the admin dashboard. This is the most complex section — it must handle creating, editing, deleting, reordering, and publishing/unpublishing all 8 existing courses.

After this phase:
- Admin can see all courses in a table/grid
- Admin can create new courses with a full multi-section form
- Admin can edit any existing course
- Admin can delete courses with confirmation
- Admin can reorder courses via drag handles
- Admin can toggle published/draft status
- The main CodePro.io site will fetch courses from the API (not MDX files)

---

## 1. Courses List Page (`src/pages/dashboard/courses/index.astro`)

**Server-side** (frontmatter):
```typescript
// Fetch all courses from API (no auth needed for GET)
const courses = await fetch(`${API_BASE}/api/courses/?limit=100`).then(r => r.json());
// courses = { courses: [...], total: 8, skip: 0, limit: 100 }
```

**Page layout**:

Header: "Courses" title + "Add New Course" button (amber, links to `/admin/dashboard/courses/new`)

Stats bar:
- Total: 8 | Published: 6 | Draft: 2 (dynamic from data)
- Filter tabs: All | Frontend | Full Stack | Programming | Testing | Business | Design

Course Table (desktop) / Cards (mobile):

**Desktop Table Columns**:
```
| ⠿ | Icon | Title | Category | Level | Duration | Badge | Status | Order | Actions |
```

- `⠿` = drag handle (for reordering) — use `cursor-grab`
- Icon: emoji display
- Title: bold, with short_description below in gray text
- Category: small colored pill (each category gets a distinct color)
- Level: small badge
- Duration: text
- Badge: if exists, show it; if not, show "-"
- Status: Toggle switch — green "Published" / gray "Draft"
- Order: number input (1-99, changes immediately on blur)
- Actions: Edit button (pencil icon) + Delete button (trash icon, red on hover)

**Mobile Cards** (< 768px):
- Show emoji + title + category + status toggle + action buttons

**Filter Bar**:
- Category tabs filter the table client-side (no API call)
- "All" shows everything

**Drag to Reorder**:
- HTML5 drag and drop on the `⠿` handle
- Show a "Save Order" button when order changes
- POST to `/api/courses/reorder` with new order
- Show success toast

**Delete Flow**:
- Click trash → ConfirmDialog: "Delete 'React Development'? This cannot be undone."
- On confirm: DELETE `/api/courses/{slug}` → remove row with fade-out animation → show success toast

**Publish Toggle**:
- Click toggle → immediate optimistic update (UI changes before API responds)
- POST to `/api/courses/{slug}/toggle-publish`
- On error: revert toggle + show error toast

---

## 2. New Course Page (`src/pages/dashboard/courses/new.astro`)

Renders the `CourseForm` React component with no initial data and `mode="create"`.

---

## 3. Edit Course Page (`src/pages/dashboard/courses/[slug]/edit.astro`)

**Server-side**:
```typescript
const { slug } = Astro.params;
const course = await fetch(`${API_BASE}/api/courses/${slug}`).then(r => r.json());
if (!course || course.error) return Astro.redirect('/admin/dashboard/courses');
```

Renders `CourseForm` with `initialData={course}` and `mode="edit"`.

---

## 4. `CourseForm` React Component (`src/components/courses/CourseForm.tsx`)

This is the most complex component. Full implementation required.

**Props**:
```typescript
interface CourseFormProps {
  mode: 'create' | 'edit';
  initialData?: CourseOut;
  onSuccess?: (course: CourseOut) => void;
}
```

**Form State**:
Use `useState` for the entire form. Initial state from `initialData` or empty defaults.

**Tab-Based Layout**:
The form is split into tabs to avoid overwhelming the user:

```
Tab 1: Basic Info
Tab 2: Curriculum
Tab 3: Details & FAQs
Tab 4: Settings
```

### Tab 1: Basic Info
```
- Title *                 [text input, max 255]
- Slug *                  [text input — auto-generated from title in create mode, locked in edit]
                          [slug preview: "/courses/react-development"]
- Short Description *     [textarea, 3 rows, max 300 chars with counter]
- Long Description        [textarea, 5 rows]
- Icon (Emoji) *          [text input max 10, with emoji picker grid showing common ones]
- Category *              [select: Frontend | Full Stack | Programming | Testing | Business | Design]
- Badge                   [select: None | Popular | Best Value | New | (custom text input)]
```

Slug auto-generation:
```typescript
// When title changes in create mode:
const generateSlug = (title: string) => 
  title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 100);
```

### Tab 2: Curriculum
```
Curriculum Modules (ordered list):
- Each module: text input + remove button
- "Add Module" button at bottom
- Drag handles to reorder modules (use simple up/down arrows if drag is complex)
- At least 1 module required

Curriculum Topics (for each module):
- Expandable sub-section under each module
- Up to 3 topics per module
- Each topic: text input
- "+ Add topic" button
- Example placeholder: "Core concepts & patterns"
```

Dynamic array management:
```typescript
// Use array state with unique keys
const [curriculum, setCurriculum] = useState<string[]>(initialData?.curriculum || ['']);
const [curriculumTopics, setCurriculumTopics] = useState<string[][]>(initialData?.curriculum_topics || []);

// addModule: [...curriculum, '']
// removeModule(i): curriculum.filter((_,idx) => idx !== i)
// updateModule(i, val): curriculum.map((m, idx) => idx === i ? val : m)
```

### Tab 3: Details & FAQs
```
Highlights (what you'll get — max 4):
- Each: text input with remove button
- "Add Highlight" button (disabled when 4 reached)

FAQs:
- Each FAQ: 
    Question [text input]
    Answer   [textarea, 3 rows]
    [Remove button]
- "Add FAQ" button
- Reorder with up/down arrows
```

### Tab 4: Settings
```
- Duration *      [text input, e.g. "8 weeks"]
- Mode *          [select: Online / Offline | Online | Offline | Hybrid]
- Level *         [select: Beginner | Intermediate | Advanced | Beginner → Intermediate | All Levels]
- Price           [text input, e.g. "Contact for pricing" or "₹15,000"]
- Order           [number input 1-99, for sorting on main site]
- Next Batch      [text input, e.g. "Starts soon" or "July 15, 2025"]
- Featured        [toggle switch — shows on homepage featured section]
- Published       [toggle switch — controls visibility on main site]
```

### Form Validation
```typescript
// Validate on submit (not on every keystroke):
const errors: Record<string, string> = {};

if (!formData.title.trim()) errors.title = 'Title is required';
if (!formData.slug.match(/^[a-z0-9-]{3,100}$/)) errors.slug = 'Slug must be 3-100 lowercase chars and hyphens only';
if (!formData.short_description.trim()) errors.short_description = 'Short description required';
if (formData.short_description.length < 10) errors.short_description = 'Must be at least 10 characters';
if (!formData.icon) errors.icon = 'Icon emoji required';
if (!formData.category) errors.category = 'Category required';
if (formData.curriculum.filter(m => m.trim()).length === 0) errors.curriculum = 'At least one curriculum module required';
if (!formData.duration) errors.duration = 'Duration required';
if (!formData.mode) errors.mode = 'Mode required';
if (!formData.level) errors.level = 'Level required';

// Scroll to first error tab automatically
// Show error count badge on tab with errors
```

### Form Submission
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;
  
  setIsSubmitting(true);
  setSubmitError(null);
  
  const payload = {
    ...formData,
    curriculum: formData.curriculum.filter(m => m.trim()),
    curriculum_topics: formData.curriculumTopics,
    highlights: formData.highlights.filter(h => h.trim()),
    faqs: formData.faqs.filter(f => f.q.trim() && f.a.trim()),
  };
  
  const url = mode === 'create' 
    ? '/admin/api/proxy/courses'    // Astro API route that proxies to FastAPI
    : `/admin/api/proxy/courses/${initialData!.slug}`;
  
  const method = mode === 'create' ? 'POST' : 'PUT';
  
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (res.ok) {
    const course = await res.json();
    showToast('Course saved successfully!', 'success');
    if (mode === 'create') {
      window.location.href = '/admin/dashboard/courses';
    } else {
      onSuccess?.(course);
    }
  } else {
    const error = await res.json();
    setSubmitError(error.message || 'Failed to save course');
    if (error.code === 'CONFLICT') {
      setErrors(prev => ({ ...prev, slug: 'This slug is already taken' }));
    }
  }
  
  setIsSubmitting(false);
};
```

### Tab Navigation
```typescript
// Track validation state per tab to show error indicators
// Tab with errors shows red badge: "Basic Info ⚠ 2"
// Clicking "Save Course" validates all tabs, then scrolls to first error tab
// "Save Draft" skips some validations and sets is_published = false
```

---

## 5. Astro API Proxy Routes (for client-side form submissions)

These routes sit between the React form and FastAPI. They read the token from cookies and forward the request.

### `src/pages/api/proxy/courses.ts`
```typescript
// GET: fetch all courses from FastAPI
// POST: create course — requires auth cookie

export const GET: APIRoute = async ({ cookies }) => { ... }
export const POST: APIRoute = async ({ cookies, request }) => {
  const token = getTokenFromCookies(cookies);
  if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  
  const body = await request.json();
  const res = await fetch(`${API_BASE}/api/courses/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

### `src/pages/api/proxy/courses/[slug].ts`
```typescript
// GET, PUT, DELETE for a specific course slug
// All write methods check auth cookie
```

### `src/pages/api/proxy/courses/reorder.ts`
```typescript
// POST — reorder courses
```

### `src/pages/api/proxy/courses/[slug]/toggle-publish.ts`
```typescript
// POST — toggle publish status
```

---

## 6. Course Preview Component (`src/components/courses/CoursePreview.tsx`)

A side panel that shows how the course card will look on the main site:
```typescript
// Props: { course: Partial<CourseOut> }
// Renders a read-only preview card matching the main site's CourseCard design
// Updates in real-time as form fields change
// Toggle: "Card View" / "List View" / "Full Details View"
// Can be shown as:
//   - Drawer (slides in from right on desktop)
//   - Bottom sheet (mobile)
// "Preview Live" button opens the actual course page on main site in new tab
```

---

## 7. Bulk Actions Bar

Appears above the table when one or more checkboxes are selected:
```typescript
// Checkbox column in course table
// When ≥1 selected, shows floating bar at bottom:
// "3 selected: [Publish All] [Unpublish All] [Delete Selected]"
// Delete Selected → single ConfirmDialog → bulk DELETE calls
```

---

## 8. Empty State

When no courses exist (fresh DB):
```
Large centered illustration (SVG or emoji-based)
"No courses yet"
"Add your first course to get started"
[Add Course] button
```

---

## Deliverables Checklist for Phase 4
- [ ] `src/pages/dashboard/courses/index.astro` — full table with all interactions
- [ ] `src/pages/dashboard/courses/new.astro`
- [ ] `src/pages/dashboard/courses/[slug]/edit.astro`
- [ ] `src/components/courses/CourseForm.tsx` — full 4-tab form (this is the most important file)
- [ ] `src/components/courses/CoursePreview.tsx`
- [ ] 5 Astro API proxy route files
- [ ] All interactions: delete, reorder, publish toggle, bulk actions
- [ ] Toast notifications on all actions
- [ ] Proper loading states on all async operations
- [ ] Form validation with per-tab error indicators

## Critical UX Requirements
- **The form must NOT lose data on tab switch** — all tabs share the same state object
- **Slug must be auto-generated and editable** — once changed manually, stop auto-generating
- **Curriculum is the most complex field** — test adding/removing/editing modules and their topics
- **The Save button must be sticky** (fixed at bottom of form on all tabs)
- **Unsaved changes warning**: if user tries to leave with unsaved changes, show browser confirm
- **All error messages must be field-specific**, not just a generic alert
- **Mobile**: the 4-tab layout stacks vertically; tabs become a scrollable horizontal pill nav
