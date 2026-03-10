"""
Rosenshine's Principles of Instruction framework.
10 principles for evaluating classroom teaching quality.
"""

from app.frameworks.base import Dimension, AnalysisFramework, register

register(AnalysisFramework(
    id="rosenshine",
    name="Classroom Instruction",
    description="Evaluate teaching quality against Rosenshine's 10 Principles",
    icon="🎓",
    target_speaker="teacher",
    speakers_expected=2,
    dimensions=[
        Dimension(number=1, name="Daily Review", description="Teacher reviews previous learning at session start", good_example="Opens class recapping last lesson's key points with targeted questions", bad_example="Jumps straight to new material with no reference to prior learning"),
        Dimension(number=2, name="New Material Presentation", description="Presents new content in small, manageable steps", good_example="Breaks complex concepts into digestible sub-steps with clear transitions", bad_example="Overwhelms students with too much information at once, no chunking"),
        Dimension(number=3, name="Guided Practice", description="Uses targeted questions to check understanding during instruction", good_example="Asks specific 'why' and 'how' questions frequently to multiple students", bad_example="Asks 'Does everyone understand?' and moves on without verifying comprehension"),
        Dimension(number=4, name="Corrections & Feedback", description="Responds to errors clearly and constructively", good_example="Addresses misconceptions directly, reteaches when needed, acknowledges effort", bad_example="Ignores wrong answers, moves on too quickly, or embarrasses students"),
        Dimension(number=5, name="Independent Practice", description="Students work independently to consolidate learning", good_example="Assigns focused tasks that students attempt individually with appropriate challenge", bad_example="No independent work is ever provided during the session"),
        Dimension(number=6, name="Weekly/Monthly Review", description="Revisits content from prior weeks/months intentionally", good_example="Explicitly connects current lesson to material from prior weeks", bad_example="Never references or uses content from previous units"),
        Dimension(number=7, name="Student Success Rate", description="Students understand at a high rate (>80% correct)", good_example="Class answers comprehension checks correctly at least 80% of the time", bad_example="Frequent confusion, many wrong answers go unaddressed"),
        Dimension(number=8, name="Scaffolding", description="Teacher provides structured support before releasing independence", good_example="Offers hints, partial examples, and worked models before asking students to try", bad_example="Either gives the full answer immediately or ignores student struggles"),
        Dimension(number=9, name="Models & Examples", description="Teacher demonstrates thinking and worked examples explicitly", good_example="Thinks aloud step-by-step through a problem before expecting students to practice", bad_example="No worked demonstration before student independent practice begins"),
        Dimension(number=10, name="Student Engagement", description="Students are actively and consistently engaged throughout", good_example="High participation, many students volunteer, varied interaction modes", bad_example="Teacher talks to silence, no student interaction, passive audience"),
    ],
    system_prompt="""You are an expert evaluator certified in Rosenshine's Principles of Instruction with deep classroom observation experience.

TASK: Analyze the diarized classroom transcript below. Score each of the 10 Rosenshine Principles from 0.0 to 1.0.

SPEAKER IDENTIFICATION:
- Identify which speaker is the teacher. The teacher typically leads instruction, asks most questions, and speaks for longer uninterrupted turns.
- If you cannot clearly identify a teacher (e.g., the recording is one speaker only, or all speakers seem like peers), set dominant_speaker to the most instructional speaker and note this ambiguity in the summary.
- If only one speaker exists: score based on what is observable; mark student-interaction principles (P3, P5, P7, P10) as 0.1–0.3 with a note that no student speech was detected.

SCORING RULES:
- Score must be 0.0–1.0 (two decimal places max). Do not cap at round numbers; use granular scores like 0.67.
- A principle with ZERO evidence scores 0.0. A principle with strong consistent evidence scores 0.85–1.0. Partial or inconsistent evidence scores 0.4–0.69.
- If a principle is simply not applicable to the session type (e.g., no review is possible because this is the first recorded lesson), score 0.3 and note this.
- Calculate teacher_talk_ratio as teacher speaking time / total speaking time (0.0–1.0). If only one speaker, it is 1.0.

EVIDENCE REQUIREMENTS:
- For each principle, provide 2–4 specific moments from the transcript.
- Each moment must include: the exact quoted text from the speaker, the timestamp in seconds (from the segment start times), the speaker label ("A", "B", etc.), and a one-sentence note explaining WHY this is evidence for that principle.
- Evidence must be actual quotes — never paraphrase or invent quotes.
- If there is no direct evidence for a principle, still include 1 moment showing what was ABSENT (e.g., the point where review could have happened but didn't).

EDGE CASES:
- Very short recordings (<5 min): Score only observable principles; add a note in the summary that short duration limits evaluation.
- Noisy/fragmentary transcripts (many [inaudible] or unclear segments): Lower confidence scores by 0.1–0.15 and note transcript quality issues.
- Multiple teachers: Identify the primary instructor and note multi-teacher context in summary.
- Non-English content partially transcribed: Note language detection issues, score what is observable.
- Single speaker (no diarization): Set speakers_expected note in summary, score P3/P5/P7/P10 conservatively.

OUTPUT: Return ONLY valid JSON — no markdown code fences, no preamble, no comments.
{
  "overall_score": float,
  "dominant_speaker": string,
  "teacher_talk_ratio": float,
  "summary": string (3–4 sentences covering strengths, weaknesses, and session context),
  "dimensions": [
    {
      "dimension_number": int,
      "dimension_name": string,
      "score": float,
      "evidence": [
        {"text": string, "timestamp": float, "speaker": string, "note": string}
      ],
      "improvement_suggestion": string (specific and actionable, not generic)
    }
  ]
}""",
    example_use="Upload a classroom recording to evaluate teaching quality against evidence-based instruction principles."
))
