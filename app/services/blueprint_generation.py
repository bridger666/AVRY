"""
Blueprint generation orchestration service.
"""

import json
import logging
from typing import Optional
from datetime import datetime

from app.models.blueprint import (
    BlueprintGenerationRequest,
    BlueprintGenerationResult,
    SnapshotData
)
from app.services.payment_validation import PaymentValidationService
from app.services.ai_blueprint_generator import AIBlueprintGenerator
from app.services.json_assembly import JSONAssemblyService
from app.services.pdf_renderer import PDFRenderingService
from app.services.metadata_embedding import MetadataEmbeddingService
from app.services.blueprint_storage import BlueprintStorageService
from app.database.db_service import db

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Super Admin Mock Data - Complete 30-question Snapshot
SUPERADMIN_MOCK_SNAPSHOT = {
    "snapshot_id": "snap_superadmin_demo",
    "diagnostic_id": "diag_superadmin_demo",
    "company_name": "Aivory Demo Corp",
    "industry": "SaaS / Technology",
    "email": "grandmaster@aivory.ai",
    "company_size": "11-50 employees",
    "annual_revenue": "USD 500k - 2M",
    "primary_goal": "increase_revenue",
    "readiness_score": 63,
    "automation_level": 25,
    "data_quality_score": 60,
    "pain_points": [
        "Manual lead qualification is consuming 3-4 hours daily",
        "No automated follow-up — deals lost due to slow response",
        "Customer support team handling 80% repetitive questions",
        "Onboarding process is fully manual, takes 5-7 days per client",
        "No visibility into sales pipeline health in real time"
    ],
    "current_tools": [
        "Gmail", "Google Sheets", "WhatsApp Business",
        "Notion", "Zoom", "Stripe", "Canva"
    ],
    "missing_tools": [
        "CRM system", "Marketing automation",
        "Support ticketing", "Analytics dashboard"
    ],
    "key_processes": [
        "Lead intake from website form",
        "Manual lead scoring by sales team",
        "WhatsApp follow-up sequence (manual)",
        "Client onboarding via email chain",
        "Monthly reporting via Google Sheets",
        "Support via WhatsApp and email (untracked)"
    ],
    "automation_opportunities": [
        "Lead scoring and qualification agent",
        "Automated WhatsApp follow-up sequences",
        "AI support agent for FAQ handling",
        "Onboarding workflow automation",
        "Real-time sales pipeline dashboard",
        "Monthly report auto-generation"
    ],
    "workflows": [
        {
            "name": "Lead Qualification Pipeline",
            "current_state": "manual",
            "frequency": "daily",
            "time_spent_hours_per_week": 15,
            "automation_potential": "high"
        },
        {
            "name": "Customer Support Handling",
            "current_state": "manual",
            "frequency": "daily",
            "time_spent_hours_per_week": 20,
            "automation_potential": "high"
        },
        {
            "name": "Client Onboarding",
            "current_state": "semi-manual",
            "frequency": "weekly",
            "time_spent_hours_per_week": 8,
            "automation_potential": "medium"
        },
        {
            "name": "Sales Follow-up",
            "current_state": "manual",
            "frequency": "daily",
            "time_spent_hours_per_week": 10,
            "automation_potential": "high"
        },
        {
            "name": "Monthly Reporting",
            "current_state": "manual",
            "frequency": "monthly",
            "time_spent_hours_per_week": 6,
            "automation_potential": "high"
        }
    ],
    "category_scores": {
        "workflow_maturity": 38,
        "data_infrastructure": 43,
        "automation_exposure": 45,
        "organizational_readiness": 55
    },
    "recommended_systems": [
        "Lead Scoring Agent",
        "Sales Qualification Agent",
        "AI Support Agent",
        "Onboarding Automation Workflow",
        "Conversion Intelligence Dashboard"
    ],
    "estimated_time_saved_hours_per_week": 42,
    "estimated_roi_multiplier": 3.2,
    "deployment_complexity": "medium",
    "deployment_estimate_days": 14,
    "priority_phase": "discovery",
    "snapshot_version": "1.0",
    "schema_version": "aivory-v1"
}


class SnapshotNotFoundError(Exception):
    """Raised when AI Snapshot data is not found."""
    pass


class BlueprintGenerationService:
    """
    Orchestrates end-to-end Blueprint generation from Snapshot data.
    
    Pipeline:
    1. Validate payment status (with super admin bypass)
    2. Retrieve AI Snapshot data
    3. Generate system name via AI
    4. Generate agents via AI
    5. Generate workflows
    6. Detect required integrations
    7. Calculate deployment estimate
    8. Assemble Blueprint JSON
    9. Render Blueprint PDF
    10. Embed metadata
    11. Store files
    12. Return result with download URLs
    """
    
    def __init__(self):
        """Initialize Blueprint generation service."""
        self.payment_service = PaymentValidationService()
        self.ai_generator = AIBlueprintGenerator()
        self.json_assembler = JSONAssemblyService()
        self.pdf_renderer = PDFRenderingService()
        self.metadata_service = MetadataEmbeddingService()
        self.storage_service = BlueprintStorageService()
    
    async def generate_blueprint(
        self,
        user_id: str,
        snapshot_id: str
    ) -> BlueprintGenerationResult:
        """
        Generate complete Blueprint from AI Snapshot.
        
        Args:
            user_id: User identifier
            snapshot_id: AI Snapshot identifier
            
        Returns:
            BlueprintGenerationResult with blueprint_id and URLs
            
        Raises:
            PaymentRequiredError: If payment not completed
            SnapshotNotFoundError: If Snapshot data unavailable
            GenerationError: If AI generation fails
        """
        try:
            # Step 1: Validate payment status
            validation = await self.payment_service.validate_blueprint_access(user_id)
            if not validation.allowed:
                return BlueprintGenerationResult(
                    success=False,
                    blueprint_id="",
                    json_url="",
                    pdf_url="",
                    message=validation.message
                )
            logger.info(f"Payment validated for user {user_id}")
            
            # Step 2: Retrieve AI Snapshot data
            snapshot_data = await self._retrieve_snapshot_data(snapshot_id, user_id)
            if not snapshot_data:
                raise SnapshotNotFoundError(f"AI Snapshot {snapshot_id} not found")
            
            logger.info(f"Retrieved snapshot {snapshot_id}")
            
            # Step 3: Generate system name via AI
            system_name = await self.ai_generator.generate_system_name(snapshot_data)
            logger.info(f"Generated system name: {system_name}")
            
            # Step 4: Generate agents via AI
            agents = await self.ai_generator.generate_agents(snapshot_data, system_name)
            logger.info(f"Generated {len(agents)} agents")
            
            # Step 5: Generate workflows
            workflows = await self.ai_generator.generate_workflows(agents, snapshot_data)
            logger.info(f"Generated {len(workflows)} workflows")
            
            # Step 6: Detect required integrations
            integrations = await self.ai_generator.detect_integrations(snapshot_data, agents)
            logger.info(f"Detected {len(integrations)} integrations")
            
            # Step 7: Calculate deployment estimate
            deployment_estimate = self.ai_generator.calculate_deployment_estimate(
                agents,
                integrations,
                snapshot_data.readiness_score
            )
            logger.info(f"Deployment estimate: {deployment_estimate}")
            
            # Step 8: Check for existing version
            existing_version = await self.storage_service.check_existing_version(
                snapshot_id,
                user_id
            )
            
            if existing_version:
                version = await self.storage_service.increment_version(existing_version)
                logger.info(f"Incrementing version from {existing_version} to {version}")
            else:
                version = "1.0"
                logger.info("Creating initial version 1.0")
            
            # Step 9: Assemble Blueprint JSON
            blueprint_json = self.json_assembler.assemble_blueprint_json(
                system_name=system_name,
                user_email=snapshot_data.user_email,
                snapshot_id=snapshot_id,
                agents=agents,
                workflows=workflows,
                integrations=integrations,
                deployment_estimate=deployment_estimate,
                version=version
            )
            logger.info(f"Assembled Blueprint JSON: {blueprint_json['blueprint_id']}")
            
            # Step 10: Render Blueprint PDF
            pdf_bytes = await self.pdf_renderer.render_blueprint_pdf(
                blueprint_json,
                snapshot_data.user_email
            )
            logger.info("Rendered Blueprint PDF")
            
            # Step 11: Embed metadata
            pdf_with_metadata = self.metadata_service.embed_metadata(
                pdf_bytes,
                blueprint_json['blueprint_id'],
                blueprint_json['schema_version'],
                system_name
            )
            logger.info("Embedded metadata in PDF")
            
            # Step 12: Store files
            storage_result = await self.storage_service.store_blueprint(
                user_id=user_id,
                blueprint_id=blueprint_json['blueprint_id'],
                version=version,
                json_data=blueprint_json,
                pdf_bytes=pdf_with_metadata
            )
            
            if not storage_result.success:
                raise Exception(f"Storage failed: {storage_result.message}")
            
            logger.info(f"Stored Blueprint {blueprint_json['blueprint_id']}")
            
            # Step 13: Return result
            return BlueprintGenerationResult(
                success=True,
                blueprint_id=blueprint_json['blueprint_id'],
                json_url=storage_result.json_url,
                pdf_url=storage_result.pdf_url,
                message="Blueprint generated successfully"
            )
            
        except SnapshotNotFoundError as e:
            logger.error(f"Snapshot not found: {e}")
            return BlueprintGenerationResult(
                success=False,
                blueprint_id="",
                json_url="",
                pdf_url="",
                message="AI Snapshot required for Blueprint generation"
            )
        
        except Exception as e:
            logger.error(f"Blueprint generation failed: {e}")
            return BlueprintGenerationResult(
                success=False,
                blueprint_id="",
                json_url="",
                pdf_url="",
                message=f"Generation failed: {str(e)}. Please contact support@aivory.com"
            )
    
    async def _retrieve_snapshot_data(
        self,
        snapshot_id: str,
        user_id: str
    ) -> Optional[SnapshotData]:
        """
        Retrieve AI Snapshot data from database.
        
        Args:
            snapshot_id: Snapshot identifier
            user_id: User identifier
            
        Returns:
            SnapshotData or None if not found
        """
        try:
            # Super admin mock data bypass
            if user_id == "GrandMasterRCH":
                logger.info(f"Super admin access: returning complete 30-question mock snapshot data")
                return SnapshotData(
                    snapshot_id=SUPERADMIN_MOCK_SNAPSHOT["snapshot_id"],
                    user_email=SUPERADMIN_MOCK_SNAPSHOT["email"],
                    company_name=SUPERADMIN_MOCK_SNAPSHOT["company_name"],
                    readiness_score=SUPERADMIN_MOCK_SNAPSHOT["readiness_score"],
                    primary_objective=SUPERADMIN_MOCK_SNAPSHOT["primary_goal"],
                    industry=SUPERADMIN_MOCK_SNAPSHOT["industry"],
                    key_processes=SUPERADMIN_MOCK_SNAPSHOT["key_processes"],
                    automation_level=str(SUPERADMIN_MOCK_SNAPSHOT["automation_level"]),
                    pain_points=SUPERADMIN_MOCK_SNAPSHOT["pain_points"],
                    workflows=[w["name"] for w in SUPERADMIN_MOCK_SNAPSHOT["workflows"]],
                    data_quality_score=SUPERADMIN_MOCK_SNAPSHOT["data_quality_score"]
                )
            
            # Get snapshot from database
            snapshot_record = await db.get_snapshot(snapshot_id)
            
            if not snapshot_record:
                logger.warning(f"Snapshot {snapshot_id} not found in database")
                return None
            
            # Validate user access (owner or super admin)
            snapshot_user_id = snapshot_record.get("user_id")
            if snapshot_user_id and snapshot_user_id != user_id and user_id != "GrandMasterRCH":
                logger.warning(f"Access denied: user {user_id} cannot access snapshot {snapshot_id}")
                return None
            
            logger.info(f"Retrieved snapshot {snapshot_id} from database")
            
            # Convert snapshot record to SnapshotData model with REAL data
            return SnapshotData(
                snapshot_id=snapshot_record["snapshot_id"],
                user_email=snapshot_record.get("user_email", "user@example.com"),
                company_name=snapshot_record.get("company_name", "Company"),
                readiness_score=snapshot_record["readiness_score"],
                primary_objective=snapshot_record["primary_objective"],
                industry=snapshot_record.get("industry", "General"),
                key_processes=snapshot_record["key_processes"],
                automation_level=snapshot_record["automation_level"],
                pain_points=snapshot_record["pain_points"],
                workflows=snapshot_record["workflows"],
                data_quality_score=snapshot_record["data_quality_score"]
            )
            
        except Exception as e:
            logger.error(f"Error retrieving snapshot {snapshot_id}: {e}")
            return None
