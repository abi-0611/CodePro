# CodePro.io — Job-Focused Tech Training Institute

A full-stack web application for a technology training institute. It includes a public-facing marketing website, a headless CMS REST API, and a protected admin dashboard — all containerised and production-ready.

---

## Architecture

| Service | Tech Stack | Default Port |
|---|---|---|
| **Main Site** | Astro 6 SSR · React 19 · Tailwind CSS 4 | `3000` |
| **API** | FastAPI · SQLAlchemy async · PostgreSQL | `8000` |
| **Admin Dashboard** | Astro 6 SSR · React 19 · Tailwind CSS 4 | `4322` |

```
codepro/
├── src/                    # Main public website
├── admin-backend/          # FastAPI CMS API
├── admin-frontend/         # Admin dashboard
├── docker-compose.yml
├── Dockerfile.main
└── astro.config.mjs
```

---

## Prerequisites

- **Node.js** 20+ and **npm** 10+
- **Python** 3.13+
- **PostgreSQL** database (e.g. [Neon](https://neon.tech) — free tier works)
- **Docker + Docker Compose** (optional, for containerised setup)

---

## Quick Start — Local Development

### 1. Clone the repository

```bash
git clone https://github.com/abi-0611/CodePro.git
cd CodePro
```

### 2. Set up the backend

```bash
cd admin-backend
```

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql+asyncpg://user:password@host/dbname?sslmode=require
SECRET_KEY=<64-character random hex string>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<your strong password>
```

Generate a `SECRET_KEY` with:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Install dependencies and run migrations:

```bash
pip install -r requirements.txt
alembic upgrade head
```

Start the API server:

```bash
uvicorn main:app --reload --port 8000
```

The API is now running at `http://localhost:8000`.
Interactive docs (dev mode only): `http://localhost:8000/docs`

### 3. Set up the main site

```bash
# From the repo root
npm install
npm run dev
```

Main site: `http://localhost:3000`

### 4. Set up the admin dashboard

```bash
cd admin-frontend
npm install
npm run dev
```

Admin dashboard: `http://localhost:4322/admin/login`

### 5. Create the first admin user

On a fresh database, call the one-time setup endpoint:

```bash
curl -X POST http://localhost:8000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@example.com","password":"YourPassword1!"}'
```

This endpoint returns `403 Forbidden` once an admin user already exists.

> **Password requirements:** minimum 8 characters, must include uppercase, lowercase, a digit, and a special character.

---

## Docker Setup (Recommended for Production)

### 1. Configure environment files

```bash
# Backend env
cp admin-backend/.env.example admin-backend/.env
# Edit admin-backend/.env with your DATABASE_URL, SECRET_KEY, etc.

# Root env (for docker-compose)
cp .env.example .env   # or create manually:
```

Create a `.env` in the repo root:

```env
SITE_URL=https://yourdomain.com
CACHE_BUST_SECRET=<random secret shared between services>
```

### 2. Build and start all services

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Main Site | `http://localhost:3000` |
| Admin Dashboard | `http://localhost:4322/admin/login` |
| API | `http://localhost:8000` |

### 3. Stop services

```bash
docker compose down
```

---

## Environment Variables Reference

### `admin-backend/.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | `postgresql+asyncpg://user:pass@host/db?sslmode=require` |
| `SECRET_KEY` | ✅ | 64-char random hex used to sign JWTs |
| `ALGORITHM` | — | JWT algorithm (default: `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | — | Access token lifetime (default: `60`) |
| `REFRESH_TOKEN_EXPIRE_DAYS` | — | Refresh token lifetime (default: `7`) |
| `ADMIN_USERNAME` | — | Seed admin username (default: `admin`) |
| `ADMIN_PASSWORD` | ✅ | Seed admin password (strong password required) |
| `CORS_ORIGINS` | — | JSON array of allowed origins (default: localhost 3000 + 4322) |
| `APP_ENV` | — | `development` enables `/docs`; `production` adds HSTS header |

### Root `.env` / Docker environment

| Variable | Description |
|---|---|
| `SITE_URL` | Canonical URL for sitemap generation (e.g. `https://codepro.io`) |
| `CACHE_BUST_SECRET` | Shared secret between admin-frontend and main-site for cache invalidation |
| `API_URL` | Main site → API URL (default: `http://localhost:8000`) |
| `PUBLIC_API_URL` | Admin frontend → API URL (default: `http://api:8000` in Docker) |
| `MAIN_SITE_URL` | Admin frontend → main site URL for cache busting |
| `SITE_BASE` | Base path prefix for subdirectory deployments (e.g. `/repo` for GitHub Pages) |

---

## Available Scripts

### Main Site

```bash
npm run dev       # Start dev server on port 3000
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # TypeScript type check
```

### Admin Frontend

```bash
cd admin-frontend
npm run dev       # Start dev server on port 4322
npm run build     # Production build
npm run preview   # Preview production build
```

### Backend

```bash
# Dev server
uvicorn main:app --reload --port 8000

# Migrations
alembic upgrade head        # Apply all pending migrations
alembic downgrade -1        # Roll back one migration
alembic revision --autogenerate -m "description"  # Generate new migration

# Tests (if added)
pytest
```

---

## API Reference

Base URL: `http://localhost:8000`

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Login with username + password; returns `access_token` and `refresh_token` |
| `POST` | `/api/auth/refresh` | Public | Exchange refresh token for new access token |
| `POST` | `/api/auth/logout` | 🔒 Bearer | Logout (client should discard tokens) |
| `GET` | `/api/auth/me` | 🔒 Bearer | Get current admin user info |
| `PUT` | `/api/auth/me/password` | 🔒 Bearer | Change admin password |
| `POST` | `/api/auth/setup` | Public | **One-time** — create first admin user (returns 403 if user exists) |

### Courses — `/api/courses`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/courses/` | Public | List courses (`?skip`, `?limit`, `?published_only`, `?category`) |
| `GET` | `/api/courses/{slug}` | Public | Get single course by slug |
| `GET` | `/api/courses/id/{id}` | Public | Get single course by UUID |
| `POST` | `/api/courses/` | 🔒 Bearer | Create course |
| `PUT` | `/api/courses/{slug}` | 🔒 Bearer | Update course |
| `DELETE` | `/api/courses/{slug}` | 🔒 Bearer | Delete course |
| `POST` | `/api/courses/reorder` | 🔒 Bearer | Reorder courses (`{ order: [{slug, order}] }`) |
| `POST` | `/api/courses/{slug}/toggle-publish` | 🔒 Bearer | Toggle published status |

### Site Content — `/api/content`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/content/all` | Public | Full site config grouped by section |
| `GET` | `/api/content/{section}` | Public | All items in a section |
| `GET` | `/api/content/{section}/{key}` | Public | Single content item |
| `PUT` | `/api/content/{section}/{key}` | 🔒 Bearer | Upsert content item |
| `POST` | `/api/content/bulk` | 🔒 Bearer | Bulk upsert content items |
| `DELETE` | `/api/content/{id}` | 🔒 Bearer | Delete content item by UUID |

### Contact Info — `/api/contact`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/contact/` | Public | Get contact info (`null` if not configured) |
| `PUT` | `/api/contact/` | 🔒 Bearer | Create/update contact info |
| `GET` | `/api/contact/social-links` | Public | Social media URLs only |

### Enquiries — `/api/enquiries`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/enquiries/` | Public | Submit enquiry (rate limited: 5 per 5 min per IP) |
| `GET` | `/api/enquiries/` | 🔒 Bearer | List enquiries (`?skip`, `?limit`, `?status`) |

### System

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check (used by Docker) |
| `GET` | `/docs` | Swagger UI (dev mode only) |
| `GET` | `/redoc` | ReDoc (dev mode only) |

---

## Main Website Pages

| Route | Description |
|---|---|
| `/` | **Homepage** — hero section, stats bar, featured courses, full course carousel, Why Choose Us tabs, process steps, testimonials, FAQ accordion, enquiry form |
| `/courses/` | **Course Listing** — all courses with live category filter tabs |
| `/courses/[slug]` | **Course Detail** — full description, highlights, curriculum accordion, FAQs, inline enquiry form, related courses, sticky CTA |
| `/about` | **About** — institute story, mission/vision, trainers, certifications |
| `/contact` | **Contact** — address, phone, email, working hours, map, social links, enquiry form, brochure download |
| `/404` | Custom 404 page |

All pages are server-rendered (Astro SSR) and degrade gracefully to hardcoded fallback content if the API is unreachable.

---

## Admin Dashboard Pages

All dashboard pages require authentication — unauthenticated requests are redirected to `/admin/login`.

| Route | Description |
|---|---|
| `/admin/login` | Login page — redirects to dashboard if already authenticated |
| `/admin/dashboard` | **Overview** — stats (total/published/draft courses, content sections), setup checklist, quick actions |
| `/admin/dashboard/courses` | **Courses** — sortable table, category badges, publish status chips, edit/delete |
| `/admin/dashboard/courses/new` | Create a new course with all fields |
| `/admin/dashboard/courses/[slug]/edit` | Edit an existing course |
| `/admin/dashboard/home-content` | Edit homepage content — hero text, stats bar values, section headers, promo banner |
| `/admin/dashboard/about-content` | Edit about page — story paragraphs, mission/vision, trainer cards |
| `/admin/dashboard/contact` | Edit contact info — phone, email, address, map URL, WhatsApp, social links, working hours, brochure URL |
| `/admin/dashboard/security` | Change admin password, view session info |

---

## Features

### Main Site
- Server-side rendered for SEO and performance
- Dynamic content pulled from CMS with stale-while-revalidate caching (60s–5min TTL)
- Graceful degradation — static fallback content if API is unreachable
- Responsive across all screen sizes
- Dark mode support
- Enquiry form with real API submission and inline error handling
- Auto-generated sitemap (`/sitemap-index.xml`)
- Custom 404 page

### Admin Dashboard
- JWT authentication (access + refresh token rotation)
- Protected routes with server-side auth check
- Course management — create, edit, delete, reorder, publish/unpublish
- Homepage content editor (hero, stats, banners)
- About page content editor (story, trainers with LinkedIn links and photo URLs)
- Contact info editor (all fields including social links)
- Password change with strength validation
- Glassmorphism design system with dark mode
- SSR proxy layer — admin dashboard never exposes API credentials to the browser

### Backend
- Security headers on all responses (`X-Frame-Options`, `X-Content-Type-Options`, etc.)
- CORS restricted to configured origins
- GZip compression
- Rate limiting — 10 login attempts / 5 min per IP; 5 enquiry submissions / 5 min per IP
- Request size limiting — 10 MB max body
- `Cache-Control` headers on all public GET endpoints
- Structured request logging
- Async PostgreSQL (asyncpg) for high concurrency
- Alembic database migrations

---

## Database Schema

### Tables

| Table | Description |
|---|---|
| `admin_users` | Admin accounts — username, email, hashed password, active flag |
| `courses` | Course records — slug, title, category, description, curriculum, FAQs, modes, fees, duration, order, published flag |
| `site_content` | Key-value CMS content indexed by `section` and `key` |
| `contact_info` | Single-row contact details — phone, email, address, social links, working hours |
| `enquiries` | Student enquiry submissions — name, email, phone, course, mode, timing, message, status |

### Migrations

```
alembic/versions/
├── cd67dc58b150_initial.py        # admin_users, courses, site_content, contact_info
└── a7f2e9c3b481_add_enquiries.py  # enquiries table
```

---

## Security Notes

- Never commit `.env` files. They are in `.gitignore`.
- Rotate `SECRET_KEY` and `DATABASE_URL` credentials if they are ever exposed.
- Change the default admin password immediately after first login.
- In production, set `APP_ENV=production` to enable HSTS and disable `/docs`.
- The `/api/auth/setup` endpoint only works once (when no admin user exists).

---

## Tech Stack Summary

### Main Site
`astro` · `@astrojs/react` · `@astrojs/node` · `@astrojs/mdx` · `@astrojs/sitemap` · `tailwindcss` · `react 19` · `motion` · `lucide-react`

### Backend
`fastapi` · `uvicorn` · `sqlalchemy[asyncio]` · `asyncpg` · `alembic` · `python-jose` · `passlib[bcrypt]` · `pydantic-settings` · `email-validator`

### Admin Frontend
`astro` · `@astrojs/react` · `@astrojs/node` · `tailwindcss` · `react 19` · `lucide-react`
