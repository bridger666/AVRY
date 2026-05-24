"""
Diagnostic data models for persistence and API.
"""

from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime


class DiagnosticAnswer(BaseModel):
    """Single diagnostic question answer."""
    question_id: str = Field(description="Question identifier")
    selected_option: int = Field(ge=0, le=4, description="Selected option index (0-4)")


class DiagnosticSubmission(BaseModel):
    """Request to submit diagnostic."""
    user_id: Optional[str] = Field(default=None, description="User identifier (optional)")
    user_email: Optional[EmailStr] = Field(default=None, description="User email")
    company_name: Optional[str] = Field(default=None, description="Company name")
    industry: Optional[str] = Field(default=None, description="Industry sector")
    answers: List[DiagnosticAnswer] = Field(description="Diagnostic answers")


class DiagnosticResult(BaseModel):
    """Result of diagnostic assessment."""
    diagnostic_id: str = Field(description="Unique diagnostic identifier")
    user_id: Optional[str] = Field(description="User identifier")
    user_email: Optional[str] = Field(description="User email")
    company_name: Optional[str] = Field(description="Company name")
    industry: Optional[str] = Field(description="Industry sector")
    score: int = Field(ge=0, le=100, description="Readiness score")
    category: str = Field(description="Readiness category")
    category_explanation: str = Field(description="Category explanation")
    insights: List[str] = Field(description="Key insights")
    recommendation: str = Field(description="Recommendation")
    badge_svg: str = Field(description="Badge SVG")
    enriched_by_ai: bool = Field(description="Whether AI enrichment was used")
    answers: List[DiagnosticAnswer] = Field(description="Original answers")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")


class DiagnosticRecord(BaseModel):
    """Database record for diagnostic."""
    diagnostic_id: str
    user_id: Optional[str]
    user_email: Optional[str]
    company_name: Optional[str]
    industry: Optional[str]
    answers: List[Dict[str, Any]]  # JSON serialized
    score: int
    category: str
    created_at: datetime
