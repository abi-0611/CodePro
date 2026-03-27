# PHASE 2 — Backend API Routers, CRUD Operations & Pydantic Schemas

## Context
Continuing the CodePro Admin CMS build. Phase 1 established the project structure, database models, and security utilities. Phase 2 implements all API endpoints — authentication, course management, site content, and contact info — with full CRUD.

The backend is: **FastAPI + SQLAlchemy (async) + Neon DB (Postgres) + JWT auth**

Refer to the models defined in Phase 1:
- `AdminUser` (table: `admin_users`)
- `Course` (table: `courses`)
- `SiteContent` (table: `site_content`)
- `ContactInfo` (table: `contact_info`)

---

## 1. Pydantic Schemas (Full Implementation)

### `app/schemas/user.py`
```
- Token: { access_token: str, refresh_token: str, token_type: str }
- TokenData: { username: str | None }
- AdminUserBase: { username: str, email: EmailStr | None }
- AdminUserCreate: inherits Base, adds { password: str } (min 8 chars, validated)
- AdminUserUpdate: { email?, password?, is_active? } (all optional)
- AdminUserOut: inherits Base, adds { id: UUID, is_active: bool, is_superuser: bool, created_at: datetime }
  - model_config = ConfigDict(from_attributes=True)
- LoginRequest: { username: str, password: str }
- RefreshTokenRequest: { refresh_token: str }
- ChangePasswordRequest: { current_password: str, new_password: str }
```

### `app/schemas/course.py`
```
- CourseBase:
    title: str (min 3, max 255)
    short_description: str (min 10)
    description: str | None
    duration: str
    mode: str
    level: str
    icon: str (max 10)
    price: str
    badge: str | None
    order: int = 99
    category: str
    next_batch: str | None
    curriculum: list[str] (min 1 item)
    curriculum_topics: list[list[str]] | None
    highlights: list[str] | None
    faqs: list[FAQItem] | None   ← FAQItem = BaseModel with q: str, a: str
    featured: bool = False
    is_published: bool = True

- CourseCreate: inherits CourseBase, adds { slug: str } 
  - slug validator: lowercase, only alphanumeric + hyphens, 3-100 chars
  
- CourseUpdate: ALL fields Optional (partial update support)

- CourseOut: inherits CourseBase, adds { id: UUID, slug: str, created_at: datetime, updated_at: datetime | None }
  - model_config = ConfigDict(from_attributes=True)

- CourseListOut: { courses: list[CourseOut], total: int }
```

### `app/schemas/site_content.py`
```
- SiteContentBase:
    section: str (max 100)
    key: str (max 100)
    value: str | None
    value_json: dict | list | None
    content_type: Literal["text", "json", "html", "url"] = "text"
    label: str | None
    description: str | None

- SiteContentCreate: inherits Base
- SiteContentUpdate: { value?, value_json?, label?, description? } all optional
- SiteContentOut: inherits Base, adds { id: UUID, updated_at: datetime | None }
  - model_config = ConfigDict(from_attributes=True)

- SiteContentBulkUpdate: { items: list[SiteContentUpdate & {id: UUID}] }
- SectionOut: { section: str, items: list[SiteContentOut] }
```

### `app/schemas/contact_info.py`
```
- ContactInfoBase: all fields from the model, all optional for update
- ContactInfoCreate: inherits Base (required fields: institute_name, phone, email, address)
- ContactInfoUpdate: ALL fields optional
- ContactInfoOut: inherits Base, adds { id: UUID, updated_at: datetime | None }
  - model_config = ConfigDict(from_attributes=True)
```

---

## 2. CRUD Layer

### `app/crud/course.py`
Implement these async functions (all take `db: AsyncSession` as first param):

```python
async def get_course_by_id(db, course_id: UUID) -> Course | None
async def get_course_by_slug(db, slug: str) -> Course | None
async def get_all_courses(db, skip: int = 0, limit: int = 100, published_only: bool = False) -> list[Course]
async def get_courses_count(db, published_only: bool = False) -> int
async def create_course(db, course_in: CourseCreate) -> Course
async def update_course(db, course: Course, updates: CourseUpdate) -> Course
    # Use model_dump(exclude_unset=True) to only update provided fields
async def delete_course(db, course: Course) -> None
async def reorder_courses(db, order_map: dict[UUID, int]) -> list[Course]
    # Updates order field for multiple courses in one transaction
async def toggle_publish(db, course: Course) -> Course
```

For `create_course` and `update_course`:
- Auto-set `updated_at = datetime.utcnow()` on every write
- Use `db.add(obj)`, `await db.commit()`, `await db.refresh(obj)` pattern
- Handle `IntegrityError` for slug conflicts — raise `HTTPException(409)`

### `app/crud/site_content.py`

```python
async def get_content_by_section(db, section: str) -> list[SiteContent]
async def get_content_by_key(db, section: str, key: str) -> SiteContent | None
async def get_all_sections(db) -> list[str]   # distinct section names
async def upsert_content(db, section: str, key: str, value: str | None, value_json: Any | None, content_type: str) -> SiteContent
    # INSERT ... ON CONFLICT (section, key) DO UPDATE SET value=..., updated_at=...
    # Use SQLAlchemy's postgresql dialect insert with on_conflict_do_update
async def bulk_update_content(db, items: list[dict]) -> list[SiteContent]
async def delete_content(db, content_id: UUID) -> None
async def get_full_site_config(db) -> dict
    # Returns all content grouped by section as nested dict:
    # { "home": { "hero_headline": "...", ... }, "about": {...}, ... }
```

### `app/crud/contact_info.py`

```python
async def get_contact_info(db) -> ContactInfo | None    # always returns the single row
async def create_contact_info(db, data: ContactInfoCreate) -> ContactInfo
async def update_contact_info(db, contact: ContactInfo, updates: ContactInfoUpdate) -> ContactInfo
async def upsert_contact_info(db, data: ContactInfoCreate) -> ContactInfo
    # If no row exists, create. If exists, update. 
    # This ensures only one row ever exists.
```

---

## 3. Auth Router (`app/routers/auth.py`)

Endpoints with prefix `/api/auth`:

### `POST /login`
- Accept `OAuth2PasswordRequestForm` (form data: username, password)
- **Also** accept JSON body `LoginRequest` — detect content-type and handle both
- Fetch user by username from DB
- Verify password with `verify_password`
- If invalid: raise `HTTPException(401, "Incorrect username or password")` — use exact message
- Return `Token`:
  ```json
  {
    "access_token": "...",
    "refresh_token": "...",
    "token_type": "bearer",
    "expires_in": 3600
  }
  ```
- Log login attempt (success/failure) with timestamp and IP

### `POST /refresh`
- Accept `RefreshTokenRequest`
- Decode and validate refresh token
- Return new `access_token` (short-lived) without re-issuing refresh token
- Raise 401 if refresh token is expired or invalid

### `POST /logout`
- Requires auth (JWT in header)
- Returns `{"message": "Logged out successfully"}`
- (Token blacklisting is optional in this phase — just return success)

### `GET /me`
- Requires auth
- Returns `AdminUserOut` of current user

### `PUT /me/password`
- Requires auth
- Accept `ChangePasswordRequest`
- Verify current password, hash new password, update DB
- Return `{"message": "Password changed successfully"}`

### `POST /setup` *(only available when no admin users exist)*
- Creates the first superuser
- Disabled after first user exists — returns 403
- Used for initial setup without running seed script

---

## 4. Courses Router (`app/routers/courses.py`)

**ALL write endpoints require `Depends(get_current_active_user)`**
**GET endpoints are public (no auth required) — the main Astro site calls these**

```
GET  /api/courses/
  Query params: skip=0, limit=100, published_only=false, category=None
  Returns: CourseListOut

GET  /api/courses/{slug}
  Returns: CourseOut
  Raises 404 if not found

GET  /api/courses/id/{course_id}
  Returns: CourseOut by UUID
  Raises 404 if not found

POST /api/courses/                    [PROTECTED]
  Body: CourseCreate
  Returns: CourseOut (201)
  Raises 409 if slug already exists

PUT  /api/courses/{slug}              [PROTECTED]
  Body: CourseUpdate (partial — only send changed fields)
  Returns: CourseOut

DELETE /api/courses/{slug}            [PROTECTED]
  Returns: {"message": "Course deleted", "slug": "..."}

POST /api/courses/reorder             [PROTECTED]
  Body: { "order": [{"slug": "react", "order": 1}, ...] }
  Returns: {"message": "Reordered successfully"}

POST /api/courses/{slug}/toggle-publish  [PROTECTED]
  Toggles is_published boolean
  Returns: CourseOut
```

---

## 5. Site Content Router (`app/routers/site_content.py`)

**GET endpoints are public. All write endpoints require auth.**

```
GET  /api/content/
  Returns all sections as: { "sections": ["home", "about", "meta", ...] }

GET  /api/content/all
  Returns full nested config: { "home": {...}, "about": {...} }
  ← This is the PRIMARY endpoint the Astro site uses

GET  /api/content/{section}
  Returns: SectionOut — all key/value pairs in the section

GET  /api/content/{section}/{key}
  Returns: SiteContentOut
  Raises 404 if not found

PUT  /api/content/{section}/{key}     [PROTECTED]
  Body: SiteContentUpdate
  Returns: SiteContentOut
  Creates if not exists (upsert behavior)

POST /api/content/bulk                [PROTECTED]
  Body: { "updates": [{ "section": "...", "key": "...", "value": "..." }] }
  Returns: { "updated": count, "items": [...] }
  ← Used by the admin dashboard to save an entire section at once

DELETE /api/content/{content_id}      [PROTECTED]
  Deletes by UUID
  Returns: {"message": "Deleted"}
```

---

## 6. Contact Info Router (`app/routers/contact_info.py`)

```
GET  /api/contact/
  Returns: ContactInfoOut (or 404 if not seeded yet)
  ← Public — Astro site uses this

PUT  /api/contact/                    [PROTECTED]
  Body: ContactInfoUpdate (all fields optional)
  Returns: ContactInfoOut
  Upsert behavior: creates if not exists, updates if exists

GET  /api/contact/social-links
  Returns only social media URLs as a clean object:
  { "instagram": "...", "facebook": "...", "youtube": "...", "linkedin": "...", "whatsapp": "..." }
  ← Public
```

---

## 7. Error Handling & Response Standards

Add to `main.py`:

```python
# Standard error response format — implement for all routers:
{
    "error": true,
    "message": "Human readable message",
    "detail": "Technical detail (only in dev)",
    "code": "ERROR_CODE"  # e.g. "NOT_FOUND", "UNAUTHORIZED", "VALIDATION_ERROR"
}

# HTTP Exception handler → format above
# Validation error handler (422) → list field errors clearly
# Generic 500 handler → log full traceback, return safe message
```

---

## 8. Pagination & Filtering for Courses

Implement a reusable `PaginationParams` dependency:
```python
class PaginationParams:
    def __init__(self, skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100)):
        self.skip = skip
        self.limit = limit
```

Add to `GET /api/courses/` response:
```json
{
  "courses": [...],
  "total": 8,
  "skip": 0,
  "limit": 20,
  "has_more": false
}
```

---

## 9. Request/Response Logging Middleware

Add to `main.py`:
```python
# Log every request: method, path, status_code, duration_ms
# Format: "[2024-01-15 10:30:45] GET /api/courses/ → 200 (45ms)"
# Use Starlette's BaseHTTPMiddleware
# Skip logging for /docs, /openapi.json, /health
```

---

## 10. API Documentation Enhancement

In `main.py`, configure OpenAPI metadata:
```python
app = FastAPI(
    title="CodePro Admin API",
    description="Backend CMS for CodePro.io training institute website",
    version="1.0.0",
    docs_url="/docs" if settings.APP_ENV == "development" else None,
    redoc_url="/redoc" if settings.APP_ENV == "development" else None,
    openapi_tags=[
        {"name": "auth", "description": "Authentication & user management"},
        {"name": "courses", "description": "Course CRUD — public GET, protected write"},
        {"name": "content", "description": "Site content management by section/key"},
        {"name": "contact", "description": "Contact info and social links"},
    ]
)
```

Tag all router endpoints appropriately.

---

## Deliverables Checklist for Phase 2
- [ ] All 4 schema files fully written (no TODOs)
- [ ] All 3 CRUD files fully implemented with proper async patterns
- [ ] Auth router with all 6 endpoints
- [ ] Courses router with all 8 endpoints
- [ ] Site content router with all 7 endpoints
- [ ] Contact info router with all 3 endpoints
- [ ] Middleware for request logging
- [ ] Standardized error responses
- [ ] OpenAPI fully tagged and documented
- [ ] All endpoints tested mentally against: empty DB, partial updates, not-found cases

## Critical Patterns to Follow

1. **Always use `await db.execute(select(...))` then `.scalars().first()` or `.scalars().all()`**
2. **For JSONB fields**: store Python lists/dicts directly — SQLAlchemy handles serialization
3. **Slug uniqueness**: enforce at DB level (unique constraint) AND return 409 from API
4. **Partial updates**: use `model_dump(exclude_unset=True)` on `CourseUpdate` before applying
5. **The Astro site GET endpoints must work WITHOUT any auth headers** — verify CORS allows this
6. **datetime**: always use `datetime.utcnow()` for writes, store as UTC in DB
