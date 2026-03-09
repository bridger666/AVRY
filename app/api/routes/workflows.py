"""
Workflows API endpoints - Minimal implementation for dashboard
"""

import logging
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/workflows", tags=["workflows"])


@router.get("/list")
async def list_workflows(user_id: str = Query(..., description="User ID")):
    """
    List workflows for a user.
    
    Returns empty list for now - placeholder for future implementation.
    """
    logger.info(f"Listing workflows for user: {user_id}")
    
    # Return empty list - no workflows yet
    return []


@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str, user_id: str = Query(...)):
    """
    Get workflow details.
    
    Placeholder for future implementation.
    """
    logger.info(f"Getting workflow {workflow_id} for user {user_id}")
    
    raise HTTPException(status_code=404, detail="Workflow not found")


@router.post("/create")
async def create_workflow(user_id: str = Query(...)):
    """
    Create a new workflow.
    
    Placeholder for future implementation.
    """
    logger.info(f"Creating workflow for user {user_id}")
    
    raise HTTPException(status_code=501, detail="Not implemented yet")
