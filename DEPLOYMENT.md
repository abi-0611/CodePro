# CodePro.io — Deployment Guide

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Main Site     │     │   FastAPI        │     │  Admin Frontend │
│   (Astro SSR)   │────▶│   Backend        │◀────│  (Astro SSR)    │
│   port 3000     │     │   port 8000      │     │  port 4322      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                        ┌──────┴──────┐
                        │  PostgreSQL  │
                        │  (Neon DB)   │
                        └─────────────┘
```

## Prerequisites

- Node.js 22+
- Python 3.12+
- PostgreSQL (Neon DB recommended)
- Docker & Docker Compose (for containerized deployment)

## Local Development

### 1. Backend (FastAPI)

```bash
cd admin-backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database URL and JWT secret

# Run migrations
alembic upgrade head

# Seed initial admin user
python seed.py

# Start server
uvicorn main:app --reload --port 8000
```

### 2. Main Site (Astro SSR)

```bash
# From project root
npm install

# Configure environment
# Edit .env with API_URL and CACHE_BUST_SECRET

# Start dev server
npm run dev
```

### 3. Admin Frontend (Astro SSR)

```bash
cd admin-frontend
npm install

# Configure environment
# Edit .env with PUBLIC_API_URL, MAIN_SITE_URL, CACHE_BUST_SECRET

# Start dev server
npm run dev
```

## Docker Deployment

```bash
# From project root
docker compose up -d --build
```

Services:
- **api** → http://localhost:8000
- **main-site** → http://localhost:3000
- **admin-frontend** → http://localhost:4322

## Environment Variables

### Main Site (`.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | FastAPI backend URL | `http://localhost:8000` |
| `CACHE_BUST_SECRET` | Secret for cache invalidation | (required) |

### Admin Frontend (`admin-frontend/.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `PUBLIC_API_URL` | FastAPI backend URL (browser-accessible) | `http://localhost:8000` |
| `MAIN_SITE_URL` | Main site URL for cache busting | `http://localhost:3000` |
| `CACHE_BUST_SECRET` | Must match main site's secret | (required) |

### Backend (`admin-backend/.env`)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Secret for signing JWT tokens |
| `JWT_REFRESH_SECRET_KEY` | Secret for refresh tokens |

## Production Notes

- Set `CACHE_BUST_SECRET` to a strong random string, shared between main site and admin frontend
- Use HTTPS reverse proxy (nginx/Caddy) in front of all services
- The main site gracefully degrades to fallback content if the API is unreachable
- API responses are cached in-memory for 30s (courses/content) to 60s (contact info)
- POST to `/api/cache-bust?secret=YOUR_SECRET` to invalidate the cache immediately
