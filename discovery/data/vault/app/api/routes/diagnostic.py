"""Diagnostic API routes"""
import logging
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from typing import List, Optional

from app.models.diagnostic import DiagnosticSubmission, DiagnosticResult
from app.services.scoring_service import calculate_score, DiagnosticAnswer
from app.services.ai_enrichment import enrich_with_ai
from app.services.static_content import get_static_content
from app.services.badge_service import generate_badge
from app.services.snapshot_scoring_service import calculate_snapshot_score
from app.services.data_extraction import DataExtractionService
from app.llm.ollama_client import OllamaClient
from app.llm.openrouter_client import OpenRouterClient, OpenRouterMessage
from app.model_config import ModelSelector
from app.config import settings
from app.utils.id_generator import generate_diagnostic_id, generate_snapshot_id
from app.database.db_service import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/diagnostic", tags=["diagnostic"])


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
@router.post("/run")
async def run_free_diagnostic(data: dict):
    """
    FREE AI READINESS DIAGNOSTIC (12 questions, $0)

    Purpose: Basic readiness assessment with static scoring

    Request body:
    {
        "answers": [
            {"question_id": "business_objective", "selected_option": 0},
            ...
        ],  # EXACTLY 12 questions
        "user_email": "user@example.com" (optional),
        "company_name": "Example Corp" (optional),
        "industry": "Technology" (optional)
    }

    Returns:
    {
        "diagnostic_id": "diag_abc123...",
        "score": number (0-100),
        "category": "Not Ready" | "Getting Started" | "Building Momentum" | "AI-Ready",
        "category_explanation": string,
        "insights": [string],
        "recommendation": string,
        "badge_svg": string,
        "enriched_by_ai": false
    }
    """
    try:
        answers = data.get("answers", [])
        user_email = data.get("user_email")
        company_name = data.get("company_name")
        industry = data.get("industry")

        # STRICT VALIDATION: Exactly 12 questions required
        if not answers:
            raise HTTPException(
                status_code=422,
                detail="Free diagnostic answers required. Please complete the 12-question assessment."
            )

        if len(answers) != 12:
            raise HTTPException(
                status_code=422,
                detail=f"Exactly 12 questions required for free diagnostic. Received {len(answers)} questions."
            )

        # Convert dict answers to DiagnosticAnswer objects
        diagnostic_answers = [
            DiagnosticAnswer(
                question_id=answer.get("question_id"),
                selected_option=answer.get("selected_option")
            )
            for answer in answers
        ]
        
        # Calculate score using scoring service
        from app.services.scoring_service import calculate_score
        score_result = calculate_score(diagnostic_answers)
        category = score_result.category

        # Get static content
        content = get_static_content(category)

        # Generate badge
        badge_svg = generate_badge(score_result.normalized_score, category)

        # Generate diagnostic_id
        diagnostic_id = generate_diagnostic_id()
        
        # Persist to database
        try:
            await db.store_diagnostic(
                diagnostic_id=diagnostic_id,
                user_id=None,  # Optional for free tier
                user_email=user_email,
                company_name=company_name,
                industry=industry,
                answers=answers,
                score=score_result.normalized_score,
                category=category
            )
            logger.info(f"Stored diagnostic {diagnostic_id}")
        except Exception as db_error:
            logger.error(f"Failed to store diagnostic: {db_error}")
            # Continue - don't fail the request if storage fails

        logger.info(f"Free diagnostic complete: id={diagnostic_id}, score={score_result.normalized_score}, category={category}")

        # Return result with diagnostic_id
        return {
            "diagnostic_id": diagnostic_id,
            "score": score_result.normalized_score,
            "category": category,
            "category_explanation": score_result.category_explanation,
            "insights": content.insights,
            "recommendation": content.recommendation,
            "badge_svg": badge_svg,
            "enriched_by_ai": False
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in free diagnostic: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again."
        )


# ============================================================================
# SUMOPOD-POWERED ENDPOINTS - SNAPSHOT ($15) & DEEP DIAGNOSTIC ($99)
# ============================================================================

def format_answers_for_prompt(answers: List[dict]) -> str:
    """Format diagnostic answers into readable text for AI prompt"""
    formatted_lines = []
    for i, answer in enumerate(answers, 1):
        question_id = answer.get("question_id", f"Q{i}")
        selected = answer.get("selected_option", "unknown")
        formatted_lines.append(f"{question_id}: {selected}")
    return "\n".join(formatted_lines)


@router.post("/snapshot")
async def run_snapshot_diagnostic(data: dict):
    """
    AIVORY INTELLIGENCE ENGINE V2 - SNAPSHOT DIAGNOSTIC ($15)
    
    Purpose: Strategic system direction with weighted scoring
    
    Model: deepseek-v3-2-251201 (automatically selected)
    Timeout: 60 seconds
    
    Request body:
    {
        "snapshot_answers": [...],  # EXACTLY 30 questions (structured taxonomy)
        "diagnostic_id": "diag_abc123..." (optional - links to free diagnostic),
        "user_email": "user@example.com" (optional),
        "company_name": "Example Corp" (optional),
        "industry": "Technology" (optional),
        "language": "en" or "id" (optional, defaults to "en")
    }
    
    Returns:
    {
        "snapshot_id": "snap_xyz789...",
        "diagnostic_id": "diag_abc123..." (if provided),
        "readiness_score": number (0-100, weighted by objective),
        "readiness_level": "Low" | "Medium" | "High",
        "strength_index": number (0-100),
        "bottleneck_index": number (0-100),
        "top_recommendations": [string],  # Top 3 system recommendations
        "priority_score": number (0-100),
        "deployment_phase_suggestion": string,
        "category_scores": {
            "workflow": number,
            "data": number,
            "automation": number,
            "organization": number
        }
    }
    
    CRITICAL: Does NOT include technical tool names or executable code.
    This is strategic layer only.
    """
    try:
        snapshot_answers = data.get("snapshot_answers", [])
        diagnostic_id = data.get("diagnostic_id")
        user_email = data.get("user_email")
        company_name = data.get("company_name")
        industry = data.get("industry")
        language = data.get("language", "en")
        
        # STRICT VALIDATION: Exactly 30 questions required
        if not snapshot_answers:
            raise HTTPException(
                status_code=422, 
                detail="Snapshot diagnostic answers required. Please complete the 30-question assessment."
            )
        
        if len(snapshot_answers) != 30:
            raise HTTPException(
                status_code=422,
                detail=f"Exactly 30 questions required for AI Snapshot. Received {len(snapshot_answers)} questions."
            )
        
        # If diagnostic_id provided, retrieve User_Context from database
        if diagnostic_id:
            diagnostic = await db.get_diagnostic(diagnostic_id)
            if not diagnostic:
                raise HTTPException(
                    status_code=404,
                    detail=f"Diagnostic {diagnostic_id} not found. Please complete the free diagnostic first."
                )
            # Inherit User_Context from diagnostic if not provided
            user_email = user_email or diagnostic.get("user_email")
            company_name = company_name or diagnostic.get("company_name")
            industry = industry or diagnostic.get("industry")
            logger.info(f"Inherited User_Context from diagnostic {diagnostic_id}")
        
        # Calculate weighted readiness score using V2 scoring engine
        scoring_result = calculate_snapshot_score(snapshot_answers)
        
        logger.info(f"Snapshot scoring complete: score={scoring_result['readiness_score']}, "
                   f"objective={scoring_result['primary_objective']}, "
                   f"categories={scoring_result['category_scores']}")
        
        # Generate snapshot_id
        snapshot_id = generate_snapshot_id()
        
        # Extract structured data using DataExtractionService
        extractor = DataExtractionService()
        pain_points = extractor.extract_pain_points(snapshot_answers)
        workflows = extractor.extract_workflows(snapshot_answers)
        key_processes = extractor.extract_key_processes(
            snapshot_answers,
            scoring_result["primary_objective"]
        )
        automation_level = extractor.determine_automation_level(snapshot_answers)
        data_quality_score = extractor.calculate_data_quality_score(snapshot_answers)
        
        logger.info(f"Extracted data: pain_points={len(pain_points)}, workflows={len(workflows)}, "
                   f"automation_level={automation_level}, data_quality={data_quality_score}")
        
        # Persist to database
        try:
            await db.store_snapshot(
                snapshot_id=snapshot_id,
                diagnostic_id=diagnostic_id,
                user_id=None,  # Optional for paid tier
                user_email=user_email,
                company_name=company_name,
                industry=industry,
                answers=snapshot_answers,
                readiness_score=scoring_result["readiness_score"],
                category_scores=scoring_result["category_scores"],
                primary_objective=scoring_result["primary_objective"],
                top_recommendations=scoring_result["top_recommendations"],
                pain_points=pain_points,
                workflows=workflows,
                key_processes=key_processes,
                automation_level=automation_level,
                data_quality_score=data_quality_score
            )
            logger.info(f"Stored snapshot {snapshot_id}")
        except Exception as db_error:
            logger.error(f"Failed to store snapshot: {db_error}")
            # Continue - don't fail the request if storage fails
        
        # Return structured snapshot result (strategic layer only)
        return {
            "snapshot_id": snapshot_id,
            "diagnostic_id": diagnostic_id,
            "readiness_score": scoring_result["readiness_score"],
            "readiness_level": scoring_result["readiness_level"],
            "strength_index": scoring_result["strength_index"],
            "bottleneck_index": scoring_result["bottleneck_index"],
            "top_recommendations": scoring_result["top_recommendations"],
            "priority_score": scoring_result["priority_score"],
            "deployment_phase_suggestion": scoring_result["deployment_phase_suggestion"],
            "category_scores": scoring_result["category_scores"],
            "strength_category": scoring_result["strength_category"],
            "bottleneck_category": scoring_result["bottleneck_category"],
            "primary_objective": scoring_result["primary_objective"],
            "weights_used": scoring_result["weights_used"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in snapshot diagnostic: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again."
        )


@router.post("/deep")
async def run_deep_diagnostic(data: dict):
    """
    AIVORY INTELLIGENCE ENGINE V2 - DEEP DIAGNOSTIC / BLUEPRINT ($99)
    
    Purpose: Refine Snapshot into deploy-ready architecture
    
    Model: glm-4-7-251222 (automatically selected for reasoning-heavy tasks)
    Fallback: deepseek-v3-2-251201
    Timeout: 90 seconds
    
    CRITICAL: Requires snapshot_result_json from Snapshot diagnostic.
    Blueprint expands selected top recommendation into full architecture.
    
    Request body:
    {
        "snapshot_result_json": {...},  # REQUIRED: Complete snapshot result
        "additional_context": string (optional),
        "language": "en" or "id" (optional, defaults to "en")
    }
    
    Returns:
    {
        "executive_summary": string,
        "system_architecture": {
            "system_name": string,
            "core_objective": string,
            "operating_model": string,
            "confidence_level": "Low" | "Medium" | "High"
        },
        "workflow_architecture": {
            "trigger_logic": string,
            "core_steps": [string],
            "decision_conditions": [string],
            "escalation_paths": [string]
        },
        "agent_structure": [{
            "agent_name": string,
            "role": string,
            "responsibilities": [string]
        }],
        "impact_projection": {
            "automation_potential_percent": number,
            "time_saved_estimate": string,
            "roi_projection": string
        },
        "deployment_phases": [string],
        "recommended_subscription_tier": "Builder" | "Operator" | "Enterprise"
    }
    
    STRICT RULES:
    - No executable code
    - No vendor-specific syntax
    - Generic agent names only
    """
    try:
        snapshot_result = data.get("snapshot_result_json")
        additional_context = data.get("additional_context", "")
        language = data.get("language", "en")
        
        # STRICT VALIDATION: snapshot_result_json is REQUIRED
        if not snapshot_result:
            raise HTTPException(
                status_code=422,
                detail="snapshot_result_json is required. Please complete the AI Snapshot ($15) diagnostic first. Deep Diagnostic cannot be run without Snapshot data."
            )
        
        # Validate snapshot_result has required structure
        if not isinstance(snapshot_result, dict):
            raise HTTPException(
                status_code=422,
                detail="snapshot_result_json must be a valid JSON object from Snapshot diagnostic."
            )
        
        required_snapshot_fields = ["system_outline", "readiness_score", "strategic_priority"]
        missing_fields = [field for field in required_snapshot_fields if field not in snapshot_result]
        if missing_fields:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid snapshot_result_json. Missing required fields: {missing_fields}. Please run Snapshot diagnostic first."
            )
        
        # Initialize OpenRouter client
        openrouter = OpenRouterClient(
            api_key=settings.openrouter_api_key,
            base_url=settings.openrouter_base_url
        )
        
        # Extract snapshot data
        readiness_score = snapshot_result.get("readiness_score", 0)
        readiness_level = snapshot_result.get("readiness_level", "Low")
        top_recommendations = snapshot_result.get("top_recommendations", [])
        primary_objective = snapshot_result.get("primary_objective", "exploratory")
        category_scores = snapshot_result.get("category_scores", {})
        bottleneck_category = snapshot_result.get("bottleneck_category", "workflow")
        
        # Select primary recommendation to expand
        primary_recommendation = top_recommendations[0] if top_recommendations else "workflow_automation_engine"
        
        # Build system prompt with A-to-A pseudo-code instructions
        lang_instruction = "Generate output in Indonesian" if language == "id" else ""
        
        system_prompt = f"""You are an AI system architect for Aivory Intelligence Engine V2.
Expand the selected system recommendation into a complete, deploy-ready architecture.
{lang_instruction}

CRITICAL INSTRUCTIONS:
1. Use NON-EXECUTABLE architecture descriptions
2. DO NOT mention specific tools: n8n, Claude, Make, Zapier, or any vendor names
3. Use generic agent names: Document_Parser_Agent, Validation_Agent, Routing_Agent, etc.
4. Focus on ARCHITECTURE, not implementation details

Return STRICT JSON ONLY. Do not include markdown code blocks.

Required JSON structure:
{{
  "executive_summary": "string (3-4 sentences)",
  "system_architecture": {{
    "system_name": "string",
    "core_objective": "string (1 sentence)",
    "operating_model": "string (2-3 sentences describing how system operates)",
    "confidence_level": "Low" | "Medium" | "High"
  }},
  "workflow_architecture": {{
    "trigger_logic": "string (what initiates the workflow)",
    "core_steps": ["string", "string", "string"],
    "decision_conditions": ["string", "string"],
    "escalation_paths": ["string", "string"]
  }},
  "agent_structure": [{{
    "agent_name": "string",
    "role": "string",
    "responsibilities": ["string", "string"]
  }}],
  "impact_projection": {{
    "automation_potential_percent": number (0-100),
    "time_saved_estimate": "string (e.g., '10-15 hours per week')",
    "roi_projection": "string (e.g., '3-6 months to positive ROI')"
  }},
  "deployment_phases": ["Phase 1: ...", "Phase 2: ...", "Phase 3: ..."],
  "recommended_subscription_tier": "Builder" | "Operator" | "Enterprise"
}}"""
        
        # Build user prompt with snapshot context
        user_prompt = f"""Snapshot Result Summary:

Primary Objective: {primary_objective}
Readiness Score: {readiness_score}/100 ({readiness_level})
Selected System: {primary_recommendation}

Category Scores:
- Workflow: {category_scores.get('workflow', 0)}/100
- Data: {category_scores.get('data', 0)}/100
- Automation: {category_scores.get('automation', 0)}/100
- Organization: {category_scores.get('organization', 0)}/100

Bottleneck: {bottleneck_category}

Additional Context: {additional_context if additional_context else "None"}

Expand "{primary_recommendation}" into a complete AI system architecture including:
1. Executive summary
2. System architecture (name, objective, operating model, confidence)
3. Workflow architecture (trigger logic, core steps, decision conditions, escalation paths)
4. Agent structure (specific agents with roles and responsibilities)
5. Impact projection (automation potential, time saved, ROI)
6. Deployment phases (3-5 phases with clear milestones)
7. Recommended subscription tier based on complexity

Remember: Use generic agent names, not tool-specific names. Focus on architecture, not implementation."""
        
        messages = [
            OpenRouterMessage(role="system", content=system_prompt),
            OpenRouterMessage(role="user", content=user_prompt)
        ]
        
        # Select model for deep diagnostic (reasoning-heavy task)
        model = ModelSelector.get_model_for_task("deep_diagnostic")
        model_specs = ModelSelector.get_model_specs(model)
        
        logger.info(f"Calling OpenRouter for deep diagnostic blueprint ({model})...")
        
        ai_response = None
        try:
            ai_response = await openrouter.chat_completion(
                messages=messages,
                model=model,
                temperature=model_specs["temperature_default"],
                max_tokens=model_specs["max_tokens"],
                timeout=model_specs["timeout"]
            )
            logger.info(f"Deep diagnostic response received (first 500 chars): {ai_response[:500]}...")
        except Exception as api_error:
            logger.error(f"OpenRouter API error with {model}: {api_error}")
            # Try fallback model
            fallback_model = ModelSelector.get_fallback_model(model)
            if fallback_model != model:
                logger.info(f"Retrying with fallback model: {fallback_model}")
                try:
                    fallback_specs = ModelSelector.get_model_specs(fallback_model)
                    ai_response = await openrouter.chat_completion(
                        messages=messages,
                        model=fallback_model,
                        temperature=fallback_specs["temperature_default"],
                        max_tokens=fallback_specs["max_tokens"],
                        timeout=fallback_specs["timeout"]
                    )
                    logger.info(f"Fallback successful with {fallback_model}")
                except Exception as fallback_error:
                    logger.error(f"Fallback model also failed: {fallback_error}")
                    raise HTTPException(
                        status_code=503,
                        detail="AI service temporarily unavailable. Please try again in a moment."
                    )
            else:
                raise HTTPException(
                    status_code=503,
                    detail="AI service temporarily unavailable. Please try again in a moment."
                )
        
        # Parse JSON with retry logic
        result = None
        for attempt in range(2):
            try:
                # Strip markdown code blocks if present
                cleaned_response = ai_response.strip()
                if cleaned_response.startswith("```json"):
                    cleaned_response = cleaned_response[7:]
                if cleaned_response.startswith("```"):
                    cleaned_response = cleaned_response[3:]
                if cleaned_response.endswith("```"):
                    cleaned_response = cleaned_response[:-3]
                cleaned_response = cleaned_response.strip()
                
                # Parse JSON
                result = json.loads(cleaned_response)
                logger.info(f"Successfully parsed blueprint JSON on attempt {attempt + 1}")
                break
                
            except json.JSONDecodeError as e:
                if attempt == 0:
                    # Retry with stricter instruction
                    logger.warning(f"JSON parse failed on attempt 1: {e}. Retrying with stricter prompt...")
                    retry_messages = messages + [
                        OpenRouterMessage(
                            role="user",
                            content="Return STRICT JSON only. Do not include markdown code blocks or any other text."
                        )
                    ]
                    try:
                        fallback_specs = ModelSelector.get_model_specs(model)
                        ai_response = await openrouter.chat_completion(
                            messages=retry_messages,
                            model=model,
                            temperature=fallback_specs["temperature_default"],
                            max_tokens=fallback_specs["max_tokens"],
                            timeout=fallback_specs["timeout"]
                        )
                    except Exception as retry_error:
                        logger.error(f"Retry request failed: {retry_error}")
                        raise HTTPException(
                            status_code=500,
                            detail="AI service error. Please try again."
                        )
                else:
                    # Final failure
                    logger.error(f"Failed to parse JSON after 2 attempts: {e}")
                    logger.error(f"Final response was: {ai_response}")
                    raise HTTPException(
                        status_code=500,
                        detail="Unable to process AI response. Please try again."
                    )
        
        # Validate required fields
        required_fields = [
            "executive_summary", "system_architecture", "workflow_architecture",
            "agent_structure", "impact_projection", "deployment_phases",
            "recommended_subscription_tier"
        ]
        missing_fields = [field for field in required_fields if field not in result]
        if missing_fields:
            logger.error(f"Missing required fields in blueprint response: {missing_fields}")
            raise HTTPException(
                status_code=500,
                detail="Incomplete AI response. Please try again."
            )
        
        # Validate A-to-A format compliance (check for forbidden tool names)
        forbidden_tools = ["n8n", "claude", "make", "zapier", "openai", "anthropic"]
        workflow_text = json.dumps(result.get("workflow_architecture", {})).lower()
        found_forbidden = [tool for tool in forbidden_tools if tool in workflow_text]
        if found_forbidden:
            logger.warning(f"Blueprint contains forbidden tool names: {found_forbidden}")
            # Don't fail, but log for monitoring
        
        logger.info(f"Deep diagnostic blueprint completed: {result.get('system_architecture', {}).get('system_name')}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in deep diagnostic: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again."
        )
