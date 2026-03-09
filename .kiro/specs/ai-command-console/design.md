# Design Document: AIVORY AI Command Console

## Overview

The AIVORY AI Command Console represents Layer 5 of the AIVORY architecture: the **Conversational Command Layer**. This is a fundamental architectural shift from a Dashboard-based Control System to an **AI Operating System**.

This is NOT a chatbot widget - it's a Manus-style AI workspace that provides natural language control over all AIVORY layers: Diagnostic, Workflow Generation, Orchestration, and Insights.

### System Architecture Evolution

**Before (Dashboard-based Control)**:
```
User → Dashboard UI → Backend Services → AI Models
```

**After (AI Operating System)**:
```
User → Command Console (Layer 5) → System Orchestrator → All Layers
  ↓
  ├─ Layer 4: Insight Layer (Dashboard)
  ├─ Layer 3: Orchestrated Execution
  ├─ Layer 2: Workflow Generator
  └─ Layer 1: AI Diagnostic
```

## AIVORY Governance & Economic Model

AIVORY is defined as: **AI Brain + Orchestration + Governance + Economic Control**

This is NOT just chat. The Console is a structured AI orchestration interface with controlled execution power.

### Credit Deduction Model (FINAL)

**AI Messages**:
- Basic message: 1 credit

**Workflow Operations**:
- Workflow Blueprint: 8 credits
- Agentic Workflow (multi-branch): 15 credits
- Enterprise Architecture Plan: 25 credits

**Workflow Triggers**:
- Builder: 2 credits
- Operator: 3 credits
- Enterprise: 5 credits

**Log Analysis**:
- Builder: 3 credits
- Operator: 6 credits
- Enterprise: 12 credits

**Workflow Modification**:
- Operator: 6 credits
- Enterprise: 10 credits

**Document Parsing**:
- Under 5 pages: 3 credits
- 5–20 pages: 8 credits
- 20+ pages: 15 credits

**Diagnostic Access**:
- Insight query: 2 credits
- Deep explanation: 5 credits

### Enforcement Rules (CRITICAL)

1. Always show credit impact before execution
2. Always validate tier before action
3. Always log credit deduction
4. No silent credit deduction
5. No auto-execution without confirmation
6. No draft = no deduction (only confirmed operations deduct credits)

### Safety Controls

**Workflow Generation**:
- Show cost estimate before generation
- Require explicit confirmation
- Deduct credits only on confirmation

**Workflow Execution**:
- Confirmation modal required
- Credit impact shown before execution
- Enterprise requires risk check before execution
- No silent execution

**Workflow Modification**:
- Show diff preview
- Show credit cost
- Require confirmation
- Version control (Enterprise)
- Audit log (Enterprise)

### Privacy & Security Controls

**Console must NOT expose**:
- Raw sensitive customer data
- Internal governance config
- Hidden routing thresholds (Enterprise internal only)

**Console CAN access**:
- AI Readiness Score
- Category breakdown
- Automation gap insights
- Previous diagnostic history
- Snapshot blueprint summary



The console features a two-panel layout: a Conversation Thread (60-70% width) on the left for chat interactions, and a Context Panel (30-40% width) on the right showing system state, credits, workflows, and AI reasoning metadata. The design maintains the existing AIVORY card design language with Inter Tight font weight 300, brand colors (#4020a5 purple, #07d197 mint green), and card backgrounds rgba(255,255,255,0.04).

Key capabilities include:
- Conversational workflow creation with AI-generated JSON
- Document intelligence (PDF, DOCX, CSV, TXT parsing)
- AI execution commands (log analysis, failure diagnosis, optimization)
- Tier-gated features (Builder, Operator, Enterprise)
- Real-time credit deduction system
- AI reasoning panel (Operator & Enterprise)
- Session persistence with localStorage
- Secure backend routing through Sumopod API

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 5: COMMAND CONSOLE (Frontend)                   │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────────────────────────┐ │
│  │  Conversation Thread │  │      Context Panel                       │ │
│  │  - Message Bubbles   │  │  - Tier Badge                            │ │
│  │  - Typing Indicator  │  │  - Credits Meter                         │ │
│  │  - Reasoning Panel   │  │  - Active Workflows                      │ │
│  │  - File Badges       │  │  - Recent Executions                     │ │
│  │  - Markdown Renderer │  │  - Token Usage (live)                    │ │
│  └──────────────────────┘  └──────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │              Command Input Bar                                       │ │
│  │  - Multi-line Input  - Upload File  - Attach Workflow               │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/JSON
┌─────────────────────────────────────────────────────────────────────────┐
│                LAYER 5: COMMAND CONSOLE (Backend API)                    │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │              Console API Routes                                      │ │
│  │  /api/console/message  /api/console/upload                          │ │
│  │  /api/console/context  /api/console/workflow/*                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │              Console Service Layer                                   │ │
│  │  - ConsoleService (orchestrates all layer access)                   │ │
│  │  - DocumentParser  - WorkflowGenerator  - LogAnalyzer               │ │
│  │  - TierValidator   - CreditManager      - SessionManager            │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │              Sumopod Client (AI Routing)                             │ │
│  │  - chat_completion()  - Models: deepseek-v3, kimi-k2                │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 4: INSIGHT LAYER                                │
│  Dashboard UI, Metrics, AI Decision Insights                             │
└─────────────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 3: ORCHESTRATED EXECUTION (Future)              │
│  Workflow Execution Engine, Retry Logic, Monitoring                      │
└─────────────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 2: WORKFLOW GENERATOR (Future)                  │
│  AI-Powered Workflow Creation and Optimization                           │
└─────────────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 1: AI DIAGNOSTIC                                │
│  Snapshot Diagnostic (Free) + Paid Diagnostic (Agentic)                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**Frontend Components:**
- **ConsoleApp**: Main application controller, manages state and routing
- **ConversationThread**: Renders message history, handles scrolling, displays typing indicator
- **MessageBubble**: Individual message component with markdown rendering, file badges, reasoning panel
- **ContextPanel**: Displays system state (tier, credits, workflows, executions, token usage)
- **CommandInput**: Multi-line input with file upload, workflow attachment, send button
- **FileUploadHandler**: Drag & drop, file picker, file validation, preview chips
- **WorkflowAttacher**: Modal for selecting and attaching workflows
- **ReasoningPanel**: Collapsible panel showing AI decision metadata (Operator & Enterprise)
- **MarkdownRenderer**: Renders markdown with code syntax highlighting and tables
- **CreditMeter**: Animated credit deduction display
- **TypingIndicator**: Animated dots with operation status

**Backend Services:**
- **ConsoleService**: Core business logic for console operations
- **DocumentParser**: Extracts text from PDF, DOCX, CSV, TXT files
- **WorkflowGenerator**: Converts natural language to workflow JSON using AI
- **TierValidator**: Enforces tier-based feature restrictions
- **CreditManager**: Tracks and deducts intelligence credits
- **LogAnalyzer**: Fetches and analyzes execution logs for AI queries
- **SessionManager**: Manages temporary document storage and conversation state
- **AuditLogger**: Logs all console operations for compliance

### Data Flow

**Message Flow:**
1. User types message in CommandInput
2. Frontend validates credits and tier permissions
3. POST /api/console/message with message, attachments, context
4. Backend validates tier, credits, rate limits
5. Backend routes to Sumopod API with appropriate model
6. Backend deducts credits based on token usage
7. Backend returns AI response with metadata
8. Frontend renders message bubble with reasoning panel
9. Frontend updates credit meter and context panel

**File Upload Flow:**
1. User drags file or clicks upload button
2. Frontend validates file type (PDF, DOCX, CSV, TXT)
3. POST /api/console/upload with file data
4. Backend parses file content using DocumentParser
5. Backend stores content temporarily (session-based)
6. Backend returns file metadata and preview
7. Frontend displays file chip in input bar
8. File content included in subsequent AI messages

**Workflow Generation Flow:**
1. User types workflow request (e.g., "Create lead scoring workflow")
2. Frontend sends to POST /api/console/workflow/generate
3. Backend uses WorkflowGenerator with AI to create JSON
4. Backend deducts credits for generation
5. Backend returns workflow JSON and preview
6. Frontend displays workflow in Context Panel
7. User reviews and edits workflow
8. User confirms via POST /api/console/workflow/confirm
9. Backend saves workflow and returns confirmation

## Components and Interfaces

### Frontend Components

#### ConsoleApp

```javascript
class ConsoleApp {
  constructor() {
    this.state = {
      tier: 'builder',
      credits: 50,
      creditLimit: 50,
      messages: [],
      uploadedFiles: [],
      attachedWorkflow: null,
      isTyping: false,
      contextData: {}
    };
  }

  async initialize() {
    // Load tier from session
    // Restore conversation from localStorage
    // Fetch context data
    // Setup event listeners
  }

  async sendMessage(content, files, workflow) {
    // Validate credits and tier
    // Call API
    // Update state
    // Render response
  }

  async uploadFile(file) {
    // Validate file type
    // Call API
    // Update state
  }

  updateCredits(newBalance) {
    // Animate credit deduction
    // Update UI
  }

  saveToLocalStorage() {
    // Store last 50 messages
  }

  restoreFromLocalStorage() {
    // Restore conversation
  }
}
```


#### MessageBubble

```javascript
class MessageBubble {
  constructor(message) {
    this.message = message; // { role, content, timestamp, files, reasoning }
  }

  render() {
    // Render user or AI message
    // Apply markdown formatting
    // Show file badges
    // Show reasoning panel (if applicable)
    // Show timestamp
  }

  renderMarkdown(content) {
    // Parse markdown
    // Syntax highlight code blocks
    // Render tables
  }

  renderReasoningPanel(reasoning) {
    // Show model, tokens, confidence, cost
    // Show routing path (Enterprise)
    // Collapsible
  }
}
```

#### ContextPanel

```javascript
class ContextPanel {
  constructor() {
    this.data = {
      tier: '',
      credits: 0,
      workflows: [],
      executions: [],
      tokenUsage: 0,
      modelUsed: ''
    };
  }

  update(newData) {
    // Update context data
    // Re-render
  }

  render() {
    // Display tier badge
    // Display credits meter
    // Display active workflows count
    // Display recent executions (last 5)
    // Display token usage (live)
    // Display model used
  }
}
```

#### CommandInput

```javascript
class CommandInput {
  constructor() {
    this.value = '';
    this.files = [];
    this.attachedWorkflow = null;
    this.maxLines = 5;
  }

  handleKeyPress(event) {
    // Enter to send
    // Shift+Enter for new line
  }

  handleFileUpload(file) {
    // Validate file type
    // Show preview chip
  }

  handleWorkflowAttach(workflow) {
    // Show workflow badge
  }

  validateSend() {
    // Check credits
    // Check tier permissions
    // Enable/disable send button
  }

  clear() {
    // Clear input
    // Remove files
    // Remove workflow
  }
}
```

### Backend API Endpoints

#### POST /api/console/message

Send a message to the AI console.

**Request:**
```json
{
  "message": "Why did workflow wf-123 fail?",
  "files": ["file-id-1", "file-id-2"],
  "workflow": "wf-123",
  "context": {
    "tier": "operator",
    "credits": 250
  }
}
```

**Response:**
```json
{
  "response": "Workflow wf-123 failed because...",
  "reasoning": {
    "model": "deepseek-v3-2-251201",
    "tokens": 1284,
    "confidence": 0.87,
    "cost": 3,
    "routing_path": ["deepseek-v3"]
  },
  "credits_remaining": 247,
  "timestamp": "2025-01-15T12:34:56Z"
}
```

**Validation:**
- Tier validation
- Credit validation (minimum 1 credit)
- Rate limiting (10 requests/minute for Builder, 30 for Operator, 100 for Enterprise)
- Input sanitization

**Error Responses:**
- 402: Insufficient credits
- 403: Tier restriction
- 429: Rate limit exceeded
- 500: AI service error

#### POST /api/console/upload

Upload a document for AI analysis.

**Request:**
```
Content-Type: multipart/form-data
file: <binary data>
tier: "operator"
```

**Response:**
```json
{
  "file_id": "file-abc123",
  "filename": "report.pdf",
  "size": 245678,
  "type": "application/pdf",
  "preview": "First 500 characters of extracted text...",
  "parsed": true,
  "expires_at": "2025-01-15T18:34:56Z"
}
```

**Validation:**
- File type validation (PDF, DOCX, CSV, TXT)
- File size limit (10MB for Builder, 50MB for Operator, 100MB for Enterprise)
- Tier-based file count limit (1 for Builder, 5 for Operator, unlimited for Enterprise)

**Error Responses:**
- 400: Invalid file type
- 413: File too large
- 403: File count limit exceeded

#### GET /api/console/context

Get current console context data.

**Response:**
```json
{
  "tier": "operator",
  "credits": 250,
  "credit_limit": 300,
  "workflows": [
    {
      "id": "wf-123",
      "name": "Lead Scoring",
      "status": "active",
      "last_run": "2025-01-15T12:00:00Z"
    }
  ],
  "executions": [
    {
      "id": "exec-456",
      "workflow_id": "wf-123",
      "status": "success",
      "timestamp": "2025-01-15T12:00:00Z"
    }
  ],
  "features": {
    "workflow_generation": true,
    "log_introspection": true,
    "reasoning_panel": true,
    "document_indexing": false
  }
}
```

#### POST /api/console/workflow/generate

Generate workflow JSON from natural language.

**Request:**
```json
{
  "prompt": "Create a lead scoring workflow that analyzes email content and escalates high-value leads to Slack",
  "tier": "operator"
}
```

**Response:**
```json
{
  "workflow": {
    "name": "Lead Scoring Workflow",
    "trigger": "email_received",
    "steps": [
      {
        "type": "ai_decision",
        "model": "deepseek-v3",
        "prompt": "Analyze email and score lead value"
      },
      {
        "type": "condition",
        "field": "score",
        "operator": ">",
        "value": 80
      },
      {
        "type": "action",
        "service": "slack",
        "method": "send_message",
        "params": {
          "channel": "#sales",
          "message": "High-value lead detected"
        }
      }
    ]
  },
  "preview": {
    "trigger": "Email Received",
    "steps": ["AI Decision: Score Lead", "Condition: Score > 80", "Action: Slack Notify"],
    "integrations": ["Slack"]
  },
  "credits_deducted": 5,
  "credits_remaining": 245
}
```

**Validation:**
- Tier validation (Builder: suggestions only, Operator: full generation, Enterprise: complex multi-model)
- Credit validation (5-20 credits depending on complexity)

#### POST /api/console/workflow/confirm

Confirm and save generated workflow.

**Request:**
```json
{
  "workflow": { /* workflow JSON */ },
  "edited": true
}
```

**Response:**
```json
{
  "workflow_id": "wf-789",
  "status": "created",
  "message": "Workflow created successfully"
}
```

## Data Models

### Message

```python
class Message(BaseModel):
    id: str
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime
    files: List[str] = []  # File IDs
    workflow: Optional[str] = None  # Workflow ID
    reasoning: Optional[ReasoningMetadata] = None
```

### ReasoningMetadata

```python
class ReasoningMetadata(BaseModel):
    model: str
    tokens: int
    confidence: float
    cost: int  # Credits
    routing_path: List[str] = []  # Enterprise only
    multi_model_breakdown: Optional[Dict[str, int]] = None  # Enterprise only
```

### UploadedFile

```python
class UploadedFile(BaseModel):
    id: str
    filename: str
    size: int
    type: str
    content: str  # Extracted text
    uploaded_at: datetime
    expires_at: datetime
    user_id: str
```

### ConsoleContext

```python
class ConsoleContext(BaseModel):
    tier: str
    credits: int
    credit_limit: int
    workflows: List[WorkflowSummary]
    executions: List[ExecutionSummary]
    features: Dict[str, bool]
```

### WorkflowSummary

```python
class WorkflowSummary(BaseModel):
    id: str
    name: str
    status: str
    last_run: Optional[datetime]
```

### ExecutionSummary

```python
class ExecutionSummary(BaseModel):
    id: str
    workflow_id: str
    workflow_name: str
    status: str
    timestamp: datetime
```

### TierConfig

```python
class TierConfig(BaseModel):
    name: str
    features: Dict[str, Any] = {
        "workflow_generation": bool,
        "log_introspection": bool,
        "reasoning_panel": bool,
        "document_indexing": bool,
        "file_upload_limit": int,
        "rate_limit": int  # requests per minute
    }
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following properties that provide unique validation value:

**Core Properties:**
1. Message chronological ordering
2. Credit deduction on operations
3. Tier permission enforcement
4. File type validation
5. Session state persistence (round-trip)
6. API endpoint validation requirements
7. Error handling and logging

**Redundancies Eliminated:**
- Combined multiple "SHALL display X" criteria into UI element presence examples
- Merged credit validation properties (10.5, 10.7) into single comprehensive property
- Consolidated tier enforcement properties (9.4, 15.4) into single property
- Combined file upload properties (6.7, 6.8, 16.1, 16.2, 16.3) into comprehensive file handling property
- Merged logging properties (14.9, 15.7, 18.6) into single audit logging property

### Properties

**Property 1: Message Chronological Ordering**

*For any* set of messages with timestamps, when displayed in the conversation thread, they should be ordered chronologically from oldest to newest.

**Validates: Requirements 3.1**

**Property 2: Credit Deduction on AI Operations**

*For any* AI operation (message generation, workflow generation, document parsing, log analysis, routing explanation), the system should deduct credits and the new balance should be less than the previous balance.

**Validates: Requirements 10.1, 7.7**

**Property 3: Insufficient Credits Block Operations**

*For any* system state where credits are zero or negative, all AI operations should be blocked and return an error.

**Validates: Requirements 10.5, 5.7**

**Property 4: Tier Permission Enforcement**

*For any* console operation with tier restrictions, the system should validate the user's tier and block operations that exceed their tier permissions.

**Validates: Requirements 9.4, 14.6, 15.4**

**Property 5: File Type Validation**

*For any* file upload, if the file type is PDF, DOCX, CSV, or TXT, the upload should succeed; otherwise, it should fail with an error.

**Validates: Requirements 6.4**

**Property 6: File Content Extraction**

*For any* uploaded file of supported types (PDF, DOCX, CSV, TXT), the system should extract text content and make it available for AI reference.

**Validates: Requirements 6.7, 16.1, 16.2**

**Property 7: Session State Persistence Round-Trip**

*For any* conversation state, storing it to localStorage and then reloading the page should restore the same conversation state (last 50 messages).

**Validates: Requirements 20.1, 20.2**

**Property 8: Workflow Generation Requires Confirmation**

*For any* AI-generated workflow, the system should not execute it automatically; execution should only occur after explicit user confirmation.

**Validates: Requirements 7.3, 7.4**

**Property 9: Workflow Preview Contains Required Elements**

*For any* generated workflow preview, it should contain Trigger, Steps, Actions, and Integrations information.

**Validates: Requirements 7.5**

**Property 10: Message Metadata Completeness**

*For any* message in the conversation thread, it should have a timestamp, avatar/icon, and role identifier.

**Validates: Requirements 3.7, 12.3, 12.4**

**Property 11: File Attachment Badge Presence**

*For any* message with file attachments, the message should display file badges for each attached file.

**Validates: Requirements 3.8, 12.8, 16.7**

**Property 12: Markdown Rendering Support**

*For any* message content containing markdown syntax (bold, italic, lists, code blocks, tables), the rendered output should properly format these elements.

**Validates: Requirements 12.5, 12.6, 12.7**

**Property 13: Reasoning Panel Metadata Completeness**

*For any* AI response in Operator or Enterprise tier, the reasoning panel should contain model name, tokens consumed, confidence score, and cost estimation.

**Validates: Requirements 11.2**

**Property 14: Reasoning Panel Updates Per Response**

*For any* AI response, the reasoning panel should update with new metadata specific to that response.

**Validates: Requirements 11.5**

**Property 15: API Endpoint Credit Validation**

*For any* API endpoint call requiring credits, the system should validate credit balance before processing and return 402 error if insufficient.

**Validates: Requirements 14.7, 15.5**

**Property 16: API Endpoint Rate Limiting**

*For any* API endpoint, if the request rate exceeds the tier-specific limit, the system should return 429 error with cooldown timer.

**Validates: Requirements 14.8, 15.6**

**Property 17: Backend AI Routing**

*For any* AI operation, the request should route through the AIVORY backend (not directly from frontend to AI service), ensuring API keys are never exposed to frontend.

**Validates: Requirements 15.2**

**Property 18: Input Sanitization**

*For any* user input sent to AI, the system should sanitize it to remove potentially harmful content before forwarding to the AI service.

**Validates: Requirements 15.8**

**Property 19: Audit Logging Completeness**

*For any* console operation, the system should log user prompt, model response, tokens, routing path, and confidence score.

**Validates: Requirements 14.9, 15.7**

**Property 20: Error Logging**

*For any* error that occurs in the system, it should be logged with timestamp, error type, and context information.

**Validates: Requirements 18.6**

**Property 21: File Upload Error Handling**

*For any* failed file upload, the system should display an error toast with a descriptive message.

**Validates: Requirements 18.3**

**Property 22: AI Request Error Handling**

*For any* failed AI request, the system should display an error message in the chat thread.

**Validates: Requirements 18.1**

**Property 23: Rate Limit Cooldown Display**

*For any* rate limit exceeded error, the system should display a cooldown timer showing when the user can make requests again.

**Validates: Requirements 18.4**

**Property 24: Typing Indicator Operation Context**

*For any* AI operation type (analyzing, generating, parsing), the typing indicator should display appropriate context text matching the operation.

**Validates: Requirements 13.4**

**Property 25: Attached Workflow AI Access**

*For any* workflow attached to a message, the AI should have access to the complete workflow JSON for analysis and modification suggestions.

**Validates: Requirements 17.5, 17.6**

**Property 26: Document Reference in AI Responses**

*For any* query about an uploaded document, the AI response should reference the document content and cite specific sections when applicable.

**Validates: Requirements 16.5, 16.6**

**Property 27: Upgrade Prompt on Tier Restriction**

*For any* attempt to use a tier-restricted feature, the system should display an upgrade prompt with information about the required tier.

**Validates: Requirements 9.5**

**Property 28: Message Storage Limit**

*For any* conversation stored in localStorage, only the last 50 messages should be retained.

**Validates: Requirements 20.4**

**Property 29: Responsive Touch Target Size**

*For any* interactive element on mobile devices, the touch target should be at least 44px in size.

**Validates: Requirements 19.5**

**Property 30: File Preview Metadata Completeness**

*For any* uploaded file preview, it should display filename, file size, and file type.

**Validates: Requirements 6.10**

## Error Handling

### Frontend Error Handling

**Credit Insufficient:**
- Display modal with upgrade CTA
- Disable send button
- Show credit balance in red

**File Upload Errors:**
- Invalid file type: Toast with "Only PDF, DOCX, CSV, TXT files are supported"
- File too large: Toast with "File exceeds size limit for your tier"
- Upload failed: Toast with "Upload failed. Please try again"

**API Errors:**
- 402 Insufficient Credits: Modal with upgrade option
- 403 Tier Restriction: Modal with feature comparison and upgrade CTA
- 429 Rate Limit: Display cooldown timer in chat
- 500 Server Error: Error message in chat with retry button

**Network Errors:**
- Connection timeout: "Connection timeout. Please check your internet"
- Network unavailable: "Network unavailable. Please try again"

### Backend Error Handling

**Validation Errors:**
- Invalid tier: Return 403 with error message
- Invalid file type: Return 400 with supported types
- Missing required fields: Return 400 with field list

**AI Service Errors:**
- Sumopod timeout: Return 504 with retry suggestion
- Sumopod error: Return 500 with generic error message
- Model unavailable: Return 503 with alternative model suggestion

**Rate Limiting:**
- Track requests per user per minute
- Return 429 with Retry-After header
- Log rate limit violations

**File Processing Errors:**
- Parse failure: Return 500 with "Unable to parse file"
- Corrupted file: Return 400 with "File appears corrupted"
- Unsupported encoding: Return 400 with "Unsupported file encoding"

### Error Logging

All errors should be logged with:
- Timestamp
- User ID
- Tier
- Error type
- Error message
- Stack trace (backend only)
- Request context (endpoint, parameters)

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests as complementary approaches:

**Unit Tests:**
- Specific examples demonstrating correct behavior
- Edge cases (empty inputs, boundary values, special characters)
- Error conditions (invalid file types, insufficient credits, tier restrictions)
- Integration points between components
- UI interactions (button clicks, file uploads, keyboard shortcuts)

**Property-Based Tests:**
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number

**Balance:**
- Avoid excessive unit tests for scenarios covered by properties
- Focus unit tests on concrete examples and integration
- Use property tests for validation across all inputs

### Property-Based Testing Configuration

**Library:** fast-check (JavaScript) for frontend, Hypothesis (Python) for backend

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: **Feature: ai-command-console, Property {number}: {property_text}**
- Each correctness property implemented by a SINGLE property-based test

**Example Property Test (JavaScript):**
```javascript
// Feature: ai-command-console, Property 1: Message Chronological Ordering
fc.assert(
  fc.property(
    fc.array(fc.record({
      id: fc.string(),
      timestamp: fc.date(),
      content: fc.string()
    })),
    (messages) => {
      const sorted = sortMessagesChronologically(messages);
      for (let i = 1; i < sorted.length; i++) {
        assert(sorted[i].timestamp >= sorted[i-1].timestamp);
      }
    }
  ),
  { numRuns: 100 }
);
```

**Example Property Test (Python):**
```python
# Feature: ai-command-console, Property 2: Credit Deduction on AI Operations
@given(
    initial_credits=st.integers(min_value=1, max_value=1000),
    operation_cost=st.integers(min_value=1, max_value=50)
)
def test_credit_deduction(initial_credits, operation_cost):
    result = perform_ai_operation(initial_credits, operation_cost)
    assert result.credits_remaining == initial_credits - operation_cost
    assert result.credits_remaining < initial_credits
```

### Test Coverage Areas

**Frontend:**
- Message rendering and chronological ordering
- Credit meter updates and animations
- File upload validation and preview
- Markdown rendering with code blocks and tables
- Session persistence (localStorage round-trip)
- Tier-based UI element visibility
- Responsive layout behavior
- Keyboard shortcuts (Enter, Shift+Enter)

**Backend:**
- API endpoint validation (tier, credits, rate limits)
- Credit deduction calculations
- File parsing (PDF, DOCX, CSV, TXT)
- Workflow JSON generation
- Tier permission enforcement
- Input sanitization
- Audit logging completeness
- Error handling and error responses

**Integration:**
- End-to-end message flow (frontend → backend → AI → frontend)
- File upload and AI document reference
- Workflow generation and confirmation
- Credit deduction synchronization
- Context panel real-time updates

### Edge Cases to Test

- Empty message submission
- Very long messages (>10,000 characters)
- Rapid successive messages (rate limiting)
- File upload during AI response
- Page reload during AI response
- Zero credits state
- Negative credits (should never occur)
- Invalid file types (executables, images)
- Corrupted files
- Very large files (exceeding tier limits)
- Markdown with nested structures
- Code blocks with special characters
- Workflow JSON with invalid structure
- Concurrent operations from same user
- localStorage quota exceeded
- Network disconnection during operation
