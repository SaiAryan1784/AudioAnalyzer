"""
Podcast Episode framework for content creators and speaking coaches.
6 dimensions evaluating hook, pacing, storytelling, and audience engagement.
"""

from app.frameworks.base import Dimension, AnalysisFramework, register

register(AnalysisFramework(
    id="podcast",
    name="Podcast Episode",
    description="Analyze engagement, storytelling, and delivery for podcast creators",
    icon="🎙",
    target_speaker="host",
    speakers_expected=2,
    dimensions=[
        Dimension(number=1, name="Hook Strength", description="Opening 60–90 seconds creates a compelling reason to keep listening", good_example="'By the end of this episode, you'll know the one counterintuitive reason most startups fail at product-market fit — and it's not what you think.'", bad_example="Opens with 3 minutes of sponsor reads, guest bio recitation, or generic pleasantries before any compelling content"),
        Dimension(number=2, name="Content Pacing", description="Episode maintains appropriate energy and information density; avoids tangents and dead air", good_example="Smooth transitions between topics, host steers back when conversation drifts, natural pauses feel intentional not awkward", bad_example="Long unrelated tangents, extended filler ('umm', 'like', 'you know'), or monotone delivery throughout"),
        Dimension(number=3, name="Guest Engagement", description="Host draws out the best from the guest: asks follow-up questions, gives space to elaborate, and avoids steamrolling", good_example="Host notices an interesting thread and pivots: 'Wait — you mentioned that briefly, I want to dig into that more...'", bad_example="Host sticks rigidly to prepared questions, interrupts the guest's best answers, or monologues instead of listening"),
        Dimension(number=4, name="Storytelling", description="Information is framed through compelling narrative, anecdote, and concrete example rather than abstract claims", good_example="Guest uses a specific story with stakes, tension, and resolution to illustrate a point", bad_example="All claims are abstract ('this is really important') with no concrete examples, stories, or data to ground them"),
        Dimension(number=5, name="Filler Word Control", description="Host and guest communicate with minimal verbal filler (um, uh, like, you know, sort of)", good_example="Clean, confident delivery; occasional pauses used intentionally for effect", bad_example="Heavy filler usage degrades perceived expertise and comprehension; more than 3–4 fillers per minute is a concern"),
        Dimension(number=6, name="CTA Clarity", description="Episode closes with a clear, specific call to action for the audience", good_example="'Subscribe wherever you listen, and if you got value from this, share it with one person who you think would benefit — that's how we grow.'", bad_example="Vague close with no specific action, or CTA buried and delivered without energy"),
    ],
    system_prompt="""You are a podcast production coach and content strategist who has produced 500+ episodes across interview, narrative, and solo formats.

TASK: Analyze this diarized podcast episode transcript. Identify the host and guest(s). Score each of the 6 dimensions from 0.0 to 1.0.

SPEAKER IDENTIFICATION:
- The host typically introduces the episode, welcomes the guest, and guides the conversation.
- Guests are introduced by the host and share expertise, stories, or opinions.
- Solo episodes: Score guest-dependent dimensions (P3: Guest Engagement) against how well the host engages the imagined audience (energy, direct address, rhetorical questions).

SCORING RULES:
- 0.0: Completely absent. 0.1–0.3: Weak. 0.4–0.6: Developing. 0.7–0.85: Strong. 0.9–1.0: Excellent.
- Filler word scoring (P5): Count fillers per minute from the transcript. >6/min → 0.2, 4–6/min → 0.4, 2–4/min → 0.6, 1–2/min → 0.8, <1/min → 1.0. Report the estimated rate in the improvement suggestion.
- Hook scoring (P1): If the first 2 minutes is heavy with ads, bio, or pleasantries before substance, cap score at 0.5.
- Adjust for format: narrative/story podcasts have different pacing expectations than interview podcasts.

EVIDENCE REQUIREMENTS:
- For each dimension, provide 2–3 direct quotes with timestamps, speaker label, and a one-sentence explanation.
- For P5 (fillers), quote specific filler-heavy passages as evidence.

OUTPUT: Return ONLY valid JSON.
{
  "overall_score": float,
  "dominant_speaker": string (host),
  "teacher_talk_ratio": float (host talk ratio),
  "summary": string (3–4 sentences: episode format, strengths, key gaps, top recommendation),
  "dimensions": [
    {
      "dimension_number": int,
      "dimension_name": string,
      "score": float,
      "evidence": [{"text": string, "timestamp": float, "speaker": string, "note": string}],
      "improvement_suggestion": string
    }
  ]
}""",
    example_use="Upload a podcast episode recording to get engagement scores, pacing analysis, and production coaching feedback."
))
