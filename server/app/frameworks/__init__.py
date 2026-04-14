"""
Pluggable analysis framework registry.

Each framework defines its own dimensions and system prompt.
All other pipeline infrastructure (auth, queue, DB) is shared.
"""

from app.frameworks.base import AnalysisFramework, Dimension, FRAMEWORKS, register

# Register all frameworks by importing them — side-effect registration
import app.frameworks.rosenshine        # noqa: F401
import app.frameworks.sales_spin        # noqa: F401
import app.frameworks.interview_star    # noqa: F401
import app.frameworks.meeting           # noqa: F401
import app.frameworks.public_speaking   # noqa: F401
import app.frameworks.customer_service  # noqa: F401
import app.frameworks.podcast           # noqa: F401
import app.frameworks.language_speaking # noqa: F401
import app.frameworks.counseling        # noqa: F401


def get_framework(framework_id: str) -> AnalysisFramework | None:
    return FRAMEWORKS.get(framework_id)


__all__ = ["AnalysisFramework", "Dimension", "FRAMEWORKS", "register", "get_framework"]
