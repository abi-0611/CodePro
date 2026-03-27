import logging
import time

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user
from app.core.redis import check_rate_limit
from app.crud.enquiry import create_enquiry, get_enquiries, get_enquiries_count
from app.database import get_db
from app.models.user import AdminUser
from app.schemas.enquiry import EnquiryCreate, EnquiryListOut, EnquiryOut

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/enquiries", tags=["enquiries"])

# Rate limit config
_RATE_WINDOW = 300  # 5 minutes
_RATE_LIMIT = 5  # max submissions per window per IP


async def _check_rate_limit(ip: str) -> None:
    allowed = await check_rate_limit(f"rl:enquiry:{ip}", _RATE_LIMIT, _RATE_WINDOW)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many submissions. Please try again later.",
        )


@router.post("/", response_model=EnquiryOut, status_code=status.HTTP_201_CREATED)
async def submit_enquiry(
    data: EnquiryCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Submit a course enquiry (public, rate-limited)."""
    client_ip = request.client.host if request.client else "unknown"
    await _check_rate_limit(client_ip)
    enquiry = await create_enquiry(db, data)
    logger.info("New enquiry from %s for course=%s ip=%s", data.email, data.course, client_ip)
    return enquiry


@router.get("/", response_model=EnquiryListOut)
async def list_enquiries(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_active_user),
):
    """List all enquiries (protected, for admin)."""
    enquiries = await get_enquiries(db, skip=skip, limit=limit, status_filter=status_filter)
    total = await get_enquiries_count(db, status_filter=status_filter)
    return EnquiryListOut(enquiries=enquiries, total=total, skip=skip, limit=limit)
