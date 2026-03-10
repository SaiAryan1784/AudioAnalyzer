"""
Per-user rate limiting — pure SQL, no extra service.

Rules (non-admin users):
    - 3 analyses per user per rolling 24-hour window
    - 30-minute minimum gap between analyses

Admin users bypass ALL limits and get an "unlimited" quota response.
"""

from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Job

_UNLIMITED = 999_999


async def check_rate_limit(user, db: AsyncSession) -> dict:
    """
    Enforce rate limits before starting a new analysis.
    Admin users bypass all limits entirely.
    Raises HTTPException(429) if any limit is exceeded.
    Returns current quota status on success.
    """
    # Admins have no limits
    if getattr(user, "is_admin", False):
        return {"used": 0, "limit": _UNLIMITED, "remaining": _UNLIMITED}

    user_id = user.id
    cutoff = datetime.utcnow() - timedelta(days=1)

    # ── Weekly limit ────────────────────────────────────────────────────
    result = await db.execute(
        select(func.count())
        .select_from(Job)
        .where(
            Job.user_id == user_id,
            Job.status != "failed",
            Job.created_at > cutoff,
        )
    )
    weekly_count = result.scalar() or 0

    if weekly_count >= settings.WEEKLY_ANALYSIS_LIMIT:
        oldest_result = await db.execute(
            select(Job.created_at)
            .where(
                Job.user_id == user_id,
                Job.status != "failed",
                Job.created_at > cutoff,
            )
            .order_by(Job.created_at.asc())
            .limit(1)
        )
        oldest = oldest_result.scalar()
        resets_at = oldest + timedelta(days=1) if oldest else datetime.utcnow()
        raise HTTPException(
            429,
            detail={
                "error": "daily_limit_reached",
                "used": weekly_count,
                "limit": settings.WEEKLY_ANALYSIS_LIMIT,
                "resets_at": resets_at.isoformat(),
                "message": (
                    f"You've used {weekly_count}/{settings.WEEKLY_ANALYSIS_LIMIT} "
                    f"analyses today. Resets {resets_at.strftime('%b %d at %H:%M UTC')}."
                ),
            },
        )

    # ── Minimum gap ─────────────────────────────────────────────────────
    last_result = await db.execute(
        select(Job.created_at)
        .where(Job.user_id == user_id, Job.status != "failed")
        .order_by(Job.created_at.desc())
        .limit(1)
    )
    last_created = last_result.scalar()

    if last_created:
        elapsed = (datetime.utcnow() - last_created).total_seconds() / 60
        if elapsed < settings.MIN_GAP_MINUTES:
            wait = int(settings.MIN_GAP_MINUTES - elapsed) + 1
            raise HTTPException(
                429,
                detail={
                    "error": "too_soon",
                    "message": f"Please wait {wait} more minutes before starting another analysis.",
                },
            )

    return {
        "used": weekly_count,
        "limit": settings.WEEKLY_ANALYSIS_LIMIT,
        "remaining": settings.WEEKLY_ANALYSIS_LIMIT - weekly_count,
    }


async def get_quota_status(user, db: AsyncSession) -> dict:
    """
    Current quota usage — safe to call any time.
    Admin users always see unlimited quota.
    """
    if getattr(user, "is_admin", False):
        return {"used": 0, "limit": _UNLIMITED, "remaining": _UNLIMITED}

    user_id = user.id
    cutoff = datetime.utcnow() - timedelta(days=7)
    result = await db.execute(
        select(func.count())
        .select_from(Job)
        .where(
            Job.user_id == user_id,
            Job.status != "failed",
            Job.created_at > cutoff,
        )
    )
    count = result.scalar() or 0
    return {
        "used": count,
        "limit": settings.WEEKLY_ANALYSIS_LIMIT,
        "remaining": settings.WEEKLY_ANALYSIS_LIMIT - count,
    }
