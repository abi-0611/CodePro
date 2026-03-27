import logging
import time
from collections import defaultdict

import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.database import engine
from app.routers import auth, contact_info, courses, enquiries, site_content

# ── Logging ──────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("codepro")

# ── App ──────────────────────────────────────────────
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
        {"name": "enquiries", "description": "Public enquiry submissions & admin listing"},
    ],
)


# ── Request Logging Middleware ───────────────────────
class RequestLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        skip_paths = ("/docs", "/openapi.json", "/health", "/redoc")
        if any(request.url.path.startswith(p) for p in skip_paths):
            return await call_next(request)

        start = time.time()
        response = await call_next(request)
        duration_ms = round((time.time() - start) * 1000)
        logger.info(
            "%s %s → %s (%sms)",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        return response


# ── Cache-Control for public GET endpoints ───────────
class CacheHeaderMiddleware(BaseHTTPMiddleware):
    CACHEABLE_PREFIXES = ("/api/courses", "/api/content", "/api/contact")

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if (
            request.method == "GET"
            and response.status_code == 200
            and any(request.url.path.startswith(p) for p in self.CACHEABLE_PREFIXES)
        ):
            response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
        return response


# ── Security Headers Middleware ───────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if settings.APP_ENV != "development":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


# ── Rate Limiter for Auth Endpoints ──────────────────
_login_attempts: dict[str, list[float]] = defaultdict(list)
_LOGIN_WINDOW = 300  # 5 minutes
_LOGIN_LIMIT = 10    # max attempts per window


class AuthRateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path == "/api/auth/login" and request.method == "POST":
            ip = request.client.host if request.client else "unknown"
            now = time.time()
            _login_attempts[ip] = [t for t in _login_attempts[ip] if now - t < _LOGIN_WINDOW]
            if len(_login_attempts[ip]) >= _LOGIN_LIMIT:
                logger.warning("Rate limit exceeded for login ip=%s", ip)
                return JSONResponse(
                    status_code=429,
                    content={"error": True, "message": "Too many login attempts. Please try again later.", "code": "RATE_LIMITED"},
                )
            _login_attempts[ip].append(now)
        return await call_next(request)


# ── Request Size Limit Middleware ────────────────────
_MAX_BODY_SIZE = 10 * 1024 * 1024  # 10 MB


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > _MAX_BODY_SIZE:
            return JSONResponse(
                status_code=413,
                content={"error": True, "message": "Request body too large", "code": "PAYLOAD_TOO_LARGE"},
            )
        return await call_next(request)


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(AuthRateLimitMiddleware)
app.add_middleware(RequestSizeLimitMiddleware)
app.add_middleware(CacheHeaderMiddleware)
app.add_middleware(RequestLogMiddleware)

app.add_middleware(GZipMiddleware, minimum_size=500)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Error Handlers ───────────────────────────────────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " → ".join(str(l) for l in err.get("loc", []))
        errors.append({"field": loc, "message": err.get("msg", "")})
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "message": "Validation failed",
            "code": "VALIDATION_ERROR",
            "detail": errors,
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    detail = str(exc) if settings.APP_ENV == "development" else None
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "message": "Internal server error",
            "code": "INTERNAL_ERROR",
            "detail": detail,
        },
    )


# ── Routers ──────────────────────────────────────────
app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(site_content.router)
app.include_router(contact_info.router)
app.include_router(enquiries.router)


# ── Startup: seed admin user ─────────────────────────
@app.on_event("startup")
async def seed_admin_user():
    """Create the default admin user from .env if it doesn't exist."""
    import bcrypt as _bcrypt
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy.orm import sessionmaker
    from app.models.user import AdminUser

    if not settings.ADMIN_PASSWORD:
        return
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as db:
        result = await db.execute(
            __import__("sqlalchemy").select(AdminUser).where(AdminUser.username == settings.ADMIN_USERNAME)
        )
        if not result.scalars().first():
            hashed = _bcrypt.hashpw(settings.ADMIN_PASSWORD.encode(), _bcrypt.gensalt(12)).decode()
            db.add(AdminUser(username=settings.ADMIN_USERNAME, hashed_password=hashed, is_active=True))
            await db.commit()
            logger.info("Seeded admin user: %s", settings.ADMIN_USERNAME)


# ── Health ───────────────────────────────────────────
@app.get("/health", tags=["health"])
async def health_check():
    """Check API and DB connectivity."""
    try:
        async with engine.connect() as conn:
            await conn.execute(
                __import__("sqlalchemy").text("SELECT 1")
            )
        return {"status": "ok", "database": "connected"}
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "error", "database": "disconnected"},
        )


# ── Entrypoint ──────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.APP_ENV == "development",
    )
