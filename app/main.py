from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import httpx

from app.config import settings
from app.api.routes import diagnostic, contact, tier, auth, console, n8n, blueprint, workflows

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI readiness diagnostics platform"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diagnostic.router, prefix="/api/v1")
app.include_router(contact.router, prefix="/api/v1")
app.include_router(tier.router)
app.include_router(console.router)
app.include_router(n8n.router)
app.include_router(blueprint.router)
app.include_router(workflows.router)

# Import new auth router
from app.api.routes import auth as auth_v2
app.include_router(auth_v2.router)


@app.get("/health")
async def health_check():
    """Health check endpoint that reports LLM availability"""
    llm_available = False
    
    # Check Ollama availability
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(f"{settings.ollama_base_url}/api/tags")
            llm_available = response.status_code == 200
    except Exception:
        llm_available = False
    
    return {
        "status": "healthy",
        "llm_available": llm_available,
        "timestamp": datetime.utcnow().isoformat()
    }
