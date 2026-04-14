"""
Pydantic schemas for API request validation and response serialisation.
Updated for multi-framework support with structured EvidenceItem.
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


# ─── Auth ────────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: EmailStr
    name: str
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    id_token: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str | None
    email_verified: bool = False
    onboarding_completed: bool = False

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    user: UserResponse | None = None


# ─── Analysis — LLM structured output ───────────────────────────────────────────

class EvidenceItem(BaseModel):
    """A single timestamped evidence moment from the transcript."""
    text: str         # Exact quote from the transcript
    timestamp: float  # Seconds into the audio
    speaker: str      # Speaker label e.g. "A", "B"
    note: str         # One-sentence explanation of why this is evidence


class DimensionScore(BaseModel):
    """Single dimension evaluation from the LLM (works for any framework)."""
    dimension_number: int
    dimension_name: str
    score: float
    evidence: list[EvidenceItem]
    improvement_suggestion: str

    @field_validator("score")
    @classmethod
    def score_range(cls, v: float) -> float:
        if not 0.0 <= v <= 1.0:
            raise ValueError("Score must be between 0.0 and 1.0")
        return round(v, 2)


class FullAnalysis(BaseModel):
    """Complete analysis result returned by the LLM."""
    overall_score: float
    dimensions: list[DimensionScore]
    summary: str
    dominant_speaker: str
    teacher_talk_ratio: float  # Reused for rep/candidate/facilitator talk ratio

    @field_validator("overall_score", "teacher_talk_ratio")
    @classmethod
    def ratio_range(cls, v: float) -> float:
        return max(0.0, min(1.0, round(v, 2)))


# ─── Job Status ──────────────────────────────────────────────────────────────────

class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    error: str | None = None
    created_at: datetime | None = None


class JobCreatedResponse(BaseModel):
    job_id: str
    status: str
    quota: "QuotaResponse"


# ─── Quota ───────────────────────────────────────────────────────────────────────

class QuotaResponse(BaseModel):
    used: int
    limit: int
    remaining: int
    resets_at: str | None = None


# ─── History / Results ───────────────────────────────────────────────────────────

class EvidenceItemResponse(BaseModel):
    text: str
    timestamp: float
    speaker: str
    note: str

    class Config:
        from_attributes = True


class DimensionScoreResponse(BaseModel):
    dimension_number: int
    dimension_name: str
    score: float
    evidence: list[EvidenceItemResponse]
    improvement: str

    class Config:
        from_attributes = True


class AnalysisResponse(BaseModel):
    id: str
    job_id: str
    framework_id: str
    framework_name: str
    duration_seconds: float
    overall_score: float
    teacher_talk_ratio: float
    dominant_speaker: str
    summary: str
    created_at: datetime
    dimension_scores: list[DimensionScoreResponse]

    class Config:
        from_attributes = True


# ─── Framework Info ──────────────────────────────────────────────────────────────

class DimensionInfo(BaseModel):
    number: int
    name: str
    description: str


class FrameworkResponse(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    target_speaker: str
    speakers_expected: int
    dimension_count: int
    dimensions: list[DimensionInfo]
    example_use: str
