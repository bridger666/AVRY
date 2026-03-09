# Design Document: Aivory Complete System

## Overview

The Aivory Complete System is a unified platform that provides progressive AI diagnostic and deployment capabilities through four distinct tiers. The system architecture maintains backward compatibility with existing free diagnostic functionality while adding three new paid tiers: AI Snapshot ($15), Deep Diagnostic ($99), and AI Operating Partner (subscription-based).

The design emphasizes:
- **Progressive Enhancement**: Each tier builds upon previous diagnostic data
- **Unified Dashboard**: Single interface with mode-based content switching
- **Tool-Agnostic Architecture**: A-to-A pseudo-code layer for future flexibility
- **Prototype-First**: No authentication or payment processing in initial implementation
- **Multilingual Support**: English and Indonesian language support
- **Design Consistency**: Apple-style UI with Inter Tight font and solid colors

## Architecture

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
│  (React-like vanilla JS, unified dashboard, mode switching)  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (FastAPI)                     │
│  /api/v1/diagnostic/run (Free)                              │
│  /api/v1/diagnostic/snapshot (AI Snapshot $15)              │
│  /api/v1/diagnostic/deep (Deep Diagnostic $99)              │
│  /api/v1/workflow/* (Operating Partner)                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  - Scoring Service (rule-based)                             │
│  - AI Enrichment Service (Sumopod integration)              │
│  - Workflow Service (A-to-A pseudo-code)                    │
│  - Tier Management Service                                  │
│  - Report Generation Service                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│  - Sumopod LLM API (deepseek, kimi, glm models)            │
│  - PDF Generation Library                                   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Free Diagnostic Flow:**
```
User → 12 Questions → Rule-based Scoring → Dashboard (mode=free) → Upgrade Options
```

**AI Snapshot Flow:**
```
Free Diagnostic Answers → Sumopod API (deepseek-v3-2-251201) → Enhanced Analysis → Dashboard (mode=snapshot)
```

**Deep Diagnostic Flow:**
```
Free Diagnostic Answers → Sumopod API (glm-4-7-251222) → Blueprint Generation → Dashboard (mode=blueprint) → Deploy Option
```

**Operating Partner Flow:**
```
Blueprint → Tier Selection → Workflow Conversion → Dashboard (mode=operate) → Simulated Execution
```

## Components and Interfaces

### Frontend Components

#### 1. Unified Dashboard Component

**Purpose**: Single-page dashboard that adapts content based on mode parameter

**Interface**:
```javascript
class UnifiedDashboard {
  constructor(mode, data, language) {
    this.mode = mode; // 'free', 'snapshot', 'blueprint', 'operate'
    this.data = data; // Diagnostic or workflow data
    this.language = language; // 'en' or 'id'
    this.selectedTier = null; // null, 'builder', 'operator', 'enterprise'
  }
  
  render() {
    // Dynamically render content based on mode
  }
  
  switchMode(newMode, newData) {
    // Switch dashboard mode without page reload
  }
  
  downloadReport() {
    // Generate and download PDF report
  }
}
```

**Modes**:
- `mode=free`: Display free diagnostic results with upgrade CTAs
- `mode=snapshot`: Display AI Snapshot analysis with deep diagnostic CTA
- `mode=blueprint`: Display complete system blueprint with deploy CTA
- `mode=operate`: Display operating partner dashboard with workflow management

#### 2. Diagnostic Question Flow Component

**Purpose**: Handle 12-question free diagnostic flow

**Interface**:
```javascript
class DiagnosticFlow {
  constructor(questions) {
    this.questions = questions; // Array of 12 questions
    this.currentIndex = 0;
    this.answers = {};
  }
  
  renderQuestion(index) {
    // Render current question with options
  }
  
  selectOption(questionId, optionIndex) {
    // Record answer and update UI
  }
  
  navigate(direction) {
    // Move to previous/next question
  }
  
  submit() {
    // Submit answers to API
  }
}
```

#### 3. Workflow Panel Component

**Purpose**: Display and manage deployed workflows in operating partner mode

**Interface**:
```javascript
class WorkflowPanel {
  constructor(workflows, tier) {
    this.workflows = workflows; // Array of workflow objects
    this.tier = tier; // Current subscription tier
  }
  
  addWorkflow(blueprint) {
    // Convert blueprint to workflow card
  }
  
  executeWorkflow(workflowId) {
    // Simulate workflow execution
  }
  
  displayExecutionStatus(workflowId, status) {
    // Show execution progress
  }
}
```

#### 4. Tier Selection Component

**Purpose**: Allow users to choose subscription tier

**Interface**:
```javascript
class TierSelector {
  constructor(tiers) {
    this.tiers = tiers; // Array of tier objects
  }
  
  displayTiers() {
    // Render tier comparison cards
  }
  
  selectTier(tierName) {
    // Set selected tier in local state
  }
}
```

### Backend Components

#### 1. Free Diagnostic Endpoint

**Endpoint**: `POST /api/v1/diagnostic/run`

**Request**:
```json
{
  "answers": [
    {
      "question_id": "business_objective",
      "selected_option": 2
    }
  ]
}
```

**Response**:
```json
{
  "score": 67,
  "category": "AI-Ready",
  "category_explanation": "Your organization shows strong readiness...",
  "insights": ["Insight 1", "Insight 2", "Insight 3"],
  "recommendation": "Next steps recommendation...",
  "badge_svg": "<svg>...</svg>"
}
```

**Implementation**: Uses existing rule-based scoring service, no LLM calls

#### 2. AI Snapshot Endpoint

**Endpoint**: `POST /api/v1/diagnostic/snapshot`

**Request**:
```json
{
  "free_diagnostic_answers": [
    {
      "question_id": "business_objective",
      "selected_option": 2
    }
  ],
  "language": "en"
}
```

**Response**:
```json
{
  "readiness_score": 72,
  "readiness_level": "High",
  "executive_summary": "Your organization demonstrates...",
  "business_objective_detected": "Cost reduction through automation",
  "key_gaps": [
    "Limited process documentation",
    "Siloed data systems"
  ],
  "automation_opportunities": [
    "Invoice processing automation",
    "Report generation automation"
  ],
  "recommended_system_outline": "A multi-agent system focused on...",
  "priority_actions": [
    "Document top 3 workflows",
    "Centralize customer data",
    "Pilot invoice automation"
  ],
  "upgrade_recommendation": "Consider Deep Diagnostic for complete blueprint"
}
```

**Implementation**:
- Primary model: `deepseek-v3-2-251201`
- Fallback model: `kimi-k2-250905`
- Timeout: 60 seconds
- Retry logic: 1 retry on JSON parse failure

#### 3. Deep Diagnostic Endpoint

**Endpoint**: `POST /api/v1/diagnostic/deep`

**Request**:
```json
{
  "free_diagnostic_answers": [
    {
      "question_id": "business_objective",
      "selected_option": 2
    }
  ],
  "language": "en"
}
```

**Response**:
```json
{
  "executive_summary": "Based on your diagnostic...",
  "system_overview": {
    "system_name": "Invoice Processing & Approval System",
    "description": "Automated invoice handling system...",
    "confidence_level": "High"
  },
  "workflow_architecture": {
    "trigger": "Email received with invoice attachment",
    "steps": [
      "Extract invoice data using OCR",
      "Validate against purchase orders",
      "Route to appropriate approver",
      "Update ERP system"
    ],
    "tools_suggested": [
      "Document Parser Agent",
      "Validation Agent",
      "Routing Agent",
      "Integration Agent"
    ]
  },
  "agent_structure": [
    {
      "agent_name": "Document Parser",
      "role": "Extract structured data from invoices",
      "responsibilities": [
        "OCR processing",
        "Data extraction",
        "Format normalization"
      ]
    }
  ],
  "expected_impact": {
    "automation_potential_percent": 85,
    "estimated_time_saved_hours_per_week": 20,
    "projected_roi": "3-6 months payback period"
  },
  "deployment_complexity": "Medium - requires ERP integration",
  "recommended_subscription_tier": "Operator"
}
```

**Implementation**:
- Model: `glm-4-7-251222`
- Timeout: 90 seconds
- Output format: A-to-A pseudo-code (no tool-specific references)
- Retry logic: 1 retry on JSON parse failure

#### 4. Workflow Deployment Service

**Purpose**: Convert blueprints to executable workflow representations

**Interface**:
```python
class WorkflowDeploymentService:
    def convert_blueprint_to_workflow(
        self,
        blueprint: dict,
        tier: str
    ) -> dict:
        """
        Convert blueprint pseudo-code to workflow card
        
        Args:
            blueprint: Deep diagnostic blueprint
            tier: Selected subscription tier
            
        Returns:
            Workflow object with simulated execution capability
        """
        pass
    
    def simulate_execution(
        self,
        workflow_id: str,
        input_data: dict
    ) -> dict:
        """
        Simulate workflow execution (no real n8n)
        
        Args:
            workflow_id: Workflow identifier
            input_data: Simulated input
            
        Returns:
            Simulated execution result
        """
        pass
```

#### 5. A-to-A Pseudo-Code Service

**Purpose**: Generate and parse tool-agnostic workflow representations

**Interface**:
```python
class A2APseudoCodeService:
    def generate_pseudo_code(
        self,
        workflow_description: str
    ) -> str:
        """
        Generate A-to-A pseudo-code from natural language
        
        Format:
        TRIGGER: [event description]
        IF [condition]:
            ROUTE TO [agent_name]
        ELSE:
            ROUTE TO [agent_name]
        EXECUTE: [action]
        
        Args:
            workflow_description: Natural language workflow
            
        Returns:
            Structured pseudo-code string
        """
        pass
    
    def parse_pseudo_code(
        self,
        pseudo_code: str
    ) -> dict:
        """
        Parse pseudo-code into structured workflow object
        
        Args:
            pseudo_code: A-to-A formatted string
            
        Returns:
            Structured workflow dictionary
        """
        pass
```

**Example A-to-A Pseudo-Code**:
```
TRIGGER: Email received with PDF attachment
IF attachment_type == "invoice":
    ROUTE TO Document_Parser_Agent
    EXTRACT: invoice_number, amount, vendor, date
    ROUTE TO Validation_Agent
    IF validation_passed:
        ROUTE TO Approval_Router_Agent
        IF amount > 10000:
            ROUTE TO Senior_Approver
        ELSE:
            ROUTE TO Standard_Approver
    ELSE:
        ROUTE TO Exception_Handler_Agent
ELSE:
    ROUTE TO General_Document_Handler
```

#### 6. Tier Management Service

**Purpose**: Manage subscription tier limits and enforcement

**Interface**:
```python
class TierManagementService:
    TIERS = {
        "builder": {
            "price": 199,
            "workflows": 3,
            "executions": 2500,
            "credits": 50
        },
        "operator": {
            "price": 499,
            "workflows": 10,
            "executions": 10000,
            "credits": 300
        },
        "enterprise": {
            "price": 1200,
            "workflows": float('inf'),
            "executions": 50000,
            "credits": 2000
        }
    }
    
    def check_workflow_limit(
        self,
        tier: str,
        current_count: int
    ) -> bool:
        """Check if user can add more workflows"""
        pass
    
    def check_execution_limit(
        self,
        tier: str,
        current_count: int
    ) -> bool:
        """Check if user has executions remaining"""
        pass
    
    def check_credit_balance(
        self,
        tier: str,
        current_balance: int,
        required: int
    ) -> bool:
        """Check if user has sufficient credits"""
        pass
```

#### 7. Report Generation Service

**Purpose**: Generate downloadable PDF reports for each tier

**Interface**:
```python
class ReportGenerationService:
    def generate_free_report(
        self,
        diagnostic_result: dict,
        language: str
    ) -> bytes:
        """Generate simple readiness score PDF"""
        pass
    
    def generate_snapshot_report(
        self,
        snapshot_result: dict,
        language: str
    ) -> bytes:
        """Generate structured readiness summary PDF"""
        pass
    
    def generate_blueprint_report(
        self,
        blueprint_result: dict,
        language: str
    ) -> bytes:
        """Generate premium AI System Blueprint PDF"""
        pass
```

## Data Models

### Diagnostic Answer Model

```python
from pydantic import BaseModel
from typing import List

class DiagnosticAnswer(BaseModel):
    question_id: str
    selected_option: int  # 0-3 index

class DiagnosticSubmission(BaseModel):
    answers: List[DiagnosticAnswer]
```

### Snapshot Result Model

```python
class SnapshotResult(BaseModel):
    readiness_score: int  # 0-100
    readiness_level: str  # "Low", "Medium", "High"
    executive_summary: str
    business_objective_detected: str
    key_gaps: List[str]
    automation_opportunities: List[str]
    recommended_system_outline: str
    priority_actions: List[str]
    upgrade_recommendation: str
```

### Blueprint Result Model

```python
class SystemOverview(BaseModel):
    system_name: str
    description: str
    confidence_level: str  # "Low", "Medium", "High"

class WorkflowArchitecture(BaseModel):
    trigger: str
    steps: List[str]
    tools_suggested: List[str]

class AgentStructure(BaseModel):
    agent_name: str
    role: str
    responsibilities: List[str]

class ExpectedImpact(BaseModel):
    automation_potential_percent: int
    estimated_time_saved_hours_per_week: int
    projected_roi: str

class BlueprintResult(BaseModel):
    executive_summary: str
    system_overview: SystemOverview
    workflow_architecture: WorkflowArchitecture
    agent_structure: List[AgentStructure]
    expected_impact: ExpectedImpact
    deployment_complexity: str
    recommended_subscription_tier: str
```

### Workflow Model

```python
class Workflow(BaseModel):
    id: str
    name: str
    description: str
    pseudo_code: str  # A-to-A format
    status: str  # "active", "paused", "draft"
    execution_count: int
    last_executed: Optional[datetime]
    tier: str  # "builder", "operator", "enterprise"
```

### Tier Model

```python
class TierLimits(BaseModel):
    workflows: int
    executions: int
    credits: int

class TierUsage(BaseModel):
    workflows_used: int
    executions_used: int
    credits_used: int

class TierStatus(BaseModel):
    tier_name: str
    limits: TierLimits
    usage: TierUsage
    upgrade_available: bool
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Environment Configuration Validation

*For any* system startup, if required environment variables (SUMOPOD_API_KEY, SUMOPOD_BASE_URL) are missing or malformed, the system should reject initialization and API requests should fail with appropriate error messages.

**Validates: Requirements 1.1, 1.2, 1.3, 1.5**

### Property 2: Free Diagnostic Isolation

*For any* free diagnostic execution, no external API calls (Sumopod or other LLM services) should be made, and the response should be generated using only rule-based scoring.

**Validates: Requirements 2.2**

### Property 3: Diagnostic Response Completeness

*For any* valid diagnostic submission (free, snapshot, or deep), the response should contain all required fields as specified for that diagnostic type.

**Validates: Requirements 2.3, 3.5, 4.3**

### Property 4: Model Fallback Behavior

*For any* AI Snapshot request, if the primary model (deepseek-v3-2-251201) fails, the system should automatically attempt the request with the fallback model (kimi-k2-250905).

**Validates: Requirements 3.4**

### Property 5: A-to-A Pseudo-Code Format Compliance

*For any* deep diagnostic blueprint, the workflow_architecture should follow A-to-A pseudo-code format (TRIGGER → IF/ELSE → ROUTE TO agents) and should not contain references to specific tools (n8n, Claude, Make, Zapier).

**Validates: Requirements 4.8, 4.9, 8.1, 8.2, 8.3**

### Property 6: Dashboard Mode Switching

*For any* valid mode parameter (free, snapshot, blueprint, operate), the dashboard should dynamically render the appropriate content sections without requiring page reload.

**Validates: Requirements 5.2, 5.3**

### Property 7: PDF Report Generation

*For any* completed diagnostic (free, snapshot, or deep), the system should generate a valid downloadable PDF report containing all relevant diagnostic data.

**Validates: Requirements 3.10, 4.6, 10.1, 10.2, 10.3, 10.4**

### Property 8: Blueprint to Workflow Conversion

*For any* valid blueprint result, when a tier is selected for deployment, the system should successfully convert the blueprint pseudo-code into a workflow card format with all required fields (id, name, description, pseudo_code, status, tier).

**Validates: Requirements 7.3**

### Property 9: A-to-A Pseudo-Code Storage

*For any* generated blueprint, the A-to-A pseudo-code should be stored internally in a structured format that can be retrieved for future processing.

**Validates: Requirements 8.4**

### Property 10: Language Prompt Injection

*For any* LLM request, when language is set to "id" (Indonesian), the system prompt should include "Generate output in Indonesian" instruction; when language is "en", no language instruction should be added.

**Validates: Requirements 9.2**

### Property 11: Language State Persistence

*For any* language setting (en or id), when switching between dashboard modes, the language preference should be maintained and UI text should remain in the selected language.

**Validates: Requirements 9.4, 9.5**

### Property 12: LLM Error Retry Logic

*For any* LLM response that fails JSON parsing, the system should retry once with "Return STRICT JSON only" appended to the prompt, and if the retry also fails, should return a user-friendly error message without crashing.

**Validates: Requirements 11.1, 11.2, 11.3**

### Property 13: LLM Request Timeout Handling

*For any* LLM API request, if the request exceeds the configured timeout duration, the system should gracefully handle the timeout and return an appropriate error response.

**Validates: Requirements 11.4**

### Property 14: Error Logging Without Data Exposure

*For any* system error, the error should be logged with sufficient detail for debugging, but user-facing error messages should not expose sensitive data (API keys, internal paths, stack traces).

**Validates: Requirements 11.5**

### Property 15: API Unavailability Handling

*For any* Sumopod API request, if the API is unavailable (connection error, timeout, or service down), the system should return an appropriate error message indicating the service is temporarily unavailable.

**Validates: Requirements 11.6**

### Property 16: Download Functionality Availability

*For any* dashboard mode (free, snapshot, blueprint), a download button or link should be present and functional, allowing users to download the appropriate report format.

**Validates: Requirements 5.10**

### Property 17: Diagnostic Data Preservation

*For any* transition between dashboard modes, diagnostic data (answers, results, scores) should be preserved in state and remain accessible when returning to previous modes.

**Validates: Requirements 14.6**

## Error Handling

### Error Categories

**1. Configuration Errors**
- Missing environment variables
- Invalid environment variable format
- Missing .env.local file

**Handling**: Fail fast at startup with clear error messages indicating which variables are missing or invalid.

**2. LLM API Errors**
- Connection timeout
- Service unavailable
- Invalid response format
- JSON parsing failure
- Rate limiting

**Handling**:
- Implement retry logic (1 retry with modified prompt for JSON errors)
- Fallback to alternative models where configured
- Return user-friendly error messages
- Log detailed errors for debugging
- Never expose API keys or internal details to users

**3. Input Validation Errors**
- Missing required questions
- Invalid question IDs
- Out-of-range option selections
- Missing language parameter

**Handling**:
- Return 422 Unprocessable Entity with specific validation errors
- Provide clear guidance on what's required
- Validate early in the request pipeline

**4. Tier Limit Errors**
- Workflow limit exceeded
- Execution limit exceeded
- Insufficient intelligence credits

**Handling**:
- Check limits before allowing operations
- Return clear error messages with current usage and limits
- Provide upgrade path information

**5. PDF Generation Errors**
- Template rendering failure
- Data formatting issues
- File system errors

**Handling**:
- Log detailed error information
- Return user-friendly error message
- Provide alternative data export options if possible

### Error Response Format

All API errors should follow consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly error message",
    "details": {
      "field": "specific_field",
      "reason": "validation_failed"
    }
  }
}
```

### Timeout Configuration

- Free Diagnostic: No timeout (rule-based, instant)
- AI Snapshot: 60 seconds
- Deep Diagnostic: 90 seconds
- Workflow Execution: 30 seconds (simulated)

### Retry Strategy

**LLM JSON Parsing Failures**:
1. First attempt: Standard prompt
2. If JSON parse fails: Retry with "Return STRICT JSON only. Do not include markdown code blocks." appended
3. If second attempt fails: Return error to user

**LLM Connection Failures**:
1. First attempt: Primary model
2. If connection fails: Try fallback model (where configured)
3. If fallback fails: Return error to user

**No retries for**:
- Validation errors (fail immediately)
- Authentication errors (fail immediately)
- Tier limit errors (fail immediately)

## Testing Strategy

### Dual Testing Approach

The Aivory Complete System requires both unit testing and property-based testing for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
**Property Tests**: Verify universal properties across all inputs through randomization

### Unit Testing Focus Areas

1. **Specific Examples**
   - Free diagnostic with known answer set produces expected score
   - Snapshot endpoint returns expected JSON structure
   - Blueprint endpoint returns expected JSON structure
   - Dashboard renders correctly for mode=free
   - Tier configuration matches specification

2. **Edge Cases**
   - Empty diagnostic answers
   - Malformed environment variables
   - Missing required fields in requests
   - Invalid mode parameters
   - Tier limits at boundary conditions

3. **Integration Points**
   - Sumopod API integration
   - PDF generation library integration
   - Frontend-backend communication
   - Dashboard mode switching
   - Workflow deployment flow

### Property-Based Testing Configuration

**Library Selection**: Use `hypothesis` for Python backend, `fast-check` for JavaScript frontend

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `# Feature: aivory-complete-system, Property {number}: {property_text}`

**Property Test Coverage**:

1. **Property 1: Environment Configuration Validation**
   - Generate random combinations of missing/present/malformed env vars
   - Verify appropriate rejection behavior

2. **Property 2: Free Diagnostic Isolation**
   - Generate random diagnostic answer sets
   - Monitor network calls to ensure no external API calls

3. **Property 3: Diagnostic Response Completeness**
   - Generate random valid diagnostic submissions
   - Verify all required fields present in response

4. **Property 4: Model Fallback Behavior**
   - Simulate primary model failures
   - Verify fallback model is called

5. **Property 5: A-to-A Pseudo-Code Format Compliance**
   - Generate random blueprint results
   - Verify format compliance and absence of tool names

6. **Property 6: Dashboard Mode Switching**
   - Generate random mode transitions
   - Verify correct content rendering

7. **Property 7: PDF Report Generation**
   - Generate random diagnostic results
   - Verify valid PDF output

8. **Property 8: Blueprint to Workflow Conversion**
   - Generate random blueprints
   - Verify successful conversion to workflow format

9. **Property 9: A-to-A Pseudo-Code Storage**
   - Generate random blueprints
   - Verify pseudo-code is stored and retrievable

10. **Property 10: Language Prompt Injection**
    - Generate random language settings
    - Verify correct prompt construction

11. **Property 11: Language State Persistence**
    - Generate random mode transitions with language settings
    - Verify language preference maintained

12. **Property 12: LLM Error Retry Logic**
    - Generate random invalid JSON responses
    - Verify retry behavior and error handling

13. **Property 13: LLM Request Timeout Handling**
    - Simulate random timeout scenarios
    - Verify graceful handling

14. **Property 14: Error Logging Without Data Exposure**
    - Generate random error conditions
    - Verify logs contain details but user messages don't expose sensitive data

15. **Property 15: API Unavailability Handling**
    - Simulate random API unavailability scenarios
    - Verify appropriate error responses

16. **Property 16: Download Functionality Availability**
    - Generate random dashboard modes
    - Verify download functionality present

17. **Property 17: Diagnostic Data Preservation**
    - Generate random mode transitions with diagnostic data
    - Verify data preservation

### Test Organization

```
tests/
├── unit/
│   ├── test_diagnostic_endpoints.py
│   ├── test_scoring_service.py
│   ├── test_sumopod_client.py
│   ├── test_a2a_service.py
│   ├── test_tier_service.py
│   ├── test_report_generation.py
│   └── test_dashboard_rendering.js
├── property/
│   ├── test_environment_config_properties.py
│   ├── test_diagnostic_properties.py
│   ├── test_llm_properties.py
│   ├── test_workflow_properties.py
│   ├── test_language_properties.py
│   └── test_error_handling_properties.py
└── integration/
    ├── test_free_diagnostic_flow.py
    ├── test_snapshot_flow.py
    ├── test_blueprint_flow.py
    └── test_deployment_flow.py
```

### Testing Best Practices

1. **Property tests handle comprehensive input coverage** - Don't write excessive unit tests for input variations
2. **Unit tests focus on specific examples** - Use them to demonstrate correct behavior for known cases
3. **Each property test runs minimum 100 iterations** - Ensures statistical confidence
4. **Tag all property tests** - Reference design document property number
5. **Test isolation** - Each test should be independent and not rely on shared state
6. **Mock external services** - Use mocks for Sumopod API in most tests
7. **Integration tests use real services** - Have separate integration tests that call real APIs (with test API keys)

## Implementation Notes

### Phase 1: Backend Foundation
1. Extend existing diagnostic endpoint structure
2. Implement Sumopod client with retry logic
3. Create snapshot and deep diagnostic endpoints
4. Implement A-to-A pseudo-code service
5. Add PDF generation service

### Phase 2: Frontend Dashboard
1. Create unified dashboard component
2. Implement mode switching logic
3. Add tier selection UI
4. Implement workflow panel
5. Add download functionality

### Phase 3: Integration & Testing
1. Connect frontend to new endpoints
2. Implement error handling
3. Add loading states
4. Write unit tests
5. Write property-based tests
6. Perform integration testing

### Phase 4: Polish & Documentation
1. Add multilingual support
2. Refine UI styling
3. Generate PDF templates
4. Write user documentation
5. Create deployment guide

### Technology Stack

**Backend**:
- FastAPI (existing)
- Python 3.9+
- python-dotenv for environment management
- httpx for async HTTP requests
- ReportLab or WeasyPrint for PDF generation
- hypothesis for property-based testing

**Frontend**:
- Vanilla JavaScript (existing)
- No framework dependencies
- CSS3 with custom properties
- fast-check for property-based testing

**External Services**:
- Sumopod API (LLM provider)
- Models: deepseek-v3-2-251201, kimi-k2-250905, glm-4-7-251222

### Security Considerations

1. **API Key Management**
   - Never commit .env.local to version control
   - Use environment variables exclusively
   - Validate API keys at startup
   - Rotate keys regularly

2. **Input Validation**
   - Validate all user inputs
   - Sanitize data before LLM prompts
   - Limit request sizes
   - Rate limit API endpoints

3. **Error Handling**
   - Never expose internal errors to users
   - Log errors securely
   - Sanitize error messages
   - Monitor error rates

4. **Data Privacy**
   - Don't store user diagnostic data (prototype mode)
   - Use local state only
   - Clear sensitive data from logs
   - Follow data minimization principles

### Performance Optimization

1. **LLM Request Optimization**
   - Keep prompts concise
   - Use appropriate temperature settings
   - Set reasonable max_tokens limits
   - Implement caching where appropriate

2. **Frontend Optimization**
   - Lazy load dashboard modes
   - Minimize DOM manipulations
   - Use CSS transitions for smooth UX
   - Optimize SVG animations

3. **Backend Optimization**
   - Use async/await for I/O operations
   - Implement connection pooling
   - Cache static content
   - Monitor response times

### Deployment Considerations

**Prototype Mode**:
- No database required
- No authentication system
- No payment processing
- Local state management only
- Suitable for demo and validation

**Future Production Mode** (not in scope):
- Add user authentication
- Integrate Stripe for payments
- Add database for persistence
- Implement real n8n workflow execution
- Add monitoring and analytics

## Appendix

### A-to-A Pseudo-Code Specification

**Format Rules**:
1. Start with TRIGGER statement
2. Use IF/ELSE for conditional logic
3. Use ROUTE TO for agent invocation
4. Use EXECUTE for actions
5. Use EXTRACT for data operations
6. Indent nested logic
7. No tool-specific references

**Example**:
```
TRIGGER: Email received with PDF attachment
IF attachment_type == "invoice":
    ROUTE TO Document_Parser_Agent
    EXTRACT: invoice_number, amount, vendor, date
    ROUTE TO Validation_Agent
    IF validation_passed:
        ROUTE TO Approval_Router_Agent
        IF amount > 10000:
            ROUTE TO Senior_Approver
        ELSE:
            ROUTE TO Standard_Approver
        EXECUTE: Update_ERP_System
    ELSE:
        ROUTE TO Exception_Handler_Agent
        EXECUTE: Notify_Finance_Team
ELSE:
    ROUTE TO General_Document_Handler
```

### Tier Comparison Matrix

| Feature | Builder | Operator | Enterprise |
|---------|---------|----------|------------|
| Price | $199/month | $499/month | $1,200+/month |
| Workflows | 3 | 10 | Unlimited |
| Executions/month | 2,500 | 10,000 | 50,000 |
| Intelligence Credits | 50 | 300 | 2,000 |
| Support | Email | Priority Email | Dedicated |
| Custom Integrations | No | Limited | Yes |
| SLA | None | 99% | 99.9% |

### LLM Model Selection Rationale

**deepseek-v3-2-251201** (AI Snapshot):
- Fast response times (2-5 seconds)
- Good at structured output
- Cost-effective for high-volume requests
- Reliable JSON generation

**kimi-k2-250905** (AI Snapshot Fallback):
- Similar capabilities to deepseek
- Different provider for redundancy
- Comparable response times
- Good JSON compliance

**glm-4-7-251222** (Deep Diagnostic):
- Superior reasoning capabilities
- Better at complex system design
- Handles longer context
- More detailed outputs

### Design System Reference

**Colors**:
- Brand Purple: #4020a5
- Button Purple: #3c229f
- Progress Green: #07d197
- Background: #ffffff
- Text: #1a1a1a
- Border: #e5e5e5

**Typography**:
- Font Family: Inter Tight
- Headings: 600 weight
- Body: 400 weight
- Buttons: 500 weight

**Spacing**:
- Base unit: 8px
- Section padding: 64px
- Card padding: 32px
- Button padding: 12px 24px

**Border Radius**:
- Buttons: 9999px (fully rounded)
- Cards: 12px
- Inputs: 8px

**Shadows**:
- Card: 0 2px 8px rgba(0,0,0,0.1)
- Button hover: 0 4px 12px rgba(64,32,165,0.2)
