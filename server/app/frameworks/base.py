"""
Base data models for the pluggable analysis framework system.
"""

from pydantic import BaseModel


class Dimension(BaseModel):
    number: int
    name: str
    description: str
    good_example: str
    bad_example: str


class AnalysisFramework(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    target_speaker: str
    speakers_expected: int
    dimensions: list[Dimension]
    system_prompt: str
    example_use: str


# Global registry — populated by each framework module
FRAMEWORKS: dict[str, AnalysisFramework] = {}


def register(framework: AnalysisFramework) -> AnalysisFramework:
    FRAMEWORKS[framework.id] = framework
    return framework
