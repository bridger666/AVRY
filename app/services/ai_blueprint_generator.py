"""
AI-powered Blueprint content generation service using OpenRouter LLM.
"""

import json
import uuid
from typing import List, Optional
from datetime import datetime

from app.models.blueprint import (
    AgentDefinition,
    WorkflowDefinition,
    IntegrationRequirement,
    SnapshotData
)
from app.llm.openrouter_client import OpenRouterClient
from app.config import settings


class AIBlueprintGenerator:
    """
    Generates Blueprint content using AI analysis of Snapshot data.
    
    Generates:
    - System names
    - Agent definitions
    - Workflow descriptions
    - Integration requirements
    - Deployment estimates
    """
    
    def __init__(self):
        """Initialize AI generation service."""
        from app.config import settings
        self.llm_client = OpenRouterClient(
            api_key=settings.openrouter_api_key,
            base_url=settings.openrouter_base_url
        )
    
    async def generate_system_name(
        self,
        snapshot_data: SnapshotData
    ) -> str:
        """
        Generate concise, descriptive system name using AI.
        
        Args:
            snapshot_data: AI Snapshot data
            
        Returns:
            System name (2-5 words)
        """
        prompt = f"""Based on this AI readiness snapshot:
- Business objective: {snapshot_data.primary_objective}
- Industry: {snapshot_data.industry or 'General'}
- Key processes: {', '.join(snapshot_data.key_processes[:3])}

Generate a professional 2-5 word system name that describes the AI system this organization should build.

Examples:
- 'Customer Service Automation Hub'
- 'Sales Intelligence Platform'
- 'Operations Optimization System'

Return only the system name, no explanation."""
        
        try:
            response = await self.llm_client.generate(
                prompt=prompt,
                max_tokens=50,
                temperature=0.7
            )
            
            system_name = response.strip().strip('"').strip("'")
            
            # Validate length
            if len(system_name) < 5 or len(system_name) > 100:
                raise ValueError("System name out of range")
            
            return system_name
            
        except Exception as e:
            print(f"AI system name generation failed: {e}")
            # Fallback format
            return f"{snapshot_data.company_name} AI System"
    
    async def generate_agents(
        self,
        snapshot_data: SnapshotData,
        system_name: str
    ) -> List[AgentDefinition]:
        """
        Generate 2-5 agents based on automation opportunities.
        
        Args:
            snapshot_data: AI Snapshot data
            system_name: Generated system name
            
        Returns:
            List of AgentDefinition objects
        """
        prompt = f"""Based on this AI readiness snapshot:
- Readiness score: {snapshot_data.readiness_score}/100
- Automation level: {snapshot_data.automation_level}
- Key workflows: {', '.join(snapshot_data.workflows[:3])}
- Pain points: {', '.join(snapshot_data.pain_points[:3])}

Design 2-5 AI agents for the '{system_name}' system.

For each agent, provide:
1. Name: Descriptive agent name
2. Trigger: When it activates (schedule/webhook/event/manual)
3. Tools: Required capabilities (email, database, API, etc.)
4. Pseudo logic: 3-5 IF/ELSE/THEN statements describing behavior

Format as JSON array:
[
  {{
    "name": "Agent Name",
    "trigger": "trigger_type",
    "tools": ["tool1", "tool2"],
    "pseudo_logic": [
      "IF condition → action()",
      "ELSE IF condition → action()",
      "ELSE → fallback()"
    ]
  }}
]

Return only valid JSON, no explanation."""
        
        try:
            response = await self.llm_client.generate(
                prompt=prompt,
                max_tokens=1000,
                temperature=0.7
            )
            
            # Parse JSON response
            agents_data = json.loads(response)
            
            # Ensure 2-5 agents
            if len(agents_data) < 2:
                agents_data = agents_data + [self._create_default_agent(len(agents_data) + 1)]
            if len(agents_data) > 5:
                agents_data = agents_data[:5]
            
            # Convert to AgentDefinition objects with IDs
            agents = []
            for idx, agent_data in enumerate(agents_data, 1):
                agent = AgentDefinition(
                    id=f"agent_{idx:02d}",
                    name=agent_data.get("name", f"Agent {idx}"),
                    trigger=agent_data.get("trigger", "manual"),
                    tools=agent_data.get("tools", ["api"]),
                    pseudo_logic=agent_data.get("pseudo_logic", [
                        "IF input_received → process_data()",
                        "ELSE → wait_for_input()"
                    ])
                )
                agents.append(agent)
            
            return agents
            
        except Exception as e:
            print(f"AI agent generation failed: {e}")
            # Fallback: create 2 default agents
            return [
                self._create_default_agent(1),
                self._create_default_agent(2)
            ]
    
    def _create_default_agent(self, index: int) -> AgentDefinition:
        """Create a default agent definition."""
        return AgentDefinition(
            id=f"agent_{index:02d}",
            name=f"Automation Agent {index}",
            trigger="manual",
            tools=["api", "database"],
            pseudo_logic=[
                "IF task_received → execute_task()",
                "ELSE IF error_detected → log_error()",
                "ELSE → wait_for_task()"
            ]
        )
    
    async def generate_workflows(
        self,
        agents: List[AgentDefinition],
        snapshot_data: SnapshotData
    ) -> List[WorkflowDefinition]:
        """
        Generate workflow definitions connecting agents.
        
        Args:
            agents: List of generated agents
            snapshot_data: AI Snapshot data
            
        Returns:
            List of WorkflowDefinition objects
        """
        # Simple workflow generation: create 1-2 workflows
        workflows = []
        
        if len(agents) >= 2:
            workflows.append(WorkflowDefinition(
                id="workflow_01",
                name="Primary Automation Workflow",
                agents=[agents[0].id, agents[1].id],
                description=f"Automated workflow connecting {agents[0].name} and {agents[1].name} for streamlined processing"
            ))
        
        if len(agents) >= 3:
            workflows.append(WorkflowDefinition(
                id="workflow_02",
                name="Secondary Processing Workflow",
                agents=[agents[2].id] + ([agents[3].id] if len(agents) >= 4 else []),
                description=f"Supporting workflow for {agents[2].name} operations"
            ))
        
        return workflows if workflows else [
            WorkflowDefinition(
                id="workflow_01",
                name="Main Workflow",
                agents=[agents[0].id],
                description="Primary automation workflow"
            )
        ]
    
    async def detect_integrations(
        self,
        snapshot_data: SnapshotData,
        agents: List[AgentDefinition]
    ) -> List[IntegrationRequirement]:
        """
        Identify required external integrations.
        
        Args:
            snapshot_data: AI Snapshot data
            agents: Generated agents
            
        Returns:
            List of IntegrationRequirement objects
        """
        integrations = []
        
        # Extract tools from agents
        all_tools = set()
        for agent in agents:
            all_tools.update(agent.tools)
        
        # Map tools to integrations
        tool_integration_map = {
            "email": ("Email Service", "API", "high", "Email communication for notifications and responses"),
            "database": ("Database", "Database", "high", "Data storage and retrieval"),
            "api": ("REST API", "API", "medium", "External service integration"),
            "crm": ("CRM Platform", "API", "high", "Customer relationship management"),
            "erp": ("ERP System", "API", "medium", "Enterprise resource planning integration"),
            "slack": ("Slack", "Webhook", "low", "Team communication and notifications"),
            "calendar": ("Calendar Service", "API", "medium", "Scheduling and event management")
        }
        
        # Create integrations based on tools
        for tool in all_tools:
            if tool.lower() in tool_integration_map:
                service_name, int_type, priority, reason = tool_integration_map[tool.lower()]
                integrations.append(IntegrationRequirement(
                    service_name=service_name,
                    integration_type=int_type,
                    priority=priority,
                    reason=reason
                ))
        
        # Add common integrations based on industry
        if snapshot_data.industry:
            industry_lower = snapshot_data.industry.lower()
            if "retail" in industry_lower or "ecommerce" in industry_lower:
                integrations.append(IntegrationRequirement(
                    service_name="Payment Gateway",
                    integration_type="API",
                    priority="high",
                    reason="Process customer payments"
                ))
            elif "healthcare" in industry_lower:
                integrations.append(IntegrationRequirement(
                    service_name="EHR System",
                    integration_type="API",
                    priority="high",
                    reason="Electronic health records integration"
                ))
        
        return integrations if integrations else [
            IntegrationRequirement(
                service_name="Cloud Storage",
                integration_type="API",
                priority="medium",
                reason="Document and data storage"
            )
        ]
    
    def calculate_deployment_estimate(
        self,
        agents: List[AgentDefinition],
        integrations: List[IntegrationRequirement],
        readiness_score: int
    ) -> str:
        """
        Calculate implementation time estimate.
        
        Formula:
        base_hours = len(agents) * 8  # 8 hours per agent
        integration_hours = len(integrations) * 4  # 4 hours per integration
        complexity_multiplier = 1.0 + ((100 - readiness_score) / 100)
        
        total_hours = (base_hours + integration_hours) * complexity_multiplier
        
        Args:
            agents: List of agents
            integrations: List of integrations
            readiness_score: AI readiness score (0-100)
            
        Returns:
            Estimate string (e.g., "40-60 hours")
        """
        base_hours = len(agents) * 8
        integration_hours = len(integrations) * 4
        complexity_multiplier = 1.0 + ((100 - readiness_score) / 100)
        
        total_hours = int((base_hours + integration_hours) * complexity_multiplier)
        
        # Round to 20-hour ranges
        lower_bound = (total_hours // 20) * 20
        upper_bound = lower_bound + 20
        
        # Ensure minimum of 20 hours
        if lower_bound < 20:
            lower_bound = 20
            upper_bound = 40
        
        return f"{lower_bound}-{upper_bound} hours"
