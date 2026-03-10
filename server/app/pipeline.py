"""
Audio processing pipeline: ffmpeg preprocessing → AssemblyAI transcription → Groq analysis.

All audio files are ephemeral — they live in /tmp for ~30 seconds and are deleted
immediately after transcription. Only text results are persisted to the database.

Accepts a framework_id to route the LLM analysis through the correct framework prompt.
"""

import os
import subprocess
import uuid
from datetime import datetime

import assemblyai as aai
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.analysis import analyze_with_retry
from app.config import settings
from app.database import async_session
from app.frameworks import FRAMEWORKS
from app.models import Analysis, DimensionScore, Job

aai.settings.api_key = settings.ASSEMBLYAI_API_KEY


# ─── ffmpeg preprocessing ───────────────────────────────────────────────────────

def validate_and_compress(input_path: str, output_path: str) -> dict:
    """
    Validate the audio file and compress it to mono MP3 @ 64 kbps.
    Returns metadata dict with duration and file size.
    """
    ext = os.path.splitext(input_path)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported format: {ext}. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    size_mb = os.path.getsize(input_path) / (1024 * 1024)
    if size_mb > settings.MAX_FILE_SIZE_MB:
        raise ValueError(f"File too large: {size_mb:.1f} MB (max {settings.MAX_FILE_SIZE_MB} MB)")

    # Compress to mono MP3 @ 64 kbps — optimal for speech transcription
    subprocess.run(
        [
            "ffmpeg", "-i", input_path,
            "-ar", "16000",   # 16 kHz sample rate
            "-ac", "1",       # mono
            "-b:a", "64k",    # 64 kbps
            "-f", "mp3",
            output_path, "-y",
        ],
        check=True,
        capture_output=True,
    )

    # Get actual duration
    result = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            output_path,
        ],
        capture_output=True,
        text=True,
    )
    duration = float(result.stdout.strip())

    if duration > settings.MAX_DURATION_SECONDS:
        os.remove(output_path)
        raise ValueError(f"Audio too long: {duration / 60:.1f} min (max 60 min)")

    return {
        "duration_seconds": duration,
        "output_path": output_path,
        "size_mb": os.path.getsize(output_path) / (1024 * 1024),
    }


# ─── AssemblyAI transcription ───────────────────────────────────────────────────

def transcribe_and_diarize(audio_path: str, speakers_expected: int = 2) -> list[dict]:
    """
    Stream audio to AssemblyAI for transcription + speaker diarization.
    Deletes the local file immediately after transcription completes.
    """
    config = aai.TranscriptionConfig(
        speaker_labels=True,
        speakers_expected=speakers_expected,
        language_code="en",
        punctuate=True,
        format_text=True,
        speech_models=["universal-3-pro"],
    )

    transcriber = aai.Transcriber()
    transcript = transcriber.transcribe(audio_path, config)

    if transcript.status == aai.TranscriptStatus.error:
        raise RuntimeError(f"Transcription failed: {transcript.error}")

    segments = []
    for utterance in transcript.utterances:
        segments.append({
            "start": utterance.start / 1000,
            "end": utterance.end / 1000,
            "speaker": utterance.speaker,
            "text": utterance.text,
        })

    # Delete temp file — no longer needed
    if os.path.exists(audio_path):
        os.remove(audio_path)

    return segments


# ─── Job status helper ───────────────────────────────────────────────────────────

async def _update_status(
    job_id: uuid.UUID, status: str, db: AsyncSession, error: str | None = None
):
    """Update the job status in the database."""
    values = {"status": status, "updated_at": datetime.utcnow()}
    if error:
        values["error"] = error
    await db.execute(update(Job).where(Job.id == job_id).values(**values))
    await db.commit()


# ─── Full pipeline ───────────────────────────────────────────────────────────────

async def run_pipeline(job_id: str, raw_path: str, user_id: str, framework_id: str = "rosenshine"):
    """
    Background task: preprocess → transcribe → analyse → persist.
    All temp files are cleaned up in the finally block.
    """
    jid = uuid.UUID(job_id)
    uid = uuid.UUID(user_id)
    compressed_path = f"/tmp/{job_id}.mp3"

    # Resolve framework (validated in route before task is enqueued)
    framework = FRAMEWORKS.get(framework_id) or FRAMEWORKS["rosenshine"]

    async with async_session() as db:
        try:
            # Step 0: Validate + compress with ffmpeg
            await _update_status(jid, "preprocessing", db)
            meta = validate_and_compress(raw_path, compressed_path)

            # Step 1: Stream to AssemblyAI
            await _update_status(jid, "transcribing", db)
            segments = transcribe_and_diarize(compressed_path, framework.speakers_expected)

            # Step 2: LLM analysis with the selected framework
            await _update_status(jid, "analyzing", db)
            result = await analyze_with_retry(segments, framework)

            # Step 3: Persist analysis to database
            await _update_status(jid, "saving", db)

            analysis = Analysis(
                job_id=jid,
                user_id=uid,
                framework_id=framework.id,
                framework_name=framework.name,
                duration_seconds=meta["duration_seconds"],
                overall_score=result.overall_score,
                teacher_talk_ratio=result.teacher_talk_ratio,
                dominant_speaker=result.dominant_speaker,
                summary=result.summary,
            )
            db.add(analysis)
            await db.flush()

            for dim in result.dimensions:
                # Serialise evidence list to JSON-serialisable dicts
                evidence_dicts = [ev.model_dump() for ev in dim.evidence]
                db.add(
                    DimensionScore(
                        analysis_id=analysis.id,
                        principle_number=dim.dimension_number,
                        principle_name=dim.dimension_name,
                        score=dim.score,
                        evidence=evidence_dicts,
                        improvement=dim.improvement_suggestion,
                    )
                )

            await _update_status(jid, "complete", db)

        except Exception as e:
            await db.rollback()
            await _update_status(jid, "failed", db, error=str(e))
            raise

        finally:
            # Always clean up temp files
            for path in [raw_path, compressed_path]:
                if os.path.exists(path):
                    os.remove(path)
