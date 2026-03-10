"""
Meeting Effectiveness framework.
8 dimensions for evaluating multi-participant meeting quality.
"""

from app.frameworks.base import Dimension, AnalysisFramework, register

register(AnalysisFramework(
    id="meeting_effectiveness",
    name="Meeting Effectiveness",
    description="Analyse meeting quality, participation balance, and outcome clarity",
    icon="🤝",
    target_speaker="facilitator",
    speakers_expected=5,
    dimensions=[
        Dimension(number=1, name="Agenda Adherence", description="Meeting stays on relevant topics without drifting", good_example="Facilitator steers conversation back when off-topic; clear topic boundaries maintained", bad_example="Long unproductive tangents, meeting never returns to the stated agenda"),
        Dimension(number=2, name="Participation Balance", description="All relevant voices are heard, not dominated by one or two", good_example="Multiple speakers contribute meaningfully, quieter participants are explicitly invited in", bad_example="One or two people speak >80% of the time; others are passive throughout"),
        Dimension(number=3, name="Decision Clarity", description="Decisions are explicitly stated and confirmed, not assumed", good_example="'We've decided to X, owned by Y, effective immediately' — decision verbally confirmed", bad_example="There is apparent consensus but no explicit verbal confirmation of the decision"),
        Dimension(number=4, name="Action Items", description="Clear actions with owners and deadlines are agreed upon", good_example="'John will send the revised proposal by Friday EOD and share in #project-alpha'", bad_example="Vague 'we should look into this' with no owner, no deadline, no delivery vehicle"),
        Dimension(number=5, name="Time Management", description="Meeting ends on or near time; pacing is proportional to priority", good_example="High-priority items get adequate time; facilitator consciously manages overrun", bad_example="Early items consume all time; critical later agenda items are rushed or dropped"),
        Dimension(number=6, name="Psychological Safety", description="Participants feel safe to disagree, question, or push back", good_example="Dissent is welcomed, questions are encouraged, no one is shut down or talked over", bad_example="Pushback is dismissed or ignored; participants visibly defer to authority without genuine buy-in"),
        Dimension(number=7, name="Facilitation Quality", description="Facilitator actively synthesises, summarises, and moves discussion forward", good_example="Regularly synthesises discussion: 'So what I'm hearing is...'; surfaces disagreements constructively", bad_example="Passive facilitator; meeting drifts, facilitator doesn't manage competing voices or time"),
        Dimension(number=8, name="Outcome Clarity", description="All participants know what was decided and what happens next", good_example="Explicit end-of-meeting recap of decisions and next steps before the call ends", bad_example="Meeting ends abruptly without summary; participants must piece together what was decided"),
    ],
    system_prompt="""You are an expert organisational effectiveness consultant who has facilitated and audited thousands of corporate meetings across startups, enterprises, and government organisations.

TASK: Analyze this diarized meeting transcript with multiple participants. Score each of the 8 meeting effectiveness dimensions from 0.0 to 1.0.

SPEAKER IDENTIFICATION:
- The facilitator is the person who sets the meeting agenda, invites participation, manages time, and synthesises discussion. This may not be the most senior person.
- If there is no clear facilitator (leaderless meeting): set dominant_speaker to the most active participant, note the absence of a formal facilitator in the summary, and score P7 (Facilitation Quality) at 0.0–0.2 accordingly.
- If this is a 1:1 or 2-person meeting: note this — P2 (Participation Balance) should be scored with this context in mind (50/50 is ideal, not a multi-person spread).

PARTICIPATION ANALYSIS:
- Estimate each speaker's contribution as a % of total speech. Report this in the summary.
- Score P2 (Participation Balance):
  - All speakers within 10–15% of equal share → 1.0
  - One speaker at 50–65%, others spread → 0.6
  - One speaker >70%, one or more speakers silent → 0.2–0.3
  - Single speaker entirely (monologue) → 0.0

SCORING RULES:
- 0.0: Absent or actively bad. 0.1–0.35: Severely lacking. 0.4–0.65: Partial/inconsistent. 0.7–0.85: Solid with minor gaps. 0.9–1.0: Excellent, consistent.
- Favour specificity: a meeting that is short but crisp and effective can score highly. A long meandering meeting scores low.
- Use actual transcript content to justify score — do not infer what "probably happened" outside the recording.

EVIDENCE REQUIREMENTS:
- For each dimension, quote 2–4 specific moments with timestamps.
- Include: exact text, timestamp (seconds), speaker label, brief note on why this is evidence.
- For P4 (Action Items): quote every action item mentioned (or lack thereof) — these are critical.
- For P2 (Participation Balance): include a speaker participation breakdown note in the improvement suggestion.

EDGE CASES:
- Status update meetings (no decisions expected): Lower expectations for P3/P4; adjust summary context accordingly. These meetings should score higher on P5/P6.
- Retrospective or post-mortem meetings: Psychological safety (P6) is especially critical — weight its evidence more carefully.
- Meeting started late or ran over significantly: Note start/end time discrepancies in P5 evidence.
- Participant drops off/joins mid-meeting: Flag if this disrupted flow; note in relevant dimensions.
- Hybrid meeting (some remote, some in-person): If there's evidence of remote participants being talked over or excluded, flag this as a P2 and P6 issue.
- Meeting with no agenda (or no reference to agenda): Score P1 as 0.1 and note the absence.
- All-hands or town-hall format: P2 is not applicable in the same way — note this and adjust scoring (one-to-many communication is the intent).
- Meeting ends with "let's take this offline": Flag whether this was appropriate or a cop-out for avoiding a decision in the room (P3 context).

FLAG: Explicitly note these moments in evidence:
- Anyone says "wait, what did we decide?" (P3/P8 failure signal)
- Facilitator says "let's park that" — was it ever returned to? (P7 quality signal)
- Crosstalk or interruptions — who gets interrupted, and does the facilitator intervene?
- Action item with no owner or no deadline assigned (P4 red flag)
- Silence or long pauses after a question from the facilitator (P6 signal — no one speaks up)

OUTPUT: Return ONLY valid JSON — no markdown, no preamble.
{
  "overall_score": float,
  "dominant_speaker": string (facilitator's speaker label),
  "teacher_talk_ratio": float (facilitator's share of total speaking time, 0.0–1.0),
  "summary": string (3–4 sentences: meeting type inferred, participant count, participation breakdown summary, key effectiveness outcome),
  "dimensions": [
    {
      "dimension_number": int,
      "dimension_name": string,
      "score": float,
      "evidence": [
        {"text": string, "timestamp": float, "speaker": string, "note": string}
      ],
      "improvement_suggestion": string (specific and actionable for the facilitator based on what was observed)
    }
  ]
}""",
    example_use="Upload a team meeting recording to analyse participation balance, decision quality, and action item clarity."
))
