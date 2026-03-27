const API_BASE = import.meta.env.API_URL || 'http://localhost:8000';

// In-memory cache with stale-while-revalidate strategy
const cache = new Map<string, { data: unknown; fetchedAt: number; ttl: number }>();
const pendingRefresh = new Set<string>();

function getCached<T>(key: string): { value: T; fresh: boolean } | null {
  const entry = cache.get(key);
  if (!entry) return null;
  const age = Date.now() - entry.fetchedAt;
  // Serve cached data; mark stale if past TTL
  return { value: entry.data as T, fresh: age <= entry.ttl };
}

function setCache<T>(key: string, data: T, ttl = 300_000): void {
  cache.set(key, { data, fetchedAt: Date.now(), ttl });
  pendingRefresh.delete(key);
}

export function clearApiCache(): void {
  cache.clear();
  pendingRefresh.clear();
}

// Fire-and-forget background refresh (stale-while-revalidate)
function backgroundRefresh<T>(url: string, cacheKey: string, cacheTTL: number): void {
  if (pendingRefresh.has(cacheKey)) return;
  pendingRefresh.add(cacheKey);
  fetch(url, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(8000) })
    .then(r => r.ok ? r.json() : null)
    .then(data => { if (data) setCache(cacheKey, data, cacheTTL); })
    .catch(() => pendingRefresh.delete(cacheKey));
}

// Timeout-safe fetch with fallback + stale-while-revalidate
async function safeFetch<T>(url: string, fallback: T, cacheKey?: string, cacheTTL = 300_000): Promise<T> {
  if (cacheKey) {
    const cached = getCached<T>(cacheKey);
    if (cached) {
      if (!cached.fresh) backgroundRefresh(url, cacheKey, cacheTTL);
      return cached.value;
    }
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
  return safeFetch(`${API_BASE}/api/content/all`, getFallbackConfig(), 'site_config', 300_000);
}

// Get contact info from DB
export async function getContactInfo(): Promise<Record<string, any> | null> {
  return safeFetch<Record<string, any> | null>(`${API_BASE}/api/contact/`, null, 'contact_info', 60_000);
}

// Get all published courses
export async function getAllCourses() {
  const data = await safeFetch<{ courses: any[] }>(
    `${API_BASE}/api/courses/?published_only=true&limit=100`,
    { courses: getFallbackCourses() },
    'all_courses',
    300_000
  );
  return (data.courses || []).sort((a: any, b: any) => (a.order || 99) - (b.order || 99));
}

// Get single course by slug
export async function getCourseBySlug(slug: string) {
  return safeFetch(`${API_BASE}/api/courses/${slug}`, null, `course_${slug}`, 300_000);
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
      hero_subheadline: 'Hands-on sessions, structured curriculum, and portfolio projects — built to help you learn faster and perform confidently in interviews.',
      hero_cta_text: 'Explore Courses',
      hero_badge_text: 'Job-focused training',
      stat1_value: '500+', stat1_label: 'Students Trained',
      stat2_value: '8+', stat2_label: 'Expert Courses',
      stat3_value: '95%', stat3_label: 'Satisfaction Rate',
      stat4_value: '100%', stat4_label: 'Placement Support',
    },
    about: {},
    contact: {},
  };
}

// Fallback courses when API is unreachable
function getFallbackCourses() {
  return [
    { slug: 'react', title: 'React Development', icon: '\u269B\uFE0F', category: 'Frontend',
      short_description: 'Build modern web apps with React.', duration: '8 weeks',
      mode: 'Online / Offline', level: 'Beginner \u2192 Intermediate', price: 'Contact for pricing',
      badge: 'Popular', order: 1, curriculum: ['JavaScript refresher', 'React fundamentals'],
      is_published: true, featured: true },
    { slug: 'angular', title: 'Angular Development', icon: '\uD83C\uDD70\uFE0F', category: 'Frontend',
      short_description: 'Build scalable frontend apps with Angular.', duration: '8 weeks',
      mode: 'Online / Offline', level: 'Intermediate', price: 'Contact for pricing',
      order: 2, curriculum: ['TypeScript essentials', 'Angular fundamentals'], is_published: true },
    { slug: 'fullstack-development', title: 'Full Stack Development', icon: '\uD83E\uDDE9', category: 'Full Stack',
      short_description: 'Build complete web apps frontend to backend.', duration: '12 weeks',
      mode: 'Online / Offline', level: 'Beginner \u2192 Intermediate', price: 'Contact for pricing',
      badge: 'Best Value', order: 3, curriculum: ['Web fundamentals', 'Frontend development'], is_published: true },
  ];
}
