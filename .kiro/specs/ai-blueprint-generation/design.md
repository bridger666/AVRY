# Design Document: AI System Blueprint ($79) Generation Pipeline

## Overview

The AI System Blueprint generation pipeline transforms AI Snapshot ($15 tier) outputs into comprehensive, actionable system designs delivered in both machine-readable (JSON) and human-readable (PDF) formats. This feature represents Step 2 in the Aivory monetization funnel, bridging diagnostic insights with automated deployment capabilities.

The system generates blueprints containing AI agents, workflows, integrations, and pseudo-logic that can be directly translated to n8n workflows through the AI Console (Step 3). The architecture supports instant generation for super admin testing while enforcing payment gates for regular users, ensuring proper monetization flow.

Key design principles:
- **Dual-format output**: JSON for machines, PDF for humans
- **Schema-based fast path**: Aivory-v1 schema enables optimized AI Console translation
- **Progressive disclosure**: PDF locks detailed workflow code to incentivize Step 3 subscription
- **Metadata embedding**: Blueprint ID and schema version enable intelligent processing
- **AI-powered generation**: System names, agents, and integrations derived from Snapshot analysis

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Purchase   │  │   Dashboard  │  │  AI Console  │         │
│  │     Flow     │  │  Blueprint   │  │    Upload    │         │
│  │              │  │     View     │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/JSON
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend                              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                   API Routes                               │ │
│  │  /blueprint/generate  │  /blueprint/{id}  │  /console/... │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            │                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Blueprint Generation Service                  │ │
│  │  • Payment Validation                                      │ │
│  │  • Snapshot Data Retrieval                                 │ │
│  │  • AI-Powered Content Generation                           │ │
│  │  • JSON Structure Assembly                                 │ │
│  │  • PDF Rendering with Branding                             │ │
│  │  • Metadata Embedding                                      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            │                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              AI Console Integration Service                │ │
│  │  • PDF Upload & Parsing                                    │ │
│  │  • Metadata Extraction                                     │ │
│  │  • Schema Detection (aivory-v1 vs external)                │ │
│  │  • Fast Path: JSON → n8n Translation                       │ │
│  │  • Fallback: Manual Interpretation Mode                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            │                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Storage Layer                                 │ │
│  │  • Blueprint JSON Storage                                  │ │
│  │  • Blueprint PDF Storage                                   │ │
│  │  • Version History Tracking                                │ │
│  │  • Access Control Enforcement                              │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     External Services                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  OpenRouter  │  │   n8n API    │  │  File Store  │         │
│  │     LLM      │  │  (Step 3)    │  │   (S3/Local) │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

**Blueprint Generation Flow**:
1. User completes $79 payment (or super admin bypasses)
2. Frontend triggers `/blueprint/generate` with user_id
3. Backend validates payment status and retrieves AI Snapshot data
4. AI generation service analyzes Snapshot and generates:
   - System name
   - Agent definitions (2-5 agents)
   - Workflow descriptions
   - Integration requirements
   - Deployment estimate
5. JSON assembly service structures data into Blueprint_JSON format
6. PDF rendering service creates branded PDF with locked sections
7. Metadata embedding service adds blueprint_id and schema_version
8. Storage service persists both files
9. Response returns blueprint_id and download URLs

**AI Console Upload Flow**:
1. Step 3 subscriber uploads Blueprint PDF
2. PDF parser extracts embedded metadata (blueprint_id, schema_version)
3. Schema detector checks schema_version value
4. If "aivory-v1": Fast path retrieves JSON and translates to n8n
5. If external/unknown: Fallback mode uses AI interpretation
6. User reviews generated n8n workflow
7. User deploys to n8n instance

## Components and Interfaces

### 1. Blueprint Generation Service

**Purpose**: Orchestrate end-to-end Blueprint generation from Snapshot data

**Interface**:
```python
class BlueprintGenerationService:
    async def generate_blueprint(
        self,
        user_id: str,
        snapshot_id: str,
        bypass_payment: bool = False
    ) -> BlueprintGenerationResult:
        """
        Generate complete Blueprint from AI Snapshot.
        
        Steps:
        1. Validate payment status (unless bypass_payment=True)
        2. Retrieve AI Snapshot data
        3. Generate system name via AI
        4. Generate agents via AI
        5. Generate workflows via AI
        6. Detect required integrations
        7. Calculate deployment estimate
        8. Assemble Blueprint JSON
        9. Render Blueprint PDF
        10. Embed metadata
        11. Store files
        12. Return result with download URLs
        
        Args:
            user_id: User identifier
            snapshot_id: AI Snapshot identifier
            bypass_payment: True for super admin access
            
        Returns:
            BlueprintGenerationResult with blueprint_id and URLs
            
        Raises:
            PaymentRequiredError: If payment not completed
            SnapshotNotFoundError: If Snapshot data unavailable
            GenerationError: If AI generation fails
        """
```

**Dependencies**:
- PaymentValidationService
- SnapshotRetrievalService
- AIGenerationService
- JSONAssemblyService
- PDFRenderingService
- MetadataEmbeddingService
- StorageService

### 2. AI Generation Service

**Purpose**: Use LLM to generate Blueprint content from Snapshot analysis

**System Name Generation**:
```python
async def generate_system_name(
    self,
    snapshot_data: SnapshotData
) -> str:
    """
    Generate concise, descriptive system name.
    
    Prompt template:
    "Based on this AI readiness snapshot:
    - Business objective: {snapshot_data.primary_objective}
    - Industry: {snapshot_data.industry}
    - Key processes: {snapshot_data.key_processes}
    
    Generate a professional 2-5 word system name that describes
    the AI system this organization should build.
    
    Examples:
    - 'Customer Service Automation Hub'
    - 'Sales Intelligence Platform'
    - 'Operations Optimization System'
    
    Return only the system name, no explanation."
    
    Fallback: "{company_name} AI System"
    """
```

**Agent Generation**:
```python
async def generate_agents(
    self,
    snapshot_data: SnapshotData,
    system_name: str
) -> List[AgentDefinition]:
    """
    Generate 2-5 agents based on automation opportunities.
    
    Prompt template:
    "Based on this AI readiness snapshot:
    - Readiness score: {snapshot_data.score}
    - Automation level: {snapshot_data.automation_level}
    - Key workflows: {snapshot_data.workflows}
    - Pain points: {snapshot_data.pain_points}
    
    Design 2-5 AI agents for the '{system_name}' system.
    
    For each agent, provide:
    1. Name: Descriptive agent name
    2. Trigger: When it activates (schedule/webhook/event/manual)
    3. Tools: Required capabilities (email, database, API, etc.)
    4. Pseudo logic: 3-5 IF/ELSE/THEN statements describing behavior
    
    Format as JSON array:
    [
      {
        'name': 'Agent Name',
        'trigger': 'trigger_type',
        'tools': ['tool1', 'tool2'],
        'pseudo_logic': [
          'IF condition → action()',
          'ELSE IF condition → action()',
          'ELSE → fallback()'
        ]
      }
    ]"
    
    Post-processing:
    - Assign unique IDs (agent_01, agent_02, ...)
    - Validate JSON structure
    - Ensure 2-5 agents generated
    """
```

**Integration Detection**:
```python
async def detect_integrations(
    self,
    snapshot_data: SnapshotData,
    agents: List[AgentDefinition]
) -> List[IntegrationRequirement]:
    """
    Identify required external integrations.
    
    Logic:
    1. Extract mentioned systems from Snapshot (ERP, CRM, etc.)
    2. Analyze agent tools to infer integration needs
    3. Add common integrations for industry/use case
    4. Prioritize by Snapshot data quality score
    
    Returns list of:
    {
      'service_name': 'Salesforce',
      'integration_type': 'API',
      'priority': 'high',
      'reason': 'CRM data access for lead scoring'
    }
    """
```

**Deployment Estimate Calculation**:
```python
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
    
    Return format: "40-60 hours" (rounded to 20-hour ranges)
    """
```

### 3. JSON Assembly Service

**Purpose**: Structure generated content into Blueprint JSON format

**Blueprint JSON Schema**:
```json
{
  "blueprint_id": "bp_[uuid]",
  "version": "1.0",
  "system_name": "Customer Service Automation Hub",
  "generated_for": "user@example.com",
  "generated_at": "2024-01-15T10:30:00Z",
  "snapshot_id": "snap_abc123",
  "agents": [
    {
      "id": "agent_01",
      "name": "Email Triage Agent",
      "trigger": "webhook",
      "tools": ["email", "nlp", "database"],
      "pseudo_logic": [
        "IF email.priority == 'urgent' → route_to_human()",
        "ELSE IF email.category == 'faq' → send_auto_response()",
        "ELSE → add_to_queue()"
      ]
    }
  ],
  "workflows": [
    {
      "id": "workflow_01",
      "name": "Customer Inquiry Processing",
      "agents": ["agent_01", "agent_02"],
      "description": "Automated email triage and response generation"
    }
  ],
  "integrations_required": [
    {
      "service_name": "Gmail",
      "integration_type": "API",
      "priority": "high",
      "reason": "Email access for triage agent"
    }
  ],
  "deployment_estimate": "40-60 hours",
  "schema_version": "aivory-v1"
}
```

**Assembly Logic**:
```python
def assemble_blueprint_json(
    self,
    system_name: str,
    user_email: str,
    snapshot_id: str,
    agents: List[AgentDefinition],
    workflows: List[WorkflowDefinition],
    integrations: List[IntegrationRequirement],
    deployment_estimate: str
) -> dict:
    """
    Assemble all components into Blueprint JSON structure.
    
    Steps:
    1. Generate unique blueprint_id
    2. Set version to "1.0" (or increment if regenerating)
    3. Add timestamp
    4. Structure agents with IDs
    5. Structure workflows
    6. Structure integrations
    7. Set schema_version to "aivory-v1"
    8. Validate against schema
    9. Return dict (will be serialized to JSON)
    """
```

### 4. PDF Rendering Service

**Purpose**: Generate branded, professional PDF with locked sections

**PDF Structure**:
```
┌─────────────────────────────────────────────────────────┐
│ [Aivory Logo]              AI System Blueprint          │
│                                                          │
│ System: Customer Service Automation Hub                 │
│ Generated for: user@example.com                         │
│ Date: January 15, 2024                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ EXECUTIVE SUMMARY                                       │
│ [Full summary text - NOT LOCKED]                        │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ SYSTEM OVERVIEW                                         │
│ [ASCII/text flow diagram - NOT LOCKED]                  │
│                                                          │
│   User → Email Triage Agent → Response Generator        │
│              ↓                                           │
│         Database Logger                                 │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ AGENTS & ROLES                                          │
│ [Full agent list with descriptions - NOT LOCKED]        │
│                                                          │
│ 1. Email Triage Agent                                   │
│    Role: Classify and route incoming emails             │
│                                                          │
│ 2. Response Generator Agent                             │
│    Role: Generate contextual responses                  │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ TOOLS & INTEGRATIONS                                    │
│ [High-level names only - NOT LOCKED]                    │
│                                                          │
│ • Gmail API                                             │
│ • OpenAI GPT-4                                          │
│ • PostgreSQL Database                                   │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ WORKFLOW PSEUDO CODE                                    │
│ [1 agent full, rest locked - PARTIALLY LOCKED]          │
│                                                          │
│ Email Triage Agent:                                     │
│   IF email.priority == 'urgent' → route_to_human()     │
│   ELSE IF email.category == 'faq' → auto_respond()     │
│   ELSE → add_to_queue()                                 │
│                                                          │
│ Response Generator Agent: 🔒 LOCKED                     │
│ Full workflow details available in dashboard            │
│ and Step 3 subscription                                 │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ DEPLOYMENT ESTIMATE: 40-60 hours                        │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ Blueprint ID: bp_abc123def456                           │
│ Schema Version: aivory-v1                               │
│                                                          │
│ Aivory | contact@aivory.com | aivory.com               │
└─────────────────────────────────────────────────────────┘
```

**Rendering Implementation**:
```python
class PDFRenderingService:
    def __init__(self):
        self.font_family = "Inter Tight"
        self.primary_color = "#7C3AED"  # Purple
        self.lock_icon = "🔒"
    
    async def render_blueprint_pdf(
        self,
        blueprint_json: dict,
        user_email: str
    ) -> bytes:
        """
        Render Blueprint PDF with branding and locked sections.
        
        Uses ReportLab or similar library for PDF generation.
        
        Sections:
        1. Header with logo and metadata
        2. Executive Summary (full)
        3. System Overview Diagram (ASCII art)
        4. Agents & Roles (full list)
        5. Tools & Integrations (names only)
        6. Workflow Pseudo Code (1 full, rest locked)
        7. Deployment Estimate
        8. Footer with blueprint_id and schema_version
        
        Returns PDF as bytes for storage/download
        """
    
    def _render_header(self, canvas, blueprint_json: dict):
        """Render header with Aivory logo and system name"""
    
    def _render_executive_summary(self, canvas, blueprint_json: dict):
        """Generate and render executive summary"""
    
    def _render_system_diagram(self, canvas, agents: List[dict]):
        """Render ASCII flow diagram showing agent connections"""
    
    def _render_agents_section(self, canvas, agents: List[dict]):
        """Render full agent list with roles"""
    
    def _render_integrations_section(self, canvas, integrations: List[dict]):
        """Render integration names (high-level only)"""
    
    def _render_workflow_pseudo_code(self, canvas, agents: List[dict]):
        """
        Render workflow pseudo code with locking.
        
        Logic:
        - Show full pseudo_logic for agents[0]
        - For agents[1:], show lock icon and message
        """
    
    def _render_footer(self, canvas, blueprint_id: str, schema_version: str):
        """Render footer with metadata and branding"""
```

### 5. Metadata Embedding Service

**Purpose**: Embed blueprint_id and schema_version in PDF for AI Console detection

**Embedding Strategy**:
```python
class MetadataEmbeddingService:
    def embed_metadata(
        self,
        pdf_bytes: bytes,
        blueprint_id: str,
        schema_version: str
    ) -> bytes:
        """
        Embed metadata in PDF for extraction.
        
        Two embedding methods:
        1. Visible text in footer (human-readable)
        2. PDF metadata properties (machine-readable)
        
        Uses PyPDF2 or similar library to modify PDF metadata.
        """
    
    def extract_metadata(
        self,
        pdf_bytes: bytes
    ) -> Optional[BlueprintMetadata]:
        """
        Extract embedded metadata from PDF.
        
        Tries multiple extraction methods:
        1. Parse footer text for blueprint_id and schema_version
        2. Read PDF metadata properties
        3. OCR footer if text extraction fails
        
        Returns None if metadata not found (external blueprint)
        """
```

**Metadata Properties**:
```python
{
    "Title": f"{system_name} - AI Blueprint",
    "Author": "Aivory",
    "Subject": "AI System Blueprint",
    "Keywords": f"blueprint_id:{blueprint_id},schema_version:{schema_version}",
    "Creator": "Aivory Blueprint Generator v1.0",
    "Producer": "Aivory",
    "Custom": {
        "blueprint_id": blueprint_id,
        "schema_version": schema_version,
        "generated_at": timestamp
    }
}
```

### 6. Storage Service

**Purpose**: Persist Blueprint files with access control

**Storage Structure**:
```
blueprints/
  {user_id}/
    {blueprint_id}/
      v1.0/
        blueprint.json
        blueprint.pdf
      v1.1/
        blueprint.json
        blueprint.pdf
```

**Interface**:
```python
class BlueprintStorageService:
    async def store_blueprint(
        self,
        user_id: str,
        blueprint_id: str,
        version: str,
        json_data: dict,
        pdf_bytes: bytes
    ) -> StorageResult:
        """
        Store Blueprint JSON and PDF files.
        
        Steps:
        1. Create directory structure
        2. Write JSON file
        3. Write PDF file
        4. Update database record
        5. Return download URLs
        """
    
    async def retrieve_blueprint_json(
        self,
        blueprint_id: str,
        user_id: str
    ) -> dict:
        """
        Retrieve Blueprint JSON with access control.
        
        Validates:
        - User owns blueprint OR user is super admin
        """
    
    async def retrieve_blueprint_pdf(
        self,
        blueprint_id: str,
        user_id: str
    ) -> bytes:
        """
        Retrieve Blueprint PDF with access control.
        """
    
    async def list_user_blueprints(
        self,
        user_id: str
    ) -> List[BlueprintMetadata]:
        """
        List all blueprints for user.
        """
```

### 7. AI Console Integration Service

**Purpose**: Handle Blueprint uploads and schema-based routing

**Upload and Detection**:
```python
class AIConsoleService:
    async def upload_blueprint(
        self,
        user_id: str,
        pdf_file: UploadFile
    ) -> UploadResult:
        """
        Process uploaded Blueprint PDF.
        
        Steps:
        1. Validate user has Step 3 subscription
        2. Extract PDF bytes
        3. Extract metadata (blueprint_id, schema_version)
        4. Detect schema type
        5. Route to appropriate translation path
        6. Return processing status
        """
    
    async def translate_aivory_blueprint(
        self,
        blueprint_id: str
    ) -> N8NWorkflow:
        """
        Fast path: Translate aivory-v1 Blueprint to n8n.
        
        Steps:
        1. Retrieve Blueprint JSON
        2. Parse agents and workflows
        3. Map agents to n8n nodes
        4. Map workflows to n8n connections
        5. Generate n8n workflow JSON
        6. Return for user review
        """
    
    async def interpret_external_blueprint(
        self,
        pdf_bytes: bytes
    ) -> InterpretationResult:
        """
        Fallback: Interpret external blueprint with AI.
        
        Steps:
        1. Extract text from PDF
        2. Use LLM to identify system components
        3. Present interpretation to user
        4. Allow manual refinement
        5. Generate n8n workflow from refined design
        """
```

**Schema Detection Logic**:
```python
def detect_schema(
    self,
    metadata: Optional[BlueprintMetadata]
) -> SchemaType:
    """
    Determine Blueprint schema type.
    
    Logic:
    - If metadata exists and schema_version == "aivory-v1": AIVORY_V1
    - If metadata exists but schema_version != "aivory-v1": EXTERNAL_KNOWN
    - If metadata missing: EXTERNAL_UNKNOWN
    
    Returns SchemaType enum for routing decision
    """
```

### 8. Payment Validation Service

**Purpose**: Enforce $79 payment gate with super admin bypass

**Interface**:
```python
class PaymentValidationService:
    async def validate_blueprint_access(
        self,
        user_id: str
    ) -> ValidationResult:
        """
        Check if user can access Blueprint generation.
        
        Logic:
        1. Check if user is GrandMasterRCH super admin
        2. If yes: return ValidationResult(allowed=True, bypass=True)
        3. If no: check payment status for $79 Blueprint tier
        4. Return ValidationResult with payment status
        """
    
    def is_super_admin(self, user_id: str) -> bool:
        """Check if user is GrandMasterRCH"""
        return user_id == "GrandMasterRCH"
```

## Data Models

### Python Backend Models

```python
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
from datetime import datetime
from enum import Enum

class AgentDefinition(BaseModel):
    id: str = Field(pattern=r"^agent_\d{2}$")
    name: str = Field(min_length=3, max_length=100)
    trigger: Literal["schedule", "webhook", "event", "manual"]
    tools: List[str] = Field(min_items=1)
    pseudo_logic: List[str] = Field(min_items=1, max_items=10)

class WorkflowDefinition(BaseModel):
    id: str = Field(pattern=r"^workflow_\d{2}$")
    name: str = Field(min_length=3, max_length=100)
    agents: List[str] = Field(min_items=1)
    description: str = Field(min_length=10, max_length=500)

class IntegrationRequirement(BaseModel):
    service_name: str
    integration_type: Literal["API", "Webhook", "Database", "File"]
    priority: Literal["high", "medium", "low"]
    reason: str

class BlueprintJSON(BaseModel):
    blueprint_id: str = Field(pattern=r"^bp_[a-z0-9]+$")
    version: str = "1.0"
    system_name: str = Field(min_length=5, max_length=100)
    generated_for: EmailStr
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    snapshot_id: str
    agents: List[AgentDefinition] = Field(min_items=2, max_items=5)
    workflows: List[WorkflowDefinition] = Field(min_items=1)
    integrations_required: List[IntegrationRequirement]
    deployment_estimate: str = Field(pattern=r"^\d+-\d+ hours$")
    schema_version: Literal["aivory-v1"] = "aivory-v1"

class BlueprintMetadata(BaseModel):
    blueprint_id: str
    schema_version: str
    system_name: str
    created_at: datetime
    version: str
    json_url: str
    pdf_url: str

class BlueprintGenerationRequest(BaseModel):
    user_id: str
    snapshot_id: str
    bypass_payment: bool = False

class BlueprintGenerationResult(BaseModel):
    success: bool
    blueprint_id: str
    json_url: str
    pdf_url: str
    message: str

class UploadResult(BaseModel):
    success: bool
    blueprint_id: Optional[str]
    schema_type: Literal["aivory-v1", "external-known", "external-unknown"]
    message: str
    translation_status: Literal["ready", "processing", "manual-required"]

class ValidationResult(BaseModel):
    allowed: bool
    bypass: bool = False
    message: str
    payment_required: bool = False

class SchemaType(str, Enum):
    AIVORY_V1 = "aivory-v1"
    EXTERNAL_KNOWN = "external-known"
    EXTERNAL_UNKNOWN = "external-unknown"

class SnapshotData(BaseModel):
    """AI Snapshot data structure (from $15 tier)"""
    snapshot_id: str
    user_email: EmailStr
    company_name: str
    readiness_score: int = Field(ge=0, le=100)
    primary_objective: str
    industry: Optional[str]
    key_processes: List[str]
    automation_level: str
    pain_points: List[str]
    workflows: List[str]
    data_quality_score: int = Field(ge=0, le=100)
```

### Frontend TypeScript Models

```typescript
interface BlueprintMetadata {
  blueprintId: string;
  systemName: string;
  createdAt: string;
  version: string;
  jsonUrl: string;
  pdfUrl: string;
}

interface BlueprintGenerationRequest {
  userId: string;
  snapshotId: string;
}

interface BlueprintGenerationResult {
  success: boolean;
  blueprintId: string;
  jsonUrl: string;
  pdfUrl: string;
  message: string;
}

interface AgentDefinition {
  id: string;
  name: string;
  trigger: 'schedule' | 'webhook' | 'event' | 'manual';
  tools: string[];
  pseudoLogic: string[];
}

interface BlueprintJSON {
  blueprintId: string;
  version: string;
  systemName: string;
  generatedFor: string;
  generatedAt: string;
  snapshotId: string;
  agents: AgentDefinition[];
  workflows: WorkflowDefinition[];
  integrationsRequired: IntegrationRequirement[];
  deploymentEstimate: string;
  schemaVersion: 'aivory-v1';
}

interface UploadResult {
  success: boolean;
  blueprintId?: string;
  schemaType: 'aivory-v1' | 'external-known' | 'external-unknown';
  message: string;
  translationStatus: 'ready' | 'processing' | 'manual-required';
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies and consolidations:

- **Super admin bypass properties (1.4, 2.5, 14.1)** can be consolidated into a single comprehensive property
- **Payment gate properties (1.2, 1.3, 1.5, 15.3)** can be combined into payment enforcement properties
- **Agent structure properties (4.1-4.6, 18.3-18.6)** have significant overlap and can be consolidated
- **PDF locking properties (5.6, 6.1, 6.2)** are redundant and can be combined
- **Storage properties (7.1, 7.2)** can be combined into a single storage property
- **Access control properties (7.5, 16.5, 25.2)** are redundant
- **Dashboard section properties (8.2-8.6, 10.1)** can be consolidated
- **Metadata embedding properties (21.1-21.4)** can be combined
- **Error handling properties (2.4, 22.1)** are redundant

The following properties provide unique validation value after consolidation:

### Payment and Access Control Properties

**Property 1: Super Admin Payment Bypass**

*For any* user authenticated as GrandMasterRCH super admin, all payment gates must be bypassed and Blueprint generation must proceed immediately without payment validation.

**Validates: Requirements 1.4, 2.5, 14.1, 14.2**

**Property 2: Payment Gate Enforcement**

*For any* non-admin user, Blueprint generation must be blocked until $79 payment is successfully completed, and unpaid access attempts must redirect to purchase flow.

**Validates: Requirements 1.2, 1.5, 15.3**

**Property 3: Payment-Triggered Generation**

*For any* successful $79 payment event, Blueprint generation must be triggered immediately.

**Validates: Requirements 1.3**

**Property 4: Access Control Enforcement**

*For any* Blueprint access attempt, the system must verify that the requesting user is either the Blueprint owner or GrandMasterRCH super admin, and deny access with 403 Forbidden for unauthorized users.

**Validates: Requirements 7.5, 16.5, 25.2, 25.3**

**Property 5: Super Admin Universal Access**

*For any* Blueprint in the system, GrandMasterRCH super admin must be able to access, view, and download it regardless of ownership.

**Validates: Requirements 14.3, 14.4, 25.4**

### Input Validation Properties

**Property 6: Snapshot Data Source Requirement**

*For any* Blueprint generation request, the system must use AI Snapshot ($15 tier) output as input and must reject free diagnostic data as direct input.

**Validates: Requirements 2.1, 2.2, 2.3**

**Property 7: Missing Snapshot Error Handling**

*For any* Blueprint generation request where AI Snapshot data is unavailable, the system must return error "AI Snapshot required for Blueprint generation".

**Validates: Requirements 2.4, 22.1**

**Property 8: Authentication Requirement**

*For any* Blueprint generation or access request, the system must verify user authentication before processing and reject unauthenticated requests.

**Validates: Requirements 15.2, 25.1**

### Blueprint JSON Structure Properties

**Property 9: JSON Field Completeness**

*For any* generated Blueprint JSON, it must contain all required fields: blueprint_id, version, system_name, generated_for, agents, workflows, integrations_required, deployment_estimate, and schema_version.

**Validates: Requirements 3.1**

**Property 10: Blueprint ID Format and Uniqueness**

*For any* generated Blueprint, the blueprint_id must match the pattern "bp_[unique_id]" and must be unique across all Blueprints in the system.

**Validates: Requirements 3.2**

**Property 11: Schema Version Constant**

*For any* generated Blueprint JSON, the schema_version field must be set to "aivory-v1".

**Validates: Requirements 3.3**

**Property 12: User Email Population**

*For any* generated Blueprint JSON, the generated_for field must contain the requesting user's email address.

**Validates: Requirements 3.5**

**Property 13: JSON Validity**

*For any* generated Blueprint JSON, the output must be valid, parseable JSON format.

**Validates: Requirements 3.10**

**Property 14: System Name Generation**

*For any* generated Blueprint, the system_name must be non-empty and between 5-100 characters in length.

**Validates: Requirements 3.4, 17.2**

**Property 15: System Name Fallback**

*For any* Blueprint generation where AI system name generation fails, the system must use fallback format "[Company] AI System".

**Validates: Requirements 17.5**

### Agent Definition Properties

**Property 16: Agent Count Range**

*For any* generated Blueprint, the agents array must contain between 2 and 5 agents.

**Validates: Requirements 18.2**

**Property 17: Agent Structure Completeness**

*For any* agent in a generated Blueprint, it must include all required fields: id (matching pattern "agent_\\d{2}"), name (non-empty), trigger (one of: schedule/webhook/event/manual), tools (non-empty array), and pseudo_logic (non-empty array).

**Validates: Requirements 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 18.3, 18.4, 18.5, 18.6**

**Property 18: Agent ID Uniqueness**

*For any* Blueprint, all agent IDs must be unique within that Blueprint.

**Validates: Requirements 4.1**

**Property 19: Pseudo Logic Notation**

*For any* agent's pseudo_logic array, at least one statement must contain IF/ELSE/THEN keywords indicating conditional logic.

**Validates: Requirements 4.6**

### Workflow and Integration Properties

**Property 20: Workflow Array Presence**

*For any* generated Blueprint, the workflows array must be present and contain at least one workflow definition.

**Validates: Requirements 3.7**

**Property 21: Integration Array Presence**

*For any* generated Blueprint, the integrations_required array must be present (may be empty if no integrations needed).

**Validates: Requirements 3.8**

**Property 22: Integration Structure**

*For any* integration in integrations_required array, it must include service_name, integration_type, priority, and reason fields.

**Validates: Requirements 19.3, 19.4**

### Deployment Estimate Properties

**Property 23: Deployment Estimate Format**

*For any* generated Blueprint, the deployment_estimate must match the pattern "\\d+-\\d+ hours" (e.g., "40-60 hours").

**Validates: Requirements 3.9, 20.2**

**Property 24: Deployment Estimate Calculation**

*For any* generated Blueprint, the deployment_estimate must vary based on number of agents, number of integrations, and AI readiness score from Snapshot.

**Validates: Requirements 20.1, 20.3**

**Property 25: Readiness Score Inverse Relationship**

*For any* two Blueprints with different AI readiness scores, the Blueprint with lower readiness score must have equal or higher deployment estimate (more foundational work needed).

**Validates: Requirements 20.4**

### PDF Generation Properties

**Property 26: PDF Section Completeness**

*For any* generated Blueprint PDF, it must contain all required sections: executive summary, system overview diagram, agent list, tools & integrations, workflow pseudo code, and footer metadata.

**Validates: Requirements 5.1**

**Property 27: PDF Non-Locked Sections**

*For any* generated Blueprint PDF, the executive summary, system overview diagram, and agent list sections must be fully visible (not locked).

**Validates: Requirements 5.2, 5.3, 5.4, 6.5**

**Property 28: PDF Workflow Locking**

*For any* generated Blueprint PDF with N agents, exactly 1 agent must show full workflow pseudo code, and the remaining (N-1) agents must show locked placeholders with message "Full workflow details available in dashboard and Step 3 subscription".

**Validates: Requirements 5.6, 6.1, 6.2, 6.3**

**Property 29: PDF Lock Visual Distinction**

*For any* locked section in Blueprint PDF, it must contain a lock icon or similar visual indicator.

**Validates: Requirements 6.4**

**Property 30: PDF Metadata Embedding**

*For any* generated Blueprint PDF, the blueprint_id and schema_version must be embedded both as visible text in the footer and as PDF metadata properties.

**Validates: Requirements 5.7, 21.1, 21.2, 21.3, 21.4**

**Property 31: PDF Metadata Extractability**

*For any* generated Blueprint PDF, the embedded metadata must be extractable using standard PDF parsing libraries (PyPDF2, pdfplumber, etc.).

**Validates: Requirements 21.5**

**Property 32: PDF Branding Elements**

*For any* generated Blueprint PDF, it must include Aivory logo in header, purple color theme (#7C3AED), Inter Tight font family, and Aivory contact information in footer.

**Validates: Requirements 5.8, 24.1, 24.2, 24.3, 24.5**

### Storage and Retrieval Properties

**Property 33: Blueprint Storage Completeness**

*For any* completed Blueprint generation, both Blueprint_JSON and Blueprint_PDF must be stored in persistent storage associated with the user account and blueprint_id.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

**Property 34: Blueprint Retrieval by ID**

*For any* stored Blueprint, it must be retrievable using its blueprint_id.

**Validates: Requirements 7.4**

**Property 35: Download File Naming**

*For any* Blueprint download, the JSON file must be named "[system_name]_blueprint.json" and the PDF file must be named "[system_name]_blueprint.pdf".

**Validates: Requirements 9.3**

**Property 36: Download Content Integrity**

*For any* Blueprint download, the downloaded file content must exactly match the stored version.

**Validates: Requirements 9.4**

### Dashboard Display Properties

**Property 37: Dashboard Content Completeness**

*For any* user accessing Blueprint dashboard after purchase, the dashboard must display all Blueprint sections: executive summary, system overview diagram, complete agent list with roles, full tools & integrations list, and complete workflow pseudo code for ALL agents (unlocked).

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

**Property 38: Dashboard Pseudo Code Unlocking**

*For any* Blueprint displayed in dashboard, all agents must show full workflow pseudo code without locking (unlike PDF which locks N-1 agents).

**Validates: Requirements 8.6**

### Versioning Properties

**Property 39: Initial Version Assignment**

*For any* newly generated Blueprint, the version field must be set to "1.0".

**Validates: Requirements 23.1**

**Property 40: Version Incrementing**

*For any* Blueprint regeneration from the same Snapshot, the version number must be incremented from the previous version.

**Validates: Requirements 23.2**

**Property 41: Version History Retention**

*For any* Blueprint with multiple versions, all versions must be stored and accessible for download.

**Validates: Requirements 23.3, 23.5**

### AI Console Integration Properties

**Property 42: Metadata Extraction from Upload**

*For any* uploaded PDF file in AI Console, the system must attempt to extract blueprint_id and schema_version metadata.

**Validates: Requirements 11.2**

**Property 43: Upload Validation**

*For any* uploaded PDF file claiming to be a Blueprint, if metadata extraction fails, the system must return error "Invalid Blueprint format".

**Validates: Requirements 11.3, 11.4**

**Property 44: Schema-Based Mode Selection**

*For any* uploaded Blueprint with schema_version = "aivory-v1", the system must activate fast path mode; for any other schema_version or missing schema_version, the system must activate fallback mode.

**Validates: Requirements 12.1, 13.1**

**Property 45: Fast Path JSON Retrieval**

*For any* Blueprint in fast path mode, the system must retrieve the Blueprint_JSON using the extracted blueprint_id.

**Validates: Requirements 12.3**

**Property 46: Fast Path JSON Parsing**

*For any* Blueprint in fast path mode, the system must parse agents, workflows, and integrations fields from Blueprint_JSON for n8n workflow generation.

**Validates: Requirements 12.4**

**Property 47: Fallback Mode Text Extraction**

*For any* Blueprint in fallback mode, the system must attempt to extract system design information from PDF text content.

**Validates: Requirements 13.4**

### Error Handling Properties

**Property 48: AI Generation Retry**

*For any* AI generation failure during Blueprint creation, the system must retry with fallback prompts before returning an error.

**Validates: Requirements 22.2**

**Property 49: Complete Failure Error Response**

*For any* Blueprint generation where all AI generation attempts fail, the system must return an error message including support contact information.

**Validates: Requirements 22.3**

**Property 50: Error Logging**

*For any* generation error or access denial, the system must log the event with relevant details for debugging and security audit.

**Validates: Requirements 22.4, 14.5, 25.5**

**Property 51: Partial Failure Graceful Handling**

*For any* Blueprint generation with partial failures (e.g., PDF generation fails but JSON succeeds), the system must handle the failure gracefully without crashing and provide available outputs.

**Validates: Requirements 22.5**

**Property 52: Download Event Tracking**

*For any* Blueprint file download, the system must log the download event for analytics.

**Validates: Requirements 9.5**

## Error Handling

### Error Categories

The system handles five primary error categories:

1. **Payment Errors**: User attempts to access Blueprint without payment
2. **Input Errors**: Missing or invalid Snapshot data
3. **Generation Errors**: AI generation failures, timeout, or service unavailable
4. **Access Errors**: Unauthorized access attempts to Blueprints
5. **Upload Errors**: Invalid Blueprint PDF uploads to AI Console

### Error Handling Strategy

#### 1. Payment Errors

**Detection**: Check payment status before Blueprint generation

**Handling**:
```python
async def validate_payment(user_id: str) -> ValidationResult:
    # Super admin bypass
    if user_id == "GrandMasterRCH":
        return ValidationResult(allowed=True, bypass=True)
    
    # Check payment status
    payment_status = await payment_service.check_blueprint_payment(user_id)
    
    if not payment_status.paid:
        return ValidationResult(
            allowed=False,
            payment_required=True,
            message="Blueprint requires $79 payment. Please complete purchase."
        )
    
    return ValidationResult(allowed=True)
```

**User Experience**: Redirect to purchase flow with clear pricing information

#### 2. Input Errors

**Detection**: Validate Snapshot data availability

**Handling**:
```python
async def retrieve_snapshot(snapshot_id: str) -> SnapshotData:
    snapshot = await snapshot_service.get_snapshot(snapshot_id)
    
    if not snapshot:
        raise SnapshotNotFoundError(
            "AI Snapshot required for Blueprint generation. "
            "Please complete AI Snapshot ($15) first."
        )
    
    return snapshot
```

**User Experience**: Clear error message with link to AI Snapshot purchase

#### 3. Generation Errors

**Detection**: Monitor AI generation service responses

**Handling**:
```python
async def generate_with_retry(
    prompt: str,
    max_retries: int = 3
) -> str:
    for attempt in range(max_retries):
        try:
            result = await ai_service.generate(prompt, timeout=10.0)
            return result
        except (TimeoutError, ConnectionError) as e:
            logger.warning(f"AI generation attempt {attempt + 1} failed: {e}")
            
            if attempt < max_retries - 1:
                # Try fallback prompt
                prompt = create_fallback_prompt(prompt)
                continue
            else:
                # All retries exhausted
                raise GenerationError(
                    "Blueprint generation failed. Please try again or contact support at support@aivory.com"
                )
```

**User Experience**: Retry automatically, show error with support contact if all attempts fail

#### 4. Access Errors

**Detection**: Validate ownership or super admin status

**Handling**:
```python
async def validate_blueprint_access(
    blueprint_id: str,
    user_id: str
) -> None:
    # Super admin has universal access
    if user_id == "GrandMasterRCH":
        return
    
    # Check ownership
    blueprint = await storage_service.get_blueprint_metadata(blueprint_id)
    
    if blueprint.owner_id != user_id:
        logger.warning(f"Unauthorized access attempt: user={user_id}, blueprint={blueprint_id}")
        raise HTTPException(
            status_code=403,
            detail="Access denied. You can only access your own Blueprints."
        )
```

**User Experience**: 403 Forbidden with clear message, log for security audit

#### 5. Upload Errors

**Detection**: Validate PDF metadata extraction

**Handling**:
```python
async def process_blueprint_upload(pdf_bytes: bytes) -> UploadResult:
    # Try to extract metadata
    metadata = metadata_service.extract_metadata(pdf_bytes)
    
    if not metadata:
        return UploadResult(
            success=False,
            schema_type="external-unknown",
            message="Could not detect Blueprint metadata. Switching to interpretation mode.",
            translation_status="manual-required"
        )
    
    # Validate schema
    if metadata.schema_version == "aivory-v1":
        return UploadResult(
            success=True,
            blueprint_id=metadata.blueprint_id,
            schema_type="aivory-v1",
            message="Aivory Blueprint detected - using optimized translation",
            translation_status="ready"
        )
    else:
        return UploadResult(
            success=True,
            blueprint_id=metadata.blueprint_id,
            schema_type="external-known",
            message="External blueprint detected - using interpretation mode",
            translation_status="manual-required"
        )
```

**User Experience**: Graceful fallback to interpretation mode for external blueprints

### Partial Failure Handling

The system handles partial failures gracefully:

```python
async def generate_blueprint(
    user_id: str,
    snapshot_id: str
) -> BlueprintGenerationResult:
    json_url = None
    pdf_url = None
    errors = []
    
    try:
        # Generate JSON
        blueprint_json = await generate_blueprint_json(snapshot_id)
        json_url = await storage_service.store_json(blueprint_json)
    except Exception as e:
        logger.error(f"JSON generation failed: {e}")
        errors.append("JSON generation failed")
    
    try:
        # Generate PDF
        if blueprint_json:  # Only if JSON succeeded
            blueprint_pdf = await generate_blueprint_pdf(blueprint_json)
            pdf_url = await storage_service.store_pdf(blueprint_pdf)
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        errors.append("PDF generation failed")
    
    # Return partial success if at least one format succeeded
    if json_url or pdf_url:
        return BlueprintGenerationResult(
            success=True,
            blueprint_id=blueprint_json.blueprint_id,
            json_url=json_url,
            pdf_url=pdf_url,
            message=f"Blueprint generated with warnings: {', '.join(errors)}" if errors else "Blueprint generated successfully"
        )
    else:
        raise GenerationError("Complete Blueprint generation failure. Please contact support.")
```

## Testing Strategy

### Dual Testing Approach

The Blueprint generation pipeline requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Payment validation logic
- Super admin bypass behavior
- Metadata extraction from sample PDFs
- Error message formatting
- API endpoint responses

**Property-Based Tests**: Verify universal properties across all inputs
- Blueprint JSON structure validity for any Snapshot data
- Agent count constraints (2-5 agents)
- PDF locking behavior for any number of agents
- Access control enforcement for any user/Blueprint combination
- Version incrementing for any regeneration sequence

### Property-Based Testing Configuration

**Library**: Use `hypothesis` for Python property-based testing

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: **Feature: ai-blueprint-generation, Property {number}: {property_text}**

**Example Property Test**:
```python
from hypothesis import given, strategies as st
import pytest

@given(
    agents=st.lists(
        st.builds(AgentDefinition, ...),
        min_size=2,
        max_size=5
    )
)
def test_property_16_agent_count_range(agents):
    """
    Feature: ai-blueprint-generation
    Property 16: For any generated Blueprint, the agents array must contain between 2 and 5 agents.
    """
    blueprint = generate_blueprint_with_agents(agents)
    assert 2 <= len(blueprint.agents) <= 5
```

### Unit Testing Focus Areas

**1. Payment Validation**:
- Test super admin bypass with user_id="GrandMasterRCH"
- Test payment gate enforcement for regular users
- Test payment status checking

**2. Metadata Embedding and Extraction**:
- Test PDF metadata embedding with sample blueprint_id
- Test metadata extraction from generated PDFs
- Test extraction failure handling for external PDFs

**3. Schema Detection**:
- Test fast path activation for schema_version="aivory-v1"
- Test fallback mode activation for other schema versions
- Test fallback mode activation for missing metadata

**4. Error Handling**:
- Test missing Snapshot error message
- Test AI generation retry logic
- Test partial failure handling (JSON succeeds, PDF fails)

**5. Access Control**:
- Test owner can access their Blueprint
- Test non-owner cannot access others' Blueprints
- Test super admin can access any Blueprint
- Test 403 response for unauthorized access

### Integration Testing

**End-to-End Blueprint Generation**:
1. Create test Snapshot data
2. Trigger Blueprint generation
3. Verify JSON structure
4. Verify PDF generation
5. Verify storage
6. Verify download URLs

**AI Console Upload Flow**:
1. Generate test Blueprint PDF
2. Upload to AI Console
3. Verify metadata extraction
4. Verify schema detection
5. Verify fast path activation
6. Verify JSON retrieval

### Test Data Generators

**Snapshot Data Generator**:
```python
def generate_test_snapshot(
    readiness_score: int = 75,
    company_name: str = "Test Corp"
) -> SnapshotData:
    return SnapshotData(
        snapshot_id=f"snap_{uuid.uuid4().hex[:8]}",
        user_email="test@example.com",
        company_name=company_name,
        readiness_score=readiness_score,
        primary_objective="Automate customer service",
        industry="Technology",
        key_processes=["Email handling", "Ticket routing"],
        automation_level="Moderate (10-50%)",
        pain_points=["Manual email triage", "Slow response times"],
        workflows=["Customer inquiry processing"],
        data_quality_score=80
    )
```

**Blueprint JSON Generator**:
```python
def generate_test_blueprint_json(
    num_agents: int = 3
) -> BlueprintJSON:
    agents = [
        AgentDefinition(
            id=f"agent_{i:02d}",
            name=f"Test Agent {i}",
            trigger="webhook",
            tools=["email", "database"],
            pseudo_logic=[
                "IF condition → action()",
                "ELSE → fallback()"
            ]
        )
        for i in range(1, num_agents + 1)
    ]
    
    return BlueprintJSON(
        blueprint_id=f"bp_{uuid.uuid4().hex}",
        version="1.0",
        system_name="Test System",
        generated_for="test@example.com",
        snapshot_id="snap_test123",
        agents=agents,
        workflows=[],
        integrations_required=[],
        deployment_estimate="40-60 hours",
        schema_version="aivory-v1"
    )
```
