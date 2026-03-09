"""
AIVORY AI Command Console API Routes
Layer 5: Conversational Command Layer
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from app.services.console_service import ConsoleService
from app.services.credit_manager import CreditManager
from app.services.tier_validator import TierValidator
from app.services.document_parser import DocumentParser
from app.services.workflow_generator import WorkflowGenerator
from app.services.audit_logger import AuditLogger
from app.llm.openrouter_client import OpenRouterRateLimitError

router = APIRouter(prefix="/api/console", tags=["console"])
logger = logging.getLogger(__name__)

# Initialize services
console_service = ConsoleService()
credit_manager = CreditManager()
tier_validator = TierValidator()
document_parser = DocumentParser()
workflow_generator = WorkflowGenerator()
audit_logger = AuditLogger()

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class MessageRequest(BaseModel):
    message: str
    files: List[str] = []
    workflow: Optional[str] = None
    context: Dict[str, Any] = {}

class MessageResponse(BaseModel):
    response: str
    reasoning: Optional[Dict[str, Any]] = None
    credits_remaining: int
    timestamp: str

class WorkflowGenerateRequest(BaseModel):
    prompt: str
    tier: str

class WorkflowConfirmRequest(BaseModel):
    workflow: Dict[str, Any]
    edited: bool = False

class PromptRequest(BaseModel):
    tier: str
    has_snapshot: bool = False
    has_blueprint: bool = False

# ============================================================================
# PROMPT ENDPOINT
# ============================================================================

@router.post("/prompt")
async def get_prompt(request: PromptRequest):
    """
    Get ARIA system prompt with tier-specific additions.
    
    Returns the complete ARIA Protocol v2.0 prompt configured
    for the user's tier and state.
    """
    try:
        from app.prompts.console_prompts import get_console_system_prompt
        
        prompt = get_console_system_prompt(
            tier=request.tier,
            has_snapshot=request.has_snapshot,
            has_blueprint=request.has_blueprint
        )
        
        return {
            "prompt": prompt,
            "version": "2.0",
            "tier": request.tier
        }
        
    except Exception as e:
        logger.error(f"Error fetching prompt: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch prompt")

# ============================================================================
# CONSOLE MESSAGE ENDPOINT
# ============================================================================

@router.post("/message", response_model=MessageResponse)
async def send_message(request: MessageRequest):
    """
    Send a message to the AI console.
    
    Validates tier permissions, credit balance, and rate limits.
    Routes to Sumopod API and returns AI response with reasoning metadata.
    """
    try:
        # Extract context
        tier = request.context.get('tier', 'builder')
        user_id = request.context.get('user_id', 'demo_user')
        has_snapshot = request.context.get('has_snapshot', False)
        has_blueprint = request.context.get('has_blueprint', False)
        
        # Validate tier permissions
        if not tier_validator.validate_console_access(tier):
            raise HTTPException(status_code=403, detail="Console access not available for your tier")
        
        # Validate credit balance (minimum 1 credit for basic message)
        credits = credit_manager.get_credits(user_id)
        if credits < 1:
            raise HTTPException(status_code=402, detail="Insufficient credits")
        
        # Validate rate limit
        if not tier_validator.check_rate_limit(user_id, tier):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        # Process message through console service with user state
        ai_response = await console_service.process_message(
            message=request.message,
            files=request.files,
            workflow=request.workflow,
            tier=tier,
            user_id=user_id,
            has_snapshot=has_snapshot,
            has_blueprint=has_blueprint
        )
        
        # Deduct credits (1 credit for basic message)
        credit_cost = 1
        new_balance = credit_manager.deduct_credits(user_id, credit_cost, "ai_message")
        
        # Audit log
        audit_logger.log_console_operation(
            user_id=user_id,
            operation="message",
            prompt=request.message,
            response=ai_response['response'],
            credits_used=credit_cost,
            tier=tier
        )
        
        return MessageResponse(
            response=ai_response['response'],
            reasoning=ai_response.get('reasoning'),
            credits_remaining=new_balance,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except HTTPException:
        raise
    except OpenRouterRateLimitError as e:
        logger.warning(f"Rate limit error: {str(e)}")
        raise HTTPException(
            status_code=429, 
            detail="The AI model is temporarily rate-limited. Please try again in a moment, or contact support to add your own API key."
        )
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ============================================================================
# FILE UPLOAD ENDPOINT
# ============================================================================

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    tier: str = Form(...)
):
    """
    Upload a document for AI analysis.
    
    Validates file type, size, and tier-based limits.
    Parses content and stores temporarily.
    """
    try:
        # Validate file type
        allowed_types = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                        'text/csv', 'text/plain']
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, DOCX, CSV, TXT supported")
        
        # Validate file size based on tier
        max_size = tier_validator.get_max_file_size(tier)
        content = await file.read()
        if len(content) > max_size:
            raise HTTPException(status_code=413, detail=f"File too large for {tier} tier")
        
        # Parse file content
        parsed_content = document_parser.parse(content, file.content_type, file.filename)
        
        # Store temporarily (mock for now - in production, use session storage)
        file_id = f"file_{datetime.utcnow().timestamp()}"
        
        return {
            "file_id": file_id,
            "filename": file.filename,
            "size": len(content),
            "type": file.content_type,
            "preview": parsed_content[:500] if parsed_content else "",
            "parsed": bool(parsed_content),
            "expires_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail="File upload failed")

# ============================================================================
# CONTEXT ENDPOINT
# ============================================================================

@router.get("/context")
async def get_context(tier: str = "builder", user_id: str = "demo_user"):
    """
    Get current console context data.
    
    Returns tier, credits, workflows, executions, and feature flags.
    """
    try:
        credits = credit_manager.get_credits(user_id)
        credit_limit = tier_validator.get_credit_limit(tier)
        features = tier_validator.get_tier_features(tier)
        
        # Mock workflow and execution data
        workflows = [
            {
                "id": "wf-123",
                "name": "Invoice Processing",
                "status": "active",
                "last_run": "2025-02-15T10:00:00Z"
            }
        ]
        
        executions = [
            {
                "id": "exec-456",
                "workflow_id": "wf-123",
                "workflow_name": "Invoice Processing",
                "status": "success",
                "timestamp": "2025-02-15T10:00:00Z"
            }
        ]
        
        return {
            "tier": tier,
            "credits": credits,
            "credit_limit": credit_limit,
            "workflows": workflows,
            "executions": executions,
            "features": features
        }
        
    except Exception as e:
        logger.error(f"Error fetching context: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch context")

# ============================================================================
# WORKFLOW GENERATION ENDPOINT
# ============================================================================

@router.post("/workflow/generate")
async def generate_workflow(request: WorkflowGenerateRequest):
    """
    Generate workflow JSON from natural language.
    
    Validates tier permissions and deducts credits.
    """
    try:
        # Validate tier permissions
        if not tier_validator.validate_workflow_generation(request.tier):
            raise HTTPException(status_code=403, detail="Workflow generation not available for your tier")
        
        # Estimate credit cost based on complexity
        credit_cost = workflow_generator.estimate_cost(request.prompt, request.tier)
        
        # Validate credits
        user_id = "demo_user"  # In production, get from session
        credits = credit_manager.get_credits(user_id)
        if credits < credit_cost:
            raise HTTPException(status_code=402, detail=f"Insufficient credits. Need {credit_cost}, have {credits}")
        
        # Generate workflow
        workflow_data = await workflow_generator.generate(request.prompt, request.tier)
        
        # Deduct credits
        new_balance = credit_manager.deduct_credits(user_id, credit_cost, "workflow_generation")
        
        # Audit log
        audit_logger.log_console_operation(
            user_id=user_id,
            operation="workflow_generation",
            prompt=request.prompt,
            response=str(workflow_data),
            credits_used=credit_cost,
            tier=request.tier
        )
        
        return {
            "workflow": workflow_data['workflow'],
            "preview": workflow_data['preview'],
            "credits_deducted": credit_cost,
            "credits_remaining": new_balance
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating workflow: {str(e)}")
        raise HTTPException(status_code=500, detail="Workflow generation failed")

# ============================================================================
# WORKFLOW CONFIRMATION ENDPOINT
# ============================================================================

@router.post("/workflow/confirm")
async def confirm_workflow(request: WorkflowConfirmRequest):
    """
    Confirm and save generated workflow.
    """
    try:
        # In production, save to database
        workflow_id = f"wf_{datetime.utcnow().timestamp()}"
        
        return {
            "workflow_id": workflow_id,
            "status": "created",
            "message": "Workflow created successfully"
        }
        
    except Exception as e:
        logger.error(f"Error confirming workflow: {str(e)}")
        raise HTTPException(status_code=500, detail="Workflow confirmation failed")
