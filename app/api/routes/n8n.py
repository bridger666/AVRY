"""n8n Integration API Routes"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import logging

from app.integrations.n8n_client import N8nClient
from app.config import settings

router = APIRouter(prefix="/api/n8n", tags=["n8n"])
logger = logging.getLogger(__name__)

# Initialize n8n client
n8n_client = N8nClient(
    base_url=settings.n8n_base_url,
    timeout=settings.n8n_timeout,
    max_retries=settings.n8n_max_retries
)


class WebhookRequest(BaseModel):
    webhook_path: str
    payload: Dict[str, Any]
    method: str = "POST"


@router.get("/health")
async def check_n8n_health():
    """Check n8n connection health"""
    try:
        health = await n8n_client.health_check()
        
        if health["status"] == "connected":
            return health
        else:
            raise HTTPException(status_code=503, detail=health)
            
    except Exception as e:
        logger.error(f"n8n health check failed: {e}")
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/webhook")
async def trigger_webhook(request: WebhookRequest):
    """Trigger n8n webhook"""
    try:
        response = await n8n_client.trigger_webhook(
            webhook_path=request.webhook_path,
            payload=request.payload,
            method=request.method
        )
        
        return {
            "status": "success",
            "response": response
        }
        
    except ConnectionError as e:
        logger.error(f"n8n webhook trigger failed: {e}")
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"n8n webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
