"""
API routes for tier management and limit checking.
"""

from fastapi import APIRouter, HTTPException
from app.models.user_tier import (
    WorkflowCreationRequest,
    WorkflowExecutionRequest,
    LimitCheckResponse,
    UserTierState,
    TierLevel
)
from app.services.tier_service import tier_service

router = APIRouter(prefix="/api/v1/tier", tags=["tier"])


@router.get("/check-workflow-limit/{user_id}", response_model=LimitCheckResponse)
async def check_workflow_limit(user_id: str):
    """
    Check if user can create a new workflow.
    """
    return tier_service.can_create_workflow(user_id)


@router.get("/check-execution-limit/{user_id}", response_model=LimitCheckResponse)
async def check_execution_limit(user_id: str):
    """
    Check if user can execute a workflow.
    """
    return tier_service.can_execute_workflow(user_id)


@router.post("/create-workflow", response_model=UserTierState)
async def create_workflow(request: WorkflowCreationRequest):
    """
    Create a new workflow (increments workflow count).
    """
    # Check limit
    limit_check = tier_service.can_create_workflow(request.user_id)
    if not limit_check.allowed:
        raise HTTPException(status_code=403, detail=limit_check.message)
    
    # Increment count
    state = tier_service.increment_workflow_count(request.user_id)
    return state


@router.post("/execute-workflow", response_model=UserTierState)
async def execute_workflow(request: WorkflowExecutionRequest):
    """
    Execute a workflow (increments execution count).
    """
    # Check limit
    limit_check = tier_service.can_execute_workflow(request.user_id)
    if not limit_check.allowed:
        raise HTTPException(status_code=403, detail=limit_check.message)
    
    # Increment count
    state = tier_service.increment_execution_count(request.user_id)
    return state


@router.get("/state/{user_id}", response_model=UserTierState)
async def get_user_state(user_id: str):
    """
    Get user's current tier state.
    """
    return tier_service.get_user_state(user_id)


@router.post("/set-tier/{user_id}/{tier}", response_model=UserTierState)
async def set_user_tier(user_id: str, tier: TierLevel):
    """
    Set user's subscription tier.
    """
    return tier_service.set_user_tier(user_id, tier)


@router.post("/reset-executions/{user_id}", response_model=UserTierState)
async def reset_executions(user_id: str):
    """
    Reset monthly execution count (admin endpoint).
    """
    return tier_service.reset_execution_count(user_id)
