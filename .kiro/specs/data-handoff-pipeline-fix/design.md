# Design Document: Data Handoff Pipeline Fix

## Overview

This design implements complete data persistence and ID traceability across the Aivory monetization funnel (Diagnostic → Snapshot → Blueprint). The current system loses 100% of user data between steps, forcing re-entry and using mock data for Blueprint generation. This fix establishes database persistence, foreign key relationships, and seamless data handoff to enable personalized Blueprint generation.

The solution extends the existing file-based `DatabaseService` with new persistence methods, modifies API endpoints to return generated IDs, and updates the Blueprint generation service to retrieve real Snapshot data instead of using hardcoded mocks.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  (Stores diagnostic_id, snapshot_id in memory/localStorage)    │
└────────────┬────────────────────────────────┬──────────────────┘
             │                                │
             ▼                                ▼
┌────────────────────────┐      ┌────────────────────────────────┐
│  Diagnostic API        │      │  Snapshot API                  │
│  POST /diagnostic/run  │      │  POST /diagnostic/snapshot     │
│  Returns: diagnostic_id│      │  Returns: snapshot_id          │
└────────────┬───────────┘      └────────────┬───────────────────┘
             │                                │
             │ Persists                       │ Persists + Links
             ▼                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database Service                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Diagnostics  │  │  Snapshots   │  │  Blueprints  │         │
│  │  Table       │  │   Table      │  │   Table      │         │
│  │              │  │              │  │              │         │
│  │ diagnostic_id│◄─┤diagnostic_id │  │              │         │
│  │ user_email   │  │ snapshot_id  │◄─┤ snapshot_id  │         │
│  │ company_name │  │ user_email   │  │ blueprint_id │         │
│  │ industry     │  │ company_name │  │ user_email   │         │
│  │ answers[]    │  │ industry     │  │ company_name │         │
│  │ score        │  │ answers[]    │  │ system_name  │         │
│  │ created_at   │  │ readiness    │  │ agents[]     │         │
│  └──────────────┘  │ pain_points  │  │ workflows[]  │         │
│                    │ workflows    │  │ created_at   │         │
│                    │ key_processes│  └──────────────┘         │
│                    │ created_at   │                            │
│                    └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Retrieves real data
                                ▼
                    ┌────────────────────────────┐
                    │  Blueprint Generation      │
                    │  Service                   │
                    │  Uses real snapshot data   │
                    └────────────────────────────┘
```

### Data Flow

1. **Diagnostic Submission**:
   - User submits 12 answers + email/company/industry
   - System generates `diagnostic_id`
   - System persists all data to `diagnostics/` directory
   - API returns `diagnostic_id` to frontend

2. **Snapshot Submission**:
   - User submits 30 answers + `diagnostic_id` (optional)
   - System generates `snapshot_id`
   - If `diagnostic_id` provided, system retrieves User_Context
   - System persists all data + foreign key to `snapshots/` directory
   - API returns `snapshot_id` and `diagnostic_id`

3. **Blueprint Generation**:
   - User requests blueprint with `snapshot_id`
   - System retrieves complete snapshot record
   - System extracts real data: company_name, pain_points, workflows, etc.
   - System generates personalized blueprint
   - System links `blueprint_id` to `snapshot_id`
   - API returns blueprint with real data

### ID Generation Strategy

All IDs follow a consistent format for easy identification and debugging:

- **diagnostic_id**: `diag_` + 12 random alphanumeric characters (e.g., `diag_a7f3k9m2p5q1`)
- **snapshot_id**: `snap_` + 12 random alphanumeric characters (e.g., `snap_x4j8n2v7c9k3`)
- **blueprint_id**: `bp_` + 12 random alphanumeric characters (e.g., `bp_m5t9r3w8h2n6`)

Generation uses Python's `secrets` module for cryptographically secure randomness.

## Components and Interfaces

### 1. Database Service Extensions

**File**: `app/database/db_service.py`

The existing `DatabaseService` class will be extended with new methods for diagnostic and snapshot persistence. The service already has blueprint storage methods.

**New Methods**:

```python
class DatabaseService:
    async def store_diagnostic(
        self,
        diagnostic_id: str,
        user_id: Optional[str],
        user_email: Optional[str],
        company_name: Optional[str],
        industry: Optional[str],
        answers: List[Dict[str, Any]],
        score: int,
        category: str
    ) -> bool:
        """Store diagnostic record to diagnostics/{diagnostic_id}.json"""
        
    async def get_diagnostic(
        self,
        diagnostic_id: str
    ) -> Optional[Dict[str, Any]]:
        """Retrieve diagnostic record"""
        
    async def list_diagnostics_by_user(
        self,
        user_id: str
    ) -> List[Dict[str, Any]]:
        """List all diagnostics for a user"""
        
    async def store_snapshot(
        self,
        snapshot_id: str,
        diagnostic_id: Optional[str],
        user_id: Optional[str],
        user_email: Optional[str],
        company_name: Optional[str],
        industry: Optional[str],
        answers: List[Dict[str, Any]],
        readiness_score: int,
        category_scores: Dict[str, float],
        primary_objective: str,
        top_recommendations: List[str],
        pain_points: List[str],
        workflows: List[str],
        key_processes: List[str],
        automation_level: str,
        data_quality_score: int
    ) -> bool:
        """Store snapshot record to snapshots/{snapshot_id}.json"""
        
    async def get_snapshot(
        self,
        snapshot_id: str
    ) -> Optional[Dict[str, Any]]:
        """Retrieve snapshot record"""
        
    async def list_snapshots_by_user(
        self,
        user_id: str
    ) -> List[Dict[str, Any]]:
        """List all snapshots for a user"""
        
    async def list_snapshots_by_diagnostic(
        self,
        diagnostic_id: str
    ) -> List[Dict[str, Any]]:
        """List all snapshots linked to a diagnostic"""
```

**Storage Format**:

Diagnostics stored as: `data/diagnostics/{diagnostic_id}.json`
```json
{
  "diagnostic_id": "diag_a7f3k9m2p5q1",
  "user_id": null,
  "user_email": "user@example.com",
  "company_name": "Example Corp",
  "industry": "Technology",
  "answers": [
    {"question_id": "business_objective", "selected_option": 2},
    ...
  ],
  "score": 75,
  "category": "Building Momentum",
  "created_at": "2024-01-15T10:30:00Z"
}
```

Snapshots stored as: `data/snapshots/{snapshot_id}.json`
```json
{
  "snapshot_id": "snap_x4j8n2v7c9k3",
  "diagnostic_id": "diag_a7f3k9m2p5q1",
  "user_id": null,
  "user_email": "user@example.com",
  "company_name": "Example Corp",
  "industry": "Technology",
  "answers": [
    {"question_id": "primary_objective", "selected_option": 1},
    ...
  ],
  "readiness_score": 72,
  "category_scores": {
    "workflow": 75.0,
    "data": 68.0,
    "automation": 70.0,
    "organization": 76.0
  },
  "primary_objective": "improve_efficiency",
  "top_recommendations": ["workflow_automation_engine", "task_routing_agent", "internal_copilot"],
  "pain_points": ["Manual data entry", "Slow approval processes"],
  "workflows": ["Invoice processing", "Customer onboarding"],
  "key_processes": ["Sales pipeline", "Support tickets"],
  "automation_level": "Partial",
  "data_quality_score": 70,
  "created_at": "2024-01-15T11:00:00Z"
}
```

### 2. ID Generation Utility

**File**: `app/utils/id_generator.py` (new file)

```python
import secrets
import string

def generate_diagnostic_id() -> str:
    """Generate unique diagnostic ID: diag_{12 chars}"""
    chars = string.ascii_lowercase + string.digits
    random_part = ''.join(secrets.choice(chars) for _ in range(12))
    return f"diag_{random_part}"

def generate_snapshot_id() -> str:
    """Generate unique snapshot ID: snap_{12 chars}"""
    chars = string.ascii_lowercase + string.digits
    random_part = ''.join(secrets.choice(chars) for _ in range(12))
    return f"snap_{random_part}"

def generate_blueprint_id() -> str:
    """Generate unique blueprint ID: bp_{12 chars}"""
    chars = string.ascii_lowercase + string.digits
    random_part = ''.join(secrets.choice(chars) for _ in range(12))
    return f"bp_{random_part}"
```

### 3. Diagnostic API Modifications

**File**: `app/api/routes/diagnostic.py`

**Changes to `/diagnostic/run` endpoint**:

1. Accept optional `user_email`, `company_name`, `industry` in request body
2. Generate `diagnostic_id` using `generate_diagnostic_id()`
3. Call `db.store_diagnostic()` to persist data
4. Return `diagnostic_id` in response

**Updated Request Model**:
```python
class DiagnosticSubmission(BaseModel):
    answers: List[DiagnosticAnswer]
    user_email: Optional[EmailStr] = None
    company_name: Optional[str] = None
    industry: Optional[str] = None
```

**Updated Response**:
```python
{
    "diagnostic_id": "diag_a7f3k9m2p5q1",  # NEW
    "score": 75,
    "category": "Building Momentum",
    "category_explanation": "...",
    "insights": [...],
    "recommendation": "...",
    "badge_svg": "...",
    "enriched_by_ai": false
}
```

### 4. Snapshot API Modifications

**File**: `app/api/routes/diagnostic.py`

**Changes to `/diagnostic/snapshot` endpoint**:

1. Accept optional `diagnostic_id`, `user_email`, `company_name`, `industry` in request body
2. If `diagnostic_id` provided, retrieve User_Context from diagnostic record
3. Generate `snapshot_id` using `generate_snapshot_id()`
4. Extract `pain_points`, `workflows`, `key_processes` from answers
5. Call `db.store_snapshot()` to persist data
6. Return `snapshot_id` and `diagnostic_id` in response

**Updated Request Model**:
```python
class SnapshotSubmission(BaseModel):
    snapshot_answers: List[SnapshotAnswer]
    diagnostic_id: Optional[str] = None
    user_email: Optional[EmailStr] = None
    company_name: Optional[str] = None
    industry: Optional[str] = None
    language: str = "en"
```

**Updated Response**:
```python
{
    "snapshot_id": "snap_x4j8n2v7c9k3",  # NEW
    "diagnostic_id": "diag_a7f3k9m2p5q1",  # NEW (if linked)
    "readiness_score": 72,
    "readiness_level": "Medium",
    "strength_index": 76,
    "bottleneck_index": 68,
    "top_recommendations": [...],
    "priority_score": 75,
    "deployment_phase_suggestion": "foundation_building",
    "category_scores": {...},
    "strength_category": "organization",
    "bottleneck_category": "data",
    "primary_objective": "improve_efficiency",
    "weights_used": {...}
}
```

### 5. Data Extraction Service

**File**: `app/services/data_extraction.py` (new file)

This service extracts structured data from snapshot answers for Blueprint generation.

```python
class DataExtractionService:
    def extract_pain_points(
        self,
        answers: List[Dict[str, Any]]
    ) -> List[str]:
        """
        Extract pain points from snapshot answers.
        
        Looks at specific questions:
        - bottlenecks_frequency
        - manual_tasks_percentage
        - process_duplication
        - change_resistance
        
        Maps high-severity answers to pain point descriptions.
        """
        
    def extract_workflows(
        self,
        answers: List[Dict[str, Any]]
    ) -> List[str]:
        """
        Extract workflows from snapshot answers.
        
        Looks at specific questions:
        - workflows_documented
        - sop_standardization
        - existing_automation_tools
        
        Infers workflow types from answer patterns.
        """
        
    def extract_key_processes(
        self,
        answers: List[Dict[str, Any]],
        primary_objective: str
    ) -> List[str]:
        """
        Extract key processes based on objective.
        
        Maps primary_objective to relevant process types:
        - increase_revenue → Sales, Marketing, Lead Management
        - improve_efficiency → Operations, Workflow Management
        - improve_response_time → Customer Support, Ticket Management
        """
        
    def determine_automation_level(
        self,
        answers: List[Dict[str, Any]]
    ) -> str:
        """
        Determine current automation level.
        
        Returns: "None", "Minimal", "Partial", "Significant", "Advanced"
        
        Based on:
        - existing_automation_tools
        - tool_integrations_maturity
        - manual_repetitive_tasks
        """
        
    def calculate_data_quality_score(
        self,
        answers: List[Dict[str, Any]]
    ) -> int:
        """
        Calculate data quality score (0-100).
        
        Based on:
        - data_centralized
        - data_accuracy_confidence
        - crm_usage_maturity
        - api_accessibility
        """
```

### 6. Blueprint Generation Service Updates

**File**: `app/services/blueprint_generation.py`

**Changes to `_retrieve_snapshot_data()` method**:

Replace mock data with real database retrieval:

```python
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
    # Retrieve from database
    snapshot_record = await db.get_snapshot(snapshot_id)
    
    if not snapshot_record:
        logger.warning(f"Snapshot {snapshot_id} not found")
        return None
    
    # Validate access (user owns snapshot or is super admin)
    if snapshot_record.get("user_id") != user_id and user_id != "super_admin":
        logger.warning(f"Access denied: user {user_id} cannot access snapshot {snapshot_id}")
        return None
    
    # Convert to SnapshotData model
    return SnapshotData(
        snapshot_id=snapshot_record["snapshot_id"],
        user_email=snapshot_record["user_email"],
        company_name=snapshot_record["company_name"],
        readiness_score=snapshot_record["readiness_score"],
        primary_objective=snapshot_record["primary_objective"],
        industry=snapshot_record.get("industry"),
        key_processes=snapshot_record["key_processes"],
        automation_level=snapshot_record["automation_level"],
        pain_points=snapshot_record["pain_points"],
        workflows=snapshot_record["workflows"],
        data_quality_score=snapshot_record["data_quality_score"]
    )
```

## Data Models

### Diagnostic Record

```python
class DiagnosticRecord(BaseModel):
    diagnostic_id: str
    user_id: Optional[str]
    user_email: Optional[str]
    company_name: Optional[str]
    industry: Optional[str]
    answers: List[Dict[str, Any]]
    score: int
    category: str
    created_at: datetime
```

### Snapshot Record

```python
class SnapshotRecord(BaseModel):
    snapshot_id: str
    diagnostic_id: Optional[str]  # Foreign key
    user_id: Optional[str]
    user_email: Optional[str]
    company_name: Optional[str]
    industry: Optional[str]
    answers: List[Dict[str, Any]]
    readiness_score: int
    category_scores: Dict[str, float]
    primary_objective: str
    top_recommendations: List[str]
    pain_points: List[str]
    workflows: List[str]
    key_processes: List[str]
    automation_level: str
    data_quality_score: int
    created_at: datetime
```

### Blueprint Metadata Update

```python
class BlueprintMetadata(BaseModel):
    blueprint_id: str
    snapshot_id: str  # Foreign key (already exists)
    user_id: str
    schema_version: str
    system_name: str
    created_at: datetime
    version: str
    json_path: str
    pdf_path: str
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Diagnostic ID Generation Uniqueness

*For any* two diagnostic submissions, the generated diagnostic_ids should be unique (collision probability < 1 in 10^18)

**Validates: Requirements 1.5**

### Property 2: Diagnostic Persistence Round Trip

*For any* diagnostic submission with valid data, storing then retrieving the diagnostic should return equivalent data (all fields match)

**Validates: Requirements 1.2, 1.3, 6.1**

### Property 3: Snapshot ID Generation Uniqueness

*For any* two snapshot submissions, the generated snapshot_ids should be unique (collision probability < 1 in 10^18)

**Validates: Requirements 2.2, 2.7**

### Property 4: Snapshot Persistence Round Trip

*For any* snapshot submission with valid data, storing then retrieving the snapshot should return equivalent data (all fields match including foreign keys)

**Validates: Requirements 2.3, 2.5, 7.1**

### Property 5: User Context Inheritance

*For any* snapshot submission with a valid diagnostic_id, the snapshot record should contain the same user_email, company_name, and industry as the linked diagnostic

**Validates: Requirements 2.4, 5.2**

### Property 6: Foreign Key Integrity

*For any* snapshot record with a diagnostic_id, querying that diagnostic_id should return a valid diagnostic record

**Validates: Requirements 4.1, 7.5**

### Property 7: Blueprint Data Authenticity

*For any* blueprint generated from a snapshot_id, the blueprint should contain the real company_name, pain_points, workflows, and key_processes from that snapshot (no mock data)

**Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.9**

### Property 8: ID Chain Traceability

*For any* blueprint_id, following the chain blueprint → snapshot → diagnostic should return valid records at each level

**Validates: Requirements 4.2, 4.3, 4.4**

### Property 9: Zero Re-Entry Validation

*For any* user completing diagnostic → snapshot → blueprint, the user_email, company_name, and industry should be entered exactly once and reused in all subsequent steps

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

### Property 10: Snapshot Answer Count Validation

*For any* snapshot submission, the system should reject submissions with answer counts != 30

**Validates: Requirements 7.3**

### Property 11: Diagnostic Answer Count Validation

*For any* diagnostic submission, the system should reject submissions with answer counts != 12

**Validates: Requirements 6.3**

### Property 12: Data Extraction Consistency

*For any* snapshot answers, extracting pain_points, workflows, and key_processes multiple times should produce the same results (deterministic extraction)

**Validates: Requirements 3.3, 3.4, 3.5**

## Error Handling

### Database Errors

1. **File Write Failures**:
   - Log error with full context (diagnostic_id, user_id, error message)
   - Return HTTP 500 with user-friendly message
   - Do not expose file system paths to users

2. **File Read Failures**:
   - Log warning for missing files
   - Return HTTP 404 for not found
   - Return HTTP 500 for read errors

3. **JSON Parse Errors**:
   - Log error with file path and parse error
   - Return HTTP 500 with message to contact support
   - Include diagnostic_id/snapshot_id in logs for debugging

### Validation Errors

1. **Invalid diagnostic_id Format**:
   - Return HTTP 422 with message: "Invalid diagnostic_id format. Expected: diag_{12 chars}"

2. **Diagnostic Not Found**:
   - Return HTTP 404 with message: "Diagnostic not found. Please complete the free diagnostic first."

3. **Snapshot Not Found**:
   - Return HTTP 404 with message: "Snapshot not found. Please complete the AI Snapshot first."

4. **Answer Count Mismatch**:
   - Return HTTP 422 with message: "Exactly {expected} questions required. Received {actual} questions."

5. **Foreign Key Violation**:
   - Return HTTP 422 with message: "Invalid diagnostic_id. Diagnostic not found."

### Access Control Errors

1. **Unauthorized Access**:
   - Return HTTP 403 with message: "Access denied. You can only access your own data."
   - Exception: super_admin can access all data

## Testing Strategy

### Unit Tests

Unit tests validate specific examples, edge cases, and error conditions. Focus on:

1. **ID Generation**:
   - Test format validation (prefix + 12 chars)
   - Test character set (lowercase + digits only)
   - Test uniqueness across 1000 generations

2. **Database Operations**:
   - Test store_diagnostic with valid data
   - Test store_diagnostic with missing optional fields
   - Test get_diagnostic with existing ID
   - Test get_diagnostic with non-existent ID
   - Test store_snapshot with diagnostic_id link
   - Test store_snapshot without diagnostic_id link
   - Test foreign key validation

3. **Data Extraction**:
   - Test extract_pain_points with high-severity answers
   - Test extract_workflows with documented workflows
   - Test extract_key_processes for each objective type
   - Test automation_level determination
   - Test data_quality_score calculation

4. **API Endpoints**:
   - Test /diagnostic/run returns diagnostic_id
   - Test /diagnostic/snapshot returns snapshot_id
   - Test /diagnostic/snapshot with diagnostic_id retrieves User_Context
   - Test blueprint generation uses real snapshot data

### Property-Based Tests

Property tests verify universal properties across all inputs using a property-based testing library (e.g., Hypothesis for Python). Each test should run minimum 100 iterations.

1. **Property 1: Diagnostic ID Uniqueness**
   - Generate 1000 diagnostic IDs
   - Assert all IDs are unique
   - **Feature: data-handoff-pipeline-fix, Property 1: Diagnostic ID Generation Uniqueness**

2. **Property 2: Diagnostic Round Trip**
   - Generate random diagnostic data
   - Store to database
   - Retrieve from database
   - Assert all fields match
   - **Feature: data-handoff-pipeline-fix, Property 2: Diagnostic Persistence Round Trip**

3. **Property 3: Snapshot ID Uniqueness**
   - Generate 1000 snapshot IDs
   - Assert all IDs are unique
   - **Feature: data-handoff-pipeline-fix, Property 3: Snapshot ID Generation Uniqueness**

4. **Property 4: Snapshot Round Trip**
   - Generate random snapshot data
   - Store to database
   - Retrieve from database
   - Assert all fields match including foreign keys
   - **Feature: data-handoff-pipeline-fix, Property 4: Snapshot Persistence Round Trip**

5. **Property 5: User Context Inheritance**
   - Generate random diagnostic with User_Context
   - Store diagnostic
   - Generate snapshot linked to diagnostic
   - Store snapshot
   - Retrieve snapshot
   - Assert User_Context matches diagnostic
   - **Feature: data-handoff-pipeline-fix, Property 5: User Context Inheritance**

6. **Property 6: Foreign Key Integrity**
   - Generate random diagnostic
   - Store diagnostic
   - Generate snapshot with diagnostic_id
   - Store snapshot
   - Retrieve diagnostic using snapshot's diagnostic_id
   - Assert diagnostic exists and matches
   - **Feature: data-handoff-pipeline-fix, Property 6: Foreign Key Integrity**

7. **Property 7: Blueprint Data Authenticity**
   - Generate random snapshot with real data
   - Store snapshot
   - Generate blueprint from snapshot
   - Assert blueprint contains real company_name, pain_points, workflows
   - Assert blueprint contains no mock data strings
   - **Feature: data-handoff-pipeline-fix, Property 7: Blueprint Data Authenticity**

8. **Property 8: ID Chain Traceability**
   - Generate diagnostic → snapshot → blueprint chain
   - Store all records
   - Retrieve blueprint
   - Follow chain to snapshot
   - Follow chain to diagnostic
   - Assert all records exist and link correctly
   - **Feature: data-handoff-pipeline-fix, Property 8: ID Chain Traceability**

9. **Property 9: Zero Re-Entry Validation**
   - Generate random User_Context
   - Create diagnostic with User_Context
   - Create snapshot linked to diagnostic (no User_Context provided)
   - Create blueprint from snapshot
   - Assert all three records contain same User_Context
   - **Feature: data-handoff-pipeline-fix, Property 9: Zero Re-Entry Validation**

10. **Property 10: Snapshot Answer Count Validation**
    - Generate snapshot submissions with answer counts from 0 to 50
    - Submit to API
    - Assert only count=30 succeeds
    - Assert all other counts return HTTP 422
    - **Feature: data-handoff-pipeline-fix, Property 10: Snapshot Answer Count Validation**

11. **Property 11: Diagnostic Answer Count Validation**
    - Generate diagnostic submissions with answer counts from 0 to 20
    - Submit to API
    - Assert only count=12 succeeds
    - Assert all other counts return HTTP 422
    - **Feature: data-handoff-pipeline-fix, Property 11: Diagnostic Answer Count Validation**

12. **Property 12: Data Extraction Consistency**
    - Generate random snapshot answers
    - Extract pain_points 10 times
    - Assert all extractions produce identical results
    - Repeat for workflows and key_processes
    - **Feature: data-handoff-pipeline-fix, Property 12: Data Extraction Consistency**

### Integration Tests

1. **End-to-End Flow Test**:
   - Submit diagnostic with User_Context
   - Verify diagnostic_id returned
   - Submit snapshot with diagnostic_id
   - Verify snapshot_id returned and User_Context inherited
   - Generate blueprint with snapshot_id
   - Verify blueprint contains real data from snapshot
   - Verify complete ID chain traceability

2. **Data Loss Prevention Test**:
   - Submit diagnostic
   - Simulate page refresh (clear frontend memory)
   - Submit snapshot with diagnostic_id
   - Verify User_Context retrieved from database
   - Simulate page refresh
   - Generate blueprint with snapshot_id
   - Verify all data present in blueprint

3. **Concurrent Submission Test**:
   - Submit 10 diagnostics concurrently
   - Verify all diagnostic_ids are unique
   - Verify all records stored correctly

### Test Configuration

- Use Hypothesis for property-based testing
- Configure minimum 100 iterations per property test
- Use pytest for unit and integration tests
- Mock file system operations for unit tests
- Use temporary directories for integration tests
- Clean up test data after each test run
