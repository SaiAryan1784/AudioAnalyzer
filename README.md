# Audio Analyzer

AI-powered classroom audio analysis tool built with React and FastAPI.

## Project Structure

```
/server       FastAPI backend with Gemini API integration
/client       React frontend with Tailwind CSS
```

## Setup

### Backend

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file with your Gemini API key:
```bash
cp env.example .env
```

4. Add your API key to `.env`:
```
GEMINI_API_KEY=your_actual_key_here
```

5. Run the server:
```bash
uvicorn main:app --reload
```

Server runs on `http://localhost:8000`

### Frontend

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

Client runs on `http://localhost:5173`

## Usage

1. Upload an audio file (MP3 or WAV)
2. Wait for AI analysis
3. View feedback cards with timestamps
4. Click any timestamp to jump to that point in the audio

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Python 3.11+, FastAPI, Google Gemini 1.5 Flash
- **API**: Google Generative AI SDK

