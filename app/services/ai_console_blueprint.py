"""
AI Console Blueprint upload and translation service.
"""

from typing import Optional
from app.models.blueprint import UploadResult, SchemaType
from app.services.metadata_embedding import MetadataEmbeddingService
from app.services.blueprint_storage import BlueprintStorageService


class AIConsoleService:
    """
    Handles Blueprint uploads and schema-based routing for AI Console.
    
    Routes:
    - Fast path: aivory-v1 schema → direct JSON-to-n8n translation
    - Fallback: external/unknown schema → manual interpretation mode
    """
    
    def __init__(self):
        """Initialize AI Console service."""
        self.metadata_service = MetadataEmbeddingService()
        self.storage_service = BlueprintStorageService()
    
    async def upload_blueprint(
        self,
        user_id: str,
        pdf_bytes: bytes
    ) -> UploadResult:
        """
        Process uploaded Blueprint PDF.
        
        Steps:
        1. Extract metadata (blueprint_id, schema_version)
        2. Detect schema type
        3. Route to appropriate translation path
        4. Return processing status
        
        Args:
            user_id: User identifier
            pdf_bytes: PDF file bytes
            
        Returns:
            UploadResult with schema type and translation status
        """
        try:
            # Extract metadata
            metadata = self.metadata_service.extract_metadata(pdf_bytes)
            
            if not metadata:
                # External blueprint without metadata
                return UploadResult(
                    success=True,
                    blueprint_id=None,
                    schema_type="external-unknown",
                    message="External blueprint detected - using interpretation mode",
                    translation_status="manual-required"
                )
            
            blueprint_id = metadata.get('blueprint_id')
            schema_version = metadata.get('schema_version')
            
            # Detect schema type
            schema_type = self._detect_schema_type(schema_version)
            
            if schema_type == "aivory-v1":
                # Fast path
                return UploadResult(
                    success=True,
                    blueprint_id=blueprint_id,
                    schema_type="aivory-v1",
                    message="Aivory Blueprint detected - using optimized translation",
                    translation_status="ready"
                )
            else:
                # Fallback mode
                return UploadResult(
                    success=True,
                    blueprint_id=blueprint_id,
                    schema_type="external-known",
                    message="External blueprint detected - using interpretation mode",
                    translation_status="manual-required"
                )
                
        except Exception as e:
            return UploadResult(
                success=False,
                blueprint_id=None,
                schema_type="external-unknown",
                message=f"Upload failed: {str(e)}",
                translation_status="manual-required"
            )
    
    def _detect_schema_type(self, schema_version: Optional[str]) -> str:
        """
        Detect Blueprint schema type.
        
        Args:
            schema_version: Schema version string
            
        Returns:
            Schema type: "aivory-v1", "external-known", or "external-unknown"
        """
        if not schema_version:
            return "external-unknown"
        
        if schema_version == "aivory-v1":
            return "aivory-v1"
        else:
            return "external-known"
    
    async def translate_aivory_blueprint(
        self,
        blueprint_id: str,
        user_id: str
    ) -> dict:
        """
        Fast path: Translate aivory-v1 Blueprint to n8n.
        
        Steps:
        1. Retrieve Blueprint JSON
        2. Parse agents and workflows
        3. Map to n8n workflow nodes and connections
        4. Return n8n workflow JSON for user review
        
        Args:
            blueprint_id: Blueprint identifier
            user_id: User identifier
            
        Returns:
            n8n workflow JSON
        """
        # Retrieve Blueprint JSON
        blueprint_json = await self.storage_service.retrieve_blueprint_json(
            blueprint_id,
            user_id
        )
        
        if not blueprint_json:
            raise ValueError("Blueprint not found or access denied")
        
        # Simple n8n workflow generation
        # In production, this would be more sophisticated
        n8n_workflow = {
            "name": blueprint_json.get("system_name", "AI Workflow"),
            "nodes": [],
            "connections": {},
            "settings": {
                "executionOrder": "v1"
            }
        }
        
        # Convert agents to n8n nodes
        agents = blueprint_json.get("agents", [])
        for idx, agent in enumerate(agents):
            node = {
                "id": agent.get("id"),
                "name": agent.get("name"),
                "type": "n8n-nodes-base.function",
                "position": [250, 300 + (idx * 150)],
                "parameters": {
                    "functionCode": f"// {agent.get('name')}\n// Trigger: {agent.get('trigger')}\n// Tools: {', '.join(agent.get('tools', []))}"
                }
            }
            n8n_workflow["nodes"].append(node)
        
        return n8n_workflow
    
    async def interpret_external_blueprint(
        self,
        pdf_bytes: bytes
    ) -> dict:
        """
        Fallback: Interpret external blueprint with AI.
        
        Steps:
        1. Extract text from PDF
        2. Use LLM to identify system components
        3. Present interpretation to user
        4. Allow manual refinement
        
        Args:
            pdf_bytes: PDF file bytes
            
        Returns:
            Interpretation result
        """
        # Simplified implementation
        # In production, this would use LLM to interpret PDF content
        return {
            "success": True,
            "message": "External blueprint interpretation requires manual review",
            "interpretation": {
                "system_name": "External System",
                "agents": [],
                "workflows": []
            }
        }
