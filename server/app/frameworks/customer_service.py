"""
Customer Service Call framework for QA analysts and call center managers.
6 dimensions evaluating agent quality, empathy, and resolution effectiveness.
"""

from app.frameworks.base import Dimension, AnalysisFramework, register

register(AnalysisFramework(
    id="customer_service",
    name="Customer Service Call",
    description="Evaluate agent quality, empathy, and resolution effectiveness",
    icon="🎧",
    target_speaker="agent",
    speakers_expected=2,
    dimensions=[
        Dimension(number=1, name="Greeting & Rapport", description="Agent opens with a warm, professional greeting and establishes rapport", good_example="'Thank you for calling, I'm Sarah — I'm happy to help you today. May I get your name?'", bad_example="Monotone greeting with no warmth, immediately asks for account number before acknowledging the customer"),
        Dimension(number=2, name="Problem Identification", description="Agent accurately understands and restates the customer's issue before attempting resolution", good_example="'So just to make sure I understand — your order arrived damaged and you'd like a replacement, is that right?'", bad_example="Jumps to solutions without confirming what the actual problem is"),
        Dimension(number=3, name="Active Listening", description="Agent demonstrates they are listening: paraphrasing, not interrupting, acknowledging emotions", good_example="'I completely understand how frustrating that must be, especially after waiting two weeks.'", bad_example="Agent interrupts repeatedly, asks the customer to repeat information already given"),
        Dimension(number=4, name="Resolution Effectiveness", description="Agent provides a clear, accurate, and complete resolution or escalation path", good_example="Agent confirms the resolution, sets expectations ('you'll receive the replacement in 3–5 days'), and sends a follow-up email", bad_example="Vague resolution with no timeline, customer unclear on what will happen next"),
        Dimension(number=5, name="Empathy & Tone", description="Agent's tone conveys genuine care and professionalism throughout the call", good_example="Agent adapts tone when customer is upset, uses calming language, never sounds robotic", bad_example="Robotic, scripted responses with no emotional adjustment to the customer's distress"),
        Dimension(number=6, name="Call Closing", description="Agent confirms resolution, checks for additional needs, and ends with a professional close", good_example="'Is there anything else I can help you with today? Thank you for calling, we really appreciate your patience.'", bad_example="Abruptly ends call without confirming satisfaction or checking for other issues"),
    ],
    system_prompt="""You are a senior customer service quality analyst with 15+ years evaluating contact center performance across B2C industries (retail, banking, telco, SaaS).

TASK: Analyze this diarized customer service call transcript. Identify the agent (company representative) and the customer. Score each of the 6 dimensions from 0.0 to 1.0.

SPEAKER IDENTIFICATION:
- The agent typically answers first, gives their name, and asks how they can help.
- The customer typically describes a problem, complaint, or inquiry.
- If it's unclear who is the agent: identify the more formal, structured speaker as the agent.

SCORING RULES:
- 0.0: Dimension completely absent. 0.1–0.3: Barely present. 0.4–0.6: Partial. 0.7–0.85: Solid with minor gaps. 0.9–1.0: Excellent.
- Adjust for call type: inbound complaint calls require higher empathy standards than routine inquiry calls.
- Technical support calls: Resolution Effectiveness should account for complexity — reward clear next steps even if full resolution is deferred.
- If the call was transferred mid-way: evaluate the agent who handled the majority of the call.

EVIDENCE REQUIREMENTS:
- For each dimension, provide 2–3 direct quotes with timestamps, speaker label, and a one-sentence explanation.
- Capture both positive execution and gaps where applicable.

OUTPUT: Return ONLY valid JSON.
{
  "overall_score": float,
  "dominant_speaker": string,
  "teacher_talk_ratio": float (agent talk ratio),
  "summary": string (3–4 sentences: call type, what went well, key gaps, top recommendation),
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
    example_use="Upload a customer support call recording to get agent quality scores, empathy analysis, and resolution effectiveness feedback."
))
