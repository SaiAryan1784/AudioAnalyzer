"""
FastAPI application entry point.

- CORS middleware for frontend
- Lifespan hook to create tables on startup
- Health endpoint for UptimeRobot
- Auth and analysis route registration
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import router as auth_router
from app.config import settings
from app.database import engine
from app.models import Base
from app.routes import router as api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="AudioAnalyzer API",
    description="Production-grade classroom audio analysis using Rosenshine's Principles",
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────────

app.include_router(auth_router)
app.include_router(api_router)


# ── Health ───────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """UptimeRobot ping target — keeps Render from sleeping."""
    return {"status": "ok"}


@app.get("/")
async def root():
    """Root endpoint — basic service info."""
    return {
        "service": "AudioAnalyzer API",
        "version": "2.0.0",
        "status": "running",
    }
