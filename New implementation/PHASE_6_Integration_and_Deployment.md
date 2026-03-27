# PHASE 6 — Main Website API Integration & Full Deployment

## Context
This is the final phase. It connects the existing CodePro.io Astro website to the FastAPI backend so that all content managed via the Admin Dashboard is reflected on the live site. It also handles deployment configuration.

**Critical rule**: Modify the existing main website files as minimally as possible. The strategy is to create new utility files and update only the data-fetching layer — no visual changes whatsoever.

---

## 1. Strategy: SSR Mode for Main Site

Change main site from static to SSR output so content updates are live immediately without rebuilds.

Update `astro.config.mjs` (add only these lines, keep everything else):
- Add `output: 'server'`
- Add `adapter: node({ mode: 'standalone' })`
- Add `@astrojs/node` to package.json

---

## 2. Create `src/lib/api.ts` in Main Site

This is the ONLY place the main site talks to the backend. Full implementation:

```typescript
const API_BASE = import.meta.env.API_URL || 'http://localhost:8000';

// In-memory cache to prevent hammering the API on every request
const cache = new Map<string, { data: unknown; fetchedAt: number; ttl: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() - entry.fetchedAt > entry.ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttl = 30_000): void {
  cache.set(key, { data, fetchedAt: Date.now(), ttl });
}

export function clearApiCache(): void {
  cache.clear();
}

// Timeout-safe fetch with fallback
async function safeFetch<T>(url: string, fallback: T, cacheKey?: string, cacheTTL = 30_000): Promise<T> {
  if (cacheKey) {
    const cached = getCached<T>(cacheKey);
    if (cached) return cached;
  }
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    if (cacheKey) setCache(cacheKey, data, cacheTTL);
    return data;
  } catch {
    return fallback;
  }
}

// Get all site content grouped by section
export async function getSiteConfig() {
  return safeFetch(`${API_BASE}/api/content/all`, getFallbackConfig(), 'site_config', 30_000);
}

// Get contact info from DB
export async function getContactInfo() {
  return safeFetch(`${API_BASE}/api/contact/`, null, 'contact_info', 60_000);
}

// Get all published courses
export async function getAllCourses() {
  const data = await safeFetch<{ courses: any[] }>(
    `${API_BASE}/api/courses/?published_only=true&limit=100`,
    { courses: getFallbackCourses() },
    'all_courses',
    30_000
  );
  return (data.courses || []).sort((a: any, b: any) => (a.order || 99) - (b.order || 99));
}

// Get single course by slug
export async function getCourseBySlug(slug: string) {
  return safeFetch(`${API_BASE}/api/courses/${slug}`, null, `course_${slug}`, 30_000);
}

// Helper: get text value from config
export function getContent(config: any, section: string, key: string, fallback = ''): string {
  return config?.[section]?.[key] || fallback;
}

// Helper: get JSON value from config
export function getContentJson<T>(config: any, section: string, key: string, fallback: T): T {
  const val = config?.[section]?.[key + '_json'] || config?.[section]?.[key];
  if (!val) return fallback;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return fallback; } }
  return val as T;
}

// Fallback config when API is unreachable
function getFallbackConfig() {
  return {
    meta: { site_name: 'CodePro.io', site_tagline: 'Master the code, Become a pro' },
    home: {
      hero_headline: 'Become job-ready with mentor-led tech programs',
      hero_subheadline: 'Hands-on sessions, structured curriculum, and portfolio projects.',
      hero_cta_text: 'Explore Courses',
    },
    about: {}, contact: {},
  };
}

// Fallback courses when API is unreachable
function getFallbackCourses() {
  return [
    { slug: 'react', title: 'React Development', icon: 'âš›ï¸', category: 'Frontend',
      short_description: 'Build modern web apps with React.', duration: '8 weeks',
      mode: 'Online / Offline', level: 'Beginner â†' Intermediate', price: 'Contact for pricing',
      badge: 'Popular', order: 1, curriculum: ['JavaScript refresher', 'React fundamentals'],
      is_published: true, featured: true },
    { slug: 'angular', title: 'Angular Development', icon: 'ð…°ï¸', category: 'Frontend',
      short_description: 'Build scalable frontend apps with Angular.', duration: '8 weeks',
      mode: 'Online / Offline', level: 'Intermediate', price: 'Contact for pricing',
      order: 2, curriculum: ['TypeScript essentials', 'Angular fundamentals'], is_published: true },
    { slug: 'fullstack-development', title: 'Full Stack Development', icon: 'ð§©', category: 'Full Stack',
      short_description: 'Build complete web apps frontend to backend.', duration: '12 weeks',
      mode: 'Online / Offline', level: 'Beginner â†' Intermediate', price: 'Contact for pricing',
      badge: 'Best Value', order: 3, curriculum: ['Web fundamentals', 'Frontend development'], is_published: true },
  ];
}
```

---

## 3. Update Main Site Pages to Use API

Make these minimal changes to existing files. For each file, ADD the import and const at the top of the frontmatter, then replace hardcoded text where it appears:

### `src/utils/consts.ts`
Add at the bottom (keep all existing exports unchanged):
```typescript
import { getContactInfo } from './lib/api.js';

export async function getLiveConsts() {
  const info = await getContactInfo();
  return {
    INSTITUTE_NAME: info?.institute_name || INSTITUTE_NAME,
    CONTACT_PHONE: info?.phone || CONTACT_PHONE,
    CONTACT_EMAIL: info?.email || CONTACT_EMAIL,
    ADDRESS_PLACEHOLDER: info?.address || ADDRESS_PLACEHOLDER,
    GOOGLE_MAPS_URL: info?.google_maps_url || GOOGLE_MAPS_URL,
    WHATSAPP_URL: info?.whatsapp_url || WHATSAPP_URL,
    SOCIAL_INSTAGRAM_URL: info?.instagram_url || SOCIAL_INSTAGRAM_URL,
    SOCIAL_FACEBOOK_URL: info?.facebook_url || SOCIAL_FACEBOOK_URL,
    SOCIAL_YOUTUBE_URL: info?.youtube_url || SOCIAL_YOUTUBE_URL,
    SOCIAL_LINKEDIN_URL: info?.linkedin_url || SOCIAL_LINKEDIN_URL,
    WORKING_HOURS: info?.working_hours || WORKING_HOURS,
    BROCHURE_PDF_URL: info?.brochure_pdf_url || BROCHURE_PDF_URL,
    PROMO_TEXT: info?.promo_text || PROMO_TEXT,
    SITE_TAGLINE: info?.site_tagline || SITE_TAGLINE,
    DEFAULT_META_DESCRIPTION: info?.institute_name
      ? `${info.institute_name} - ${info.site_tagline || SITE_TAGLINE}`
      : DEFAULT_META_DESCRIPTION,
  };
}
```

### `src/components/Header.astro` — Add these 2 lines to frontmatter:
```typescript
import { getLiveConsts } from '../utils/consts';
const liveConsts = await getLiveConsts();
```
Then replace `INSTITUTE_NAME` with `liveConsts.INSTITUTE_NAME` and `CONTACT_PHONE` with `liveConsts.CONTACT_PHONE` in the HTML.

### `src/components/Footer.astro` — Same pattern:
```typescript
import { getLiveConsts } from '../utils/consts';
const liveConsts = await getLiveConsts();
```
Replace all const references with `liveConsts.CONST_NAME`.

### `src/components/NotificationBanner.astro`:
```typescript
import { getLiveConsts } from '../utils/consts';
const liveConsts = await getLiveConsts();
// Replace PROMO_TEXT → liveConsts.PROMO_TEXT
// Only render the banner if liveConsts.PROMO_TEXT is truthy
```

### `src/components/HeroAnimated.astro` — Add:
```typescript
import { getSiteConfig, getContent, getContentJson } from '../lib/api';
const config = await getSiteConfig();
const heroHeadline = getContent(config, 'home', 'hero_headline', 'Become job-ready with mentor-led tech programs');
const heroSubheadline = getContent(config, 'home', 'hero_subheadline', 'Hands-on sessions...');
const heroCta = getContent(config, 'home', 'hero_cta_text', 'Explore Courses');
const techBadges = getContentJson<string[]>(config, 'home', 'tech_badges', ['React', 'Python', 'Java', 'Angular', 'Full Stack', 'Testing', 'Tally', 'Web Design']);
const stats = [
  { value: getContent(config, 'home', 'stat1_value', '500+'), label: getContent(config, 'home', 'stat1_label', 'Students Trained') },
  { value: getContent(config, 'home', 'stat2_value', '8+'), label: getContent(config, 'home', 'stat2_label', 'Expert Courses') },
  { value: getContent(config, 'home', 'stat3_value', '95%'), label: getContent(config, 'home', 'stat3_label', 'Satisfaction Rate') },
  { value: getContent(config, 'home', 'stat4_value', '100%'), label: getContent(config, 'home', 'stat4_label', 'Placement Support') },
];
// Replace hardcoded values in the HTML with these variables
```

### `src/pages/courses/index.astro` — Replace getCollection:
```typescript
// Remove: import { getCollection } from 'astro:content';
import { getAllCourses } from '../../lib/api';
const sortedCourses = await getAllCourses();
// courses now have flat properties: course.title NOT course.data.title
// Update all course.data.XXX references to course.XXX
```

### `src/pages/courses/[slug].astro` — Remove getStaticPaths, use API:
```typescript
// Remove getStaticPaths entirely (SSR mode doesn't need it)
// Remove: import { getCollection, render } from 'astro:content';
import { getCourseBySlug, getAllCourses } from '../../lib/api';

const { slug } = Astro.params;
const course = await getCourseBySlug(slug as string);
if (!course) return Astro.redirect('/courses/');

// For related courses:
const allCourses = await getAllCourses();
const relatedCourses = allCourses
  .filter((c: any) => c.category === course.category && c.slug !== course.slug)
  .slice(0, 3);

// All course.data.XXX → course.XXX (properties are flat from API)
// Remove the MDX <Content /> render — use course.description as HTML/text instead
// Replace <Content /> with: <div class="prose ..." set:html={course.description || ''} />
```

### `src/components/CoursesCarousel.astro`:
```typescript
// Remove: import { getCollection } from 'astro:content';
import { getAllCourses } from '../lib/api';
const courses = await getAllCourses();
// Update course references from course.data.XXX to course.XXX
// Update course.id to course.slug for the href
```

---

## 4. Cache Bust API Route

Create `src/pages/api/cache-bust.ts` in the main site:
```typescript
import type { APIRoute } from 'astro';
import { clearApiCache } from '../../lib/api';

export const POST: APIRoute = async ({ url }) => {
  const secret = url.searchParams.get('secret');
  if (secret !== import.meta.env.CACHE_BUST_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }
  clearApiCache();
  return new Response(JSON.stringify({ cleared: true, timestamp: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
```

Update the admin frontend's save actions to call this after every successful save:
```typescript
// In all proxy routes, after successful PUT/POST to FastAPI:
await fetch(`${MAIN_SITE_URL}/api/cache-bust?secret=${CACHE_BUST_SECRET}`, { method: 'POST' });
```

---

## 5. Environment Variables

Main site `.env` additions:
```env
API_URL=http://localhost:8000
CACHE_BUST_SECRET=your-random-secret-here
```

Admin frontend `.env` additions:
```env
PUBLIC_API_URL=http://localhost:8000
MAIN_SITE_URL=http://localhost:3000
CACHE_BUST_SECRET=your-random-secret-here
```

---

## 6. Docker Compose (project root `docker-compose.yml`)

```yaml
version: '3.9'
services:
  api:
    build:
      context: ./admin-backend
    ports: ["8000:8000"]
    env_file: ./admin-backend/.env
    restart: unless-stopped

  main-site:
    build:
      context: .
      dockerfile: Dockerfile.main
    ports: ["3000:3000"]
    environment:
      API_URL: http://api:8000
      CACHE_BUST_SECRET: ${CACHE_BUST_SECRET}
    depends_on: [api]
    restart: unless-stopped

  admin-frontend:
    build:
      context: ./admin-frontend
    ports: ["4322:4322"]
    environment:
      PUBLIC_API_URL: http://localhost:8000
      MAIN_SITE_URL: http://main-site:3000
      CACHE_BUST_SECRET: ${CACHE_BUST_SECRET}
    depends_on: [api]
    restart: unless-stopped
```

Dockerfiles for each service — minimal Node 22 + multi-stage builds for Astro SSR, Python 3.12 slim for FastAPI.

---

## 7. Health Check Additions

Add `GET /health` to FastAPI that checks DB connectivity.
Add `src/pages/api/health.ts` to main site that checks API reachability.

---

## 8. Testing Checklist (create `TESTING_CHECKLIST.md`)

Key tests to verify end-to-end integration:

Backend:
- GET /health returns 200
- POST /api/auth/login correct creds returns tokens
- POST /api/auth/login wrong creds returns 401
- GET /api/courses/ returns 8 courses (seeded)
- POST /api/courses/ without auth returns 401
- GET /api/content/all returns all sections
- GET /api/contact/ returns contact info

Admin Dashboard:
- Login at localhost:4322/admin/login works
- Dashboard shows correct course count from live API
- Create/Edit/Delete course works end to end
- Save homepage content → verify change appears on main site within 30s
- Save contact info → verify in main site footer

Main Website:
- Homepage loads without errors in SSR mode
- Courses page shows courses from API
- Individual course slug pages work dynamically
- Footer shows real contact info from DB
- If API is down, fallback content shows (not crash)

End-to-End:
- Admin edits hero headline → refresh main site → new text appears
- Admin adds new course → appears on /courses
- Admin unpublishes course → disappears from main site
- Admin updates phone number → appears in footer

---

## Deliverables Checklist for Phase 6

- [ ] `src/lib/api.ts` — complete with caching and fallbacks
- [ ] `src/utils/consts.ts` — getLiveConsts added (backward compatible)
- [ ] `src/components/Header.astro` — uses getLiveConsts
- [ ] `src/components/Footer.astro` — uses getLiveConsts
- [ ] `src/components/NotificationBanner.astro` — uses getLiveConsts
- [ ] `src/components/HeroAnimated.astro` — uses API content
- [ ] `src/pages/courses/index.astro` — uses getAllCourses
- [ ] `src/pages/courses/[slug].astro` — SSR, no getStaticPaths, uses getCourseBySlug
- [ ] `src/components/CoursesCarousel.astro` — uses getAllCourses
- [ ] `src/pages/api/cache-bust.ts`
- [ ] `astro.config.mjs` — SSR mode + node adapter
- [ ] `docker-compose.yml`
- [ ] `Dockerfile.main`
- [ ] `admin-backend/Dockerfile`
- [ ] `admin-frontend/Dockerfile`
- [ ] `DEPLOYMENT.md`
- [ ] `TESTING_CHECKLIST.md`
