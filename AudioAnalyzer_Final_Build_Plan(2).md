# AudioAnalyzer — Final Build Plan
### Pipeline · Architecture · Hosting · Rate Limiting
> Single source of truth. Every tool is free or open source. No local ML on the server.

---

## Why Neon DB Over Supabase

Good call. Neon is the better choice for this project for three specific reasons:

| | Neon (your choice) | Supabase |
|---|---|---|
| **Inactivity behaviour** | Scales to zero, wakes in <1 second | Entire project pauses after 7 days inactivity |
| **Open source** | Yes — fully open source on GitHub (neondatabase/neon) | Partially open source |
| **Free storage** | 0.5 GB/project, up to 5 GB across 10 projects | 500 MB total |
| **Compute** | 100 CU-hours/month (doubled Oct 2025), scale-to-zero | Nano shared instance |
| **Connection pooling** | Built-in pgBouncer (up to 10,000 connections) | Built-in pgBouncer |
| **Free tier expiry** | Never expires, no credit card required | Never expires |

For this project, 0.5 GB storage is enormous — a full analysis result (text, scores, transcript) is ~8–12 KB. That's 40,000+ analyses before hitting the limit. The scale-to-zero behaviour is also a perfect match: Neon only uses compute when a query is actually running, so 100 CU-hours/month is more than sufficient for a rate-limited portfolio app.

---

## The Core Architectural Decision — No Local ML

Before the upgrade list, the most important decision in this entire plan:

**All ML inference runs on external APIs. Zero ML on the backend server.**

Running any local model (WhisperX, pyannote, anything) on a free-tier server is a non-starter:

| | Local WhisperX (medium) on free CPU | AssemblyAI API |
|---|---|---|
| 10 min recording | 4–6 minutes | ~5 seconds |
| 45 min recording | 20–30 minutes | ~23 seconds |
| RAM required | 4–8 GB | ~50 MB (just HTTP client) |
| Server required | GPU instance ($$$) | Any free tier |

Removing local ML means: no PyTorch, no CUDA, no model downloads on startup. The backend becomes a lightweight HTTP coordinator that calls APIs and writes to a database. It runs perfectly on Render's free 512 MB instance.

---

## Final Architecture

```
User uploads audio (MP3, WAV, M4A, WEBM — max 60 min)
    |
[STEP 0] ffmpeg — open source (LGPL)
    Validate format, compress to mono MP3 @ 64kbps
    Written to /tmp/{job_id}.mp3 — ephemeral server disk
    |
[STEP 1] AssemblyAI API
    Compressed file streamed directly as bytes — no storage URL needed
    Transcription + speaker diarization in ONE API call
    ~23 seconds for a 45-min recording
    Returns: speaker-labelled segments with timestamps
    |
[STEP 2] os.remove() — delete /tmp file immediately after transcription
    File only lived on disk for ~30 seconds total
    |
[STEP 3] Groq Llama 3.3 70B API — open source model (Meta Llama)
    Structured Pydantic output — Rosenshine scores + evidence
    temperature=0.1, response_format=json_object
    |
[STEP 4] Langfuse — open source (MIT)
    Trace every LLM call: latency, token cost, output quality
    |
[STEP 5] FastAPI BackgroundTasks
    Async job — no Redis, no Celery, just Python
    Jobs complete in ~50 seconds, well within HTTP timeout
    |
[STEP 6] Rate Limiting
    Postgres query — 3 analyses/user/week, 30 min gap
    No extra service needed
    |
[STEP 7] Neon PostgreSQL — open source (Apache 2.0)
    Per-user analysis history, job status, refresh tokens
    SQLAlchemy ORM + Alembic migrations
    |
[STEP 8] React Dashboard
    Historical trends per teacher — Recharts RadarChart + LineChart
```

> **No file storage service needed.** Audio files exist only in `/tmp` during processing (~30 seconds), then are deleted. Only text results (scores, transcript, feedback) are persisted to Neon — text is tiny.

---

## Upgrade 0 — ffmpeg Audio Preprocessing

### Why Non-Negotiable
All speech APIs perform best on clean mono audio. ffmpeg normalises any input format before anything else touches the file. It also validates file type, enforces duration limits, and compresses files to stay under AssemblyAI's upload threshold.

### Install
```bash
sudo apt install ffmpeg    # Ubuntu/Debian (Render uses Debian)
brew install ffmpeg        # Mac local dev
```

### Code
```python
import subprocess, os

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".webm", ".ogg", ".flac"}
MAX_DURATION_SECONDS = 3600   # 60 minutes
MAX_FILE_SIZE_MB = 100

def validate_and_compress(input_path: str, output_path: str) -> dict:
    ext = os.path.splitext(input_path)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported format: {ext}. Allowed: {ALLOWED_EXTENSIONS}")

    size_mb = os.path.getsize(input_path) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise ValueError(f"File too large: {size_mb:.1f} MB (max {MAX_FILE_SIZE_MB} MB)")

    # Compress to mono MP3 @ 64kbps — 60 min becomes ~28 MB
    # 64kbps mono is perfectly sufficient for speech transcription accuracy
    subprocess.run([
        "ffmpeg", "-i", input_path,
        "-ar", "16000",   # 16kHz sample rate
        "-ac", "1",       # mono
        "-b:a", "64k",    # 64kbps
        "-f", "mp3",
        output_path, "-y"
    ], check=True, capture_output=True)

    # Get actual duration post-compression
    result = subprocess.run([
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        output_path
    ], capture_output=True, text=True)
    duration = float(result.stdout.strip())

    if duration > MAX_DURATION_SECONDS:
        os.remove(output_path)
        raise ValueError(f"Audio too long: {duration/60:.1f} min (max 60 min)")

    return {
        "duration_seconds": duration,
        "output_path": output_path,
        "size_mb": os.path.getsize(output_path) / (1024 * 1024)
    }
```

---

## Upgrade 1 — AssemblyAI (Transcription + Diarization)

### Why No Storage Service
AssemblyAI accepts raw file bytes directly — no public URL needed. The audio file is written to `/tmp` by FastAPI when the user uploads it, compressed by ffmpeg, streamed to AssemblyAI, then deleted immediately. The file exists on disk for ~30 seconds total. This means zero storage services, zero credit cards, zero configuration.

The one edge case: if Render restarts mid-job, the `/tmp` file is lost and the job fails. With rate limiting at 3 jobs/week, this is acceptable — surface a clear error and let the user retry.

### The Cost Reality (Be Honest About This)
AssemblyAI gives $50 free credits on signup. There is no recurring free tier after that. With the 3-analysis/week rate limit:

```
Cost per 45-min analysis:
  Transcription:  $0.0025/min × 45 = $0.1125
  Diarization:    $0.00033/min × 45 = $0.0149
  Total:          ~$0.13 per job

$50 ÷ $0.13 ≈ 385 analyses before credits run out
3 analyses/week × 52 weeks = 156 analyses/year per user

$50 credit = enough for ~2.5 years of solo use, or months of multi-user portfolio demos.
```

### Install
```bash
pip install assemblyai
```

### Code
```python
import assemblyai as aai
import os

aai.settings.api_key = os.environ["ASSEMBLYAI_API_KEY"]

def transcribe_and_diarize(local_audio_path: str) -> list[dict]:
    """
    Streams compressed audio bytes directly to AssemblyAI.
    No storage URL needed — file path is enough.
    Deletes the local file after transcription completes.
    """
    config = aai.TranscriptionConfig(
        speaker_labels=True,
        speakers_expected=2,    # Teacher + students — improves diarization accuracy
        language_code="en",
        punctuate=True,
        format_text=True
    )

    transcriber = aai.Transcriber()
    transcript = transcriber.transcribe(local_audio_path, config)  # Accepts local path directly

    if transcript.status == aai.TranscriptStatus.error:
        raise RuntimeError(f"Transcription failed: {transcript.error}")

    segments = []
    for utterance in transcript.utterances:
        segments.append({
            "start": utterance.start / 1000,    # ms → seconds
            "end":   utterance.end   / 1000,
            "speaker": utterance.speaker,       # "A", "B", "C" etc.
            "text": utterance.text
        })

    # Delete temp file immediately — no longer needed
    if os.path.exists(local_audio_path):
        os.remove(local_audio_path)

    return segments
```

### Output
```json
[
  {"start": 0.5,  "end": 4.2,  "speaker": "A", "text": "Can anyone recall what we covered last week?"},
  {"start": 5.1,  "end": 6.8,  "speaker": "B", "text": "We talked about fractions."},
  {"start": 7.0,  "end": 12.3, "speaker": "A", "text": "Exactly. Today we will build on that."}
]
```

---

## Upgrade 2 — Groq + Pydantic Structured Output

### Why
Forcing the LLM to return validated, typed data instead of free-form text is the core production pattern for AI pipelines. Pydantic v2 validates every field on parse — if the LLM hallucinates a score of 1.5 or skips a field, it throws a validation error rather than silently passing bad data downstream.

### Install
```bash
pip install groq pydantic
```

### Models
```python
from pydantic import BaseModel, field_validator

class PrincipleAnalysis(BaseModel):
    principle_number: int           # 1–10
    principle_name: str
    score: float                    # 0.0 to 1.0
    evidence: list[str]             # Direct quotes from transcript — must cite speaker
    timestamp_start: float          # Seconds into audio
    improvement_suggestion: str

    @field_validator("score")
    @classmethod
    def score_range(cls, v):
        if not 0.0 <= v <= 1.0:
            raise ValueError("Score must be 0.0–1.0")
        return round(v, 2)

    @field_validator("principle_number")
    @classmethod
    def valid_principle(cls, v):
        if not 1 <= v <= 10:
            raise ValueError("Principle number must be 1–10")
        return v

class FullAnalysis(BaseModel):
    overall_score: float
    principles: list[PrincipleAnalysis]
    summary: str
    dominant_speaker: str           # The speaker label most likely to be the teacher
    teacher_talk_ratio: float       # 0.0–1.0, proportion of time teacher speaks
```

### Analysis Function
```python
from groq import Groq
import json

groq_client = Groq()

def format_transcript(segments: list[dict]) -> str:
    return "\n".join(
        f"[{seg['start']:.1f}s] Speaker {seg['speaker']}: {seg['text']}"
        for seg in segments
    )

def analyze_transcript(segments: list[dict]) -> FullAnalysis:
    transcript = format_transcript(segments)

    SYSTEM_PROMPT = """You are an expert evaluator trained in Rosenshine's Principles of Instruction.

Analyze the classroom transcript and return ONLY a valid JSON object (no markdown, no preamble).
The JSON must match this exact structure:
{
  "overall_score": float (0.0-1.0),
  "dominant_speaker": string (the speaker label who is the teacher, e.g. "A"),
  "teacher_talk_ratio": float (0.0-1.0),
  "summary": string (2-3 sentences),
  "principles": [
    {
      "principle_number": int (1-10),
      "principle_name": string,
      "score": float (0.0-1.0),
      "evidence": [list of direct quotes with speaker labels],
      "timestamp_start": float (seconds),
      "improvement_suggestion": string
    }
  ]
}
Evaluate all 10 Rosenshine Principles. Identify the teacher by who speaks most and leads instruction."""

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Transcript:\n{transcript}"}
        ],
        response_format={"type": "json_object"},
        temperature=0.1,      # Low temp for consistent structured output
        max_tokens=4000
    )

    raw = response.choices[0].message.content
    return FullAnalysis.model_validate_json(raw)
```

---

## Upgrade 3 — Langfuse Observability

### Why Langfuse, Not LangSmith
LangSmith is built for the LangChain ecosystem. This pipeline uses the raw Groq SDK — Langfuse is the correct tool: fully provider-agnostic, open source (MIT), self-hostable, and designed exactly for tracing raw LLM API calls.

### Install
```bash
pip install langfuse
```

### .env
```env
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com
```

### Code
```python
from langfuse.decorators import observe, langfuse_context

@observe(name="rosenshine-analysis")
def analyze_transcript(segments: list[dict]) -> FullAnalysis:
    transcript = format_transcript(segments)

    langfuse_context.update_current_observation(
        metadata={
            "segment_count": len(segments),
            "model": "llama-3.3-70b-versatile",
            "provider": "groq",
            "transcript_length": len(transcript)
        }
    )

    response = groq_client.chat.completions.create(...)

    # Manually log token usage (Groq SDK doesn't auto-push to Langfuse)
    langfuse_context.update_current_observation(
        usage={
            "input": response.usage.prompt_tokens,
            "output": response.usage.completion_tokens
        }
    )

    return FullAnalysis.model_validate_json(response.choices[0].message.content)
```

Every run appears in Langfuse with latency, token cost, input/output pairs, and error rate — zero extra infrastructure needed.

---

## Upgrade 4 — FastAPI BackgroundTasks (No Redis/Celery)

### Why No ARQ or Celery
Without local ML compute, the full pipeline completes in ~50 seconds — well within any reasonable timeout. A heavyweight job queue (ARQ, Celery) is unnecessary complexity. FastAPI's built-in `BackgroundTasks` is sufficient and keeps the server stateless.

Job status is persisted to the database, so if the server restarts mid-job, the client can detect a "stuck pending" state and show an appropriate message.

### Code
```python
from fastapi import FastAPI, BackgroundTasks, UploadFile, Depends, HTTPException
import uuid, os, shutil
from datetime import datetime

app = FastAPI()

@app.post("/analyze")
async def start_analysis(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    # Rate limit check runs FIRST — before processing anything
    await check_rate_limit(user_id, db)

    # Validate file size before reading it
    if file.size and file.size > 100 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 100 MB)")

    job_id = str(uuid.uuid4())

    # Save uploaded file to /tmp immediately
    raw_path = f"/tmp/{job_id}_raw"
    with open(raw_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Create job record in DB (status: pending)
    await db.execute(
        "INSERT INTO jobs (id, user_id, status, created_at) VALUES ($1,$2,'pending',$3)",
        job_id, user_id, datetime.utcnow()
    )

    # Kick off background pipeline — returns immediately to client
    background_tasks.add_task(run_pipeline, job_id, raw_path, user_id)

    quota = await get_quota_status(user_id, db)
    return {
        "job_id": job_id,
        "status": "pending",
        "quota": quota
    }


@app.get("/status/{job_id}")
async def get_status(
    job_id: str,
    user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    job = await db.fetchrow(
        "SELECT * FROM jobs WHERE id = $1 AND user_id = $2",
        job_id, user_id
    )
    if not job:
        raise HTTPException(404, "Job not found")
    return dict(job)


async def run_pipeline(job_id: str, raw_path: str, user_id: str):
    db = await get_db_connection()
    compressed_path = f"/tmp/{job_id}.mp3"
    try:
        # Step 0: Validate + compress with ffmpeg
        await update_job_status(job_id, "preprocessing", db)
        meta = validate_and_compress(raw_path, compressed_path)

        # Step 1: Stream to AssemblyAI — file deleted inside this function after use
        await update_job_status(job_id, "transcribing", db)
        segments = transcribe_and_diarize(compressed_path)
        # compressed_path is deleted inside transcribe_and_diarize()

        # Step 2: LLM analysis
        await update_job_status(job_id, "analyzing", db)
        analysis = await analyze_with_retry(segments)

        # Step 3: Save to Neon DB
        await save_analysis(job_id, user_id, analysis, meta["duration_seconds"], db)
        await update_job_status(job_id, "complete", db)

    except Exception as e:
        await update_job_status(job_id, "failed", db, error=str(e))
        raise
    finally:
        # Always clean up — even if something fails mid-way
        for path in [raw_path, compressed_path]:
            if os.path.exists(path):
                os.remove(path)
```

---

## Upgrade 5 — JWT Auth + Refresh Token Rotation

### Why Build This Yourself
Using Clerk or Auth0 is faster to ship but hides the mechanics. For a portfolio project where interviewers ask "how does your auth work?", being able to explain JWTs, bcrypt, httpOnly cookies, and refresh token rotation is far more valuable than "I used Clerk."

### Install
```bash
pip install python-jose[cryptography] passlib[bcrypt] python-multipart
```

### Token Strategy
```
Access token:   15 minutes, stored in React state (memory only)
Refresh token:  7 days, stored in httpOnly cookie (JS cannot read)

On access token expiry → send refresh cookie → get new access token
On refresh token expiry → redirect to /login
```

### Database Schema
```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT UNIQUE NOT NULL,
    name            TEXT,
    hashed_password TEXT NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,       -- bcrypt hash of the token, never raw
    expires_at  TIMESTAMP NOT NULL,
    revoked     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);
```

### Core Auth Implementation
```python
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Response, Cookie, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
import hashlib, os

SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def create_token(user_id: str, expire_delta: timedelta, token_type: str) -> str:
    payload = {
        "sub": str(user_id),
        "type": token_type,
        "exp": datetime.utcnow() + expire_delta
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(401, "Wrong token type")
        return payload["sub"]
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")

@app.post("/auth/signup")
async def signup(body: SignupRequest, db = Depends(get_db)):
    existing = await db.fetchrow("SELECT id FROM users WHERE email = $1", body.email)
    if existing:
        raise HTTPException(400, "Email already registered")
    hashed = pwd_context.hash(body.password)
    user_id = await db.fetchval(
        "INSERT INTO users (email, name, hashed_password) VALUES ($1,$2,$3) RETURNING id",
        body.email, body.name, hashed
    )
    access = create_token(str(user_id), timedelta(minutes=15), "access")
    return {"access_token": access}

@app.post("/auth/login")
async def login(body: LoginRequest, response: Response, db = Depends(get_db)):
    user = await db.fetchrow("SELECT * FROM users WHERE email = $1", body.email)
    if not user or not pwd_context.verify(body.password, user["hashed_password"]):
        raise HTTPException(401, "Invalid credentials")

    access = create_token(str(user["id"]), timedelta(minutes=15), "access")
    refresh = create_token(str(user["id"]), timedelta(days=7), "refresh")

    # Store hash of refresh token (never store raw)
    token_hash = hashlib.sha256(refresh.encode()).hexdigest()
    await db.execute(
        "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)",
        user["id"], token_hash, datetime.utcnow() + timedelta(days=7)
    )

    # Set refresh token as httpOnly cookie — JS cannot access this
    response.set_cookie(
        key="refresh_token", value=refresh,
        httponly=True, secure=True, samesite="lax",
        max_age=7 * 24 * 60 * 60
    )
    return {"access_token": access, "user": {"id": str(user["id"]), "email": user["email"], "name": user["name"]}}

@app.post("/auth/refresh")
async def refresh_access_token(refresh_token: str = Cookie(None), db = Depends(get_db)):
    if not refresh_token:
        raise HTTPException(401, "No refresh token")
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Invalid token type")

        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        record = await db.fetchrow(
            "SELECT * FROM refresh_tokens WHERE token_hash=$1 AND revoked=FALSE AND expires_at > NOW()",
            token_hash
        )
        if not record:
            raise HTTPException(401, "Refresh token invalid or expired")

        return {"access_token": create_token(payload["sub"], timedelta(minutes=15), "access")}
    except JWTError:
        raise HTTPException(401, "Invalid refresh token")

@app.post("/auth/logout")
async def logout(response: Response, refresh_token: str = Cookie(None), db = Depends(get_db)):
    if refresh_token:
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        await db.execute("UPDATE refresh_tokens SET revoked=TRUE WHERE token_hash=$1", token_hash)
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}
```

### API Endpoints
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/signup` | Public | Create account, returns access token |
| POST | `/auth/login` | Public | Returns access token + sets httpOnly refresh cookie |
| POST | `/auth/refresh` | Cookie | Returns new access token |
| POST | `/auth/logout` | Protected | Revokes refresh token |
| GET | `/auth/me` | Protected | Current user profile |
| POST | `/analyze` | Protected | Start analysis job |
| GET | `/status/{job_id}` | Protected | Job status (scoped to user) |
| GET | `/history` | Protected | User's analysis history |
| GET | `/quota` | Protected | Current week usage |

---

## Upgrade 6 — No File Storage Service Needed

Audio files are written to Render's ephemeral `/tmp` disk by FastAPI on upload, compressed by ffmpeg in place, streamed directly to AssemblyAI as bytes, then deleted immediately. The file exists on disk for ~30 seconds total. There is no storage service, no credit card, no configuration.

```
Upload → /tmp/{job_id}_raw     (FastAPI writes incoming bytes)
       → /tmp/{job_id}.mp3     (ffmpeg compresses in place)
       → AssemblyAI            (streamed directly as bytes)
       → os.remove()           (deleted inside transcribe_and_diarize)
```

Only text data (transcript segments, Rosenshine scores, feedback) is persisted — to Neon PostgreSQL. Text is tiny: a full analysis result is ~10 KB. Neon's free 0.5 GB supports ~50,000 analyses.

**The one caveat**: if Render restarts mid-job, the `/tmp` file is gone and the job fails. The `finally` block in `run_pipeline` handles cleanup, and the job status in Neon will read `"failed"` — the frontend shows a retry button. With 3 jobs/week rate limiting, this edge case is acceptable for a portfolio project.



## Upgrade 7 — Neon PostgreSQL + SQLAlchemy + Alembic

### Why Alembic
Raw `CREATE TABLE` SQL works once. The moment you need to add a column, rename a field, or add an index — which will happen — you need migrations. Alembic is Git for your database schema.

### Install
```bash
pip install sqlalchemy alembic asyncpg
```

### Connection (Use Neon's Pooled URL)
```python
# Use the pooled connection URL from Neon dashboard
# Format: postgresql+asyncpg://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
DATABASE_URL = os.environ["DATABASE_URL"]
```

### SQLAlchemy Models
```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ARRAY
import uuid
from datetime import datetime

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=True)
    hashed_password: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    analyses: Mapped[list["Analysis"]] = relationship(back_populates="user")

class Job(Base):
    __tablename__ = "jobs"
    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str]           # pending | preprocessing | transcribing | analyzing | complete | failed
    error: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)

class Analysis(Base):
    __tablename__ = "analyses"
    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("jobs.id"), unique=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    filename: Mapped[str]
    audio_key: Mapped[str]
    duration_seconds: Mapped[float]
    overall_score: Mapped[float]
    teacher_talk_ratio: Mapped[float]
    dominant_speaker: Mapped[str]
    summary: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    user: Mapped["User"] = relationship(back_populates="analyses")
    principle_scores: Mapped[list["PrincipleScore"]] = relationship(back_populates="analysis", cascade="all, delete-orphan")

class PrincipleScore(Base):
    __tablename__ = "principle_scores"
    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("analyses.id"))
    principle_number: Mapped[int]
    principle_name: Mapped[str]
    score: Mapped[float]
    evidence: Mapped[list[str]] = mapped_column(ARRAY(Text))
    timestamp_start: Mapped[float]
    improvement: Mapped[str] = mapped_column(Text)
    analysis: Mapped["Analysis"] = relationship(back_populates="principle_scores")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    token_hash: Mapped[str] = mapped_column(String, unique=True)
    expires_at: Mapped[datetime]
    revoked: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
```

### Alembic Setup
```bash
alembic init alembic
# Edit alembic/env.py to import your Base and set DATABASE_URL
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

---

## Upgrade 8 — Per-User Rate Limiting

### Design
| Limit | Value | Reason |
|---|---|---|
| Analyses per week | 3 | Protects ~4+ months of AssemblyAI credits across multiple users |
| Min gap between analyses | 30 minutes | Prevents accidental double-submit |
| Max audio duration | 60 minutes | Covers full class periods, controls per-job cost |
| Max file size | 100 MB | Practical upload guard |

### Implementation — Pure SQL, No Extra Service
```python
from fastapi import HTTPException
from datetime import datetime, timedelta

WEEKLY_LIMIT = 3
MIN_GAP_MINUTES = 30

async def check_rate_limit(user_id: str, db) -> dict:
    # 1. Count completed/in-progress analyses this week
    weekly_count = await db.fetchval(
        """SELECT COUNT(*) FROM jobs
           WHERE user_id = $1
           AND status != 'failed'
           AND created_at > NOW() - INTERVAL '7 days'""",
        user_id
    )

    if weekly_count >= WEEKLY_LIMIT:
        # Tell the user exactly when their quota resets
        oldest = await db.fetchval(
            """SELECT created_at FROM jobs
               WHERE user_id = $1 AND status != 'failed'
               AND created_at > NOW() - INTERVAL '7 days'
               ORDER BY created_at ASC LIMIT 1""",
            user_id
        )
        reset_at = oldest + timedelta(days=7)
        raise HTTPException(429, {
            "error": "weekly_limit_reached",
            "used": int(weekly_count),
            "limit": WEEKLY_LIMIT,
            "resets_at": reset_at.isoformat(),
            "message": f"You've used {weekly_count}/{WEEKLY_LIMIT} analyses this week. Resets {reset_at.strftime('%b %d at %H:%M UTC')}."
        })

    # 2. Check minimum gap
    last_job = await db.fetchrow(
        """SELECT created_at FROM jobs
           WHERE user_id = $1 AND status != 'failed'
           ORDER BY created_at DESC LIMIT 1""",
        user_id
    )
    if last_job:
        elapsed_minutes = (datetime.utcnow() - last_job["created_at"]).total_seconds() / 60
        if elapsed_minutes < MIN_GAP_MINUTES:
            wait = int(MIN_GAP_MINUTES - elapsed_minutes) + 1
            raise HTTPException(429, {
                "error": "too_soon",
                "message": f"Please wait {wait} more minutes before starting another analysis."
            })

    return {"used": int(weekly_count), "limit": WEEKLY_LIMIT, "remaining": WEEKLY_LIMIT - int(weekly_count)}

async def get_quota_status(user_id: str, db) -> dict:
    count = await db.fetchval(
        """SELECT COUNT(*) FROM jobs
           WHERE user_id = $1 AND status != 'failed'
           AND created_at > NOW() - INTERVAL '7 days'""",
        user_id
    )
    return {"used": int(count), "limit": WEEKLY_LIMIT, "remaining": WEEKLY_LIMIT - int(count)}
```

### Frontend Quota Widget
The dashboard must always show the user their current usage. Never let them hit a limit without warning.

```jsx
// Always visible at top of dashboard
const QuotaBadge = ({ used, limit, resetsAt }) => (
  <div className="quota-banner">
    <span>{used}/{limit} analyses used this week</span>
    <div className="quota-dots">
      {Array.from({length: limit}, (_, i) => (
        <span key={i} className={i < used ? "dot-used" : "dot-free"} />
      ))}
    </div>
    {used >= limit && <span className="reset-note">Resets {resetsAt}</span>}
  </div>
)
```

---

## Upgrade 9 — Historical Dashboard

### Frontend Components
Add a `/history` route in React with three visualisations:

```jsx
import { LineChart, Line, XAxis, YAxis, Tooltip, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'

// Overall score trend over time
<LineChart data={analyses}>
  <XAxis dataKey="created_at" />
  <YAxis domain={[0, 1]} />
  <Line dataKey="overall_score" stroke="#6366f1" />
  <Tooltip />
</LineChart>

// Rosenshine principle breakdown — per session
<RadarChart data={principleScores}>
  <PolarGrid />
  <PolarAngleAxis dataKey="principle_name" />
  <Radar dataKey="score" fill="#6366f1" fillOpacity={0.4} />
</RadarChart>
```

### `/history` API Endpoint
```python
@app.get("/history")
async def get_history(user_id: str = Depends(get_current_user), db = Depends(get_db)):
    analyses = await db.fetch(
        """SELECT a.*, array_agg(row_to_json(ps)) as principles
           FROM analyses a
           LEFT JOIN principle_scores ps ON ps.analysis_id = a.id
           WHERE a.user_id = $1
           GROUP BY a.id
           ORDER BY a.created_at DESC
           LIMIT 20""",
        user_id
    )
    return [dict(row) for row in analyses]
```

---

## Upgrade 10 — Error Handling + Retry

```python
import asyncio
from functools import wraps
from groq import RateLimitError, APIError

def retry(max_attempts: int = 3, delay: float = 2.0, backoff: float = 2.0,
          retry_on: tuple = (Exception,)):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_delay = delay
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except retry_on as e:
                    if attempt == max_attempts - 1:
                        raise
                    await asyncio.sleep(current_delay)
                    current_delay *= backoff    # 2s → 4s → 8s
        return wrapper
    return decorator

# Only retry on transient errors, not validation errors
@retry(max_attempts=3, delay=2.0, retry_on=(RateLimitError, APIError))
async def analyze_with_retry(segments: list[dict]) -> FullAnalysis:
    return analyze_transcript(segments)
```

---

## Free Hosting Stack

### Full Diagram
```
[Vercel]              React frontend (free, permanent)
     |
[Render]              FastAPI backend (free, permanent)
     |                /tmp disk for ephemeral audio files (~30s per job)
[UptimeRobot]         Pings /health every 5 min — keeps Render awake (free)
     |
[Neon]                PostgreSQL — analysis results, auth, job status (free, permanent)
     |
[AssemblyAI]          Transcription + diarization ($50 credits on signup)
[Groq]                LLM analysis (free tier, permanent)
[Langfuse]            Observability (free tier, permanent)
```

**Zero credit cards required across the entire stack.**

---

### Vercel — Frontend
- Unlimited deployments, 100 GB bandwidth/month
- Auto-deploy on every GitHub push
- Custom domain on free tier
- **Cost: $0 permanently**

---

### Render — Backend
- 750 free instance hours/month — enough for one service 24/7
- 512 MB RAM, 0.1 vCPU — sufficient since there's no local ML
- Auto-deploy from GitHub
- **Important**: Do NOT use Render's built-in Postgres — it expires after 30 days. Use Neon.
- **Limitation**: Spins down after 15 min inactivity → solved by UptimeRobot
- **Cost: $0 permanently**

```yaml
# render.yaml (already in your repo — update this)
services:
  - type: web
    name: audio-analyzer-api
    runtime: python
    buildCommand: pip install -r requirements.txt && alembic upgrade head
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: ASSEMBLYAI_API_KEY
        sync: false
      - key: GROQ_API_KEY
        sync: false
      - key: SECRET_KEY
        sync: false
      - key: LANGFUSE_SECRET_KEY
        sync: false
      - key: LANGFUSE_PUBLIC_KEY
        sync: false
      - key: LANGFUSE_HOST
        value: https://cloud.langfuse.com
```

---

### UptimeRobot — Keep Render Alive
- Free plan monitors every 5 minutes
- Create a monitor pointing at `https://your-api.onrender.com/health`
- Prevents Render from ever spinning down during active use
- **Cost: $0 permanently**

```python
@app.get("/health")
async def health():
    return {"status": "ok"}
```

---

### Neon — PostgreSQL
- Free tier: 100 CU-hours/project/month, 0.5 GB storage per branch, 5 GB egress — no credit card required
- Databases automatically suspend when not in use, meaning they stop consuming compute — preserving your monthly CU-hours
- Built-in pgBouncer, database branching, open source (Apache 2.0)
- No project pausing (unlike Supabase's 7-day inactivity pause)
- **Cost: $0 permanently** (0.5 GB is ~40,000 analyses worth of text data)

```python
# Always use the pooled connection string from Neon dashboard
# Settings → Connection string → toggle "Connection pooling" ON
DATABASE_URL = "postgresql+asyncpg://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
```

---

### AssemblyAI — Transcription + Diarization
- $50 free credits on signup — no recurring free tier
- ~$0.13 per 45-min analysis → ~385 jobs from $50
- With 3 analyses/user/week rate limiting: enough for months of portfolio demos
- **Cost: $0 until credits run out, then ~$0.13/job**

---

### Groq — LLM Analysis
- Permanent free tier: 1,000 requests/day, 6,000 tokens/minute
- Llama 3.3 70B: ~2,000 tokens per full analysis prompt
- 1,000 req/day far exceeds 3 analyses/user/week with rate limiting
- **Cost: $0 permanently**

---

### Langfuse — Observability
- Free cloud tier, unlimited traces
- Open source (MIT), self-hostable if needed
- **Cost: $0 permanently**

---

## Complete Environment Variables

```env
# Database (Neon — use pooled URL from Neon dashboard)
DATABASE_URL=postgresql+asyncpg://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require

# AssemblyAI
ASSEMBLYAI_API_KEY=

# Groq
GROQ_API_KEY=

# Auth — generate with: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=

# Langfuse
LANGFUSE_SECRET_KEY=
LANGFUSE_PUBLIC_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com
```

---

## Processing Time — Final Numbers

For a 45-minute classroom recording:

| Step | Tool | Time |
|---|---|---|
| Save upload to /tmp | Render disk | ~2s |
| Validate + compress | ffmpeg | ~10s |
| Stream to AssemblyAI + transcribe + diarize | AssemblyAI | ~23s |
| Delete /tmp files | os.remove() | <1s |
| Rosenshine analysis | Groq Llama 3.3 | ~5–8s |
| Save to Neon | PostgreSQL | <1s |
| **Total** | | **~42–45 seconds** |

Frontend polls `/status/{job_id}` every 3 seconds and shows the current step name in the progress bar.

---

## Final Tech Stack — All Open Source or Free

| Layer | Tool | Licence / Cost |
|---|---|---|
| Audio preprocessing | ffmpeg | LGPL — open source |
| Temp file handling | Render /tmp disk | Ephemeral — no service needed |
| Transcription + diarization | AssemblyAI API | $50 credits |
| LLM | Groq + Llama 3.3 70B | Meta Llama licence — free tier |
| Structured output | Pydantic v2 | MIT — open source |
| Observability | Langfuse | MIT — open source |
| Job handling | FastAPI BackgroundTasks | MIT — open source |
| Auth | JWT + bcrypt (python-jose, passlib) | MIT — open source |
| Database ORM | SQLAlchemy + Alembic | MIT — open source |
| Database | Neon PostgreSQL | Apache 2.0 — free tier permanent |
| Frontend | React + Vite | MIT — open source |
| Charts | Recharts | MIT — open source |
| Frontend hosting | Vercel | Free tier permanent |
| Backend hosting | Render | Free tier permanent |
| Keep-alive | UptimeRobot | Free tier permanent |

---

## Implementation Priority

| Week | What To Build | Why First |
|---|---|---|
| **Week 1** | ffmpeg preprocessing + AssemblyAI integration | Core pipeline — nothing works without this |
| **Week 2** | Groq structured output + Pydantic models | Analysis quality — the core product value |
| **Week 3** | JWT auth + refresh tokens + Neon DB + Alembic | Gate everything behind user identity |
| **Week 4** | Rate limiting + BackgroundTasks + /tmp cleanup | Production readiness |
| **Week 5** | Langfuse observability + error retry | Depth signals for interviews |
| **Week 6** | Historical dashboard + quota UI + deploy to Render/Vercel | Ship it |

---

## Resume Bullet

> *"Rebuilt AudioAnalyzer into a production-grade zero-cost pipeline: ffmpeg preprocessing with ephemeral /tmp file handling, AssemblyAI for combined transcription and speaker diarization, Groq Llama 3.3 with Pydantic-validated structured outputs, JWT auth with refresh token rotation, Postgres-backed per-user rate limiting, Langfuse observability, and Neon serverless PostgreSQL — deployed entirely free on Render and Vercel with no credit card required."*
