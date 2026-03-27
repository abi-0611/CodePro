import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.database import get_db
from app.models.user import AdminUser
from app.schemas.user import (
    AdminUserCreate,
    AdminUserOut,
    ChangePasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    Token,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    """Authenticate admin user and return JWT tokens."""
    username = form_data.username
    password = form_data.password

    result = await db.execute(select(AdminUser).where(AdminUser.username == username))
    user = result.scalars().first()

    if not user or not verify_password(password, user.hashed_password):
        logger.warning("Failed login attempt for username=%s ip=%s", username, request.client.host if request.client else "unknown")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})

    logger.info("Successful login for username=%s ip=%s", username, request.client.host if request.client else "unknown")

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=3600,
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    body: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Get new access token using refresh token."""
    payload = decode_token(body.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    username = payload.get("sub")
    result = await db.execute(select(AdminUser).where(AdminUser.username == username))
    user = result.scalars().first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    access_token = create_access_token(data={"sub": user.username})
    return Token(
        access_token=access_token,
        refresh_token=body.refresh_token,
        token_type="bearer",
        expires_in=3600,
    )


@router.post("/logout")
async def logout(current_user: AdminUser = Depends(get_current_active_user)):
    """Log out the current user."""
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=AdminUserOut)
async def get_me(current_user: AdminUser = Depends(get_current_active_user)):
    """Get current authenticated user info."""
    return current_user


@router.put("/me/password")
async def change_password(
    body: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_active_user),
):
    """Change current user's password."""
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    current_user.hashed_password = get_password_hash(body.new_password)
    current_user.updated_at = datetime.now(timezone.utc)
    db.add(current_user)
    await db.commit()
    return {"message": "Password changed successfully"}


@router.post("/setup", response_model=AdminUserOut, status_code=status.HTTP_201_CREATED)
async def initial_setup(
    body: AdminUserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create the first admin user. Disabled after first user exists."""
    result = await db.execute(select(func.count(AdminUser.id)))
    count = result.scalar() or 0
    if count > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Setup already completed. Admin user exists.",
        )

    user = AdminUser(
        username=body.username,
        email=body.email,
        hashed_password=get_password_hash(body.password),
        is_active=True,
        is_superuser=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
