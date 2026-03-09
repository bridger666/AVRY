"""
Workflow Generator Service - AI-powered workflow creation
"""

import logging
from typing import Dict, Any
from app.llm.openrouter_client import OpenRouterClient, OpenRouterMessage
from app.model_config import ModelSelector
from app.config import settings

logger = logging.getLogger(__name__)

class WorkflowGenerator:
    """
    Generates workflow JSON from natural language descriptions.
    Uses AI to convert user intent into structured workflow definitions.
    """
    
    def __init__(self):
        self.openrouter_client = OpenRouterClient(
            api_key=settings.openrouter_api_key,
            base_url=settings.openrouter_base_url
        )
    
    async def generate(self, prompt: str, tier: str) -> Dict[str, Any]:
        """
        Generate workflow from natural language prompt.
        
        Args:
            prompt: User's workflow description
            tier: User's subscription tier
            
        Returns:
            Dict with workflow JSON and preview
        """
        try:
            # Build system prompt for workflow generation
            system_prompt = self._get_workflow_system_prompt(tier)
            
            # Select model for workflow generation (short/medium output)
            model = ModelSelector.get_model_for_task("workflow_generation")
            model_specs = ModelSelector.get_model_specs(model)
            
            # Call AI to generate workflow
            messages = [
                OpenRouterMessage(role="system", content=system_prompt),
                OpenRouterMessage(role="user", content=f"Generate a workflow for: {prompt}")
            ]
            
            response = await self.openrouter_client.chat_completion(
                messages=messages,
                model=model,
                temperature=model_specs["temperature_default"],
                max_tokens=model_specs["max_tokens"],
                timeout=model_specs["timeout"]
            )
            
            # Extract workflow (in production, parse JSON from response)
            workflow_json = self._parse_workflow_response(response, prompt, tier)
            
            # Generate preview
            preview = self._generate_preview(workflow_json)
            
            return {
                "workflow": workflow_json,
                "preview": preview
            }
            
        except Exception as e:
            logger.error(f"Error generating workflow: {str(e)}")
            raise
    
    def estimate_cost(self, prompt: str, tier: str) -> int:
        """
        Estimate credit cost for workflow generation.
        
        Args:
            prompt: Workflow description
            tier: User tier
            
        Returns:
            Estimated credit cost
        """
        # Analyze complexity
        word_count = len(prompt.split())
        
        if tier == "builder":
            return 5  # Simple suggestions
        elif tier == "operator":
            if word_count < 20:
                return 8  # Simple workflow
            else:
                return 15  # Complex workflow
        else:  # enterprise
            if word_count < 20:
                return 15  # Agentic workflow
            else:
                return 25  # Enterprise architecture
    
    def _get_workflow_system_prompt(self, tier: str) -> str:
        """Get system prompt for workflow generation based on tier."""
        base_prompt = """You are a workflow generation AI. Generate structured workflow JSON from user descriptions.

Workflow structure:
{
  "name": "Workflow Name",
  "trigger": "trigger_type",
  "steps": [
    {"type": "action", "service": "service_name", "method": "method_name"},
    {"type": "condition", "field": "field_name", "operator": "operator", "value": "value"},
    {"type": "ai_decision", "model": "model_name", "prompt": "decision_prompt"}
  ]
}

Respond with valid JSON only."""
        
        tier_prompts = {
            "builder": base_prompt + "\n\nGenerate simple, single-path workflows with basic actions.",
            "operator": base_prompt + "\n\nGenerate full workflows with conditions, loops, and AI decisions.",
            "enterprise": base_prompt + "\n\nGenerate complex multi-model workflows with advanced orchestration."
        }
        
        return tier_prompts.get(tier, base_prompt)
    
    def _parse_workflow_response(self, response: Dict, prompt: str, tier: str) -> Dict[str, Any]:
        """Parse AI response into workflow JSON."""
        # In production, parse JSON from AI response
        # For now, generate mock workflow based on prompt
        
        workflow_name = self._extract_workflow_name(prompt)
        model = ModelSelector.get_model_for_task("workflow_generation")
        
        return {
            "name": workflow_name,
            "trigger": "manual",
            "steps": [
                {
                    "type": "ai_decision",
                    "model": model,
                    "prompt": f"Analyze and process: {prompt}"
                },
                {
                    "type": "condition",
                    "field": "confidence",
                    "operator": ">",
                    "value": 0.8
                },
                {
                    "type": "action",
                    "service": "notification",
                    "method": "send",
                    "params": {
                        "message": "Workflow completed successfully"
                    }
                }
            ]
        }
    
    def _extract_workflow_name(self, prompt: str) -> str:
        """Extract workflow name from prompt."""
        # Simple extraction (in production, use AI)
        words = prompt.split()[:5]
        return " ".join(words).title() + " Workflow"
    
    def _generate_preview(self, workflow: Dict[str, Any]) -> Dict[str, Any]:
        """Generate human-readable preview of workflow."""
        steps = workflow.get('steps', [])
        
        step_descriptions = []
        for step in steps:
            if step['type'] == 'ai_decision':
                step_descriptions.append(f"AI Decision: {step.get('model', 'AI')}")
            elif step['type'] == 'condition':
                step_descriptions.append(f"Condition: {step.get('field')} {step.get('operator')} {step.get('value')}")
            elif step['type'] == 'action':
                step_descriptions.append(f"Action: {step.get('service')} - {step.get('method')}")
        
        # Extract integrations
        integrations = list(set([
            step.get('service', '') for step in steps if step['type'] == 'action'
        ]))
        
        return {
            "trigger": workflow.get('trigger', 'manual').replace('_', ' ').title(),
            "steps": step_descriptions,
            "integrations": [i.title() for i in integrations if i]
        }
