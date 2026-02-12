"""Scoring service for AI readiness diagnostic"""
from typing import List, Dict, Any
from pydantic import BaseModel, Field

from app.services.scoring_config import (
    MAX_RAW_SCORE,
    CATEGORY_RANGES,
    CATEGORY_EXPLANATIONS,
    DIAGNOSTIC_QUESTIONS
)


class DiagnosticAnswer(BaseModel):
    """Single diagnostic answer"""
    question_id: str
    selected_option: int = Field(ge=0, le=3, description="Selected option index (0-3)")


class ScoringResult(BaseModel):
    """Result of scoring calculation"""
    raw_score: int = Field(ge=0, le=36, description="Sum of all answer scores")
    normalized_score: float = Field(ge=0, le=100, description="Score normalized to 0-100 scale")
    category: str = Field(description="AI readiness category")
    category_explanation: str = Field(description="Explanation of the category")


def calculate_score(answers: List[DiagnosticAnswer]) -> ScoringResult:
    """
    Calculate AI readiness score from diagnostic answers.
    
    This function implements mandatory scoring logic that works
    independently of LLM availability.
    
    Args:
        answers: List of 12 diagnostic answers
    
    Returns:
        ScoringResult with raw score, normalized score, category, and explanation
    
    Raises:
        ValueError: If answers list is invalid
    """
    if len(answers) != 12:
        raise ValueError(f"Expected 12 answers, got {len(answers)}")
    
    # Create lookup for question scores
    question_scores = {}
    for question in DIAGNOSTIC_QUESTIONS:
        question_id = question["id"]
        question_scores[question_id] = [opt["score"] for opt in question["options"]]
    
    # Calculate raw score by summing all answer scores
    raw_score = 0
    for answer in answers:
        question_id = answer.question_id
        option_index = answer.selected_option
        
        if question_id not in question_scores:
            raise ValueError(f"Unknown question_id: {question_id}")
        
        if option_index >= len(question_scores[question_id]):
            raise ValueError(
                f"Invalid option_index {option_index} for question {question_id}"
            )
        
        raw_score += question_scores[question_id][option_index]
    
    # Normalize to 0-100 scale
    normalized_score = (raw_score / MAX_RAW_SCORE) * 100
    
    # Assign category based on score ranges
    category = assign_category(normalized_score)
    
    # Get category explanation
    category_explanation = CATEGORY_EXPLANATIONS[category]
    
    return ScoringResult(
        raw_score=raw_score,
        normalized_score=round(normalized_score, 1),
        category=category,
        category_explanation=category_explanation
    )


def assign_category(normalized_score: float) -> str:
    """
    Assign readiness category based on normalized score.
    
    Args:
        normalized_score: Score in range 0-100
    
    Returns:
        Category name: "AI Unready", "AI Curious", "AI Ready", or "AI Native"
    """
    for category, (min_score, max_score) in CATEGORY_RANGES.items():
        if min_score <= normalized_score <= max_score:
            return category
    
    # Fallback (should never happen with valid score)
    return "AI Unready"


def calculate_score_from_dict(answers_dict: Dict[str, int]) -> ScoringResult:
    """
    Convenience function to calculate score from a dictionary.
    
    Args:
        answers_dict: Dict mapping question_id -> selected_option
    
    Returns:
        ScoringResult
    """
    answers = [
        DiagnosticAnswer(question_id=qid, selected_option=option)
        for qid, option in answers_dict.items()
    ]
    return calculate_score(answers)
