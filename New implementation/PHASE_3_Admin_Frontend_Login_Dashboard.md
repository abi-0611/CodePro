# PHASE 3 — Admin Frontend: Login Page, Auth System & Dashboard Shell

## Context
This phase builds the **admin-frontend** — a completely separate Astro app living at `/admin-frontend/`. It must:
- Match the design language of the main CodePro.io site (same font stack, same color palette)
- Have a secure login page that stores JWT in httpOnly cookies (via a server-side endpoint)
- Have a dashboard shell with sidebar navigation
- Protect all dashboard routes server-side (redirect to login if no valid token)

**Do NOT modify any file in the main website (`/src/`, `astro.config.mjs`, etc.)**

The main site uses:
- Fonts: Space Grotesk (headings), Inter (body)
- Colors: `--color-primary: #b45309`, dark amber palette
- Border radius: `--radius-card: 20px`
- The same Tailwind CSS v4

---

## 1. Admin Frontend `package.json`

```json
{
  "name": "codepro-admin",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "astro dev --port 4322",
    "build": "astro build",
    "preview": "astro preview --port 4322"
  },
  "dependencies": {
    "astro": "^6.1.0",
    "@astrojs/react": "^5.0.2",
    "@tailwindcss/vite": "^4.1.14",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@fontsource/inter": "^5.2.8",
    "@fontsource/space-grotesk": "^5.2.10",
    "lucide-react": "^0.546.0",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/node": "^22.0.0",
    "typescript": "~5.8.2"
  }
}
```

---

## 2. `astro.config.mjs` for Admin Frontend

```javascript
// admin-frontend/astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',   // SSR mode — required for auth middleware and cookie handling
  base: '/admin',     // Admin site lives at /admin path when deployed together
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    port: 4322,
    host: '0.0.0.0',
  },
});
```

---

## 3. Auth Utility (`src/lib/auth.ts`)

Write a TypeScript module for the admin frontend:

```typescript
// All functions are used in .astro files (server-side) and React components (client-side)

const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';
const TOKEN_COOKIE = 'codepro_admin_token';
const REFRESH_COOKIE = 'codepro_admin_refresh';

// Server-side (used in Astro frontmatter):
export function getTokenFromCookies(cookies: AstroCookies): string | null
export function setAuthCookies(cookies: AstroCookies, accessToken: string, refreshToken: string): void
  // Set access_token: httpOnly, secure, sameSite: lax, maxAge: 3600
  // Set refresh_token: httpOnly, secure, sameSite: lax, maxAge: 604800
export function clearAuthCookies(cookies: AstroCookies): void
export function isAuthenticated(cookies: AstroCookies): boolean
  // Returns true if access token cookie exists (not expired check — just presence)
export async function verifyTokenWithAPI(token: string): Promise<{valid: boolean, user?: AdminUser}>
  // Calls GET /api/auth/me with Bearer token, returns result

// Client-side (used in React components):
export async function loginRequest(username: string, password: string): Promise<LoginResult>
  // POST to /api/admin-auth/login (an Astro API route that proxies to FastAPI and sets cookies)
export async function logoutRequest(): Promise<void>
  // POST to /api/admin-auth/logout (clears cookies server-side)
export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T>
  // Wrapper for authenticated API calls — reads token from cookie via server, or from memory
  // Handles 401 → redirects to /admin/login
  // Adds Authorization: Bearer <token> header automatically
```

---

## 4. Astro Middleware (`src/middleware.ts`)

```typescript
// Protects all /admin/dashboard/* routes
// If no valid token cookie → redirect to /admin/login
// If token is expired → try to refresh using refresh cookie → update access token cookie
// If refresh also fails → clear cookies → redirect to login

import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  
  // Public routes — allow through
  const publicRoutes = ['/admin/login', '/admin/api/admin-auth/login'];
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return next();
  }
  
  // Protected routes — check token
  if (pathname.startsWith('/admin/dashboard')) {
    const token = getTokenFromCookies(context.cookies);
    if (!token) {
      return context.redirect('/admin/login');
    }
    // Optionally verify with API (can skip for performance — just check cookie presence)
    // If you want strict verification: call verifyTokenWithAPI and redirect if invalid
  }
  
  return next();
});
```

---

## 5. Admin API Routes (Astro Server Endpoints)

These are **Astro API routes** that act as a proxy layer, handling cookies securely.

### `src/pages/api/admin-auth/login.ts`
```typescript
// POST /admin/api/admin-auth/login
// Accepts: { username: string, password: string }
// Calls FastAPI POST /api/auth/login
// On success: set httpOnly cookies, return { success: true, user: {...} }
// On failure: return { success: false, error: "Invalid credentials" } with 401
```

### `src/pages/api/admin-auth/logout.ts`
```typescript
// POST /admin/api/admin-auth/logout
// Clears auth cookies
// Returns { success: true }
```

### `src/pages/api/admin-auth/me.ts`
```typescript
// GET /admin/api/admin-auth/me
// Reads token from cookie, calls FastAPI GET /api/auth/me
// Returns user data or 401
```

---

## 6. Global Admin Styles (`src/styles/admin.css`)

```css
/* Import same fonts as main site */
@import "@fontsource/space-grotesk/400.css";
@import "@fontsource/space-grotesk/700.css";
@import "@fontsource/inter/400.css";
@import "@fontsource/inter/600.css";
@import "tailwindcss";

:root {
  /* Same color palette as main site */
  --color-primary: #b45309;
  --color-primary-dark: #92400e;
  --color-primary-light: #fef3c7;
  
  /* Admin-specific layout */
  --sidebar-width: 260px;
  --header-height: 64px;
  --radius-card: 16px;
  --radius-input: 10px;
  
  /* Admin light theme */
  --bg-page: #f5f5f7;
  --bg-sidebar: #1a1a2e;       /* Deep navy for sidebar */
  --bg-sidebar-hover: #16213e;
  --bg-card: #ffffff;
  --text-primary: #111111;
  --text-secondary: #6b7280;
  --text-sidebar: #94a3b8;
  --text-sidebar-active: #ffffff;
  --border-color: #e5e7eb;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
}

/* Form input base style */
.admin-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-input);
  background: white;
  color: var(--text-primary);
  font-size: 0.875rem;
  line-height: 1.5;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.admin-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(180, 83, 9, 0.12);
}
.admin-input.error { border-color: #ef4444; }

/* Admin button styles */
.admin-btn {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 1rem; border-radius: 8px;
  font-weight: 500; font-size: 0.875rem;
  transition: all 0.15s; cursor: pointer;
}
.admin-btn-primary { background: var(--color-primary); color: white; }
.admin-btn-primary:hover { background: var(--color-primary-dark); }
.admin-btn-secondary { background: white; color: var(--text-primary); border: 1px solid var(--border-color); }
.admin-btn-secondary:hover { background: #f9fafb; }
.admin-btn-danger { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
.admin-btn-danger:hover { background: #dc2626; color: white; }

/* Card */
.admin-card {
  background: var(--bg-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-color);
  padding: 1.5rem;
}

/* Toast notification */
.admin-toast {
  position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
  min-width: 300px; padding: 1rem 1.25rem;
  border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  display: flex; align-items: center; gap: 0.75rem;
  animation: slideInRight 0.3s ease;
}
.admin-toast.success { background: #f0fdf4; border-left: 4px solid #22c55e; color: #15803d; }
.admin-toast.error { background: #fef2f2; border-left: 4px solid #ef4444; color: #dc2626; }
.admin-toast.info { background: #eff6ff; border-left: 4px solid #3b82f6; color: #1d4ed8; }

@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

---

## 7. Login Page (`src/pages/login.astro`)

Full implementation requirements:

**Server-side** (frontmatter):
- If user already has valid token cookie → redirect to `/admin/dashboard`
- Read any `?error=` query param to show error message
- Read any `?redirect=` param to redirect after login

**HTML Structure**:
```
Full-screen layout with two columns (desktop) / single column (mobile):

LEFT COLUMN (hidden on mobile):
- Large gradient background (#b45309 → #92400e)
- CodePro.io logo (text-based, large)
- Tagline: "Admin Control Center"
- Decorative stat cards floating:
  - "8 Courses"
  - "Live Updates"
  - "Secure CMS"
- Subtle grid pattern overlay (same as main site)

RIGHT COLUMN:
- White card, centered
- "Welcome back" headline
- "Sign in to manage your content" subtext
- Username field (with user icon inside)
- Password field (with lock icon, show/hide toggle button)
- "Remember me" checkbox (extends token to 7 days — just visual for now)
- Primary "Sign In" button (full width, amber, loading spinner state)
- Error message area (red, below button)
- Footer: "CodePro.io Admin • v1.0"
```

**JavaScript (client-side in `<script>` tag)**:
```javascript
// Handle form submission via fetch (not page reload)
// POST to /admin/api/admin-auth/login
// Show loading state on button (disable + spinner)
// On success: window.location.href = redirect param or '/admin/dashboard'
// On failure: show error message, shake the card (CSS animation)
// Clear password field on error
// Keyboard: Enter key submits form
// Input validation: both fields required, username min 3 chars
```

---

## 8. Admin Layout (`src/layouts/AdminLayout.astro`)

Props: `{ title: string, activeNav?: string }`

**Structure**:
```
<html>
  <head> (meta, fonts, CSS) </head>
  <body class="admin-body">
    <aside class="sidebar"> ... </aside>
    <div class="main-area">
      <header class="top-bar"> ... </header>
      <main class="content-area">
        <slot />
      </main>
    </div>
  </body>
</html>
```

**Sidebar** (fixed, left, `--sidebar-width` wide):
- Dark navy background (`#1a1a2e`)
- Top: Logo area with "⚡ CodePro Admin" text and version badge
- Navigation sections:

```
OVERVIEW
  🏠 Dashboard         /admin/dashboard

CONTENT
  📚 Courses           /admin/dashboard/courses
  🏠 Homepage          /admin/dashboard/home-content
  ℹ️  About Page       /admin/dashboard/about-content
  📞 Contact Info      /admin/dashboard/contact

SETTINGS
  🔐 Security          /admin/dashboard/security
```

- Active state: highlight with amber left border + lighter text
- Hover state: slightly lighter background
- Bottom: User info card showing current admin username + "Sign Out" button

**Top Bar** (fixed, right of sidebar):
- Page title (from props)
- Right side: "View Live Site →" link that opens main site in new tab
- Breadcrumb showing current location
- Last saved indicator: "Last saved: 2 min ago" (placeholder)

**Server-side auth check** in frontmatter:
```typescript
// If no token → Astro.redirect('/admin/login')
const token = getTokenFromCookies(Astro.cookies);
if (!token) return Astro.redirect('/admin/login');
```

---

## 9. Dashboard Index (`src/pages/dashboard/index.astro`)

Uses `AdminLayout` with title "Dashboard".

**Content**:

Stats row (4 cards):
- Total Courses (fetch from GET /api/courses/ → total)
- Published Courses
- Content Sections managed
- "Last Updated" timestamp

Quick Actions grid:
- "Add New Course" button → `/admin/dashboard/courses/new`
- "Edit Homepage" → `/admin/dashboard/home-content`
- "Update Contact Info" → `/admin/dashboard/contact`
- "View Live Site" → main site URL

Recent Activity list (placeholder):
- Static list showing: "Course 'React Development' updated", "Contact info saved", etc.
- Mark as "coming soon" with a small badge

Content Health checklist:
- Fetch all sections from API
- For each: show green ✓ if has content, yellow ⚠ if empty
- Show: Homepage Content, About Content, Contact Info, Course Count

**All data fetching is server-side** using the token from cookies:
```typescript
const token = getTokenFromCookies(Astro.cookies);
const courses = await fetch(`${API_BASE}/api/courses/?limit=100`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());
```

---

## 10. Shared React Components (for reuse in Phase 4)

### `src/components/ui/Toast.tsx`
```typescript
// Self-dismissing toast notification
// Props: { message: string, type: 'success' | 'error' | 'info', onDismiss: () => void }
// Auto-dismiss after 4 seconds
// Click to dismiss early
// Slide-in animation from right
```

### `src/components/ui/LoadingSpinner.tsx`
```typescript
// Centered spinner with optional "Loading..." text
// Props: { size?: 'sm' | 'md' | 'lg', text?: string }
```

### `src/components/ui/ConfirmDialog.tsx`
```typescript
// Modal confirmation dialog
// Props: { isOpen: bool, title: str, message: str, onConfirm: fn, onCancel: fn, confirmLabel?: str, isDangerous?: bool }
// isDangerous = red confirm button
// Backdrop click cancels
// Escape key cancels
```

### `src/components/ui/FormField.tsx`
```typescript
// Reusable form field wrapper
// Props: { label: string, required?: bool, error?: string, helpText?: string, children: ReactNode }
// Renders: label → children (input/select/textarea) → error message → help text
```

### `src/components/ui/PageHeader.tsx`
```typescript
// Page section header within dashboard pages
// Props: { title: str, description?: str, action?: { label: str, href?: str, onClick?: fn, variant?: 'primary'|'secondary' } }
```

---

## Deliverables Checklist for Phase 3
- [ ] `package.json` with all dependencies
- [ ] `astro.config.mjs` with SSR mode enabled
- [ ] `src/lib/auth.ts` with all utility functions
- [ ] `src/middleware.ts` protecting dashboard routes
- [ ] 3 Astro API route files for auth proxy
- [ ] `src/styles/admin.css` with complete design system
- [ ] `src/pages/login.astro` — full pixel-perfect implementation
- [ ] `src/layouts/AdminLayout.astro` — full layout with sidebar and topbar
- [ ] `src/pages/dashboard/index.astro` — dashboard home with real data
- [ ] 5 shared React UI components

## Important Constraints
- **SSR mode is mandatory** — cookies cannot be set securely in client-only mode
- **Never store JWT in localStorage** — always use httpOnly cookies via Astro API routes
- **The login page must redirect to dashboard if already authenticated**
- **Sidebar navigation must visually indicate the active route** using `Astro.url.pathname`
- **Mobile**: Sidebar collapses to hamburger menu on screens < 768px (implement toggle)
- **All API calls from server-side** Astro pages use the token from cookies
- **All API calls from client-side** React components call Astro API routes (which handle the token) — never call FastAPI directly from browser to avoid CORS/cookie complexity
