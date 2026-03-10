"""
JWT authentication with refresh-token rotation.

Endpoints:
    POST /auth/signup   — Create account, return access token
    POST /auth/login    — Login, return access + set httpOnly refresh cookie
    POST /auth/refresh  — Rotate access token using refresh cookie
    POST /auth/logout   — Revoke refresh token, clear cookie
    GET  /auth/me       — Current user profile
"""

import hashlib
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from fastapi.security import OAuth2PasswordBearer
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import RefreshToken, User
from app.schemas import GoogleAuthRequest, LoginRequest, SignupRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ─── Token helpers ───────────────────────────────────────────────────────────────

def _create_token(user_id: str, expire_delta: timedelta, token_type: str) -> str:
    """Encode a JWT with subject, type, and expiry."""
    payload = {
        "sub": str(user_id),
        "type": token_type,
        "exp": datetime.utcnow() + expire_delta,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def _hash_token(raw_token: str) -> str:
    """SHA-256 hash of a token for safe database storage."""
    return hashlib.sha256(raw_token.encode()).hexdigest()


# ─── Dependency: current authenticated user ──────────────────────────────────────

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Decode access token, verify it, and return the User row."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(401, "Invalid token type")
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(401, "Invalid token payload")
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(401, "User not found")
    return user


# ─── Endpoints ───────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=TokenResponse)
async def signup(body: SignupRequest, db: AsyncSession = Depends(get_db)):
    """Create a new account and return an access token."""
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    user = User(
        email=body.email,
        name=body.name,
        hashed_password=pwd_context.hash(body.password),
    )
    db.add(user)
    await db.flush()  # populate user.id before creating token

    access = _create_token(
        str(user.id), timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES), "access"
    )
    return TokenResponse(
        access_token=access,
        user=UserResponse(id=str(user.id), email=user.email, name=user.name),
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)
):
    """Authenticate and return access token + httpOnly refresh cookie."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password or not pwd_context.verify(body.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")

    access = _create_token(
        str(user.id), timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES), "access"
    )
    refresh = _create_token(
        str(user.id), timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS), "refresh"
    )

    # Store only the hash — never persist the raw token
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=_hash_token(refresh),
            expires_at=datetime.utcnow()
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )
    return TokenResponse(
        access_token=access,
        user=UserResponse(id=str(user.id), email=user.email, name=user.name),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(
    refresh_token: str | None = Cookie(None),
    db: AsyncSession = Depends(get_db),
):
    """Use the httpOnly refresh cookie to issue a fresh access token."""
    if not refresh_token:
        raise HTTPException(401, "No refresh token")

    try:
        payload = jwt.decode(
            refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Invalid token type")
    except JWTError:
        raise HTTPException(401, "Invalid refresh token")

    token_hash = _hash_token(refresh_token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False,  # noqa: E712
            RefreshToken.expires_at > datetime.utcnow(),
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(401, "Refresh token invalid or expired")

    access = _create_token(
        payload["sub"], timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES), "access"
    )
    return TokenResponse(access_token=access)


@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: str | None = Cookie(None),
    db: AsyncSession = Depends(get_db),
):
    """Revoke the refresh token and clear the cookie."""
    if refresh_token:
        token_hash = _hash_token(refresh_token)
        result = await db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        record = result.scalar_one_or_none()
        if record:
            record.revoked = True

    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
    )


# ─── Google OAuth ──────────────────────────────────────────────────────────────

@router.post("/google", response_model=TokenResponse)
async def google_auth(
    body: GoogleAuthRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify a Google ID token and return JWT tokens.
    Creates the user account automatically on first sign-in.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(500, "Google OAuth not configured")

    try:
        id_info = google_id_token.verify_oauth2_token(
            body.id_token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10,
        )
    except ValueError as e:
        raise HTTPException(401, f"Invalid Google token: {e}")

    email: str = id_info.get("email", "")
    name: str | None = id_info.get("name")
    if not email:
        raise HTTPException(400, "Google account has no email")

    # Find or create user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            id=uuid.uuid4(),
            email=email,
            name=name,
            hashed_password=None,   # Google-only account — no password
            is_admin=False,
        )
        db.add(user)
        await db.flush()
    elif name and not user.name:
        # Backfill name if user signed up via email originally
        user.name = name

    # Issue tokens (same as regular login)
    access = _create_token(
        str(user.id), timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES), "access"
    )
    refresh = _create_token(
        str(user.id), timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS), "refresh"
    )

    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=_hash_token(refresh),
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
    )
    await db.commit()

    response.set_cookie(
        key="refresh_token",
        value=refresh,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )
    return TokenResponse(
        access_token=access,
        user=UserResponse(id=str(user.id), email=user.email, name=user.name),
    )
