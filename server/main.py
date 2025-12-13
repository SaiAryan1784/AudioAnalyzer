from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
import time
import tempfile
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://audio-analyzer-beta.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

@app.get("/")
async def root():
    apiKey = os.getenv("GEMINI_API_KEY")
    return {
        "status": "running",
        "api_key_set": bool(apiKey and apiKey != "your_gemini_api_key_here")
    }

@app.post("/analyze")
async def analyze(file: UploadFile):
    import json
    
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    audioBytes = await file.read()
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
        tmp.write(audioBytes)
        tmpPath = tmp.name
    
    try:
        print(f"Uploading file: {file.filename}")
        uploadedFile = genai.upload_file(tmpPath)
        
        print("Waiting for file processing...")
        while uploadedFile.state.name == "PROCESSING":
            time.sleep(2)
            uploadedFile = genai.get_file(uploadedFile.name)
        
        if uploadedFile.state.name == "FAILED":
            raise HTTPException(status_code=500, detail="File processing failed")
        
        print("File ready, generating content...")
        model = genai.GenerativeModel("models/gemini-2.5-flash")
        
        prompt = """Analyze this classroom audio using Rosenshine's Principles of Instruction. Identify 3 distinct pedagogical moments.

Rosenshine's 10 Principles:
1. Daily Review - reviewing previous learning
2. Present New Material in Small Steps - breaking down content with practice after each step
3. Ask Questions - checking all student responses
4. Provide Models - demonstrating examples
5. Guide Student Practice - supervised practice with feedback
6. Check for Understanding - regularly assessing comprehension
7. Obtain High Success Rate - ensuring correct responses
8. Provide Scaffolds - temporary supports for difficult tasks
9. Independent Practice - assigning and monitoring practice
10. Weekly/Monthly Review - consolidating learning

Return ONLY a JSON object (no markdown):
{
  "feedback": [
    {
      "timestamp": "MM:SS",
      "principle": "Principle Name (e.g., Daily Review, Ask Questions)",
      "description": "1 sentence explaining what the teacher did and if it was effective."
    }
  ]
}"""
        
        response = model.generate_content([uploadedFile, prompt])
        
        print("Cleaning up file...")
        genai.delete_file(uploadedFile.name)
        
        print(f"Raw response: {response.text[:200]}")
        
        cleanText = response.text.strip()
        if cleanText.startswith("```json"):
            cleanText = cleanText[7:]
        if cleanText.startswith("```"):
            cleanText = cleanText[3:]
        if cleanText.endswith("```"):
            cleanText = cleanText[:-3]
        cleanText = cleanText.strip()
        
        result = json.loads(cleanText)
        print(f"Parsed result: {result}")
        return result
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        print(f"Text was: {cleanText[:500]}")
        return {"feedback": []}
    except Exception as e:
        print(f"Error: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmpPath):
            os.unlink(tmpPath)

