"""
Blueprint API endpoints for generation, retrieval, and downloads.
"""

import logging
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import FileResponse, JSONResponse
from typing import List

from app.models.blueprint import (
    BlueprintGenerationRequest,
    BlueprintGenerationResult,
    BlueprintMetadata
)
from app.services.blueprint_generation import BlueprintGenerationService
from app.services.blueprint_storage import BlueprintStorageService
from app.services.payment_validation import PaymentValidationService

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/v1/blueprint", tags=["blueprint"])

# Initialize services
generation_service = BlueprintGenerationService()
storage_service = BlueprintStorageService()
payment_service = PaymentValidationService()


@router.post("/generate", response_model=BlueprintGenerationResult)
async def generate_blueprint(request: BlueprintGenerationRequest):
    """
    Generate AI Blueprint from Snapshot data.
    
    Validates payment status and generates complete Blueprint with JSON and PDF outputs.
    
    Args:
        request: BlueprintGenerationRequest with user_id, snapshot_id
        
    Returns:
        BlueprintGenerationResult with blueprint_id and download URLs
    """
    try:
        logger.info(f"Blueprint generation requested for user {request.user_id}, snapshot {request.snapshot_id}")
        
        result = await generation_service.generate_blueprint(
            user_id=request.user_id,
            snapshot_id=request.snapshot_id
        )
        
        if result.success:
            logger.info(f"Blueprint generated successfully: {result.blueprint_id}")
        else:
            logger.warning(f"Blueprint generation failed: {result.message}")
        
        return result
        
    except Exception as e:
        logger.error(f"Blueprint generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list", response_model=List[BlueprintMetadata])
async def list_blueprints(user_id: str):
    """
    List all blueprints for user.
    
    Super admin sees all blueprints.
    Regular users see only their own.
    
    Args:
        user_id: User identifier
        
    Returns:
        List of BlueprintMetadata
    """
    try:
        blueprints = await storage_service.list_user_blueprints(user_id)
        return blueprints
        
    except Exception as e:
        logger.error(f"Error listing blueprints: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{blueprint_id}", response_model=dict)
async def get_blueprint(blueprint_id: str, user_id: str):
    """
    Get specific Blueprint JSON content.
    
    Validates access control (owner or super admin).
    
    Args:
        blueprint_id: Blueprint identifier
        user_id: Requesting user ID
        
    Returns:
        Full Blueprint JSON content
    """
    try:
        blueprint_json = await storage_service.retrieve_blueprint_json(
            blueprint_id,
            user_id
        )
        
        if not blueprint_json:
            raise HTTPException(
                status_code=403,
                detail="Access denied or blueprint not found"
            )
        
        return blueprint_json
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving blueprint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{blueprint_id}/download/json")
async def download_blueprint_json(blueprint_id: str, user_id: str):
    """
    Download Blueprint JSON file.
    
    Args:
        blueprint_id: Blueprint identifier
        user_id: Requesting user ID
        
    Returns:
        JSON file as downloadable attachment
    """
    try:
        # Retrieve blueprint JSON
        blueprint_json = await storage_service.retrieve_blueprint_json(
            blueprint_id,
            user_id
        )
        
        if not blueprint_json:
            raise HTTPException(
                status_code=403,
                detail="Access denied or blueprint not found"
            )
        
        # Get system name for filename
        system_name = blueprint_json.get("system_name", "blueprint")
        filename = f"{system_name.replace(' ', '_')}_blueprint.json"
        
        # Log download event
        logger.info(f"Blueprint JSON downloaded: {blueprint_id} by user {user_id}")
        
        # Return JSON as downloadable file
        return JSONResponse(
            content=blueprint_json,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading JSON: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{blueprint_id}/download/pdf")
async def download_blueprint_pdf(blueprint_id: str, user_id: str):
    """
    Download Blueprint PDF file.
    
    Args:
        blueprint_id: Blueprint identifier
        user_id: Requesting user ID
        
    Returns:
        PDF file as downloadable attachment
    """
    try:
        # Retrieve blueprint PDF
        pdf_bytes = await storage_service.retrieve_blueprint_pdf(
            blueprint_id,
            user_id
        )
        
        if not pdf_bytes:
            raise HTTPException(
                status_code=403,
                detail="Access denied or blueprint not found"
            )
        
        # Get metadata for filename
        metadata = await storage_service.get_blueprint_metadata(blueprint_id)
        if metadata:
            system_name = metadata.system_name
        else:
            system_name = "blueprint"
        
        filename = f"{system_name.replace(' ', '_')}_blueprint.pdf"
        
        # Log download event
        logger.info(f"Blueprint PDF downloaded: {blueprint_id} by user {user_id}")
        
        # Return PDF as downloadable file
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/payment/record")
async def record_payment(user_id: str, amount: float, payment_method: str = "stripe"):
    """
    Record successful Blueprint payment.
    
    Args:
        user_id: User identifier
        amount: Payment amount
        payment_method: Payment method used
        
    Returns:
        Success status
    """
    try:
        success = await payment_service.record_payment(
            user_id,
            amount,
            payment_method
        )
        
        if success:
            return {"success": True, "message": "Payment recorded successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to record payment")
        
    except Exception as e:
        logger.error(f"Error recording payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))
