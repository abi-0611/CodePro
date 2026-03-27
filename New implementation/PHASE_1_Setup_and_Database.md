# PHASE 1 — Project Setup, Database Architecture & Environment Configuration

## Context
I have an existing Astro + React + Tailwind website called **CodePro.io** — a tech training institute website. I need to build a **full Admin CMS Dashboard** on top of it. This phase sets up the entire backend foundation.

The existing frontend stack is:
- Astro v6 + React 19 + Tailwind CSS v4
- Content is currently hardcoded in MDX files and TypeScript constants
- The site is at the root of the project (astro.config.mjs, src/, public/, etc.)

## What to Build in This Phase

### 1. Directory Structure to Create

Create the following folder structure **alongside** the existing Astro project (do NOT touch any existing files):

```
/admin-backend/
├── main.py
├── requirements.txt
├── .env.example
├── alembic.ini
├── alembic/
│   ├── env.py
│   └── versions/
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── database.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── site_content.py
│   │   └── contact_info.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── site_content.py
│   │   └── contact_info.py
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── courses.py
│   │   ├── site_content.py
│   │   └── contact_info.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py
│   │   └── dependencies.py
│   └── crud/
│       ├── __init__.py
│       ├── course.py
│       ├── site_content.py
│       └── contact_info.py
```

Also create an admin frontend directory:
```
/admin-frontend/
├── package.json
├── astro.config.mjs
├── tsconfig.json
├── tailwind.config.mjs  (if needed)
├── public/
└── src/
    ├── layouts/
    │   └── AdminLayout.astro
    ├── pages/
    │   ├── login.astro
    │   └── dashboard/
    │       └── index.astro
    ├── components/
    └── styles/
        └── admin.css
```

---

### 2. `requirements.txt` — Full Backend Dependencies

```txt
fastapi==0.115.0
uvicorn[standard]==0.30.6
asyncpg==0.29.0
sqlalchemy[asyncio]==2.0.35
alembic==1.13.2
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
python-dotenv==1.0.1
pydantic==2.8.2
pydantic-settings==2.4.0
httpx==0.27.2
email-validator==2.2.0
greenlet==3.1.0
```

---

### 3. `app/config.py` — Settings with Pydantic

Write a `Settings` class using `pydantic_settings.BaseSettings` that reads from `.env`:

- `DATABASE_URL`: Neon DB connection string (asyncpg format: `postgresql+asyncpg://...`)
- `SECRET_KEY`: 64-char random hex string for JWT signing
- `ALGORITHM`: `"HS256"`
- `ACCESS_TOKEN_EXPIRE_MINUTES`: `60`
- `REFRESH_TOKEN_EXPIRE_DAYS`: `7`
- `ADMIN_USERNAME`: default admin username
- `ADMIN_PASSWORD`: hashed bcrypt password stored in env
- `CORS_ORIGINS`: list of allowed origins (the Astro frontend URLs)
- `APP_ENV`: `"development"` or `"production"`

Use `model_config = SettingsConfigDict(env_file=".env")` and export a singleton `settings = Settings()`.

---

### 4. `app/database.py` — Async SQLAlchemy with Neon DB

Set up:
- `create_async_engine` with the Neon DB `DATABASE_URL`
- Engine pool settings appropriate for serverless: `pool_size=5`, `max_overflow=10`, `pool_pre_ping=True`, `pool_recycle=300`
- `AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)`
- `Base = declarative_base()`
- An async `get_db()` dependency generator that yields a session and handles rollback on exception

---

### 5. Database Models — Full Schema

#### `app/models/user.py`
Table: `admin_users`
- `id`: UUID primary key (default `uuid4`)
- `username`: String(50), unique, not null, indexed
- `email`: String(255), unique, nullable
- `hashed_password`: String(255), not null
- `is_active`: Boolean, default True
- `is_superuser`: Boolean, default False
- `created_at`: DateTime with timezone, server_default `now()`
- `updated_at`: DateTime with timezone, onupdate

#### `app/models/course.py`
Table: `courses`
- `id`: UUID primary key
- `slug`: String(100), unique, not null, indexed — URL-friendly identifier
- `title`: String(255), not null
- `short_description`: Text, not null
- `description`: Text, nullable
- `duration`: String(50) — e.g. "8 weeks"
- `mode`: String(100) — e.g. "Online / Offline"
- `level`: String(50) — e.g. "Beginner"
- `icon`: String(10) — emoji
- `price`: String(100)
- `badge`: String(50), nullable — e.g. "Popular"
- `order`: Integer, default 99
- `category`: String(100)
- `next_batch`: String(100), nullable
- `curriculum`: JSONB — array of strings (module names)
- `curriculum_topics`: JSONB — array of arrays of strings
- `highlights`: JSONB — array of strings
- `faqs`: JSONB — array of `{q, a}` objects
- `featured`: Boolean, default False
- `is_published`: Boolean, default True
- `created_at`: DateTime with timezone
- `updated_at`: DateTime with timezone

#### `app/models/site_content.py`
Table: `site_content`
- `id`: UUID primary key
- `section`: String(100), not null, indexed — e.g. `"home"`, `"about"`, `"hero"`
- `key`: String(100), not null — e.g. `"hero_headline"`, `"site_tagline"`
- `value`: Text, nullable — the actual content string
- `value_json`: JSONB, nullable — for complex structured content (arrays, objects)
- `content_type`: String(50), default `"text"` — `"text"`, `"json"`, `"html"`, `"url"`
- `label`: String(255), nullable — human-readable label for the admin UI
- `description`: Text, nullable — help text explaining what this field controls
- `updated_at`: DateTime with timezone
- Add a **unique constraint** on `(section, key)`

#### `app/models/contact_info.py`
Table: `contact_info`
- `id`: UUID primary key
- `institute_name`: String(255)
- `site_tagline`: String(500)
- `phone`: String(50)
- `email`: String(255)
- `address`: Text
- `city`: String(100)
- `state`: String(100)
- `pincode`: String(20)
- `google_maps_url`: Text
- `whatsapp_url`: Text
- `facebook_url`: Text
- `instagram_url`: Text
- `youtube_url`: Text
- `linkedin_url`: Text
- `working_hours`: String(255)
- `brochure_pdf_url`: Text, nullable
- `promo_text`: Text, nullable
- `updated_at`: DateTime with timezone

---

### 6. `app/core/security.py` — JWT + Password Hashing

Implement:
- `pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")`
- `verify_password(plain, hashed) -> bool`
- `get_password_hash(password) -> str`
- `create_access_token(data: dict, expires_delta: timedelta | None) -> str` — signs with HS256, includes `exp` and `sub` claims
- `create_refresh_token(data: dict) -> str` — longer-lived token
- `decode_token(token: str) -> dict | None` — returns payload or None on failure, handles `JWTError` and `ExpiredSignatureError` separately

---

### 7. `app/core/dependencies.py` — Auth Dependencies

- `get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> AdminUser` — decodes JWT, fetches user from DB, raises 401 if invalid
- `get_current_active_user(current_user = Depends(get_current_user)) -> AdminUser` — raises 400 if user is inactive
- `require_superuser(current_user = Depends(get_current_active_user)) -> AdminUser` — raises 403 if not superuser
- Use `OAuth2PasswordBearer(tokenUrl="/api/auth/login")`

---

### 8. Alembic Setup

Configure `alembic/env.py` to:
- Import all models so Alembic can detect them
- Use async engine with `run_sync` pattern
- Read `DATABASE_URL` from settings
- Set `target_metadata = Base.metadata`

Write the first migration file that creates ALL tables defined above.

---

### 9. `main.py` — FastAPI App Entry Point

```python
# Requirements for main.py:
# - Create FastAPI app with title "CodePro Admin API", version "1.0.0"
# - Add CORSMiddleware with settings.CORS_ORIGINS, allow all methods and headers, allow credentials
# - Mount routers with prefix "/api":
#     /api/auth      → auth router
#     /api/courses   → courses router
#     /api/content   → site_content router
#     /api/contact   → contact_info router
# - Add a GET "/" health check endpoint returning {"status": "ok", "app": "CodePro Admin API"}
# - Add startup event that logs "Admin API started"
# - Add proper exception handlers for 404, 422, 500
# - Include OpenAPI docs at /docs (only in development)
```

---

### 10. `.env.example`

```env
# Neon DB - use asyncpg driver format
DATABASE_URL=postgresql+asyncpg://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?ssl=require

# JWT
SECRET_KEY=your-64-char-hex-secret-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Admin Credentials (password is bcrypt hashed)
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$12$...

# CORS - comma separated
CORS_ORIGINS=http://localhost:4321,http://localhost:3000,https://yourdomain.com

# Environment
APP_ENV=development
```

---

### 11. Seed Script `seed_admin.py`

Create a standalone script (run once) that:
1. Creates the DB tables if not exist
2. Inserts one superuser admin with username from env and bcrypt-hashed password
3. Seeds the `contact_info` table with the **real data** from `src/utils/consts.ts`:
   - institute_name: "CodePro.io"
   - phone: "+91 91762 41244"
   - email: "humairasiraj0985@gmail.com"
   - address: "Madambakkam, Chennai, Tamil Nadu, India"
   - whatsapp_url: "https://wa.me/919176241244"
   - google_maps_url: "https://www.google.com/maps/search/?api=1&query=Madambakkam..."
   - working_hours: "9:00 AM - 6:00 PM IST, Monday to Saturday"
4. Seeds the `site_content` table with ALL configurable fields:
   - section: "home", keys: "hero_headline", "hero_subheadline", "hero_cta_text", "home_section_1_title", etc.
   - section: "about", keys: "story_para_1", "story_para_2", "mission_text", "vision_text", "founding_year"
   - section: "meta", keys: "site_tagline", "default_meta_description", "promo_text"
5. Seeds ALL 8 courses from the existing MDX content with exact data (React, Angular, Full Stack, Java, Python, Software Testing, Tally Prime, Web Designing)
6. Print success/failure for each seed operation
7. Be idempotent (use `ON CONFLICT DO NOTHING` or check-before-insert)

---

## Deliverables Checklist for Phase 1
- [ ] Full directory structure created
- [ ] All Python files written with complete implementations (no TODOs, no stubs)
- [ ] All SQLAlchemy models with correct column types and relationships
- [ ] Alembic configured and first migration written
- [ ] Security utilities fully implemented
- [ ] `main.py` fully configured
- [ ] `seed_admin.py` tested and idempotent
- [ ] `.env.example` with all required variables documented

## Important Notes
- Do NOT modify any existing files in the Astro project
- All async operations must use `await` properly
- Use `asyncpg` driver for Neon DB compatibility
- JSONB columns must use `sqlalchemy.dialects.postgresql.JSONB`
- Every model must import from `app.database` for `Base`
- Pydantic v2 syntax: use `model_config`, not `class Config`
