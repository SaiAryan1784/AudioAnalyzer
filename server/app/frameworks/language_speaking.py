"""
Language Speaking Practice framework for ESL teachers, speaking coaches, and learners.
6 dimensions evaluating pronunciation, fluency, vocabulary, grammar, and confidence.
"""

from app.frameworks.base import Dimension, AnalysisFramework, register

register(AnalysisFramework(
    id="language_speaking",
    name="Language Speaking Practice",
    description="Evaluate spoken English fluency, grammar, and pronunciation for learners",
    icon="🌐",
    target_speaker="learner",
    speakers_expected=2,
    dimensions=[
        Dimension(number=1, name="Pronunciation Clarity", description="Words are articulated clearly and accurately; minimal phoneme substitutions that impede comprehension", good_example="Clear consonant and vowel sounds; word endings pronounced; natural word stress", bad_example="Frequent consonant cluster reduction, dropped word endings, or stress patterns that distort meaning"),
        Dimension(number=2, name="Vocabulary Range", description="Learner uses varied, contextually appropriate vocabulary rather than repeating basic words", good_example="Employs precise vocabulary for the topic; paraphrases naturally when a word is unavailable", bad_example="Relies on a narrow set of high-frequency words; avoids complex sentences due to vocabulary gaps"),
        Dimension(number=3, name="Grammar Accuracy", description="Sentence structures are grammatically correct; verb tenses, articles, and prepositions used appropriately", good_example="Subject-verb agreement maintained; correct use of past/present/future tense; articles (a/the) used correctly", bad_example="Systematic tense errors, missing articles, incorrect prepositions, or broken sentence structure"),
        Dimension(number=4, name="Fluency & Pacing", description="Speech flows smoothly without excessive pausing, reformulation, or breakdown in communication", good_example="Natural pause before complex ideas; repairs are quick and smooth; maintains conversational momentum", bad_example="Long hesitation gaps, frequent false starts, or communication breakdowns that impede the exchange"),
        Dimension(number=5, name="Confidence & Intonation", description="Learner speaks with appropriate confidence and uses natural intonation patterns (not flat or overly monotone)", good_example="Rising intonation on questions; varied pitch to signal enthusiasm or emphasis; comfortable silence", bad_example="Flat, robotic intonation throughout; very quiet delivery; excessive apologetic phrases ('sorry, my English...')"),
        Dimension(number=6, name="Comprehensibility", description="Overall — could a native speaker understand this learner without significant effort?", good_example="Listener can follow all key points without needing to ask for repetition; accent is present but not distracting", bad_example="Significant misunderstandings due to pronunciation or grammar; native listener would frequently need clarification"),
    ],
    system_prompt="""You are a certified English language examiner (IELTS, CELPIP) and speaking coach with expertise in second-language acquisition. You evaluate spoken English at all proficiency levels (A1–C2).

TASK: Analyze this diarized conversation or speaking practice transcript. Identify the learner and, if present, the teacher/interviewer/interlocutor. Score each of the 6 dimensions from 0.0 to 1.0 based ONLY on the learner's speech.

SPEAKER IDENTIFICATION:
- The learner is typically less fluent, may hesitate more, and is responding to prompts.
- The teacher/interviewer guides the conversation and asks questions.
- If only one speaker (monologue practice): evaluate that single speaker on all dimensions.

SCORING CALIBRATION (CEFR approximate alignment):
- 0.0–0.2: Pre-A1/A1 — Very limited. 0.2–0.4: A2 — Basic. 0.4–0.6: B1 — Intermediate. 0.6–0.75: B2 — Upper-intermediate. 0.75–0.9: C1 — Advanced. 0.9–1.0: C2 — Near-native.

SCORING RULES:
- Evaluate the learner ONLY — do not score the teacher/native speaker.
- Be constructive, not harsh — the goal is to motivate improvement.
- Note the learner's L1 background if detectable from the errors (e.g., Spanish speakers often drop articles, Mandarin speakers may omit -s/-ed endings).
- Grammar: Distinguish between systematic errors (recurring pattern = significant issue) and incidental errors (one-off slips = minor).
- Fluency: Note if pauses are for thinking (cognitive) vs. for searching for words (lexical gap) — the former is less penalised.

EVIDENCE REQUIREMENTS:
- Quote specific learner utterances (not the teacher's speech) with timestamps.
- For pronunciation (P1): note specific phonemes or words that are unclear.
- For grammar (P3): quote the error and provide the corrected form in the note.
- For vocabulary (P2): note both strong word choices and gaps.

OUTPUT: Return ONLY valid JSON.
{
  "overall_score": float,
  "dominant_speaker": string (learner),
  "teacher_talk_ratio": float (learner talk ratio — how much the learner spoke vs total),
  "summary": string (3–4 sentences: estimated CEFR level, strengths, 2 priority areas to improve, one specific actionable tip),
  "dimensions": [
    {
      "dimension_number": int,
      "dimension_name": string,
      "score": float,
      "evidence": [{"text": string, "timestamp": float, "speaker": string, "note": string}],
      "improvement_suggestion": string (specific and actionable, not generic)
    }
  ]
}""",
    example_use="Upload a speaking practice recording or language tutoring session to get proficiency-level feedback, grammar analysis, and pronunciation coaching."
))
