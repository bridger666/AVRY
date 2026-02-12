"""Diagnostic API routes"""
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.models.diagnostic import DiagnosticSubmission, DiagnosticResult
from app.services.scoring_service import calculate_score, DiagnosticAnswer
from app.services.ai_enrichment import enrich_with_ai
from app.services.static_content import get_static_content
from app.services.badge_service import generate_badge
from app.llm.ollama_client import OllamaClient

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/diagnostic", tags=["diagnostic"])


@router.post("/run", response_model=DiagnosticResult)
async def run_diagnostic(submission: DiagnosticSubmission):
    """
    Run the complete diagnostic flow.
    
    Steps:
    1. Validate submission (12 answers)
    2. Calculate mandatory score
    3. Attempt AI enrichment (with timeout)
    4. Fall back to static content if AI fails
    5. Generate badge
    6. Return complete result
    """
    try:
        # Validate exactly 12 answers
        if len(submission.answers) != 12:
            raise HTTPException(
                status_code=422,
                detail=f"Expected 12 answers, got {len(submission.answers)}"
            )
        
        # Convert to scoring service format
        scoring_answers = [
            DiagnosticAnswer(
                question_id=ans.question_id,
                selected_option=ans.selected_option
            )
            for ans in submission.answers
        ]
        
        # Step 1: Calculate mandatory score (always succeeds)
        logger.info("Calculating AI readiness score...")
        score_result = calculate_score(scoring_answers)
        logger.info(
            f"Score calculated: {score_result.normalized_score}/100 "
            f"({score_result.category})"
        )
        
        # Step 2: Attempt AI enrichment (optional, may fail)
        enriched_by_ai = False
        llm_client = OllamaClient()
        
        logger.info("Attempting AI enrichment...")
        ai_enrichment = await enrich_with_ai(
            llm_client,
            scoring_answers,
            score_result,
            timeout=5.0
        )
        
        # Step 3: Use AI content or fall back to static content
        if ai_enrichment:
            logger.info("Using AI-generated content")
            insights = ai_enrichment.insights
            recommendation = ai_enrichment.recommendation
            enriched_by_ai = True
        else:
            logger.info(f"Falling back to static content for {score_result.category}")
            static_content = get_static_content(score_result.category)
            insights = static_content.insights
            recommendation = static_content.recommendation
            enriched_by_ai = False
        
        # Step 4: Generate badge (always succeeds)
        logger.info("Generating badge...")
        badge_svg = generate_badge(score_result.normalized_score, score_result.category)
        
        # Step 5: Return complete result
        result = DiagnosticResult(
            score=score_result.normalized_score,
            category=score_result.category,
            category_explanation=score_result.category_explanation,
            insights=insights,
            recommendation=recommendation,
            badge_svg=badge_svg,
            enriched_by_ai=enriched_by_ai
        )
        
        logger.info("Diagnostic completed successfully")
        return result
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error during diagnostic: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your diagnostic"
        )


@router.get("/test-llm")
async def test_llm():
    """Test Ollama connection"""
    try:
        llm_client = OllamaClient()
        response = await llm_client.generate(
            "Say 'Hello from Aivory!' in one sentence.",
            timeout=3.0
        )
        return {
            "status": "success",
            "response": response,
            "message": "LLM is available and responding"
        }
    except Exception as e:
        logger.warning(f"LLM test failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unavailable",
                "error": str(e),
                "message": "LLM is not available, but the system will use static content"
            }
        )
