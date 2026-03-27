# PHASE 5 — Admin Dashboard: Site Content Editor & Contact Info Manager

## Context
This phase builds the remaining content management pages:
1. **Homepage Content Editor** — edit hero text, section titles, promo banner, stats
2. **About Page Editor** — edit about page copy, team info, story paragraphs
3. **Contact Info Manager** — edit all contact details, social links, maps embed
4. **Global Settings** — site name, tagline, SEO meta, working hours

These pages let the admin replace ALL the hardcoded fake content currently in the Astro `.ts` constants and `.astro` files.

**Key principle**: The main Astro site will call `GET /api/content/all` to get all content at build time OR at request time. The admin sets the content via this dashboard.

---

## 1. Understanding the Content Architecture

The `site_content` table stores content as `(section, key, value)` tuples.

Here is the **complete mapping** of all content keys that need to be manageable:

### Section: `"meta"` — Site-wide settings
```
site_name          → "CodePro.io"
site_tagline       → "Master the code, Become a pro"
default_description → "CodePro.io - Master the code, Become a pro"
promo_text         → "" (notification banner text — leave empty to hide)
logo_url           → "" (URL to logo image, leave empty to use text)
```

### Section: `"home"` — Homepage content
```
hero_headline      → "Become job-ready with mentor-led tech programs"
hero_subheadline   → "Hands-on sessions, structured curriculum..."
hero_cta_text      → "Explore Courses"
hero_cta_link      → "/courses/"
hero_badge_text    → "Job-focused training"

section1_eyebrow   → "Top Courses"
section1_title     → "Start with our most popular programs"
section1_description → "Hands-on, mentor-led courses..."
section1_cta_text  → "View All Courses"

section2_eyebrow   → "All Programs"
section2_title     → "Explore every course"

tech_badges        → value_json: ["React", "Python", "Java", "Angular", "Full Stack", "Testing", "Tally", "Web Design"]

stat1_value        → "500+"
stat1_label        → "Students Trained"
stat2_value        → "8+"
stat2_label        → "Expert Courses"
stat3_value        → "95%"
stat3_label        → "Satisfaction Rate"
stat4_value        → "100%"
stat4_label        → "Placement Support"
```

### Section: `"about"` — About page
```
about_eyebrow      → "About"
about_h1           → "Built for practical learning"
about_tagline      → "Mentor-led training..."
founding_year      → "2022"

story_para_1       → "CodePro.io was created..."
story_para_2       → "Our trainers are B.Tech graduates..."
story_para_3       → "We teach through guided practice..."

mission_text       → "Deliver mentor-led learning..."
vision_text        → "To help learners become confident..."

team_eyebrow       → "Our team"
team_title         → "Mentors who teach with clarity"
team_description   → "Our trainers are B.Tech graduates..."

trainers           → value_json: [
                       { name: "Trainer 1", designation: "B.Tech Graduate", exp: "3 years", linkedin: "" },
                       ...4 trainers
                     ]

stat1_value        → "500+"    (about page stats)
stat1_label        → "Students Trained"
stat2_value        → "8+"
stat2_label        → "Courses Offered"
stat3_value        → "95%"
stat3_label        → "Satisfaction Rate"
stat4_value        → "3+"
stat4_label        → "Years Experience"
```

### Section: `"contact"` — Contact page labels (the actual contact details are in `contact_info` table)
```
contact_eyebrow    → "Contact"
contact_title      → "Let's plan your learning path"
contact_description → "Share what you want to learn..."
contact_form_title → "Send an enquiry"
```

---

## 2. Homepage Content Editor Page (`src/pages/dashboard/home-content.astro`)

**Server-side**:
```typescript
const token = getTokenFromCookies(Astro.cookies);
if (!token) return Astro.redirect('/admin/login');

// Fetch current home + meta content
const contentRes = await fetch(`${API_BASE}/api/content/all`);
const allContent = await contentRes.json();
const home = allContent.home || {};
const meta = allContent.meta || {};
```

Renders `HomeContentEditor` React component with `initialData={{ home, meta }}`.

---

## 3. `HomeContentEditor` React Component (`src/components/content/HomeContentEditor.tsx`)

**Layout**: Two-column on desktop — form on left (60%), live preview on right (40%)

**Sections**:

### Section A: Site-Wide Meta
```
Card: "🌐 Global Settings"
- Site Name         [text input]
- Site Tagline      [text input, max 100 chars]
- Default Meta Description [textarea, 2 rows, with char counter — 160 chars max]
- Promo Banner Text [text input, with note: "Leave empty to hide the banner"]
```

### Section B: Hero Section
```
Card: "🦸 Hero Section"
- Main Headline        [textarea, 2 rows — this is the big H1]
  * Real value: "Become job-ready with mentor-led tech programs"
- Sub-headline         [textarea, 3 rows]
- Badge Text           [text input, small — "Job-focused training"]
- Primary CTA Text     [text input — "Explore Courses"]
- Primary CTA Link     [text input — "/courses/"]
- Secondary CTA Text   [text input — "View Highlights"]
- Secondary CTA Link   [text input — "#home-courses"]
```

### Section C: Stats Strip
```
Card: "📊 Stats Bar"
4 stat items in a 2x2 grid:
Each stat:
  - Value   [text input, small — e.g. "500+"]
  - Label   [text input — e.g. "Students Trained"]
```

### Section D: Tech Badges
```
Card: "🏷️ Tech Badges"
Shown under the hero section — comma-separated or tag input
[tag input that converts to array]:
  Each tag shown as pill with × remove
  "Add badge" text input + enter to add
  Current: React, Python, Java, Angular, Full Stack, Testing, Tally, Web Design
```

### Section E: Featured Section Labels
```
Card: "📚 Top Courses Section"
- Eyebrow Text      [text input — "Top Courses"]
- Section Title     [text input]
- Section Description [textarea, 2 rows]
- CTA Button Text   [text input — "View All Courses"]
```

### Section F: Enquiry CTA Section
```
Card: "📬 Enquiry Banner (Bottom of Homepage)"
- Headline          [textarea, 2 rows]
- Description       [textarea, 3 rows]
- Bullet Points     [array input — add/remove rows, each a text input]
  Current bullets:
  • Free 15-minute consultation call
  • No pushy sales — just honest guidance
  • Get a learning roadmap tailored for you
  • Flexible batch options explained clearly
```

**Save Behavior**:
```typescript
// "Save All" button at top-right
// Also auto-saves 30 seconds after last change (debounced)
// POST to /admin/api/proxy/content/bulk
// Body: { updates: [{ section, key, value, content_type }, ...] }
// Show "Saving..." → "Saved ✓" status in header
// Show error toast if any save fails
```

**Live Preview Panel** (right column):
```
Simplified read-only preview of the homepage hero showing:
- The headline with gradient text styling
- Sub-headline text
- CTA buttons (non-functional, just visual)
- Stats strip
Updates in real-time as form fields change (use state)
"Open Live Site" button at top
```

---

## 4. About Page Editor (`src/pages/dashboard/about-content.astro`)

Renders `AboutContentEditor` React component.

### `AboutContentEditor` Component Sections:

**Section A: Page Header**
```
- Eyebrow Text      [text input]
- H1 Headline       [text input]
- Tagline           [textarea, 2 rows]
```

**Section B: Our Story**
```
Card: "📖 Our Story"
- Story Paragraph 1 [textarea, 5 rows — rich text NOT needed, just plain text]
- Story Paragraph 2 [textarea, 5 rows]
- Story Paragraph 3 [textarea, 5 rows]
- Founding Badge Text [text input — "B.Tech mentors • 3 years teaching experience"]
- Founding Year     [text input — "2022"]
```

**Section C: Mission & Vision**
```
Card: "🎯 Mission & Vision"
- Mission Text  [textarea, 4 rows]
- Vision Text   [textarea, 4 rows]
```

**Section D: About Page Stats**
```
Card: "📊 About Page Stats"
4 stats (same as homepage stats but separate values for about page):
Each: value + label inputs
```

**Section E: Team / Trainers**
```
Card: "👥 Team Members"
4 trainer cards (fixed count — always 4):
Each trainer:
  - Name             [text input]
  - Designation      [text input — "B.Tech Graduate & Trainer"]
  - Experience       [text input — "3 years teaching experience"]
  - LinkedIn URL     [text input — URL]
  [Photo]: Placeholder image notice: "Upload feature coming soon — use a hosted image URL"
  - Photo URL        [text input — optional]

Note: Trainer order matches the display order on the about page
```

**Section F: Certifications**
```
Card: "🏆 Certifications & Accreditations"
Note at top: "These show in the certification logos strip on the About page"
4 cert items:
Each:
  - Name         [text input — "ISO 9001" / "NASSCOM" / etc.]
  - Logo URL     [text input — optional]
```

---

## 5. Contact Info Manager (`src/pages/dashboard/contact.astro`)

Renders `ContactInfoEditor` React component.

### `ContactInfoEditor` Component:

**Section A: Core Contact Details**
```
Card: "📍 Institute Information"
- Institute Name     [text input, required]
- Site Tagline       [text input]
- Phone Number       [text input, with +91 prefix helper]
- Email Address      [email input]
- Full Address       [textarea, 3 rows]
- City               [text input]
- State              [text input]
- Pincode            [text input]
- Working Hours      [text input — "9:00 AM - 6:00 PM IST, Monday to Saturday"]
```

**Section B: Online Presence**
```
Card: "🔗 URLs & Links"
Each field has a small preview link icon that opens the URL in new tab:
- Website URL        [url input]
- Google Maps URL    [url input — full Google Maps link]
- WhatsApp URL       [url input — "https://wa.me/91XXXXXXXXXX"]
  Helper text: "Format: https://wa.me/CountryCodePhoneNumber (no spaces, no +)"
- Brochure PDF URL   [url input — optional, external hosted PDF]
```

**Section C: Social Media**
```
Card: "📱 Social Media"
Each has platform icon + label:
- Instagram URL      [url input]
- Facebook URL       [url input]
- YouTube URL        [url input]
- LinkedIn URL       [url input]

Quick validate button: "Test Links" — opens all non-empty URLs
```

**Section D: Promo Banner**
```
Card: "📢 Notification Banner"
- Banner Text        [text input]
  Helper: "Shown at the top of the website. Leave empty to hide the banner."
  Preview: [shows the banner with the text if filled]
```

**Section E: Google Maps Preview**
```
After entering Google Maps URL, show a "Preview Map" button
When clicked: embed an iframe preview of the map
Note: "This map embed will show on the Contact page"
```

**Save**:
```typescript
// PUT /admin/api/proxy/contact
// This is a full replace (send all fields)
// Show field-level error if API validation fails
// Success: toast + update "Last saved" timestamp
```

---

## 6. Security Page (`src/pages/dashboard/security.astro`)

Renders `SecuritySettings` React component.

### `SecuritySettings` Component:

**Change Password Section**:
```
Card: "🔐 Change Password"
- Current Password    [password input with show/hide]
- New Password        [password input with strength indicator]
  Strength meter: Weak / Fair / Strong / Very Strong
  Requirements: min 8 chars, 1 uppercase, 1 number, 1 special char
- Confirm Password    [password input — must match]
[Change Password] button
```

**Active Sessions Section** (placeholder for now):
```
Card: "📱 Active Sessions"
Note: "Session management will be available in a future update"
[Sign Out All Devices] button (calls logout endpoint)
```

**Admin User Info**:
```
Card: "👤 Account Info"
- Username: [read-only display]
- Account Created: [read-only date]
- Last Login: [read-only — not tracked yet, show "N/A"]
```

---

## 7. Proxy API Routes for Content & Contact

### `src/pages/api/proxy/content/bulk.ts`
```typescript
// POST — bulk update site content
// Reads auth cookie, forwards to FastAPI POST /api/content/bulk
```

### `src/pages/api/proxy/content/[section]/[key].ts`
```typescript
// PUT — update single content item
// DELETE — delete content item
```

### `src/pages/api/proxy/contact.ts`
```typescript
// GET — fetch contact info
// PUT — update contact info
```

### `src/pages/api/proxy/auth/password.ts`
```typescript
// PUT — change password
// Reads auth cookie, forwards to FastAPI PUT /api/auth/me/password
```

---

## 8. Auto-Save System (`src/lib/autosave.ts`)

Reusable TypeScript utility for all content editors:

```typescript
interface AutoSaveConfig {
  delay: number;        // debounce delay in ms (default: 2000)
  onSave: () => Promise<void>;
  onSaveStart?: () => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

export function useAutoSave(data: unknown, config: AutoSaveConfig): {
  saveStatus: 'idle' | 'pending' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  triggerSave: () => Promise<void>;
  cancelPendingSave: () => void;
}

// SaveStatusIndicator component showing:
// ● Unsaved changes... | ⟳ Saving... | ✓ Saved (2 min ago) | ✕ Save failed
```

---

## 9. Content Version History (Lightweight)

Store the last 5 versions of each content section in localStorage (client-side only):

```typescript
// When saving a section, snapshot the current state
// Show "Version History" drawer with:
// - Timestamp of each save
// - "Restore" button that fills the form with old values
// - Limited to 5 most recent
// This is a nice-to-have UX feature — implement if time allows, otherwise stub it
```

---

## 10. Dashboard Navigation Update

Update `AdminLayout.astro` sidebar links to include all new pages:

```
OVERVIEW
  🏠 Dashboard             /admin/dashboard

CONTENT MANAGEMENT
  📚 Courses               /admin/dashboard/courses
  🏠 Homepage              /admin/dashboard/home-content
  ℹ️  About Page           /admin/dashboard/about-content
  📞 Contact Info          /admin/dashboard/contact

ADMIN
  🔐 Security              /admin/dashboard/security
  🚪 Sign Out
```

Also add a **breadcrumb** component that shows the current page path.

---

## Deliverables Checklist for Phase 5

- [ ] `src/pages/dashboard/home-content.astro`
- [ ] `src/components/content/HomeContentEditor.tsx` — full implementation with all 6 sections
- [ ] `src/pages/dashboard/about-content.astro`
- [ ] `src/components/content/AboutContentEditor.tsx` — full implementation with all 6 sections
- [ ] `src/pages/dashboard/contact.astro`
- [ ] `src/components/content/ContactInfoEditor.tsx` — full implementation with all 5 sections
- [ ] `src/pages/dashboard/security.astro`
- [ ] `src/components/content/SecuritySettings.tsx`
- [ ] 4 Astro proxy API routes
- [ ] `src/lib/autosave.ts` with `useAutoSave` hook
- [ ] Updated `AdminLayout.astro` sidebar
- [ ] All forms have proper validation, error states, and success feedback

## UX Requirements
- **Unsaved changes indicator** on every page — subtle dot in the page title or nav
- **Save confirmation** — after saving, show "✓ Changes saved" for 3 seconds
- **Required fields** marked with red asterisk
- **Character counters** on all textarea fields with limits
- **URL field validation** — check format, offer "Test Link" button
- **Phone number formatting helper** for WhatsApp URL construction
- **All forms must work on mobile** — single column layout below 768px
