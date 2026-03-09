# Requirements Document: AIVORY AI Command Console

## Introduction

The AIVORY AI Command Console represents a fundamental architectural shift: transforming AIVORY from a Dashboard-based Control System into an **AI Operating System with Conversational Command Layer**.

This is NOT a chatbot widget - it's Layer 5 of the AIVORY architecture: a **Conversational Command Layer** that provides natural language control over all system layers (Diagnostic, Workflow Generation, Orchestration, Insights).

### AIVORY System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 5: COMMAND CONSOLE LAYER (NEW)                       │
│  Conversational AI control over entire system                │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: INSIGHT LAYER                                      │
│  Dashboard visualization, metrics, AI decision insights      │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: ORCHESTRATED EXECUTION (Future)                    │
│  Workflow execution engine, retry logic, monitoring          │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: WORKFLOW GENERATOR (Future)                        │
│  AI-powered workflow creation and optimization               │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: AI DIAGNOSTIC                                      │
│  Snapshot diagnostic (free) + Paid diagnostic (agentic)      │
└─────────────────────────────────────────────────────────────┘
```

The console feels like a Manus-style AI workspace, a Notion AI + Terminal hybrid, and an enterprise AI copilot panel. It provides conversational access to generate workflows, analyze execution logs, upload documents, issue commands, inspect reasoning, and trigger orchestration.

### Architectural Decisions

**Console Placement**: Dedicated route `/dashboard/console` accessible from dashboard navigation

**File Persistence Strategy**:
- Builder Tier: Temporary (session-based, expires after 6 hours)
- Operator Tier: Temporary (session-based, expires after 6 hours)
- Enterprise Tier: Persistent document indexing with vector storage for long-term AI memory

**Enterprise Memory & Context**:
- Enterprise tier supports server-side conversation persistence
- Enterprise tier supports document indexing for cross-session context
- Enterprise tier supports memory retrieval across sessions

**Console Scope & Capabilities** (FINAL GOVERNANCE MODEL):

The Console is the AI Command Layer of AIVORY. It is NOT a chatbot. It is a **structured AI orchestration interface with controlled execution power**. All capabilities are tier-aware and credit-aware.

**1. Workflow Generation (Conversational → Structured)**

YES — but structured with cost transparency.

The console must:
- Convert user intent → Structured Workflow Blueprint JSON
- Validate against tier limits before generation
- Show cost estimate before final generation
- Deduct credits ONLY on final confirmation

**Credit Rules**:
- Conversational AI message (simple response): **1 credit**
- Structured Workflow Blueprint generation: **8 credits**
- Agentic multi-branch workflow generation (Operator+): **15 credits**
- Enterprise multi-model architecture generation: **25 credits**

**Enforcement**: No draft = no deduction. Only confirmed generation deducts credits.

**2. Execution Log Analysis**

YES — but tier-based depth.

Console should:
- Fetch workflow execution logs
- Detect failures
- Diagnose root cause
- Provide fix recommendations

**Tier Restrictions**:

**Builder**:
- Basic error explanation
- Retry suggestions
- No deep reasoning trace
- **Cost: 3 credits per analysis**

**Operator**:
- Root cause breakdown
- Decision node analysis
- Threshold & rule evaluation
- **Cost: 6 credits per analysis**

**Enterprise**:
- Multi-model token analysis
- Risk scoring review
- SLA performance review
- Governance trace
- **Cost: 12 credits per analysis**

**3. Workflow Execution Control**

YES — but controlled with safety gates.

**Builder**:
- Manual confirmation required
- Cannot auto-loop
- **Cost: 2 credits per trigger**

**Operator**:
- Can trigger with confirmation
- Can simulate before execution
- **Cost: 3 credits per trigger**

**Enterprise**:
- Can trigger + simulate + schedule
- Can trigger via console command
- **Cost: 5 credits per trigger**

**Safety Controls**:
- Confirmation modal required
- Credit impact shown before execution
- Enterprise requires risk check before execution
- No silent execution

**4. Workflow Modification**

YES — but permission-gated with version control.

**Builder**:
- Can receive suggestions only
- Cannot auto-edit JSON
- **Cost: View only (0 credits)**

**Operator**:
- Can receive structured modification proposal
- Must approve before applying
- **Cost: 6 credits per modification**

**Enterprise**:
- Can auto-update JSON after confirmation
- Version control required
- Audit log required
- **Cost: 10 credits per modification**

**Console must**:
- Show diff preview
- Show credit cost
- Require confirmation

**5. Diagnostic Data Access**

YES — structured access only with privacy controls.

Console can access:
- AI Readiness Score
- Category breakdown
- Automation gap insights
- Previous diagnostic history
- Snapshot blueprint summary

**Tier Restrictions**:

**Builder**:
- View score + recommendations only

**Operator**:
- Access gap analysis + blueprint summary

**Enterprise**:
- Access full architecture mapping + risk scoring

**Credit Rules**:
- Diagnostic insight query: **2 credits**
- Deep architectural explanation: **5 credits**

**Console must NOT expose**:
- Raw sensitive customer data
- Internal governance config
- Hidden routing thresholds (Enterprise internal only)

**6. Credit Deduction Model (FINAL)**

**AI Messages**:
- Basic message: **1 credit**

**Workflow Operations**:
- Workflow Blueprint: **8 credits**
- Agentic Workflow (multi-branch): **15 credits**
- Enterprise Architecture Plan: **25 credits**

**Workflow Triggers**:
- Builder: **2 credits**
- Operator: **3 credits**
- Enterprise: **5 credits**

**Log Analysis**:
- Builder: **3 credits**
- Operator: **6 credits**
- Enterprise: **12 credits**

**Workflow Modification**:
- Operator: **6 credits**
- Enterprise: **10 credits**

**Document Parsing**:
- Under 5 pages: **3 credits**
- 5–20 pages: **8 credits**
- 20+ pages: **15 credits**

**Diagnostic Access**:
- Insight query: **2 credits**
- Deep explanation: **5 credits**

**Enforcement Rules** (CRITICAL):
- Always show credit impact before execution
- Always validate tier before action
- Always log credit deduction
- No silent credit deduction
- No auto-execution without confirmation

**This defines AIVORY as**:
**AI Brain + Orchestration + Governance + Economic Control**

Not just chat.

## Glossary

- **Console**: AI Command Layer interface for interactive system control
- **Chat_Thread**: Conversational interface showing user messages and AI responses
- **Context_Panel**: Right-side panel showing system state and metadata
- **Command_Input**: Multi-line input bar with file upload capabilities
- **Workflow_Generation**: AI-powered creation of workflow JSON from natural language
- **Document_Intelligence**: File upload, parsing, and AI-powered document analysis
- **Reasoning_Drawer**: Collapsible panel showing AI decision metadata
- **Credit_Deduction**: Intelligence credits consumed per AI operation
- **Tier_Gating**: Feature access restrictions based on subscription tier
- **CMR_Routing**: Custom Mechanism Routing for Enterprise multi-model orchestration

## Requirements

### Requirement 1: Console Route and Navigation

**User Story:** As a user, I want to access the AI Command Console from the dashboard, so that I can interact with my AI system conversationally.

#### Acceptance Criteria

1. THE System SHALL provide route /dashboard/console
2. THE Dashboard sidebar SHALL include "Console" navigation item
3. WHEN user clicks Console, THE System SHALL navigate to console interface
4. THE Console SHALL be accessible from all subscription tiers
5. THE Console SHALL maintain session state when navigating away and back

### Requirement 2: Two-Panel Console Layout

**User Story:** As a user, I want a split-panel console layout, so that I can see conversation and system context simultaneously.

#### Acceptance Criteria

1. THE Console SHALL use two-panel layout: LEFT (Conversation Thread) and RIGHT (Context Panel)
2. THE Conversation Thread SHALL occupy 60-70% of width
3. THE Context Panel SHALL occupy 30-40% of width
4. THE layout SHALL be responsive on tablet/mobile (stack vertically)
5. THE panels SHALL be resizable via draggable divider
6. THE layout SHALL maintain AI Operating Partner card design language

### Requirement 3: Conversation Thread

**User Story:** As a user, I want to see my conversation history with the AI, so that I can track my interactions and commands.

#### Acceptance Criteria

1. THE Conversation Thread SHALL display user messages and AI responses chronologically
2. THE user messages SHALL align left with distinct styling
3. THE AI responses SHALL align left with different background color
4. THE thread SHALL auto-scroll to latest message
5. THE thread SHALL support infinite scroll for history
6. THE thread SHALL show typing indicator when AI is responding
7. THE thread SHALL display timestamps for each message
8. THE thread SHALL show file attachments as badges in messages

### Requirement 4: Context Panel

**User Story:** As a user, I want to see system state and metadata, so that I can monitor my resources and active workflows.

#### Acceptance Criteria

1. THE Context Panel SHALL display Active Tier
2. THE Context Panel SHALL display Credits Remaining with live updates
3. THE Context Panel SHALL display Active Workflows count
4. THE Context Panel SHALL display Recent Executions (last 5)
5. THE Context Panel SHALL display Selected Workflow details (when applicable)
6. THE Context Panel SHALL display Token Usage (live during AI response)
7. THE Context Panel SHALL display Model Used for current operation
8. THE Context Panel SHALL update in real-time as system state changes

### Requirement 5: Command Input Bar

**User Story:** As a user, I want a multi-line input bar with file upload, so that I can send complex commands and attach documents.

#### Acceptance Criteria

1. THE Input Bar SHALL support multi-line text input
2. THE Input Bar SHALL expand vertically as user types (max 5 lines)
3. THE Input Bar SHALL include Upload File button
4. THE Input Bar SHALL include Attach Workflow button
5. THE Input Bar SHALL include Send button
6. THE Input Bar SHALL support Enter to send, Shift+Enter for new line
7. THE Input Bar SHALL disable Send when credits insufficient
8. THE Input Bar SHALL show character count for long messages

### Requirement 6: File Upload and Drag & Drop

**User Story:** As a user, I want to upload documents via drag & drop or click, so that the AI can analyze my files.

#### Acceptance Criteria

1. THE Console SHALL support drag & drop file upload
2. THE Console SHALL show drag overlay when file is dragged over
3. THE Console SHALL support click-to-upload via file picker
4. THE Console SHALL accept PDF, DOCX, CSV, TXT file types
5. THE Console SHALL show file preview chip after upload
6. THE Console SHALL allow removing uploaded file before sending
7. THE Console SHALL parse file content upon upload
8. THE Console SHALL store file temporarily for AI reference
9. THE Enterprise Tier SHALL support persistent document indexing
10. THE Console SHALL show file size and type in preview

### Requirement 7: Conversational Workflow Creation

**User Story:** As a user, I want to create workflows by describing them in natural language, so that I don't need to write JSON manually.

#### Acceptance Criteria

1. WHEN user types workflow request (e.g., "Create lead scoring workflow with Slack escalation"), THE AI SHALL generate structured workflow JSON
2. THE AI SHALL show workflow preview in Context Panel
3. THE AI SHALL require user confirmation before execution
4. THE System SHALL NOT automatically execute workflows without confirm
5. THE workflow preview SHALL show: Trigger, Steps, Actions, Integrations
6. THE user SHALL be able to edit generated workflow before confirming
7. THE System SHALL deduct credits for workflow generation
8. THE Builder Tier SHALL support basic workflow suggestions only
9. THE Operator Tier SHALL support full workflow generation
10. THE Enterprise Tier SHALL support complex multi-model workflows

### Requirement 8: AI Execution Commands

**User Story:** As a user, I want to ask the AI about my system, so that I can understand failures, analyze logs, and optimize performance.

#### Acceptance Criteria

1. THE AI SHALL respond to "Why did workflow fail?" by fetching logs and reasoning
2. THE AI SHALL respond to "Analyze last 10 executions" by aggregating execution data
3. THE AI SHALL respond to "Simulate this workflow" by running dry-run
4. THE AI SHALL respond to "Optimize for lower token usage" by suggesting improvements
5. THE AI SHALL respond to "Show reasoning for decision D-9021" by fetching decision metadata
6. THE AI SHALL fetch logs, reasoning, and model metadata to answer queries
7. THE AI SHALL format responses with structured data (tables, lists, code blocks)
8. THE AI SHALL provide actionable recommendations

### Requirement 9: Tier-Based Console Capabilities

**User Story:** As a user, I want console features appropriate to my tier, so that I can access capabilities I've paid for.

#### Acceptance Criteria

1. THE Builder Tier SHALL support: Basic chat, Workflow suggestion, Limited file upload (1 file), No deep log introspection
2. THE Operator Tier SHALL support: Workflow generation, Decision explanation, Retry trigger, Token usage insight, Multiple file uploads (5 files)
3. THE Enterprise Tier SHALL support: Multi-model routing explanation, CMR override command, SLA inspection, Risk analysis query, Audit trail query, Document indexing, Unlimited file uploads
4. THE System SHALL enforce tier limits on console operations
5. THE System SHALL show upgrade prompt when user attempts tier-restricted feature
6. THE Console SHALL display tier badge in Context Panel

### Requirement 10: Credit System Integration

**User Story:** As a user, I want to see credit deductions in real-time, so that I can manage my AI usage.

#### Acceptance Criteria

1. THE System SHALL deduct credits when: AI message generated, Workflow JSON generated, Document parsed, Log analysis performed, Routing explanation requested
2. THE credit meter in top bar SHALL update in real-time
3. THE credit meter in Context Panel SHALL update in real-time
4. THE System SHALL animate credit deduction
5. IF credits insufficient, THE System SHALL block AI response
6. IF credits insufficient, THE System SHALL show modal with upgrade option
7. THE System SHALL show credit cost estimate before expensive operations
8. THE System SHALL allow user to cancel operation if cost is high

### Requirement 11: AI Reasoning Panel (Operator & Enterprise)

**User Story:** As an Operator/Enterprise user, I want to see AI reasoning metadata, so that I can understand how decisions are made.

#### Acceptance Criteria

1. THE Reasoning Panel SHALL be collapsible
2. THE Reasoning Panel SHALL show: Model used, Tokens consumed, Confidence score, Cost estimation
3. THE Enterprise Tier SHALL additionally show: Routing path, Multi-model breakdown
4. THE Reasoning Panel SHALL NOT be visible in Builder tier
5. THE Reasoning Panel SHALL update for each AI response
6. THE Reasoning Panel SHALL be positioned below AI message
7. THE Reasoning Panel SHALL use subtle styling (not intrusive)

### Requirement 12: Message Bubble Design

**User Story:** As a user, I want clear visual distinction between my messages and AI responses, so that I can easily follow the conversation.

#### Acceptance Criteria

1. THE user messages SHALL use card design language with subtle background
2. THE AI messages SHALL use different background color
3. THE messages SHALL include avatar/icon (user icon vs AI icon)
4. THE messages SHALL show timestamp
5. THE messages SHALL support markdown formatting
6. THE messages SHALL support code blocks with syntax highlighting
7. THE messages SHALL support tables for structured data
8. THE messages SHALL support file attachment badges

### Requirement 13: Typing Indicator

**User Story:** As a user, I want to see when the AI is thinking, so that I know my request is being processed.

#### Acceptance Criteria

1. THE Console SHALL show typing indicator when AI is generating response
2. THE typing indicator SHALL show animated dots
3. THE typing indicator SHALL show estimated time for long operations
4. THE typing indicator SHALL show "Analyzing..." or "Generating..." based on operation
5. THE typing indicator SHALL be cancellable by user

### Requirement 14: Backend API Endpoints

**User Story:** As a developer, I want well-defined API endpoints, so that the console can communicate with the backend.

#### Acceptance Criteria

1. THE System SHALL provide POST /api/console/message endpoint
2. THE System SHALL provide POST /api/console/upload endpoint
3. THE System SHALL provide GET /api/console/context endpoint
4. THE System SHALL provide POST /api/console/workflow/generate endpoint
5. THE System SHALL provide POST /api/console/workflow/confirm endpoint
6. ALL endpoints SHALL require tier validation
7. ALL endpoints SHALL require credit validation
8. ALL endpoints SHALL implement rate limiting
9. ALL endpoints SHALL log: User prompt, Model response, Tokens, Routing path, Confidence

### Requirement 15: Security and Control

**User Story:** As a system administrator, I want secure AI routing, so that users cannot bypass tier restrictions or abuse the system.

#### Acceptance Criteria

1. THE System SHALL NOT expose model API keys to frontend
2. ALL AI calls SHALL go through AIVORY backend routing layer
3. THE Enterprise Tier SHALL apply CMR before model call
4. THE System SHALL validate tier permissions before each operation
5. THE System SHALL validate credit balance before each operation
6. THE System SHALL implement rate limiting per tier
7. THE System SHALL log all console operations for audit
8. THE System SHALL sanitize user inputs before sending to AI

### Requirement 16: Document Intelligence

**User Story:** As a user, I want the AI to understand my uploaded documents, so that I can ask questions about them.

#### Acceptance Criteria

1. WHEN user uploads document, THE System SHALL parse content
2. THE System SHALL extract text from PDF, DOCX, CSV, TXT
3. THE System SHALL store document temporarily (session-based)
4. THE Enterprise Tier SHALL support persistent document indexing
5. THE AI SHALL reference document content in responses
6. THE AI SHALL cite specific sections when answering document questions
7. THE System SHALL show document badge in chat thread
8. THE System SHALL allow user to remove document from context

### Requirement 17: Workflow Attachment

**User Story:** As a user, I want to attach existing workflows to my message, so that the AI can analyze or modify them.

#### Acceptance Criteria

1. THE Input Bar SHALL include "Attach Workflow" button
2. WHEN clicked, THE System SHALL show workflow selector modal
3. THE user SHALL be able to select from active workflows
4. THE selected workflow SHALL appear as badge in input bar
5. THE AI SHALL have access to workflow JSON for analysis
6. THE AI SHALL be able to suggest modifications to attached workflow

### Requirement 18: Error Handling

**User Story:** As a user, I want clear error messages, so that I can understand and resolve issues.

#### Acceptance Criteria

1. IF AI request fails, THE System SHALL show error message in chat
2. IF credits insufficient, THE System SHALL show modal with upgrade CTA
3. IF file upload fails, THE System SHALL show error toast
4. IF rate limit exceeded, THE System SHALL show cooldown timer
5. THE error messages SHALL be user-friendly and actionable
6. THE System SHALL log errors for debugging

### Requirement 19: Responsive Design

**User Story:** As a user, I want the console to work on mobile devices, so that I can access it anywhere.

#### Acceptance Criteria

1. THE Console SHALL stack panels vertically on mobile (< 768px)
2. THE Context Panel SHALL be collapsible on mobile
3. THE Input Bar SHALL remain fixed at bottom on mobile
4. THE file upload SHALL work on mobile devices
5. THE touch targets SHALL be minimum 44px

### Requirement 20: Session Persistence

**User Story:** As a user, I want my conversation to persist, so that I can continue where I left off.

#### Acceptance Criteria

1. THE Console SHALL store conversation in browser localStorage
2. THE Console SHALL restore conversation on page reload
3. THE Console SHALL support clearing conversation history
4. THE Console SHALL limit stored messages to last 50 (performance)
5. THE Enterprise Tier SHALL support server-side conversation persistence
