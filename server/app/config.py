"""
Application configuration loaded from environment variables.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Centralised settings — every config value comes from env vars."""

    # ── Database (Neon PostgreSQL) ──────────────────────────────────────
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "")

    # ── External APIs ───────────────────────────────────────────────────
    ASSEMBLYAI_API_KEY: str = os.environ.get("ASSEMBLYAI_API_KEY", "")
    GROQ_API_KEY: str = os.environ.get("GROQ_API_KEY", "")

    # ── Auth ────────────────────────────────────────────────────────────
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "change-me-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    GOOGLE_CLIENT_ID: str = os.environ.get("GOOGLE_CLIENT_ID", "")

    # ── Langfuse Observability ──────────────────────────────────────────
    LANGFUSE_SECRET_KEY: str = os.environ.get("LANGFUSE_SECRET_KEY", "")
    LANGFUSE_PUBLIC_KEY: str = os.environ.get("LANGFUSE_PUBLIC_KEY", "")
    LANGFUSE_HOST: str = os.environ.get("LANGFUSE_HOST", "https://cloud.langfuse.com")

    # ── Rate Limits ─────────────────────────────────────────────────────
    WEEKLY_ANALYSIS_LIMIT: int = 3
    MIN_GAP_MINUTES: int = 30

    # ── Audio Constraints ───────────────────────────────────────────────
    MAX_FILE_SIZE_MB: int = 100
    MAX_DURATION_SECONDS: int = 3600  # 60 minutes
    ALLOWED_EXTENSIONS: set[str] = {".mp3", ".wav", ".m4a", ".webm", ".ogg", ".flac"}

    # ── CORS ────────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://audio-analyzer-beta.vercel.app",
    ]


settings = Settings()
