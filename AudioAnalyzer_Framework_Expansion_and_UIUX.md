# AudioAnalyzer — Framework Expansion + UI/UX Design Plan
### Pluggable Analysis Engine · Timestamp Audio Player · Complete UI Redesign

---

## Part 1 — Pluggable Framework Architecture

---

### The Core Insight

Every use case shares the exact same pipeline. The only thing that changes is the **system prompt** and **scoring dimensions**. Everything else — auth, rate limiting, job queue, DB — is identical.

```
Audio File
    ↓
ffmpeg compress          ← same for all
    ↓
AssemblyAI transcribe    ← same for all
    ↓
[FRAMEWORK SELECTOR]     ← THIS is what changes per use case
    ↓
Groq Llama 3.3           ← same for all
    ↓
Neon DB                  ← same for all
```

Adding a new use case = writing a new `AnalysisFramework` object. No new infrastructure, no new API routes, no new DB tables.

---

### Framework Data Model

```python
# frameworks/base.py
from pydantic import BaseModel
from typing import Optional

class Dimension(BaseModel):
    number: int
    name: str
    description: str           # What this dimension measures
    good_example: str          # What high score looks like
    bad_example: str           # What low score looks like

class AnalysisFramework(BaseModel):
    id: str                    # "rosenshine", "sales_spin", "interview_star" etc.
    name: str                  # Display name
    description: str           # One-liner for UI
    icon: str                  # Emoji for UI cards
    target_speaker: str        # "teacher", "salesperson", "candidate", "presenter"
    speakers_expected: int     # How many speakers to diarize (2, 3, etc.)
    dimensions: list[Dimension]
    system_prompt: str         # Full LLM system prompt
    example_use: str           # "Upload a 45-min classroom recording..."


# Registry — all available frameworks
FRAMEWORKS: dict[str, AnalysisFramework] = {}

def register(framework: AnalysisFramework):
    FRAMEWORKS[framework.id] = framework
    return framework
```

---

### All Use Cases + Prompts

#### 1. Classroom Teaching — Rosenshine's Principles
```python
register(AnalysisFramework(
    id="rosenshine",
    name="Classroom Instruction",
    description="Evaluate teaching quality against Rosenshine's 10 Principles",
    icon="🎓",
    target_speaker="teacher",
    speakers_expected=2,
    dimensions=[
        Dimension(number=1, name="Daily Review", description="Teacher reviews previous learning", good_example="Opens class recapping last lesson", bad_example="Jumps straight to new material"),
        Dimension(number=2, name="New Material Presentation", description="Small steps with clear explanations", good_example="Breaks concept into digestible chunks", bad_example="Overwhelms with too much at once"),
        Dimension(number=3, name="Guided Practice", description="Questions to check understanding", good_example="Asks specific comprehension questions frequently", bad_example="Asks 'Does everyone understand?' and moves on"),
        Dimension(number=4, name="Corrections & Feedback", description="Responds to errors clearly", good_example="Addresses misconceptions directly", bad_example="Ignores wrong answers or moves on quickly"),
        Dimension(number=5, name="Independent Practice", description="Students practice independently", good_example="Assigns tasks for students to try alone", bad_example="No independent work given"),
        Dimension(number=6, name="Weekly/Monthly Review", description="Revisits older content", good_example="References prior units intentionally", bad_example="Never connects to previous lessons"),
        Dimension(number=7, name="Student Success Rate", description="Students understand at high rate", good_example="Class answers questions correctly >80% of time", bad_example="Frequent confusion, many wrong answers"),
        Dimension(number=8, name="Scaffolding", description="Support provided during difficulty", good_example="Hints given before full answers", bad_example="Either gives answer or ignores struggle"),
        Dimension(number=9, name="Models & Examples", description="Shows worked examples", good_example="Thinks aloud through a problem step by step", bad_example="No demonstration before student practice"),
        Dimension(number=10, name="Engagement", description="Students are actively engaged", good_example="High participation, students volunteer answers", bad_example="Teacher talks to silence, no interaction"),
    ],
    system_prompt="""You are an expert evaluator trained in Rosenshine's Principles of Instruction.
Analyze the classroom transcript. Identify which speaker is the teacher based on who leads instruction.
Score each of the 10 Rosenshine Principles from 0.0 to 1.0.
For each principle, provide 1-3 direct quotes from the transcript as evidence, include the timestamp, and give a specific, actionable improvement suggestion.
Also calculate the teacher talk ratio (proportion of total speaking time by the teacher).
Return ONLY valid JSON matching the schema provided.""",
    example_use="Upload a classroom recording to evaluate teaching quality against evidence-based instruction principles."
))
```

#### 2. Sales Call — SPIN Selling
```python
register(AnalysisFramework(
    id="sales_spin",
    name="Sales Call (SPIN)",
    description="Coach sales reps using the SPIN selling methodology",
    icon="📞",
    target_speaker="salesperson",
    speakers_expected=2,
    dimensions=[
        Dimension(number=1, name="Situation Questions", description="Establishes context and background", good_example="'How many people are currently on your team?'", bad_example="Assumes context without asking"),
        Dimension(number=2, name="Problem Questions", description="Uncovers pain points", good_example="'What's the biggest challenge with your current process?'", bad_example="Jumps to pitch without exploring problems"),
        Dimension(number=3, name="Implication Questions", description="Explores consequences of problems", good_example="'How does that affect your quarterly targets?'", bad_example="Never connects problems to business impact"),
        Dimension(number=4, name="Need-Payoff Questions", description="Gets prospect to articulate value", good_example="'If you solved that, what would that mean for the team?'", bad_example="Rep explains value instead of letting prospect discover it"),
        Dimension(number=5, name="Talk Ratio", description="Rep listens more than speaks", good_example="Rep speaks <50% of the time", bad_example="Rep dominates the conversation"),
        Dimension(number=6, name="Objection Handling", description="Responds to objections with empathy and evidence", good_example="Acknowledges concern then provides specific evidence", bad_example="Dismisses objections or becomes defensive"),
        Dimension(number=7, name="Next Steps", description="Clear next action agreed upon", good_example="Specific date, owner, and action confirmed", bad_example="Ends with vague 'I'll follow up'"),
        Dimension(number=8, name="Rapport", description="Human connection and trust-building", good_example="Personal touches, remembers context, uses name", bad_example="Feels transactional and scripted"),
    ],
    system_prompt="""You are an expert sales coach specialising in SPIN selling methodology.
Analyze the sales call transcript. The salesperson is the rep being evaluated.
Score each of the 8 SPIN dimensions from 0.0 to 1.0.
For each, quote specific lines from the transcript as evidence with timestamps, and provide a concrete coaching tip.
Calculate the rep's talk ratio. Flag any specific moments of strong or poor technique.
Return ONLY valid JSON matching the schema provided.""",
    example_use="Upload a recorded sales call to get SPIN methodology coaching and talk ratio analysis."
))
```

#### 3. Interview Coaching — STAR Method
```python
register(AnalysisFramework(
    id="interview_star",
    name="Interview Coaching (STAR)",
    description="Evaluate candidate or self-practice interview responses",
    icon="🎯",
    target_speaker="candidate",
    speakers_expected=2,
    dimensions=[
        Dimension(number=1, name="Situation Clarity", description="Sets up context concisely", good_example="Clear, specific situation in 1-2 sentences", bad_example="Rambling or vague background"),
        Dimension(number=2, name="Task Definition", description="Clearly states their role/responsibility", good_example="'I was responsible for...'", bad_example="Unclear what they personally owned"),
        Dimension(number=3, name="Action Specificity", description="Details concrete steps taken", good_example="Specific actions with reasoning", bad_example="'We just kind of figured it out'"),
        Dimension(number=4, name="Result Quantification", description="Outcomes with numbers where possible", good_example="'Reduced time by 40%, saved $20k'", bad_example="'It went well' with no metrics"),
        Dimension(number=5, name="Conciseness", description="Answers within 2 minutes", good_example="Tight, structured, no rambling", bad_example="Exceeds 3 minutes, loses focus"),
        Dimension(number=6, name="Confidence & Clarity", description="Speaks with confidence and clarity", good_example="Clear voice, no excessive filler words", bad_example="'um', 'like', 'you know' excessively"),
        Dimension(number=7, name="Question Relevance", description="Answer actually addresses the question asked", good_example="Example is directly relevant to the question", bad_example="Generic answer that could apply to any question"),
        Dimension(number=8, name="Reflection", description="Shows learning from experience", good_example="'What I'd do differently is...'", bad_example="No insight or self-awareness shown"),
    ],
    system_prompt="""You are an expert interview coach with 15 years experience in technical and behavioural interviews.
Analyze the interview transcript. The candidate is the person answering questions.
Score each of the 8 STAR dimensions from 0.0 to 1.0.
Quote specific lines from the candidate's answers with timestamps as evidence.
Count filler words (um, uh, like, you know) and report the total.
Give concrete, specific coaching for each dimension.
Return ONLY valid JSON matching the schema provided.""",
    example_use="Record yourself answering interview questions to get STAR method coaching and filler word analysis."
))
```

#### 4. Meeting Effectiveness
```python
register(AnalysisFramework(
    id="meeting_effectiveness",
    name="Meeting Effectiveness",
    description="Analyse meeting quality, participation, and outcome clarity",
    icon="🤝",
    target_speaker="facilitator",
    speakers_expected=5,    # Multiple participants
    dimensions=[
        Dimension(number=1, name="Agenda Adherence", description="Meeting stays on topic", good_example="Facilitator steers back when off-track", bad_example="Long tangents, never returns to agenda"),
        Dimension(number=2, name="Participation Balance", description="All voices heard, not dominated", good_example="Multiple speakers contribute meaningfully", bad_example="One or two people speak >80% of the time"),
        Dimension(number=3, name="Decision Clarity", description="Decisions are explicitly stated", good_example="'We've decided to X, owned by Y'", bad_example="Consensus assumed but never confirmed"),
        Dimension(number=4, name="Action Items", description="Clear actions with owners and deadlines", good_example="'John will send the report by Friday'", bad_example="Vague next steps with no owner"),
        Dimension(number=5, name="Time Management", description="Meeting ends on time, pacing is good", good_example="Topics covered proportionally to importance", bad_example="Early items over-discussed, late items rushed"),
        Dimension(number=6, name="Psychological Safety", description="People feel safe to disagree", good_example="Dissent welcomed, questions encouraged", bad_example="Pushback is shut down or ignored"),
        Dimension(number=7, name="Facilitation Quality", description="Facilitator guides effectively", good_example="Synthesises, summarises, moves things forward", bad_example="Passive, lets meeting drift"),
        Dimension(number=8, name="Outcome Clarity", description="Everyone knows what happens next", good_example="Recap of decisions and actions at end", bad_example="Meeting ends without summary"),
    ],
    system_prompt="""You are an expert organisational effectiveness consultant.
Analyze the meeting transcript with multiple speakers.
Identify the facilitator based on who sets direction and manages discussion flow.
Score each of the 8 meeting effectiveness dimensions from 0.0 to 1.0.
Calculate participation ratio per speaker (% of total speaking time).
Flag specific moments with timestamps where the meeting succeeded or failed.
Give concrete improvement suggestions for the facilitator.
Return ONLY valid JSON matching the schema provided.""",
    example_use="Upload a team meeting recording to analyse participation balance, decision quality, and action item clarity."
))
```

#### 5. Public Speaking / Presentation
```python
register(AnalysisFramework(
    id="public_speaking",
    name="Public Speaking",
    description="Evaluate presentation delivery, structure, and audience engagement",
    icon="🎤",
    target_speaker="presenter",
    speakers_expected=2,
    dimensions=[
        Dimension(number=1, name="Opening Hook", description="Captures attention immediately", good_example="Starts with a story, question, or striking stat", bad_example="'Hi I'm X and today I'll be talking about...'"),
        Dimension(number=2, name="Structure Clarity", description="Clear beginning, middle, end", good_example="Signposts transitions, audience knows where they are", bad_example="Jumps around, hard to follow"),
        Dimension(number=3, name="Pacing", description="Appropriate speed, uses pauses effectively", good_example="Pauses after key points, varies speed", bad_example="Rushes through, no pauses"),
        Dimension(number=4, name="Filler Word Usage", description="Minimal um/uh/like", good_example="<5 filler words per minute", bad_example=">15 filler words per minute"),
        Dimension(number=5, name="Audience Engagement", description="Involves the audience", good_example="Asks questions, uses 'you', tells relatable stories", bad_example="Lectures at audience with no interaction"),
        Dimension(number=6, name="Confidence", description="Projects confidence through voice and delivery", good_example="Strong voice, owns the material", bad_example="Apologetic, hesitant, excessive qualifiers"),
        Dimension(number=7, name="Key Message Clarity", description="Core takeaway is crystal clear", good_example="One clear message repeated and reinforced", bad_example="Audience couldn't identify the main point"),
        Dimension(number=8, name="Closing", description="Strong, memorable close", good_example="Call to action, callback to opening, strong final line", bad_example="'So yeah, that's it...'"),
    ],
    system_prompt="""You are an expert speaking coach who has trained TEDx speakers and C-suite executives.
Analyze the presentation transcript. Count filler words (um, uh, like, you know, so) per minute.
Score each of the 8 delivery dimensions from 0.0 to 1.0.
Quote specific lines with timestamps as evidence.
Give precise, actionable coaching — not generic advice.
Return ONLY valid JSON matching the schema provided.""",
    example_use="Record a presentation or speech to get delivery coaching, filler word counts, and structure feedback."
))
```

---

### API Changes (Minimal — One Extra Field)

```python
# Just add framework_id to the upload endpoint
@app.post("/analyze")
async def start_analysis(
    file: UploadFile,
    framework_id: str = "rosenshine",   # Default to existing use case
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    if framework_id not in FRAMEWORKS:
        raise HTTPException(400, f"Unknown framework. Available: {list(FRAMEWORKS.keys())}")

    framework = FRAMEWORKS[framework_id]
    await check_rate_limit(user_id, db)
    ...
    background_tasks.add_task(run_pipeline, job_id, raw_path, user_id, framework)
```

### DB Change (One Column)

```sql
ALTER TABLE analyses ADD COLUMN framework_id TEXT NOT NULL DEFAULT 'rosenshine';
ALTER TABLE analyses ADD COLUMN framework_name TEXT;

-- dimension_scores replaces principle_scores conceptually (same table, same schema)
-- principle_number → dimension_number, principle_name → dimension_name
-- Rename the table if starting fresh, otherwise reuse as-is
```

---

## Part 2 — Timestamped Audio Player

---

### The Feature

Every analysis result links directly to the moment in the audio where the evidence was found. The user clicks a timestamp badge and the audio player jumps to that exact second. This transforms static text feedback into an interactive coaching experience.

```
[Principle: Guided Practice — Score: 0.6]
Evidence:
  ▶ [0:42]  "Does everyone understand?" — Teacher asked closed question
  ▶ [3:17]  "Good, let's move on" — Moved on without checking comprehension
  ▶ [8:55]  "Can anyone tell me why...?" — Better: open question
Suggestion: Replace 'does everyone understand?' with specific questions like
            'Can you explain this back to me in your own words?'
```

---

### Backend — Store Timestamps in DB

The `PrincipleScore` / `DimensionScore` model already has `timestamp_start`. Extend it to store **all** evidence timestamps, not just one:

```python
class EvidenceItem(BaseModel):
    text: str               # The quoted text
    timestamp: float        # Seconds into the audio
    speaker: str            # "A", "B" etc.
    note: str               # Why this was flagged

class DimensionScore(BaseModel):
    dimension_number: int
    dimension_name: str
    score: float
    evidence: list[EvidenceItem]    # Multiple timestamped moments
    improvement_suggestion: str
```

Updated LLM prompt instruction:
```python
"""For each dimension, find 2-4 specific moments in the transcript.
For each moment, include:
- The exact quoted text from the speaker
- The timestamp in seconds (from the transcript timestamps)
- The speaker label ("A", "B" etc.)
- A one-sentence note explaining why this moment is evidence for this dimension.
"""
```

---

### Frontend — Audio Player Component

```jsx
// components/AudioPlayer.jsx
import { useState, useRef, useEffect, useCallback } from 'react'

export function AudioPlayer({ audioFile, analysisResults }) {
  const audioRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeEvidence, setActiveEvidence] = useState(null)

  // Collect ALL evidence timestamps across all dimensions
  const allTimestamps = analysisResults.dimensions.flatMap(dim =>
    dim.evidence.map(ev => ({
      ...ev,
      dimensionName: dim.dimension_name,
      score: dim.score
    }))
  ).sort((a, b) => a.timestamp - b.timestamp)

  // Jump to a specific second in the audio
  const seekTo = useCallback((seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [])

  // Highlight the current evidence as audio plays
  useEffect(() => {
    const interval = setInterval(() => {
      if (audioRef.current) {
        const t = audioRef.current.currentTime
        setCurrentTime(t)

        // Find which evidence is active right now
        const active = allTimestamps.find(
          ev => Math.abs(ev.timestamp - t) < 3   // Within 3 seconds
        )
        setActiveEvidence(active || null)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [allTimestamps])

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progressPercent = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="audio-player">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioFile}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Waveform progress bar with timestamp markers */}
      <div className="player-bar">
        <button onClick={() => isPlaying ? audioRef.current.pause() : audioRef.current.play()}>
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div
          className="progress-track"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const ratio = (e.clientX - rect.left) / rect.width
            seekTo(ratio * duration)
          }}
        >
          {/* Progress fill */}
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />

          {/* Timestamp markers for every evidence item */}
          {allTimestamps.map((ev, i) => (
            <div
              key={i}
              className={`timestamp-marker ${activeEvidence === ev ? 'active' : ''}`}
              style={{ left: `${(ev.timestamp / duration) * 100}%` }}
              onClick={(e) => { e.stopPropagation(); seekTo(ev.timestamp) }}
              title={`${ev.dimensionName}: ${ev.text.substring(0, 60)}...`}
            />
          ))}
        </div>

        <span className="time-display">{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>

      {/* Active evidence callout — appears when playing near a flagged moment */}
      {activeEvidence && (
        <div className="evidence-callout">
          <span className="dimension-badge">{activeEvidence.dimensionName}</span>
          <span className="evidence-text">"{activeEvidence.text}"</span>
          <span className="evidence-note">{activeEvidence.note}</span>
        </div>
      )}
    </div>
  )
}
```

### Timestamp Badge — Used in Analysis Cards

```jsx
// Every evidence item renders as a clickable timestamp badge
function EvidenceBadge({ evidence, onSeek }) {
  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <button
      className="evidence-badge"
      onClick={() => onSeek(evidence.timestamp)}
      title="Jump to this moment in the audio"
    >
      <span className="timestamp">▶ {formatTime(evidence.timestamp)}</span>
      <span className="quote">"{evidence.text}"</span>
      <span className="note">{evidence.note}</span>
    </button>
  )
}
```

---

## Part 3 — Complete UI/UX Redesign

---

### Design Direction: "Precision Observatory"

The aesthetic is a **dark, instrument-grade dashboard** — like a flight simulator or medical monitor. Clean, data-dense, purposeful. Every pixel earns its place. The product handles serious professional work (teaching quality, sales performance, hiring) — the UI should feel like a trusted professional tool, not a consumer app.

```
Color palette:
  Background:    #0A0B0F  (near-black, slightly blue-shifted)
  Surface:       #111318  (card backgrounds)
  Border:        #1E2128  (subtle dividers)
  Primary:       #4F7FFF  (electric blue — actions, progress)
  Success:       #2ECC8A  (scores ≥0.7)
  Warning:       #F5A623  (scores 0.4–0.7)
  Danger:        #E85D4A  (scores <0.4)
  Text primary:  #F0F2F7
  Text muted:    #6B7280

Typography:
  Display font:  "Syne" (geometric, distinctive, modern)
  Body font:     "IBM Plex Mono" (monospace for data, scores, timestamps)
  UI font:       "Syne" for labels, "IBM Plex Mono" for values
```

---

### Page 1 — Landing / Framework Selection

The first thing a logged-in user sees. Not a dashboard — a framework picker that makes the product's versatility immediately clear.

```
┌─────────────────────────────────────────────────────┐
│  AUDIO ANALYZER                      [3/3 analyses] │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  What are you analyzing today?                      │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │    🎓    │  │    📞    │  │    🎯    │          │
│  │Classroom │  │   Sales  │  │Interview │          │
│  │Instruction  │   Call   │  │ Coaching │          │
│  │          │  │          │  │          │          │
│  │Rosenshine│  │   SPIN   │  │   STAR   │          │
│  │ 10 dims  │  │  8 dims  │  │  8 dims  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                     │
│  ┌──────────┐  ┌──────────┐                         │
│  │    🤝    │  │    🎤    │                         │
│  │  Meeting │  │  Public  │                         │
│  │Effectiveness  Speaking │                         │
│  └──────────┘  └──────────┘                         │
│                                                     │
│  ─────────────────────────────────────────────────  │
│  Recent analyses ↓                                  │
└─────────────────────────────────────────────────────┘
```

```jsx
// pages/Home.jsx
function FrameworkCard({ framework, onSelect }) {
  return (
    <button
      className="framework-card"
      onClick={() => onSelect(framework.id)}
    >
      <span className="framework-icon">{framework.icon}</span>
      <h3 className="framework-name">{framework.name}</h3>
      <p className="framework-description">{framework.description}</p>
      <span className="dimension-count">{framework.dimensions.length} dimensions</span>
    </button>
  )
}
```

---

### Page 2 — Upload Screen

After picking a framework, the user lands on a clean upload screen. No clutter — just the task.

```
┌─────────────────────────────────────────────────────┐
│  ← Back      🎓 Classroom Instruction               │
│  ─────────────────────────────────────────────────  │
│                                                     │
│                                                     │
│         ┌───────────────────────────────┐           │
│         │                               │           │
│         │         Drop audio here       │           │
│         │                               │           │
│         │    MP3 · WAV · M4A · WEBM     │           │
│         │       Max 60 min · 100MB      │           │
│         │                               │           │
│         │    [ Choose file ]            │           │
│         └───────────────────────────────┘           │
│                                                     │
│  ──── What gets analyzed ────────────────────────── │
│                                                     │
│  1. Daily Review          6. Weekly Review          │
│  2. New Material          7. Success Rate           │
│  3. Guided Practice       8. Scaffolding            │
│  4. Corrections           9. Models & Examples      │
│  5. Independent Practice 10. Engagement             │
│                                                     │
│  Quota: ●●○  2/3 analyses used · Resets in 4 days  │
│                                                     │
│  [ Start Analysis ]                                 │
└─────────────────────────────────────────────────────┘
```

```jsx
// components/UploadZone.jsx
import { useState, useCallback } from 'react'

function UploadZone({ onFileSelect }) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState(null)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) {
      setFile(dropped)
      onFileSelect(dropped)
    }
  }, [onFileSelect])

  return (
    <div
      className={`upload-zone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {file ? (
        <div className="file-preview">
          <span className="file-icon">🎵</span>
          <span className="file-name">{file.name}</span>
          <span className="file-size">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
          <button onClick={() => { setFile(null); onFileSelect(null) }}>✕ Remove</button>
        </div>
      ) : (
        <>
          <div className="upload-icon">↑</div>
          <p>Drop audio here or <label className="file-link">choose file<input type="file" accept=".mp3,.wav,.m4a,.webm,.ogg,.flac" onChange={(e) => { setFile(e.target.files[0]); onFileSelect(e.target.files[0]) }} hidden /></label></p>
          <p className="upload-hint">MP3 · WAV · M4A · WEBM · Max 60 min · 100 MB</p>
        </>
      )}
    </div>
  )
}
```

---

### Page 3 — Processing / Live Progress Screen

The user should never look at a blank spinner. Show them exactly what step is happening with a progress tracker.

```
┌─────────────────────────────────────────────────────┐
│  Analyzing: morning_class_recording.mp3             │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  ✓  Preprocessing audio (ffmpeg)         3.2s       │
│  ✓  Transcribing (AssemblyAI)            23.1s      │
│  ●  Diarizing speakers...                ━━━━━━░░   │
│  ○  Analyzing principles (Groq)                     │
│  ○  Saving results                                  │
│                                                     │
│  ──────────────────────────────────────────────     │
│  Estimated: ~25 seconds remaining                   │
│                                                     │
│  While you wait →                                   │
│  Rosenshine Principle 3: Ask more questions than    │
│  you think you need to. If >80% answer correctly,   │
│  you're moving at the right pace.                   │
└─────────────────────────────────────────────────────┘
```

```jsx
// pages/Processing.jsx
const STEPS = [
  { key: 'preprocessing', label: 'Preprocessing audio', hint: 'Compressing for analysis' },
  { key: 'transcribing',  label: 'Transcribing speech', hint: 'AssemblyAI converting audio to text' },
  { key: 'diarizing',     label: 'Identifying speakers', hint: 'Separating teacher from students' },
  { key: 'analyzing',     label: 'Analyzing framework', hint: 'Groq scoring each dimension' },
  { key: 'saving',        label: 'Saving results', hint: 'Writing to database' },
]

function ProcessingPage({ jobId }) {
  const [status, setStatus] = useState('preprocessing')
  const [elapsed, setElapsed] = useState({})

  useEffect(() => {
    const poll = setInterval(async () => {
      const res = await fetch(`/status/${jobId}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setStatus(data.status)
      if (data.status === 'complete') {
        clearInterval(poll)
        navigate(`/results/${jobId}`)
      }
      if (data.status === 'failed') {
        clearInterval(poll)
        // Show error UI
      }
    }, 3000)
    return () => clearInterval(poll)
  }, [jobId])

  const currentIndex = STEPS.findIndex(s => s.key === status)

  return (
    <div className="processing-page">
      <h2 className="processing-title">Analyzing your recording...</h2>
      <div className="step-list">
        {STEPS.map((step, i) => (
          <div
            key={step.key}
            className={`step ${i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'pending'}`}
          >
            <span className="step-indicator">{i < currentIndex ? '✓' : i === currentIndex ? '●' : '○'}</span>
            <div className="step-content">
              <span className="step-label">{step.label}</span>
              {i === currentIndex && <span className="step-hint">{step.hint}</span>}
            </div>
            {i < currentIndex && <span className="step-time">{elapsed[step.key]}s</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### Page 4 — Results Page (The Most Important Screen)

This is where everything comes together. Three-panel layout:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back   🎓 Classroom Analysis   morning_class.mp3   Nov 12, 2025     │
├──────────────────────┬─────────────────────────────────────────────────┤
│                      │                                                 │
│  OVERALL  7.2/10     │   ████████████████░░░░  Guided Practice  0.48  │
│                      │   ▶ [0:42] "Does everyone understand?"          │
│  Radar chart of      │          — Closed question, no real check       │
│  all dimensions      │   ▶ [3:17] "Good, let's move on"               │
│                      │          — Moved on without confirming          │
│  Teacher talk: 67%   │   Suggestion: Replace closed questions with     │
│                      │   "Can you explain this back to me?"            │
│  Duration: 42:18     │                                                 │
│                      │   ████████████████████░  Daily Review  0.85    │
│  ─────────────────   │   ▶ [0:05] "Yesterday we covered fractions"     │
│  Dimensions:         │          — Strong opening recall prompt         │
│                      │   ▶ [1:22] "Remember when we discussed..."      │
│  ✓ Daily Review 0.85 │                                                 │
│  ✓ New Material 0.78 │   ─────────────────────────────────────────    │
│  ● Guided Prac  0.48 │                                                 │
│  ✓ Corrections  0.71 │   [Audio Player — sticky at bottom of panel]   │
│  ● Independent  0.55 │   ▶  ──────────●──────────────────────  42:18  │
│  ...                 │   ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌      │
│                      │   (markers at 0:42, 1:22, 3:17... all evidence) │
└──────────────────────┴─────────────────────────────────────────────────┘
```

```jsx
// pages/Results.jsx
import { useState } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { AudioPlayer } from '../components/AudioPlayer'

function ResultsPage({ analysis, audioFile }) {
  const [seekTime, setSeekTime] = useState(null)

  const radarData = analysis.dimensions.map(d => ({
    dimension: d.dimension_name.split(' ')[0],   // Shortened label for radar
    score: Math.round(d.score * 10),             // 0–10 scale for display
    fullMark: 10
  }))

  const scoreColor = (score) => {
    if (score >= 0.7) return 'var(--success)'
    if (score >= 0.4) return 'var(--warning)'
    return 'var(--danger)'
  }

  return (
    <div className="results-layout">

      {/* LEFT PANEL — Summary */}
      <aside className="results-sidebar">
        <div className="overall-score">
          <span className="score-number">{(analysis.overall_score * 10).toFixed(1)}</span>
          <span className="score-label">/ 10</span>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="dimension" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <Radar dataKey="score" fill="var(--primary)" fillOpacity={0.2} stroke="var(--primary)" />
          </RadarChart>
        </ResponsiveContainer>

        <div className="meta-stats">
          <div className="stat"><span>Teacher talk</span><span>{Math.round(analysis.teacher_talk_ratio * 100)}%</span></div>
          <div className="stat"><span>Duration</span><span>{formatDuration(analysis.duration_seconds)}</span></div>
          <div className="stat"><span>Framework</span><span>{analysis.framework_name}</span></div>
        </div>

        <div className="dimension-list">
          {analysis.dimensions.map(d => (
            <button
              key={d.dimension_number}
              className="dimension-row"
              onClick={() => document.getElementById(`dim-${d.dimension_number}`).scrollIntoView({ behavior: 'smooth' })}
            >
              <span className="dim-indicator" style={{ color: scoreColor(d.score) }}>
                {d.score >= 0.7 ? '✓' : '●'}
              </span>
              <span className="dim-name">{d.dimension_name}</span>
              <span className="dim-score" style={{ color: scoreColor(d.score) }}>
                {(d.score * 10).toFixed(1)}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* RIGHT PANEL — Dimension Detail + Audio Player */}
      <main className="results-main">
        {analysis.dimensions.map(d => (
          <div key={d.dimension_number} id={`dim-${d.dimension_number}`} className="dimension-card">
            <div className="dimension-header">
              <h3>{d.dimension_name}</h3>
              <div className="score-bar">
                <div
                  className="score-fill"
                  style={{
                    width: `${d.score * 100}%`,
                    background: scoreColor(d.score)
                  }}
                />
              </div>
              <span className="score-value" style={{ color: scoreColor(d.score) }}>
                {(d.score * 10).toFixed(1)}
              </span>
            </div>

            <div className="evidence-list">
              {d.evidence.map((ev, i) => (
                <button
                  key={i}
                  className="evidence-item"
                  onClick={() => setSeekTime(ev.timestamp)}
                >
                  <span className="timestamp-badge">▶ {formatTime(ev.timestamp)}</span>
                  <div className="evidence-content">
                    <span className="evidence-quote">"{ev.text}"</span>
                    <span className="evidence-note">{ev.note}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="improvement-box">
              <span className="improvement-label">Suggestion</span>
              <p>{d.improvement_suggestion}</p>
            </div>
          </div>
        ))}
      </main>

      {/* STICKY AUDIO PLAYER — always visible at bottom */}
      <div className="player-sticky">
        <AudioPlayer
          audioFile={audioFile}
          analysisResults={analysis}
          seekTime={seekTime}
          onSeek={setSeekTime}
        />
      </div>

    </div>
  )
}
```

---

### Page 5 — History Dashboard

```jsx
// pages/History.jsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function HistoryPage({ analyses }) {
  const [selectedFramework, setSelectedFramework] = useState('all')

  const filtered = selectedFramework === 'all'
    ? analyses
    : analyses.filter(a => a.framework_id === selectedFramework)

  const chartData = filtered.map(a => ({
    date: new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    score: parseFloat((a.overall_score * 10).toFixed(1)),
    framework: a.framework_name
  }))

  return (
    <div className="history-page">
      <div className="history-header">
        <h1>Your Analyses</h1>
        <div className="framework-filter">
          {['all', ...Object.keys(FRAMEWORKS)].map(id => (
            <button
              key={id}
              className={`filter-btn ${selectedFramework === id ? 'active' : ''}`}
              onClick={() => setSelectedFramework(id)}
            >
              {id === 'all' ? 'All' : FRAMEWORKS[id]?.icon + ' ' + FRAMEWORKS[id]?.name}
            </button>
          ))}
        </div>
      </div>

      {/* Score trend chart */}
      <div className="trend-chart">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" stroke="var(--text-muted)" />
            <YAxis domain={[0, 10]} stroke="var(--text-muted)" />
            <Tooltip
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            />
            <Line dataKey="score" stroke="var(--primary)" strokeWidth={2} dot={{ fill: 'var(--primary)' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Analysis cards */}
      <div className="analysis-grid">
        {filtered.map(analysis => (
          <a key={analysis.id} href={`/results/${analysis.job_id}`} className="analysis-card">
            <div className="card-header">
              <span className="framework-icon">{FRAMEWORKS[analysis.framework_id]?.icon}</span>
              <span className="analysis-date">
                {new Date(analysis.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <div className="card-score" style={{ color: scoreColor(analysis.overall_score) }}>
              {(analysis.overall_score * 10).toFixed(1)}<span>/10</span>
            </div>
            <div className="card-filename">{analysis.filename}</div>
            <div className="card-duration">{formatDuration(analysis.duration_seconds)}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
```

---

### Global CSS — Design System

```css
/* styles/globals.css */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');

:root {
  --bg:          #0A0B0F;
  --surface:     #111318;
  --surface-2:   #181B22;
  --border:      #1E2128;
  --primary:     #4F7FFF;
  --primary-dim: #1A2D5A;
  --success:     #2ECC8A;
  --warning:     #F5A623;
  --danger:      #E85D4A;
  --text:        #F0F2F7;
  --text-muted:  #6B7280;

  --font-display: 'Syne', sans-serif;
  --font-mono:    'IBM Plex Mono', monospace;

  --radius:   8px;
  --radius-lg: 16px;
  --shadow:   0 4px 24px rgba(0,0,0,0.4);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-display);
  font-size: 15px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* Numbers and data in mono */
.score-number, .timestamp-badge, .time-display, .dim-score, .stat span:last-child {
  font-family: var(--font-mono);
}

/* Cards */
.framework-card, .dimension-card, .analysis-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  transition: border-color 0.15s, transform 0.15s;
  cursor: pointer;
}
.framework-card:hover, .analysis-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
}

/* Evidence items */
.evidence-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius);
  background: var(--surface-2);
  border: 1px solid transparent;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s;
  width: 100%;
  margin-bottom: 8px;
}
.evidence-item:hover {
  border-color: var(--primary);
}
.timestamp-badge {
  background: var(--primary-dim);
  color: var(--primary);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}
.evidence-quote { color: var(--text); font-style: italic; font-size: 14px; display: block; }
.evidence-note  { color: var(--text-muted); font-size: 12px; display: block; margin-top: 4px; }

/* Score bar */
.score-bar {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  flex: 1;
  overflow: hidden;
}
.score-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.6s ease;
}

/* Audio player sticky */
.player-sticky {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding: 12px 24px;
  z-index: 100;
}
.progress-track {
  position: relative;
  flex: 1;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  cursor: pointer;
}
.progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 2px;
  pointer-events: none;
}
.timestamp-marker {
  position: absolute;
  top: -4px;
  width: 3px;
  height: 12px;
  background: var(--warning);
  border-radius: 1px;
  transform: translateX(-50%);
  cursor: pointer;
  transition: background 0.15s;
}
.timestamp-marker.active { background: var(--primary); transform: translateX(-50%) scaleY(1.4); }
.timestamp-marker:hover  { background: var(--text); }

/* Improvement box */
.improvement-box {
  background: rgba(79, 127, 255, 0.08);
  border-left: 3px solid var(--primary);
  padding: 12px 16px;
  border-radius: 0 var(--radius) var(--radius) 0;
  margin-top: 16px;
}
.improvement-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--primary);
  font-weight: 600;
  display: block;
  margin-bottom: 6px;
}

/* Results layout */
.results-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-rows: 1fr auto;
  min-height: 100vh;
  padding-bottom: 80px;  /* Space for sticky player */
}
.results-sidebar {
  padding: 24px;
  border-right: 1px solid var(--border);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}
.results-main {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Upload zone */
.upload-zone {
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
  padding: 48px;
  text-align: center;
  transition: border-color 0.15s, background 0.15s;
  cursor: pointer;
}
.upload-zone.dragging { border-color: var(--primary); background: var(--primary-dim); }
.upload-zone.has-file { border-color: var(--success); border-style: solid; }

/* Quota badge */
.quota-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
  color: var(--text-muted);
}
.dot-used  { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--primary); margin: 0 2px; }
.dot-free  { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--border); margin: 0 2px; }
```

---

## Summary

### New Features Added
| Feature | Detail |
|---|---|
| Framework selector | 5 use cases, each with full prompt + dimensions |
| Timestamped evidence | Every score backed by clickable audio moments |
| Sticky audio player | Fixed at screen bottom, always accessible |
| Timestamp markers | Visual dots on progress bar for every flagged moment |
| Active evidence callout | Highlights current moment as audio plays |
| Live progress screen | Step-by-step status during processing |
| Score color system | Green/amber/red based on threshold |
| Radar chart | Per-session dimension breakdown |
| History trend line | Score over time per framework |

### Resume Bullet Addition
> *"Extended AudioAnalyzer into a multi-framework coaching platform supporting 5 professional use cases (teaching, sales, interviews, meetings, public speaking) with a pluggable prompt architecture, timestamped evidence linked to a sticky audio player with scrubable progress bar markers, and a precision observatory dark UI built with Syne + IBM Plex Mono typography."*
