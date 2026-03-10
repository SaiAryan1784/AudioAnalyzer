"""
STAR Method Interview Coaching framework.
8 dimensions for evaluating behavioural interview responses.
"""

from app.frameworks.base import Dimension, AnalysisFramework, register

register(AnalysisFramework(
    id="interview_star",
    name="Interview Coaching (STAR)",
    description="Evaluate candidate or self-practice interview responses",
    icon="🎯",
    target_speaker="candidate",
    speakers_expected=2,
    dimensions=[
        Dimension(number=1, name="Situation Clarity", description="Candidate sets up context concisely and specifically", good_example="Clear, specific situation established in 1–2 sentences with enough context", bad_example="Rambling or vague background that never grounds the listener in a real scenario"),
        Dimension(number=2, name="Task Definition", description="Clearly states their personal role and responsibility", good_example="'I was responsible for leading the migration across 3 teams'", bad_example="Unclear what they personally owned versus what the team did collectively"),
        Dimension(number=3, name="Action Specificity", description="Describes concrete steps taken with reasoning", good_example="'First I mapped all dependencies, then I scheduled daily syncs with each team lead to unblock...'", bad_example="'We just kind of figured it out' — no specific actions described"),
        Dimension(number=4, name="Result Quantification", description="States outcomes with measurable data where possible", good_example="'Reduced deployment time by 40%, saving the team ~$20k/quarter in engineering overhead'", bad_example="'It went well' or 'the project was a success' with no concrete metrics"),
        Dimension(number=5, name="Conciseness", description="Answer is tight and structured, ideally 90–150 seconds", good_example="Covers all STAR elements clearly within 2 minutes with no tangents", bad_example="Exceeds 3+ minutes, loses focus, goes on tangents unrelated to the question"),
        Dimension(number=6, name="Confidence & Delivery", description="Speaks with clarity and minimal filler words", good_example="Steady pace, clear articulation, pauses used purposefully, <5 filler words per minute", bad_example="Excessive 'um', 'like', 'you know', 'basically' — undermines credibility"),
        Dimension(number=7, name="Question Relevance", description="Answer directly addresses what was actually asked", good_example="Example chosen is directly and specifically relevant to the question's theme", bad_example="Generic or pre-prepared answer that doesn't map to what was specifically asked"),
        Dimension(number=8, name="Reflection & Growth", description="Shows self-awareness and learning from the experience", good_example="'What I'd do differently is...' or 'That taught me to...' — genuine insight", bad_example="No insight or self-awareness; candidate treats the story as purely flattering with no growth angle"),
    ],
    system_prompt="""You are an expert interview coach with 15+ years developing candidates for top-tier tech, consulting, and finance firms. You have deep expertise in STAR method behavioural interviews.

TASK: Analyze this diarized interview transcript. Identify the candidate and the interviewer. Score each of the 8 STAR dimensions from 0.0 to 1.0.

SPEAKER IDENTIFICATION:
- The candidate is the person answering questions about their experience. They typically use past-tense storytelling ("I was...", "We needed to...", "The result was...").
- The interviewer asks questions and may provide prompts ("Can you tell me about a time...", "What happened next?").
- If only one speaker is present (self-practice recording): score all observable dimensions, note the absence of an interviewer, and mark P7 (Question Relevance) as Not Applicable (score 0.5) if no question was asked.
- If the recording is a panel interview (multiple interviewers): identify the candidate as the single respondent; treat all interviewer turns combined as the interviewer side.

SCORING RULES:
- 0.0: Completely absent. 0.1–0.3: Present but severely underdeveloped. 0.4–0.6: Partial — has the element but it's weak or inconsistent. 0.7–0.85: Good — clear presence with minor gaps. 0.9–1.0: Excellent, crisp, no material gaps.
- Filler word counting: Count "um", "uh", "like" (used as filler), "you know", "basically", "kind of", "sort of" across the candidate's entire response. Report total count and per-minute rate in the improvement suggestion for P6.
- Conciseness (P5): Estimate duration from transcript timestamps. <90s → 0.6 (possibly under-answered), 90–150s → 1.0, 150–200s → 0.7, 200–240s → 0.5, >240s → 0.2.

EVIDENCE REQUIREMENTS:
- For each dimension, quote 2–4 specific moments from the candidate's speech with timestamps.
- Include: exact text, timestamp (seconds), speaker label ("A" or "B"), one-sentence note.
- Do NOT quote the interviewer's question as evidence for a candidate dimension — only quote the candidate.
- For P6, include a tally of filler words found (e.g., "6 'um' instances detected across the response").

EDGE CASES:
- Multi-question session (more than one interview question answered): Score each dimension across ALL answers holistically. Note how many questions were answered.
- Follow-up / probing questions from interviewer: If the interviewer had to probe heavily for details (e.g., "Can you be more specific?", "What was YOUR role exactly?"), this is negative evidence for P2/P3 — flag it.
- Technical interview questions mixed with behavioural: Focus scoring only on the behavioural/STAR portions. Note if the recording is partly technical.
- Candidate switches examples mid-answer: Flag this as a P1/P5 issue — note the switch and its impact.
- Candidate uses hypothetical ("I would...") instead of real past experience: Flag as a P1/P2 failure — score P1 0.0 and note that STAR requires real past examples.
- Very short answers (<45 seconds): Score P5 as 0.4 (likely under-answering), flag potential failure to demonstrate depth.
- Candidate explicitly says "I don't have an example for that": Score P7 0.0, note this directly.
- Nervous disfluency vs. habitual filler: If fillers cluster at the start and then reduce, it may be nerves rather than habit — note this distinction in P6.

FLAG: Note these specific moments explicitly in the evidence:
- Candidate says "we" when asked what THEY did (ownership ambiguity — P2 red flag)
- Candidate quantifies a result (P4 positive — capture exact metric quoted)
- Candidate contradicts themselves (e.g., says project succeeded then mentions it was cancelled)
- Interviewer had to repeat or rephrase the question (P7 negative signal)

OUTPUT: Return ONLY valid JSON — no markdown, no preamble.
{
  "overall_score": float,
  "dominant_speaker": string (the candidate's speaker label, e.g. "A"),
  "teacher_talk_ratio": float (candidate's share of total speaking time, 0.0–1.0),
  "summary": string (3–4 sentences: question(s) asked, overall STAR quality, top strength, most critical improvement area),
  "dimensions": [
    {
      "dimension_number": int,
      "dimension_name": string,
      "score": float,
      "evidence": [
        {"text": string, "timestamp": float, "speaker": string, "note": string}
      ],
      "improvement_suggestion": string (specific to what was actually said — include filler word count for P6)
    }
  ]
}""",
    example_use="Record yourself answering interview questions to get STAR method coaching and filler word analysis."
))
