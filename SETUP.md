# AudioAnalyzer — Setup Guide

## Prerequisites
- Python 3.11+
- Node.js 18+
- ffmpeg (`sudo apt install ffmpeg` on Ubuntu, `brew install ffmpeg` on Mac)

## Backend

```bash
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Copy the `.env` file into `server/` (or ensure it's at the project root) with:

```env
DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require
ASSEMBLYAI_API_KEY=...
GROQ_API_KEY=...
SECRET_KEY=<generate: python -c "import secrets; print(secrets.token_hex(32))">
LANGFUSE_SECRET_KEY=...
LANGFUSE_PUBLIC_KEY=...
LANGFUSE_HOST=https://cloud.langfuse.com
```

Run the server:
```bash
cd server
uvicorn app.main:app --reload --port 8000
```

Tables are created automatically on startup. For migrations:
```bash
cd server
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Frontend

```bash
cd client
npm install
npm run dev
```

Create `client/.env` (optional):
```env
VITE_API_URL=http://localhost:8000
```

Open http://localhost:5173

## Deployment

- **Backend**: Deploy `server/` to Render (see `render.yaml`)
- **Frontend**: Deploy `client/` to Vercel (see `vercel.json`)
- **Keep-alive**: Set up UptimeRobot to ping `/health` every 5 min
