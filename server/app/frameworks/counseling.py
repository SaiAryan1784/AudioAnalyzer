"""
Therapy / Counseling Session framework for clinical supervisors and training programs.
6 dimensions evaluating therapeutic alliance, reflective listening, empathy, and clinical technique.

Privacy note: Audio files are deleted immediately after processing. No session content is stored.
"""

from app.frameworks.base import Dimension, AnalysisFramework, register

register(AnalysisFramework(
    id="counseling",
    name="Therapy / Counseling Session",
    description="Evaluate therapeutic technique, empathy, and alliance for clinical supervisors",
    icon="🧠",
    target_speaker="therapist",
    speakers_expected=2,
    dimensions=[
        Dimension(number=1, name="Therapeutic Alliance", description="Therapist establishes and maintains a warm, trusting, collaborative relationship with the client", good_example="Therapist validates the client's experience, uses their name, references prior sessions, and communicates genuine care", bad_example="Therapist is detached, moves quickly past emotional disclosures, or maintains an overly clinical transactional tone"),
        Dimension(number=2, name="Reflective Listening", description="Therapist reflects content and emotion accurately, demonstrating full understanding of the client's experience", good_example="'It sounds like underneath the frustration with your boss, there's a deeper fear that you're not valued. Is that right?'", bad_example="Simple paraphrasing without emotional depth; therapist repeats words but doesn't capture the emotional undercurrent"),
        Dimension(number=3, name="Empathic Accuracy", description="Therapist accurately identifies and names the client's emotional state and validates it without minimising or over-dramatising", good_example="'That sounds incredibly lonely — to feel like no one in your family really understands what you're carrying.'", bad_example="Missing the emotional subtext entirely, or naming the wrong emotion, leading the client to feel misunderstood"),
        Dimension(number=4, name="Pacing & Silence Use", description="Therapist allows appropriate silences, doesn't rush to fill space, and paces the session to client's needs", good_example="Therapist allows 5–10 seconds of silence after a significant disclosure before responding; doesn't interrupt processing", bad_example="Immediately fills every silence with a question or statement; rushes past meaningful moments that need space"),
        Dimension(number=5, name="Goal Clarity", description="Session maintains a clear therapeutic focus aligned to client goals; interventions are purposeful and coherent", good_example="Therapist gently brings the conversation back to the agreed therapeutic goal when it drifts; links current material to treatment plan", bad_example="Session feels unfocused; topic jumps without clinical purpose; no clear thread connecting the session to treatment goals"),
        Dimension(number=6, name="Non-Judgmental Stance", description="Therapist communicates unconditional positive regard; client's experiences are accepted without evaluation or advice-giving", good_example="Therapist explores ambivalence without steering; accepts contradictions; avoids 'you should' language", bad_example="Subtle value judgements, unsolicited advice, normalising in a way that dismisses the client's unique experience"),
    ],
    system_prompt="""You are a licensed clinical supervisor (LPC, LCSW) with expertise in person-centred, CBT, and psychodynamic modalities. You provide formative supervision feedback to therapists-in-training.

IMPORTANT PRIVACY NOTICE: You are analyzing a clinical training or supervision recording. The content is confidential. Do not include any personally identifying information in your output. Focus only on the therapist's technique and communication — not on the clinical content or the client's presenting issues.

TASK: Analyze this diarized therapy session transcript. Identify the therapist and client. Score each of the 6 dimensions from 0.0 to 1.0 based ONLY on the therapist's clinical technique.

SPEAKER IDENTIFICATION:
- The therapist typically asks open-ended questions, reflects, and guides the therapeutic process.
- The client shares personal experiences, feelings, and challenges.
- If unclear: identify the more question-asking, structuring speaker as the therapist.

SCORING RULES:
- 0.0: Completely absent. 0.1–0.3: Significant concern — needs immediate attention in supervision. 0.4–0.6: Developing — present but inconsistent. 0.7–0.85: Competent — good application with minor gaps. 0.9–1.0: Excellent — consistent, skillful, adaptive.
- Frame feedback developmentally — assume this may be a trainee. Language should be supportive and growth-oriented.
- If this is clearly an experienced therapist: raise the bar for 'excellent' accordingly.
- Never comment on the appropriateness of the client's disclosures or clinical content beyond how the therapist responded.

EVIDENCE REQUIREMENTS:
- Quote the THERAPIST's responses only (not the client's disclosures).
- For each dimension, provide 2–3 therapist utterances with timestamps and notes explaining the clinical significance.
- Frame negative evidence as 'missed opportunities' rather than errors.

IMPORTANT: The output summary and improvement suggestions must focus exclusively on therapist technique and clinical skill — not on the client's issues, diagnosis, or personal content.

OUTPUT: Return ONLY valid JSON.
{
  "overall_score": float,
  "dominant_speaker": string (client — clients typically speak more in therapy),
  "teacher_talk_ratio": float (therapist talk ratio — therapists should typically speak <40% of session time),
  "summary": string (3–4 sentences: session type/modality if detectable, therapist strengths, 2 development areas, one specific supervision recommendation — NO client identifying details),
  "dimensions": [
    {
      "dimension_number": int,
      "dimension_name": string,
      "score": float,
      "evidence": [{"text": string, "timestamp": float, "speaker": string, "note": string}],
      "improvement_suggestion": string (developmentally framed, specific to what was observed)
    }
  ]
}""",
    example_use="Upload a clinical supervision or training session recording to get therapist technique scores, reflective listening analysis, and formative feedback."
))
