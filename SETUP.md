# Quick Setup Guide

## Initial Setup

### Backend
```bash
cd server
pip install -r requirements.txt
cp env.example .env
```

Edit `.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_key_here
```

Run server:
```bash
./run.sh
```

### Frontend
```bash
cd client
npm install
./run.sh
```

## Testing

1. Open browser to `http://localhost:5173`
2. Upload an MP3 or WAV audio file
3. Wait for analysis
4. Click timestamps on feedback cards to seek audio

## API Key

Get your free Gemini API key from:
https://makersuite.google.com/app/apikey

