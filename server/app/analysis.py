"""
Groq LLM analysis with Pydantic structured output and Langfuse tracing.

Accepts an AnalysisFramework object to dynamically use the correct system prompt
and return dimensions appropriate to the selected use case.
"""

import asyncio
import json
from functools import wraps

from groq import APIError, Groq, RateLimitError
from langfuse import Langfuse

from app.config import settings
from app.frameworks.base import AnalysisFramework
from app.schemas import FullAnalysis

groq_client = Groq(api_key=settings.GROQ_API_KEY)

# Langfuse client for observability tracing
langfuse = Langfuse(
    secret_key=settings.LANGFUSE_SECRET_KEY,
    public_key=settings.LANGFUSE_PUBLIC_KEY,
    host=settings.LANGFUSE_HOST,
)


def format_transcript(segments: list[dict]) -> str:
    """Format diarised segments into a readable transcript with timestamps."""
    return "\n".join(
        f"[{seg['start']:.1f}s] Speaker {seg['speaker']}: {seg['text']}"
        for seg in segments
    )


# ─── Retry decorator ────────────────────────────────────────────────────────────

def retry(
    max_attempts: int = 3,
    delay: float = 2.0,
    backoff: float = 2.0,
    retry_on: tuple = (Exception,),
):
    """Exponential-backoff retry for transient API errors."""

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_delay = delay
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except retry_on as exc:
                    if attempt == max_attempts - 1:
                        raise
                    await asyncio.sleep(current_delay)
                    current_delay *= backoff
            return None  # unreachable

        return wrapper

    return decorator


# ─── Core analysis ───────────────────────────────────────────────────────────────

def analyze_transcript(segments: list[dict], framework: AnalysisFramework) -> FullAnalysis:
    """Run Groq analysis using the framework's system prompt, with Langfuse tracing."""
    transcript = format_transcript(segments)

    metadata = {
        "framework_id": framework.id,
        "framework_name": framework.name,
        "segment_count": len(segments),
        "model": "llama-3.3-70b-versatile",
        "provider": "groq",
        "transcript_length": len(transcript),
        "dimension_count": len(framework.dimensions),
    }

    messages = [
        {"role": "system", "content": framework.system_prompt},
        {"role": "user", "content": f"Transcript:\n{transcript}"},
    ]

    # Langfuse v3 API: use start_as_current_span for top-level trace
    with langfuse.start_as_current_span(
        name=f"{framework.id}-analysis",
        input=metadata,
    ):
        with langfuse.start_as_current_generation(
            name="groq-llm-call",
            model="llama-3.3-70b-versatile",
            input=messages,
            model_parameters={"temperature": 0.1, "max_tokens": 6000},
        ) as generation:
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=6000,
            )

            raw = response.choices[0].message.content

            generation.update(
                output=raw,
                usage={
                    "input": response.usage.prompt_tokens,
                    "output": response.usage.completion_tokens,
                },
            )

    result = FullAnalysis.model_validate_json(raw)
    langfuse.flush()

    return result


@retry(max_attempts=3, delay=2.0, retry_on=(RateLimitError, APIError))
async def analyze_with_retry(segments: list[dict], framework: AnalysisFramework) -> FullAnalysis:
    """Async wrapper with exponential backoff on transient Groq errors."""
    return await asyncio.to_thread(analyze_transcript, segments, framework)
