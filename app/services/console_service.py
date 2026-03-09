"""
Console Service - Core business logic for AI Command Console
"""

import logging
from typing import Dict, List, Optional, Any
from app.llm.openrouter_client import OpenRouterClient, OpenRouterMessage, OpenRouterRateLimitError
from app.model_config import ModelSelector
from app.config import settings
from app.prompts.console_prompts import get_console_system_prompt

logger = logging.getLogger(__name__)

class ConsoleService:
    """
    Core service for console operations.
    Orchestrates AI interactions, document intelligence, and command execution.
    """
    
    # Model fallback order for rate limit handling
    FALLBACK_MODELS = [
        "qwen/qwen3-vl-30b-a3b-thinking",
        "qwen/qwen3-vl-235b-a22b-thinking",
        "qwen/qwen3-next-80b-a3b-instruct:free",
        "qwen/qwen3-235b-a22b-thinking-2507",
        "qwen/qwen3-4b:free"
    ]
    
    def __init__(self):
        self.openrouter_client = OpenRouterClient(
            api_key=settings.openrouter_api_key,
            base_url=settings.openrouter_base_url
        )
    
    async def process_message(
        self,
        message: str,
        files: List[str] = None,
        workflow: Optional[str] = None,
        tier: str = "builder",
        user_id: str = "demo_user",
        has_snapshot: bool = False,
        has_blueprint: bool = False
    ) -> Dict[str, Any]:
        """
        Process a console message and return AI response with reasoning.
        Implements automatic model fallback on rate limits.
        
        Args:
            message: User message
            files: List of file IDs attached to message
            workflow: Workflow ID attached to message
            tier: User's subscription tier
            user_id: User identifier
            has_snapshot: Whether user has completed AI Snapshot
            has_blueprint: Whether user has completed AI Blueprint
            
        Returns:
            Dict with response and reasoning metadata
        """
        try:
            # Build context for AI
            context = self._build_context(message, files, workflow, tier)
            
            # Build messages for OpenRouter with ARIA system prompt
            system_prompt = get_console_system_prompt(
                tier=tier,
                has_snapshot=has_snapshot,
                has_blueprint=has_blueprint
            )
            messages = [
                OpenRouterMessage(role="system", content=system_prompt),
                OpenRouterMessage(role="user", content=context)
            ]
            
            # Try models in fallback order
            last_error = None
            for model in self.FALLBACK_MODELS:
                try:
                    logger.info(f"Attempting console chat with model: {model}")
                    
                    # Get model specs (use defaults if not found)
                    try:
                        model_specs = ModelSelector.get_model_specs(model)
                    except:
                        model_specs = {
                            "temperature_default": 0.3,
                            "max_tokens": 2000,
                            "timeout": 60.0
                        }
                    
                    # Call OpenRouter API
                    ai_response_text = await self.openrouter_client.chat_completion(
                        messages=messages,
                        model=model,
                        temperature=model_specs["temperature_default"],
                        max_tokens=model_specs["max_tokens"],
                        timeout=model_specs["timeout"]
                    )
                    
                    # Success! Build response
                    logger.info(f"✅ Successfully got response from model: {model}")
                    ai_response = {
                        "response": ai_response_text,
                        "model": model,
                        "usage": {
                            "total_tokens": len(ai_response_text.split()) * 2  # Rough estimate
                        }
                    }
                    
                    # Build reasoning metadata
                    reasoning = self._build_reasoning_metadata(ai_response, tier)
                    
                    return {
                        "response": ai_response_text,
                        "reasoning": reasoning
                    }
                    
                except OpenRouterRateLimitError as e:
                    logger.warning(f"⚠️ Model {model} rate limited, trying next model...")
                    last_error = e
                    continue  # Try next model
                    
                except Exception as e:
                    logger.error(f"❌ Error with model {model}: {str(e)}")
                    last_error = e
                    continue  # Try next model
            
            # All models failed
            if last_error:
                if isinstance(last_error, OpenRouterRateLimitError):
                    raise OpenRouterRateLimitError("All models are rate-limited. Please try again later.")
                raise last_error
            else:
                raise Exception("All models failed without specific error")
            
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            raise
    
    def _build_context(
        self,
        message: str,
        files: Optional[List[str]],
        workflow: Optional[str],
        tier: str
    ) -> str:
        """Build context string for AI with message, files, and workflow."""
        context_parts = [message]
        
        if files:
            context_parts.append(f"\n\n[Attached Files: {len(files)} files]")
            # In production, fetch and include file content
        
        if workflow:
            context_parts.append(f"\n\n[Attached Workflow: {workflow}]")
            # In production, fetch and include workflow JSON
        
        return "\n".join(context_parts)
    
    def _select_model(self, tier: str) -> str:
        """
        Select AI model based on tier.
        All tiers now use deepseek-v3-2-free for console chat (fast response).
        """
        # Console chat is always short/medium output, use DeepSeek Free
        model = ModelSelector.get_model_for_task("console_chat")
        logger.info(f"Selected model {model} for tier {tier}")
        return model
    
    # Removed _get_system_prompt - now using get_console_system_prompt from prompts module
    
    def _build_reasoning_metadata(self, ai_response: Dict, tier: str) -> Optional[Dict[str, Any]]:
        """Build reasoning metadata from AI response."""
        if tier == "builder":
            return None  # Builder tier doesn't get reasoning panel
        
        usage = ai_response.get('usage', {})
        model = ai_response.get('model', 'unknown')
        
        reasoning = {
            "model": model,
            "tokens": usage.get('total_tokens', 0),
            "confidence": 0.85,  # Mock confidence score
            "cost": 1  # Credits
        }
        
        if tier == "enterprise":
            reasoning["routing_path"] = [model]
            reasoning["multi_model_breakdown"] = {
                model: usage.get('total_tokens', 0)
            }
        
        return reasoning
