"""
SQLAlchemy ORM models for the AudioAnalyzer database.

Tables:
    - users:            Registered accounts
    - jobs:             Analysis job tracking (status, timestamps)
    - analyses:         Completed analysis results (multi-framework)
    - dimension_scores: Per-dimension scores linked to an analysis (replaces principle_scores)
    - refresh_tokens:   Hashed refresh tokens for JWT rotation
"""

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, Text, Float, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


# ─── Users ──────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    hashed_password: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    # Relationships
    analyses: Mapped[list["Analysis"]] = relationship(back_populates="user")
    jobs: Mapped[list["Job"]] = relationship(back_populates="user")


# ─── Jobs ────────────────────────────────────────────────────────────────────────

class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[str] = mapped_column(
        String, default="pending"
    )  # pending | preprocessing | transcribing | diarizing | analyzing | saving | complete | failed
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    filename: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="jobs")
    analysis: Mapped["Analysis | None"] = relationship(
        back_populates="job", uselist=False
    )


# ─── Analyses ────────────────────────────────────────────────────────────────────

class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"), unique=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    framework_id: Mapped[str] = mapped_column(String, nullable=False, default="rosenshine")
    framework_name: Mapped[str | None] = mapped_column(String, nullable=True)
    duration_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)
    teacher_talk_ratio: Mapped[float] = mapped_column(Float, nullable=False)
    dominant_speaker: Mapped[str] = mapped_column(String, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="analyses")
    job: Mapped["Job"] = relationship(back_populates="analysis")
    dimension_scores: Mapped[list["DimensionScore"]] = relationship(
        back_populates="analysis", cascade="all, delete-orphan"
    )


# ─── Dimension Scores ────────────────────────────────────────────────────────────

class DimensionScore(Base):
    """
    Stores per-dimension scores for any framework.
    Uses the same table name (principle_scores) for backward compatibility.
    Timestamps are now stored inside the JSONB evidence column.
    The legacy timestamp_start column is kept nullable with a default of 0.0.
    """
    __tablename__ = "principle_scores"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    analysis_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("analyses.id", ondelete="CASCADE"), index=True
    )
    principle_number: Mapped[int] = mapped_column(Integer, nullable=False)
    principle_name: Mapped[str] = mapped_column(String, nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    # JSONB column stores list[EvidenceItem] dicts: {text, timestamp, speaker, note}
    evidence: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    # Legacy column — still exists in DB, kept nullable. Timestamps now in evidence JSONB.
    timestamp_start: Mapped[float | None] = mapped_column(Float, nullable=True, default=0.0)
    improvement: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    analysis: Mapped["Analysis"] = relationship(back_populates="dimension_scores")


# ─── Refresh Tokens ──────────────────────────────────────────────────────────────

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    token_hash: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


# ─── Password Reset Tokens ────────────────────────────────────────────────────────

class PasswordResetToken(Base):
    """Single-use, time-limited token for password reset via email link."""
    __tablename__ = "password_reset_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    token_hash: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


# ─── Email Verification Tokens ────────────────────────────────────────────────────

class EmailVerificationToken(Base):
    """Token sent to users on signup to verify their email address."""
    __tablename__ = "email_verification_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    token_hash: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
