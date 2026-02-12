"""Data models for diagnostic flow"""
from typing import List
from datetime import datetime
from pydantic import BaseModel, Field


class DiagnosticAnswer(BaseModel):
    """Single diagnostic answer"""
    question_id: str = Field(description="Question identifier")
    selected_option: int = Field(ge=0, le=3, description="Selected option index (0-3)")


class DiagnosticSubmission(BaseModel):
    """Diagnostic submission from frontend"""
    answers: List[DiagnosticAnswer] = Field(
        min_length=12,
        max_length=12,
        description="Exactly 12 diagnostic answers"
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ScoringResult(BaseModel):
    """Result of scoring calculation"""
    raw_score: int = Field(ge=0, le=36, description="Sum of all answer scores")
    normalized_score: float = Field(ge=0, le=100, description="Score normalized to 0-100 scale")
    category: str = Field(description="AI readiness category")
    category_explanation: str = Field(description="Explanation of the category")


class AIEnrichment(BaseModel):
    """AI-generated enrichment content"""
    insights: List[str] = Field(min_length=3, max_length=3, description="3 insights")
    recommendation: str = Field(description="Recommendation paragraph")
    narrative: str = Field(description="Readiness narrative")


class DiagnosticResult(BaseModel):
    """Complete diagnostic result returned to frontend"""
    score: float = Field(description="Normalized AI readiness score (0-100)")
    category: str = Field(description="Readiness category")
    category_explanation: str = Field(description="Category explanation")
    insights: List[str] = Field(description="3 bullet-point insights")
    recommendation: str = Field(description="Recommendation paragraph")
    badge_svg: str = Field(description="SVG badge markup")
    enriched_by_ai: bool = Field(description="True if AI enrichment succeeded")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
