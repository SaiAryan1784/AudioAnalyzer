# AudioAnalyzer

**Upload audio. Get a structured, evidence-backed coaching report in seconds.**

AudioAnalyzer transcribes any spoken-word recording, diarizes speakers, and runs the transcript through a framework-specific LLM prompt to produce scored, actionable feedback. Frameworks cover classrooms, sales calls, job interviews, podcasts, meetings, counseling sessions, and more.

Live: [audio-analyzer-beta.vercel.app](https://audio-analyzer-beta.vercel.app)

---

## How it works

```
Upload audio  →  ffmpeg compress  →  AssemblyAI transcribe + diarize
    →  Groq LLM score against framework dimensions  →  Results UI
```

1. Audio is compressed to mono MP3 @ 64 kbps via ffmpeg (ephemeral — deleted after transcription)
2. AssemblyAI returns a diarized transcript with per-segment speaker labels and timestamps
3. Groq (`llama-3.3-70b-versatile`) scores the transcript against the selected framework's dimensions (0.0–1.0 per dimension)
4. Results are persisted to Neon (PostgreSQL) and streamed back to the frontend

---

## Stack

### Frontend — `client/`
| | |
|---|---|
| React 18 + Vite | SPA, file-based routing via React Router v7 |
| Tailwind CSS | All styling |
| Recharts | Score visualisations |
| `@react-oauth/google` | Google Sign-In |

### Backend — `server/`
| | |
|---|---|
| FastAPI + Uvicorn | Async API server |
| SQLAlchemy 2 (async) + Alembic | ORM + migrations |
| Neon (PostgreSQL) | Managed serverless Postgres |
| AssemblyAI | Transcription + speaker diarization |
| Groq | LLM inference (llama-3.3-70b-versatile) |
| Langfuse | LLM observability tracing |
| Resend | Transactional email |
| Render | Hosting |

---

## Analysis Frameworks

Each framework defines a set of scored dimensions and a custom LLM system prompt.

| ID | Name | Dimensions | Target Use |
|---|---|---|---|
| `rosenshine` | Classroom Instruction | 10 | Teacher quality vs. Rosenshine's Principles |
| `public_speaking` | Public Speaking | — | Speaker clarity, delivery, engagement |
| `meeting` | Meeting Facilitation | — | Meeting effectiveness, participation |
| `podcast` | Podcast Analysis | — | Host performance, pacing, content |
| `sales_spin` | Sales (SPIN) | — | SPIN selling technique |
| `interview_star` | Job Interview (STAR) | — | Candidate response quality |
| `language_speaking` | Language Speaking | — | Fluency, vocabulary, pronunciation |
| `counseling` | Counseling Session | — | Therapeutic technique quality |
| `customer_service` | Customer Service | — | Agent empathy, resolution, tone |

Frameworks are registered in `server/app/frameworks/`. Adding a new one requires only a new file that calls `register(AnalysisFramework(...))`.

---

## Rate Limits

- **3 analyses per user per rolling 24-hour window**
- **30-minute minimum gap** between submissions
- Admin users bypass all limits
- Limits are enforced in SQL (no Redis dependency) — see `server/app/rate_limit.py`

---

## Audio Constraints

| Constraint | Limit |
|---|---|
| Max file size | 100 MB |
| Max duration | 60 minutes |
| Accepted formats | `.mp3` `.wav` `.m4a` `.webm` `.ogg` `.flac` |

---

## Local Development

### Prerequisites
- Python 3.11+
- Node 18+
- ffmpeg installed and on PATH
- A Neon database (or local Postgres with `CREATE EXTENSION postgis;`)

### Backend

```bash
cd server
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Copy and fill in env vars
cp env.example .env

alembic upgrade head
uvicorn app.main:app --reload
# API running at http://localhost:8000
```

### Frontend

```bash
cd client
npm install
npm run dev
# App running at http://localhost:5173
```

---

## Environment Variables

### Backend (`server/.env`)

```env
DATABASE_URL=postgresql+asyncpg://user:pass@host/db

ASSEMBLYAI_API_KEY=
GROQ_API_KEY=

SECRET_KEY=                          # JWT signing secret
GOOGLE_CLIENT_ID=                    # Google OAuth web client ID

LANGFUSE_SECRET_KEY=
LANGFUSE_PUBLIC_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com

RESEND_API_KEY=
EMAIL_FROM=AudioAnalyzer <noreply@audioanalyzer.app>
FRONTEND_URL=https://audio-analyzer-beta.vercel.app
```

---

## Deployment

### Backend — Render

`render.yaml` is included. On push to main, Render runs:

```
pip install -r requirements.txt && alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1
```

`GET /health` is the UptimeRobot ping target to prevent the service sleeping.

### Frontend — Vercel

`client/vercel.json` includes the SPA rewrite rule. Connect the repo to Vercel, set root to `client/`, and deploy.

---

## Project Structure

```
AudioAnalyzer/
├── client/
│   ├── src/
│   │   ├── pages/          # Route-level components
│   │   ├── components/     # Shared UI components
│   │   ├── context/        # React context (auth)
│   │   └── api.js          # Axios API client
│   └── vite.config.js
├── server/
│   ├── app/
│   │   ├── frameworks/     # Pluggable analysis framework definitions
│   │   ├── main.py         # FastAPI app + CORS + lifespan
│   │   ├── routes.py       # /analyze, /status, /results, /history, /quota
│   │   ├── pipeline.py     # ffmpeg → AssemblyAI → Groq orchestration
│   │   ├── analysis.py     # Groq LLM call + Langfuse tracing
│   │   ├── auth.py         # JWT auth + Google OAuth
│   │   ├── models.py       # SQLAlchemy ORM models
│   │   ├── schemas.py      # Pydantic request/response schemas
│   │   ├── rate_limit.py   # Per-user quota enforcement
│   │   └── config.py       # Settings from env vars
│   ├── alembic/            # DB migrations
│   └── requirements.txt
└── render.yaml
```

---

## Auth

- Email/password with email verification
- Google Sign-In (OAuth2)
- JWT access tokens (15 min) + refresh tokens (7 days)
- Password reset via email (Resend)

All protected routes require `Authorization: Bearer <access_token>`.
