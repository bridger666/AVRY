"""AI enrichment service with graceful degradation"""
import logging
from typing import Optional, List
from pydantic import BaseModel

from app.llm.ollama_client import OllamaClient, LLMError
from app.services.scoring_service import ScoringResult, DiagnosticAnswer

logger = logging.getLogger(__name__)


class AIEnrichment(BaseModel):
    """AI-generated enrichment content"""
    insights: List[str]
    recommendation: str
    narrative: str


def build_insights_prompt(answers: List[DiagnosticAnswer], score: ScoringResult) -> str:
    """
    Build prompt for generating insights.
    
    Args:
        answers: List of diagnostic answers
        score: Scoring result
    
    Returns:
        Formatted prompt string
    """
    # Summarize key answers
    answer_summary = "\n".join([
        f"- {ans.question_id}: option {ans.selected_option}"
        for ans in answers[:5]  # Include first 5 for context
    ])
    
    prompt = f"""Based on this AI readiness diagnostic:
- Score: {score.normalized_score}/100 ({score.category})
- Key answers:
{answer_summary}

Generate exactly 3 short, actionable insights (1-2 sentences each) about this organization's AI readiness. Focus on specific strengths or gaps.

Format as bullet points starting with "- "."""
    
    return prompt


def build_recommendation_prompt(answers: List[DiagnosticAnswer], score: ScoringResult) -> str:
    """
    Build prompt for generating recommendation.
    
    Args:
        answers: List of diagnostic answers
        score: Scoring result
    
    Returns:
        Formatted prompt string
    """
    answer_summary = "\n".join([
        f"- {ans.question_id}: option {ans.selected_option}"
        for ans in answers[:5]
    ])
    
    prompt = f"""Based on this AI readiness diagnostic:
- Score: {score.normalized_score}/100 ({score.category})
- Key answers:
{answer_summary}

Write a single paragraph (3-4 sentences) recommending the next steps this organization should take to improve AI readiness or begin AI adoption.

Be specific and actionable."""
    
    return prompt


def build_narrative_prompt(score: ScoringResult) -> str:
    """
    Build prompt for generating narrative.
    
    Args:
        score: Scoring result
    
    Returns:
        Formatted prompt string
    """
    prompt = f"""Based on this AI readiness diagnostic:
- Score: {score.normalized_score}/100 ({score.category})

Write a 2-sentence narrative explaining what this score means for the organization's AI journey.

Be concise and clear."""
    
    return prompt


async def enrich_with_ai(
    llm_client: OllamaClient,
    answers: List[DiagnosticAnswer],
    score: ScoringResult,
    timeout: float = 5.0
) -> Optional[AIEnrichment]:
    """
    Attempt to generate AI-powered insights and recommendations.
    
    This function tries to use the LLM to generate personalized content.
    If the LLM fails or times out, it returns None, allowing the caller
    to fall back to static content.
    
    Args:
        llm_client: Ollama client instance
        answers: List of diagnostic answers
        score: Scoring result
        timeout: Timeout for LLM requests
    
    Returns:
        AIEnrichment if successful, None if LLM fails
    """
    try:
        # System prompt for AI consultant role
        system_prompt = (
            "You are an AI transformation consultant. "
            "You analyze organizational signals. "
            "You do not hallucinate. "
            "You only reason based on provided inputs."
        )
        
        # Generate 3 insights
        logger.info("Generating AI insights...")
        insights_prompt = build_insights_prompt(answers, score)
        insights_text = await llm_client.generate(
            insights_prompt,
            system_prompt=system_prompt,
            timeout=timeout
        )
        insights = parse_insights(insights_text)
        
        # Generate recommendation
        logger.info("Generating AI recommendation...")
        rec_prompt = build_recommendation_prompt(answers, score)
        recommendation = await llm_client.generate(
            rec_prompt,
            system_prompt=system_prompt,
            timeout=timeout
        )
        recommendation = recommendation.strip()
        
        # Generate narrative
        logger.info("Generating AI narrative...")
        narrative_prompt = build_narrative_prompt(score)
        narrative = await llm_client.generate(
            narrative_prompt,
            system_prompt=system_prompt,
            timeout=timeout
        )
        narrative = narrative.strip()
        
        logger.info("AI enrichment successful")
        return AIEnrichment(
            insights=insights,
            recommendation=recommendation,
            narrative=narrative
        )
        
    except TimeoutError as e:
        logger.warning(f"AI enrichment timed out: {e}")
        return None
    except ConnectionError as e:
        logger.warning(f"AI enrichment failed - LLM unavailable: {e}")
        return None
    except LLMError as e:
        logger.warning(f"AI enrichment failed - LLM error: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error during AI enrichment: {e}")
        return None


def parse_insights(insights_text: str) -> List[str]:
    """
    Parse insights from LLM response text.
    
    Extracts bullet points and returns as list of strings.
    
    Args:
        insights_text: Raw text from LLM
    
    Returns:
        List of insight strings (up to 3)
    """
    insights = []
    
    # Split by lines and look for bullet points
    lines = insights_text.strip().split('\n')
    for line in lines:
        line = line.strip()
        # Remove bullet point markers
        if line.startswith('- '):
            line = line[2:]
        elif line.startswith('• '):
            line = line[2:]
        elif line.startswith('* '):
            line = line[2:]
        
        if line and len(insights) < 3:
            insights.append(line)
    
    # Ensure we have exactly 3 insights
    while len(insights) < 3:
        insights.append("Additional analysis needed for complete assessment")
    
    return insights[:3]
