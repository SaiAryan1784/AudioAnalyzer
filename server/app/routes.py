"""
API routes for analysis, job status, history, quota, and frameworks.
"""

import os
import shutil
import uuid
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.database import get_db
from app.frameworks import FRAMEWORKS
from app.models import Analysis, DimensionScore, Job, User
from app.pipeline import run_pipeline
from app.rate_limit import check_rate_limit, get_quota_status
from app.schemas import (
    AnalysisResponse,
    DimensionInfo,
    DimensionScoreResponse,
    EvidenceItemResponse,
    FrameworkResponse,
    JobCreatedResponse,
    JobStatusResponse,
    QuotaResponse,
)

router = APIRouter(tags=["analysis"])


# ─── Frameworks registry ─────────────────────────────────────────────────────────

@router.get("/frameworks", response_model=list[FrameworkResponse])
async def list_frameworks():
    """Return all available analysis frameworks (public endpoint)."""
    return [
        FrameworkResponse(
            id=fw.id,
            name=fw.name,
            description=fw.description,
            icon=fw.icon,
            target_speaker=fw.target_speaker,
            speakers_expected=fw.speakers_expected,
            dimension_count=len(fw.dimensions),
            dimensions=[
                DimensionInfo(number=d.number, name=d.name, description=d.description)
                for d in fw.dimensions
            ],
            example_use=fw.example_use,
        )
        for fw in FRAMEWORKS.values()
    ]


# ─── Start analysis ──────────────────────────────────────────────────────────────

@router.post("/analyze", response_model=JobCreatedResponse)
async def start_analysis(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    framework_id: str = Form("rosenshine"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload audio and start a background analysis job with the selected framework."""
    # Validate framework
    if framework_id not in FRAMEWORKS:
        raise HTTPException(
            400,
            f"Unknown framework '{framework_id}'. Available: {list(FRAMEWORKS.keys())}"
        )

    # Rate limit check — runs BEFORE any processing (admins bypass)
    await check_rate_limit(current_user, db)

    # Validate file type
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in {".mp3", ".wav", ".m4a", ".webm", ".ogg", ".flac"}:
        raise HTTPException(400, f"Unsupported format: {ext}")

    # Validate file size
    if file.size and file.size > 100 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 100 MB)")

    job_id = uuid.uuid4()
    raw_path = f"/tmp/{job_id}_raw{ext}"

    # Save uploaded file to /tmp
    with open(raw_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Create job record
    job = Job(
        id=job_id,
        user_id=current_user.id,
        status="pending",
        filename=file.filename,
        created_at=datetime.utcnow(),
    )
    db.add(job)
    await db.commit()

    # Kick off background pipeline with selected framework
    background_tasks.add_task(
        run_pipeline, str(job_id), raw_path, str(current_user.id), framework_id
    )

    quota = await get_quota_status(current_user, db)
    return JobCreatedResponse(
        job_id=str(job_id),
        status="pending",
        quota=QuotaResponse(**quota),
    )


# ─── Job status ───────────────────────────────────────────────────────────────────

@router.get("/status/{job_id}", response_model=JobStatusResponse)
async def get_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Poll for the status of an analysis job."""
    result = await db.execute(
        select(Job).where(
            Job.id == uuid.UUID(job_id),
            Job.user_id == current_user.id,
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(404, "Job not found")

    return JobStatusResponse(
        job_id=str(job.id),
        status=job.status,
        error=job.error,
        created_at=job.created_at,
    )


# ─── Results ─────────────────────────────────────────────────────────────────────

def _build_analysis_response(a: Analysis) -> AnalysisResponse:
    """Convert an Analysis ORM object to AnalysisResponse schema."""
    return AnalysisResponse(
        id=str(a.id),
        job_id=str(a.job_id),
        framework_id=a.framework_id,
        framework_name=a.framework_name or a.framework_id,
        duration_seconds=a.duration_seconds,
        overall_score=a.overall_score,
        teacher_talk_ratio=a.teacher_talk_ratio,
        dominant_speaker=a.dominant_speaker,
        summary=a.summary,
        created_at=a.created_at,
        dimension_scores=[
            DimensionScoreResponse(
                dimension_number=ds.principle_number,
                dimension_name=ds.principle_name,
                score=ds.score,
                evidence=[
                    EvidenceItemResponse(**ev)
                    for ev in (ds.evidence or [])
                    # Handle legacy rows that have plain string evidence
                    if isinstance(ev, dict)
                ],
                improvement=ds.improvement,
            )
            for ds in sorted(a.dimension_scores, key=lambda d: d.principle_number)
        ],
    )


@router.get("/results/{job_id}", response_model=AnalysisResponse)
async def get_results(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the full analysis results for a completed job."""
    # Find the job first to verify ownership
    job_result = await db.execute(
        select(Job).where(
            Job.id == uuid.UUID(job_id),
            Job.user_id == current_user.id,
        )
    )
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(404, "Job not found")

    if job.status == "failed":
        raise HTTPException(422, f"Analysis failed: {job.error}")

    if job.status != "complete":
        raise HTTPException(202, "Analysis not yet complete")

    # Load the analysis with dimension scores
    analysis_result = await db.execute(
        select(Analysis)
        .where(Analysis.job_id == uuid.UUID(job_id))
        .options(selectinload(Analysis.dimension_scores))
    )
    analysis = analysis_result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(404, "Analysis record not found")

    return _build_analysis_response(analysis)


# ─── History ─────────────────────────────────────────────────────────────────────

@router.get("/history", response_model=list[AnalysisResponse])
async def get_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch the user's analysis history with dimension scores."""
    result = await db.execute(
        select(Analysis)
        .where(Analysis.user_id == current_user.id)
        .options(selectinload(Analysis.dimension_scores))
        .order_by(Analysis.created_at.desc())
        .limit(50)
    )
    analyses = result.scalars().all()
    return [_build_analysis_response(a) for a in analyses]


# ─── Quota ───────────────────────────────────────────────────────────────────────

@router.get("/quota", response_model=QuotaResponse)
async def quota(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the user's current analysis quota."""
    status = await get_quota_status(current_user, db)
    return QuotaResponse(**status)
