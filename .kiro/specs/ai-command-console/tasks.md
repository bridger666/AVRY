# Implementation Plan: AIVORY AI Command Console

## Overview

This implementation plan builds Layer 5 of the AIVORY architecture: the **Conversational Command Layer**. This represents a fundamental shift from Dashboard-based Control to an **AI Operating System**.

The console will be built with vanilla JavaScript frontend (served via XAMPP on port 80) and Python FastAPI backend (port 8081). The implementation follows a phased approach with clear architectural boundaries.

### Implementation Philosophy

This is NOT a generic feature addition. We are building an Enterprise AI Operating System with:
- Conversational control over all system layers
- Tier-gated intelligence capabilities
- Real-time credit enforcement
- Document intelligence and memory
- AI reasoning transparency
- Enterprise-grade security and audit

### Phase Structure

**PHASE 1**: Console UI Framework (Frontend shell, routing, layout)
**PHASE 2**: Tier Gating Integration (Tier detection, feature restrictions, upgrade prompts)
**PHASE 3**: Credit Enforcement Integration (Credit validation, deduction, real-time updates)
**PHASE 4**: Backend Console API (API routes, service layer, Sumopod integration)
**PHASE 5**: File Upload & Parsing (Document intelligence, temporary/persistent storage)
**PHASE 6**: Reasoning Metadata Layer (AI decision transparency, token tracking)
**PHASE 7**: Enterprise CMR Console Controls (Multi-model routing, audit trails)

Each phase builds on the previous, with checkpoints to ensure architectural integrity.

## PHASE 1: Console UI Framework

**Goal**: Build the foundational UI shell with two-panel layout, routing, and basic state management.

### Tasks

## PHASE 1: Console UI Framework

**Goal**: Build the foundational UI shell with two-panel layout, routing, and basic state management.

### Tasks

- [ ] 1.1 Create console HTML page structure
  - Create `frontend/console.html` at route `/dashboard/console`
  - Implement two-panel layout: LEFT (Conversation Thread 60-70%) + RIGHT (Context Panel 30-40%)
  - Add command input bar at bottom (fixed position)
  - Link to `console.css` and `console.js`
  - Match existing AIVORY card design language
  - _Requirements: 1.1, 2.1, 2.2, 2.3_

- [ ] 1.2 Create console CSS stylesheet
  - Create `frontend/console.css`
  - Implement two-panel layout with CSS Grid
  - Add resizable divider styling (draggable)
  - Add message bubble styles (user vs AI, distinct backgrounds)
  - Add input bar styles (multi-line, expandable)
  - Add context panel styles (tier badge, credits, workflows, executions)
  - Add responsive mobile styles (stack vertically < 768px)
  - Use Inter Tight font weight 300, brand colors (#4020a5, #07d197), card backgrounds rgba(255,255,255,0.04)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 19.1_

- [ ] 1.3 Create console JavaScript module
  - Create `frontend/console.js`
  - Implement ConsoleApp class with state management
  - Initialize tier detection from URL parameter or session
  - Setup event listeners for input bar (send, file upload, workflow attach)
  - Implement panel resizing logic (draggable divider)
  - _Requirements: 1.1, 1.3, 2.5_

- [ ] 1.4 Add console navigation to dashboard
  - Update `frontend/dashboard-subscription.html` to add "Console" navigation item
  - Add navigation link to `/dashboard/console`
  - Style navigation item to match existing dashboard design
  - _Requirements: 1.2, 1.3_

- [ ] 1.5 Implement conversation thread container
  - Create ConversationThread component
  - Add auto-scroll to latest message
  - Add infinite scroll for history (load more on scroll up)
  - Add empty state message ("Start a conversation...")
  - _Requirements: 3.1, 3.4, 3.5_

- [ ] 1.6 Implement context panel container
  - Create ContextPanel component
  - Add tier badge display
  - Add credits meter display (static for now)
  - Add active workflows count display
  - Add recent executions list (last 5)
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 1.7 Implement command input bar
  - Create CommandInput component
  - Add multi-line textarea (max 5 lines, auto-expand)
  - Add "Upload File" button (disabled for now)
  - Add "Attach Workflow" button (disabled for now)
  - Add "Send" button
  - Implement Enter to send, Shift+Enter for new line
  - _Requirements: 5.1, 5.2, 5.6_

- [ ] 1.8 CHECKPOINT: UI Framework Complete
  - Verify console route accessible at `/dashboard/console`
  - Verify two-panel layout renders correctly
  - Verify responsive design works on mobile
  - Verify navigation from dashboard works
  - Ask user for feedback before proceeding

## PHASE 2: Tier Gating Integration

**Goal**: Integrate tier detection, feature restrictions, and upgrade prompts.

### Tasks

- [ ] 2.1 Implement tier detection and state management
  - Detect tier from URL parameter (?tier=builder|operator|enterprise)
  - Store tier in ConsoleApp state
  - Fetch tier from backend session if no URL parameter
  - Display tier badge in Context Panel
  - _Requirements: 9.6_

- [ ] 2.2 Create tier configuration object
  - Define TIER_CONFIG with feature flags for each tier
  - Builder: Basic chat, workflow suggestions, 1 file upload, no log introspection
  - Operator: Workflow generation, decision explanation, 5 file uploads, log analysis
  - Enterprise: CMR routing, unlimited files, document indexing, audit trails
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 2.3 Implement tier-based UI element visibility
  - Show/hide features based on tier configuration
  - Disable file upload button if tier limit reached
  - Disable workflow generation for Builder tier
  - Show "Upgrade" badge on restricted features
  - _Requirements: 9.4_

- [ ] 2.4 Create upgrade modal component
  - Create modal that shows when user attempts tier-restricted feature
  - Display feature comparison table (Builder vs Operator vs Enterprise)
  - Show pricing information
  - Add "Upgrade Now" CTA button
  - Add "Cancel" button to close modal
  - _Requirements: 9.5, 10.6_

- [ ] 2.5 Implement tier validation on user actions
  - Validate tier before allowing file upload
  - Validate tier before workflow generation
  - Validate tier before log analysis
  - Show upgrade modal if action not allowed
  - _Requirements: 9.4, 9.5_

- [ ]* 2.6 Write property test for tier permission enforcement
  - **Property 4: Tier Permission Enforcement**
  - **Validates: Requirements 9.4, 14.6, 15.4**

- [ ]* 2.7 Write property test for upgrade prompt on tier restriction
  - **Property 27: Upgrade Prompt on Tier Restriction**
  - **Validates: Requirements 9.5**

- [ ] 2.8 CHECKPOINT: Tier Gating Complete
  - Verify tier detection works for all three tiers
  - Verify feature restrictions enforced correctly
  - Verify upgrade modal appears when expected
  - Ask user for feedback before proceeding

## PHASE 3: Credit Enforcement Integration

**Goal**: Implement credit validation, deduction, and real-time updates.

### Tasks

- [ ] 3.1 Implement credit state management
  - Add credits and creditLimit to ConsoleApp state
  - Fetch initial credit balance from backend
  - Update credit display in Context Panel
  - Update credit display in top bar (if exists)
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 3.2 Implement credit validation before actions
  - Validate credits before sending AI message
  - Validate credits before workflow generation
  - Validate credits before document parsing
  - Disable send button if credits insufficient
  - _Requirements: 5.7, 10.5_

- [ ] 3.3 Create insufficient credits modal
  - Create modal that shows when credits are insufficient
  - Display current credit balance
  - Show credit cost of attempted operation
  - Add "Upgrade Plan" CTA button
  - Add "Buy Credits" button (if applicable)
  - _Requirements: 10.6_

- [ ] 3.4 Implement credit deduction animation
  - Animate credit meter when credits deducted
  - Use smooth easing (ease-out cubic)
  - Duration: 500ms
  - Show credit cost in animation
  - _Requirements: 10.4_

- [ ] 3.5 Implement credit cost estimation
  - Show credit cost estimate before expensive operations (>5 credits)
  - Display confirmation modal with cost
  - Allow user to cancel operation
  - _Requirements: 10.7, 10.8_

- [ ]* 3.6 Write property test for credit deduction
  - **Property 2: Credit Deduction on AI Operations**
  - **Validates: Requirements 10.1, 7.7**

- [ ]* 3.7 Write property test for insufficient credits blocking
  - **Property 3: Insufficient Credits Block Operations**
  - **Validates: Requirements 10.5, 5.7**

- [ ] 3.8 CHECKPOINT: Credit Enforcement Complete
  - Verify credit validation works before all operations
  - Verify credit deduction animation works
  - Verify insufficient credits modal appears correctly
  - Ask user for feedback before proceeding

## PHASE 4: Backend Console API

**Goal**: Build backend API routes, service layer, and Sumopod integration.

### Tasks

- [ ] 4.1 Create console API routes module
  - Create `app/api/routes/console.py`
  - Define POST /api/console/message endpoint (stub)
  - Define POST /api/console/upload endpoint (stub)
  - Define GET /api/console/context endpoint (stub)
  - Define POST /api/console/workflow/generate endpoint (stub)
  - Define POST /api/console/workflow/confirm endpoint (stub)
  - Register routes in main.py
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 4.2 Create console service module
  - Create `app/services/console_service.py`
  - Implement ConsoleService class
  - Implement message handling method (integrates with SumopodClient)
  - Implement tier validation method
  - Implement credit validation method
  - _Requirements: 14.6, 14.7, 15.4, 15.5_

- [ ] 4.3 Create credit manager service
  - Create `app/services/credit_manager.py`
  - Implement CreditManager class
  - Implement credit deduction logic (with operation type)
  - Implement credit validation method
  - Implement credit cost estimation method
  - Store credit transactions for audit
  - _Requirements: 10.1, 10.5, 10.7_

- [ ] 4.4 Implement POST /api/console/message endpoint
  - Accept message, files, workflow, context
  - Validate tier permissions
  - Validate credit balance
  - Implement rate limiting (10/min Builder, 30/min Operator, 100/min Enterprise)
  - Route to Sumopod API via ConsoleService
  - Deduct credits based on operation complexity
  - Return AI response with reasoning metadata
  - _Requirements: 14.1, 14.6, 14.7, 14.8_

- [ ] 4.5 Implement GET /api/console/context endpoint
  - Return tier, credits, credit_limit
  - Return active workflows (mock data for now)
  - Return recent executions (mock data for now)
  - Return tier features configuration
  - _Requirements: 14.3_

- [ ] 4.6 Implement input sanitization
  - Create sanitization utility function
  - Sanitize user inputs before sending to AI
  - Remove potentially harmful content (scripts, SQL injection attempts)
  - _Requirements: 15.8_

- [ ] 4.7 Implement audit logging service
  - Create `app/services/audit_logger.py`
  - Log all console operations (user prompt, model response, tokens, routing path, confidence)
  - Log errors with timestamp, user ID, tier, error type, context
  - Store logs in database or file system
  - _Requirements: 14.9, 15.7, 18.6_

- [ ]* 4.8 Write property test for API endpoint credit validation
  - **Property 15: API Endpoint Credit Validation**
  - **Validates: Requirements 14.7, 15.5**

- [ ]* 4.9 Write property test for API endpoint rate limiting
  - **Property 16: API Endpoint Rate Limiting**
  - **Validates: Requirements 14.8, 15.6**

- [ ]* 4.10 Write property test for backend AI routing
  - **Property 17: Backend AI Routing**
  - **Validates: Requirements 15.2**

- [ ]* 4.11 Write property test for input sanitization
  - **Property 18: Input Sanitization**
  - **Validates: Requirements 15.8**

- [ ]* 4.12 Write property test for audit logging completeness
  - **Property 19: Audit Logging Completeness**
  - **Validates: Requirements 14.9, 15.7**

- [ ] 4.13 CHECKPOINT: Backend API Core Complete
  - Verify all API endpoints respond correctly
  - Verify tier and credit validation works
  - Verify rate limiting works
  - Verify audit logging works
  - Ask user for feedback before proceeding

## PHASE 5: File Upload & Parsing

**Goal**: Implement document intelligence with temporary/persistent storage.

### Tasks

- [ ] 5.1 Create document parser service
  - Create `app/services/document_parser.py`
  - Implement PDF text extraction (using PyPDF2 or pdfplumber)
  - Implement DOCX text extraction (using python-docx)
  - Implement CSV parsing (using csv module)
  - Implement TXT reading
  - _Requirements: 16.1, 16.2_

- [ ] 5.2 Implement POST /api/console/upload endpoint
  - Accept multipart/form-data file upload
  - Validate file type (PDF, DOCX, CSV, TXT only)
  - Validate file size (10MB Builder, 50MB Operator, 100MB Enterprise)
  - Validate file count limit (1 Builder, 5 Operator, unlimited Enterprise)
  - Parse file content using DocumentParser
  - Store temporarily (session-based, expires after 6 hours)
  - Return file metadata and preview (first 500 chars)
  - _Requirements: 6.4, 6.7, 6.8, 16.3_

- [ ] 5.3 Implement file upload UI
  - Create FileUploadHandler class
  - Add drag & drop support
  - Add drag overlay when file dragged over
  - Add click-to-upload file picker
  - Add file preview chips (show filename, size, type)
  - Allow removing uploaded file before sending
  - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6, 6.10_

- [ ] 5.4 Implement file badges in messages
  - Display file badges in message bubbles
  - Show filename, size, type
  - Style badges to match design language
  - _Requirements: 3.8, 12.8_

- [ ] 5.5 Integrate file content with AI messages
  - Include file content in AI message context
  - Allow AI to reference document content in responses
  - Show document citations in AI responses
  - _Requirements: 16.5, 16.6, 16.7_

- [ ] 5.6 Implement Enterprise persistent document indexing (optional)
  - Create vector storage for Enterprise tier
  - Index document content for long-term memory
  - Allow cross-session document retrieval
  - _Requirements: 6.9, 16.4_

- [ ]* 5.7 Write property test for file type validation
  - **Property 5: File Type Validation**
  - **Validates: Requirements 6.4**

- [ ]* 5.8 Write property test for file content extraction
  - **Property 6: File Content Extraction**
  - **Validates: Requirements 6.7, 16.1, 16.2**

- [ ]* 5.9 Write property test for file upload error handling
  - **Property 21: File Upload Error Handling**
  - **Validates: Requirements 18.3**

- [ ]* 5.10 Write property test for file attachment badge presence
  - **Property 11: File Attachment Badge Presence**
  - **Validates: Requirements 3.8, 12.8, 16.7**

- [ ] 5.11 CHECKPOINT: File Upload & Parsing Complete
  - Verify file upload works for all supported types
  - Verify file parsing extracts text correctly
  - Verify tier-based file limits enforced
  - Verify AI can reference uploaded documents
  - Ask user for feedback before proceeding

## PHASE 6: Reasoning Metadata Layer

**Goal**: Implement AI decision transparency with token tracking and reasoning panels.

### Tasks

- [ ] 6.1 Update message endpoint to return reasoning metadata
  - Modify POST /api/console/message response
  - Include model name, tokens consumed, confidence score, cost
  - Include routing path (Enterprise only)
  - Include multi-model breakdown (Enterprise only)
  - _Requirements: 11.2, 11.3_

- [ ] 6.2 Create ReasoningPanel component
  - Create collapsible reasoning panel
  - Display model used, tokens consumed, confidence score, cost
  - Display routing path (Enterprise only)
  - Display multi-model breakdown (Enterprise only)
  - Position below AI message
  - Use subtle styling (not intrusive)
  - _Requirements: 11.1, 11.2, 11.3, 11.6_

- [ ] 6.3 Implement tier-based reasoning panel visibility
  - Hide reasoning panel in Builder tier
  - Show basic reasoning in Operator tier (model, tokens, confidence, cost)
  - Show full reasoning in Enterprise tier (+ routing path, multi-model breakdown)
  - _Requirements: 11.3, 11.4_

- [ ] 6.4 Implement live token usage display
  - Show token usage in Context Panel during AI response
  - Update in real-time as tokens are consumed
  - Show model used for current operation
  - _Requirements: 4.6, 4.7_

- [ ] 6.5 Implement typing indicator with operation context
  - Create TypingIndicator component
  - Show animated dots when AI is responding
  - Show operation context ("Analyzing...", "Generating...", "Parsing...")
  - Show estimated time for long operations (>10 seconds)
  - Make cancellable by user
  - _Requirements: 3.6, 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ]* 6.6 Write property test for reasoning panel metadata completeness
  - **Property 13: Reasoning Panel Metadata Completeness**
  - **Validates: Requirements 11.2**

- [ ]* 6.7 Write property test for reasoning panel updates per response
  - **Property 14: Reasoning Panel Updates Per Response**
  - **Validates: Requirements 11.5**

- [ ]* 6.8 Write property test for typing indicator operation context
  - **Property 24: Typing Indicator Operation Context**
  - **Validates: Requirements 13.4**

- [ ] 6.9 CHECKPOINT: Reasoning Metadata Layer Complete
  - Verify reasoning panel displays correctly for each tier
  - Verify token usage updates in real-time
  - Verify typing indicator shows correct operation context
  - Ask user for feedback before proceeding

## PHASE 7: Enterprise CMR Console Controls

**Goal**: Implement Enterprise-specific features (CMR routing, workflow generation, log analysis).

### Tasks

- [ ] 7.1 Implement workflow generator service
  - Create `app/services/workflow_generator.py`
  - Implement AI-powered workflow JSON generation
  - Use Sumopod API with structured prompts
  - Generate workflow preview (trigger, steps, actions, integrations)
  - Respect tier limits (Builder: suggestions, Operator: full, Enterprise: complex)
  - _Requirements: 7.1, 7.5, 7.8, 7.9, 7.10_

- [ ] 7.2 Implement POST /api/console/workflow/generate endpoint
  - Accept workflow prompt and tier
  - Validate tier (Builder: suggestions only, Operator: full, Enterprise: complex)
  - Deduct credits (5 simple, 10 moderate, 20 complex)
  - Generate workflow JSON using WorkflowGenerator
  - Return workflow JSON and preview
  - _Requirements: 7.1, 7.7, 14.4_

- [ ] 7.3 Implement POST /api/console/workflow/confirm endpoint
  - Accept workflow JSON and edited flag
  - Save workflow to database (mock for now)
  - Return workflow ID and status
  - _Requirements: 7.3, 14.5_

- [ ] 7.4 Implement workflow preview in context panel
  - Display generated workflow in Context Panel
  - Show trigger, steps, actions, integrations
  - Add "Edit" button to modify workflow before confirming
  - Add "Confirm" button to save workflow
  - _Requirements: 7.2, 7.5, 7.6_

- [ ] 7.5 Implement workflow attachment
  - Create WorkflowAttacher component
  - Add "Attach Workflow" button to input bar
  - Show workflow selector modal (list active workflows)
  - Display selected workflow as badge in input bar
  - Include workflow JSON in message context
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 7.6 Create log analyzer service
  - Create `app/services/log_analyzer.py`
  - Implement log fetching and aggregation (mock data for now)
  - Implement failure analysis
  - Implement execution data aggregation
  - _Requirements: 8.1, 8.2, 8.6_

- [ ] 7.7 Implement AI command handlers
  - Handle "Why did workflow fail?" command (fetch logs, analyze)
  - Handle "Analyze last 10 executions" command (aggregate data)
  - Handle "Simulate this workflow" command (dry-run)
  - Handle "Optimize for lower token usage" command (suggestions)
  - Handle "Show reasoning for decision D-XXXX" command (fetch metadata)
  - Format responses with structured data (tables, lists, code blocks)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ] 7.8 Implement Enterprise CMR routing
  - Add CMR (Custom Mechanism Routing) for Enterprise tier
  - Apply CMR before model call
  - Log routing decisions for audit
  - _Requirements: 15.3_

- [ ] 7.9 Implement markdown renderer
  - Create MarkdownRenderer class
  - Add markdown parsing (using marked.js or similar library)
  - Add syntax highlighting for code blocks (using highlight.js or prism.js)
  - Add table rendering support
  - Integrate into MessageBubble component
  - _Requirements: 12.5, 12.6, 12.7_

- [ ]* 7.10 Write property test for workflow generation requires confirmation
  - **Property 8: Workflow Generation Requires Confirmation**
  - **Validates: Requirements 7.3, 7.4**

- [ ]* 7.11 Write property test for workflow preview completeness
  - **Property 9: Workflow Preview Contains Required Elements**
  - **Validates: Requirements 7.5**

- [ ]* 7.12 Write property test for attached workflow AI access
  - **Property 25: Attached Workflow AI Access**
  - **Validates: Requirements 17.5, 17.6**

- [ ]* 7.13 Write property test for markdown rendering support
  - **Property 12: Markdown Rendering Support**
  - **Validates: Requirements 12.5, 12.6, 12.7**

- [ ] 7.14 CHECKPOINT: Enterprise CMR Console Controls Complete
  - Verify workflow generation works for all tiers
  - Verify workflow attachment works
  - Verify log analysis commands work
  - Verify CMR routing works for Enterprise
  - Verify markdown rendering works
  - Ask user for feedback before proceeding

## PHASE 8: Core Messaging & Session Persistence

**Goal**: Implement message rendering, session persistence, and conversation history.

### Tasks

- [ ] 8.1 Implement message sending
  - Implement sendMessage() in ConsoleApp
  - Call POST /api/console/message with message, files, workflow
  - Show typing indicator while waiting for response
  - Handle API errors gracefully
  - _Requirements: 5.7, 10.5_

- [ ] 8.2 Implement message rendering
  - Create MessageBubble class
  - Render user messages (left-aligned, distinct styling)
  - Render AI messages (left-aligned, different background)
  - Add timestamps to messages
  - Add avatar/icons (user icon vs AI icon)
  - Integrate markdown rendering
  - Integrate reasoning panel
  - _Requirements: 3.1, 3.2, 3.3, 3.7, 12.1, 12.2, 12.3, 12.4_

- [ ] 8.3 Implement localStorage conversation storage
  - Save conversation to localStorage after each message
  - Limit to last 50 messages
  - Include message content, timestamp, files, reasoning
  - _Requirements: 20.1, 20.4_

- [ ] 8.4 Implement conversation restoration
  - Restore conversation from localStorage on page load
  - Maintain session state when navigating away and back
  - _Requirements: 1.5, 20.2_

- [ ] 8.5 Implement clear conversation history
  - Add "Clear History" button in Context Panel
  - Show confirmation modal before clearing
  - Clear localStorage and reset UI state
  - _Requirements: 20.3_

- [ ]* 8.6 Write property test for message chronological ordering
  - **Property 1: Message Chronological Ordering**
  - **Validates: Requirements 3.1**

- [ ]* 8.7 Write property test for message metadata completeness
  - **Property 10: Message Metadata Completeness**
  - **Validates: Requirements 3.7, 12.3, 12.4**

- [ ]* 8.8 Write property test for session state persistence round-trip
  - **Property 7: Session State Persistence Round-Trip**
  - **Validates: Requirements 20.1, 20.2**

- [ ]* 8.9 Write property test for message storage limit
  - **Property 28: Message Storage Limit**
  - **Validates: Requirements 20.4**

- [ ] 8.10 CHECKPOINT: Core Messaging Complete
  - Verify messages send and render correctly
  - Verify conversation persists across page reloads
  - Verify clear history works
  - Ask user for feedback before proceeding

## PHASE 9: Error Handling & Polish

**Goal**: Implement comprehensive error handling, responsive design, and final polish.

### Tasks

- [ ] 9.1 Implement frontend error handling
  - Add error message display in chat thread
  - Add error toast for file uploads
  - Add insufficient credits modal
  - Add tier restriction modal
  - Add rate limit cooldown timer
  - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [ ] 9.2 Implement backend error handling
  - Add validation error responses (400)
  - Add tier restriction responses (403)
  - Add insufficient credits responses (402)
  - Add rate limit responses (429)
  - Add AI service error responses (500, 503, 504)
  - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [ ] 9.3 Implement responsive design
  - Stack panels vertically on mobile (< 768px)
  - Make context panel collapsible on mobile
  - Fix input bar at bottom on mobile
  - Ensure file upload works on mobile
  - Ensure touch targets are minimum 44px
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 9.4 Implement character count for long messages
  - Show character count when message exceeds 500 characters
  - _Requirements: 5.8_

- [ ] 9.5 Implement credit cost estimation modal
  - Show modal before expensive operations (>5 credits)
  - Display operation description and credit cost
  - Add "Proceed" and "Cancel" buttons
  - _Requirements: 10.7, 10.8_

- [ ]* 9.6 Write property test for AI request error handling
  - **Property 22: AI Request Error Handling**
  - **Validates: Requirements 18.1**

- [ ]* 9.7 Write property test for rate limit cooldown display
  - **Property 23: Rate Limit Cooldown Display**
  - **Validates: Requirements 18.4**

- [ ]* 9.8 Write property test for responsive touch target size
  - **Property 29: Responsive Touch Target Size**
  - **Validates: Requirements 19.5**

- [ ]* 9.9 Write property test for error logging
  - **Property 20: Error Logging**
  - **Validates: Requirements 18.6**

- [ ] 9.10 CHECKPOINT: Error Handling & Polish Complete
  - Verify all error scenarios handled gracefully
  - Verify responsive design works on mobile
  - Verify all polish features work
  - Ask user for feedback before proceeding

## PHASE 10: Final Integration & Testing

**Goal**: End-to-end testing, integration verification, and production readiness.

### Tasks

- [ ] 10.1 End-to-end testing for Builder tier
  - Test complete message flow (send → AI response → credit deduction)
  - Test file upload (1 file limit)
  - Test workflow suggestions (not full generation)
  - Test tier restrictions (no log introspection, no reasoning panel)
  - Test credit enforcement

- [ ] 10.2 End-to-end testing for Operator tier
  - Test complete message flow with reasoning panel
  - Test file upload (5 file limit)
  - Test workflow generation (full)
  - Test log analysis commands
  - Test credit enforcement

- [ ] 10.3 End-to-end testing for Enterprise tier
  - Test complete message flow with full reasoning
  - Test file upload (unlimited)
  - Test workflow generation (complex multi-model)
  - Test CMR routing
  - Test document indexing (if implemented)
  - Test credit enforcement

- [ ] 10.4 Integration testing
  - Test navigation from dashboard to console
  - Test session persistence across navigation
  - Test credit synchronization with dashboard
  - Test tier synchronization with dashboard

- [ ] 10.5 Performance testing
  - Test with long conversation history (50+ messages)
  - Test with large file uploads
  - Test with rapid successive messages (rate limiting)
  - Test localStorage quota handling

- [ ] 10.6 Security testing
  - Verify API keys never exposed to frontend
  - Verify input sanitization works
  - Verify tier validation cannot be bypassed
  - Verify credit validation cannot be bypassed
  - Verify rate limiting works

- [ ] 10.7 FINAL CHECKPOINT: Production Ready
  - All tests passing
  - All tiers working correctly
  - All security measures in place
  - Documentation complete
  - Ready for deployment

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and architectural integrity
- Property tests validate universal correctness properties
- The implementation follows the existing AIVORY design language
- All AI calls route through the backend for security
- The console integrates with existing dashboard navigation
- This is Layer 5 of the AIVORY AI Operating System architecture
  - [ ] 1.1 Create console API routes module
    - Create `app/api/routes/console.py` with route stubs
    - Define POST /api/console/message endpoint
    - Define POST /api/console/upload endpoint
    - Define GET /api/console/context endpoint
    - Define POST /api/console/workflow/generate endpoint
    - Define POST /api/console/workflow/confirm endpoint
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ]* 1.2 Write property test for API endpoint validation
    - **Property 15: API Endpoint Credit Validation**
    - **Validates: Requirements 14.7, 15.5**

  - [ ]* 1.3 Write property test for rate limiting
    - **Property 16: API Endpoint Rate Limiting**
    - **Validates: Requirements 14.8, 15.6**

  - [ ] 1.4 Create console service module
    - Create `app/services/console_service.py`
    - Implement ConsoleService class with message handling
    - Integrate with existing SumopodClient
    - Implement tier validation logic
    - Implement credit validation logic
    - _Requirements: 14.6, 14.7, 15.4, 15.5_

  - [ ]* 1.5 Write property test for tier permission enforcement
    - **Property 4: Tier Permission Enforcement**
    - **Validates: Requirements 9.4, 14.6, 15.4**

  - [ ] 1.6 Create credit manager service
    - Create `app/services/credit_manager.py`
    - Implement credit deduction logic
    - Implement credit validation
    - Implement credit cost estimation
    - _Requirements: 10.1, 10.5, 10.7_

  - [ ]* 1.7 Write property test for credit deduction
    - **Property 2: Credit Deduction on AI Operations**
    - **Validates: Requirements 10.1, 7.7**

  - [ ]* 1.8 Write property test for insufficient credits blocking
    - **Property 3: Insufficient Credits Block Operations**
    - **Validates: Requirements 10.5, 5.7**

- [ ] 2. Document Processing
  - [ ] 2.1 Create document parser service
    - Create `app/services/document_parser.py`
    - Implement PDF text extraction (using PyPDF2 or pdfplumber)
    - Implement DOCX text extraction (using python-docx)
    - Implement CSV parsing (using csv module)
    - Implement TXT reading
    - _Requirements: 16.1, 16.2_

  - [ ]* 2.2 Write property test for file type validation
    - **Property 5: File Type Validation**
    - **Validates: Requirements 6.4**

  - [ ]* 2.3 Write property test for file content extraction
    - **Property 6: File Content Extraction**
    - **Validates: Requirements 6.7, 16.1, 16.2**

  - [ ] 2.4 Implement file upload endpoint
    - Implement POST /api/console/upload handler
    - Add file type validation
    - Add file size validation (tier-based limits)
    - Add temporary storage (session-based)
    - Return file metadata and preview
    - _Requirements: 6.4, 6.7, 6.8, 16.3_

  - [ ]* 2.5 Write property test for file upload error handling
    - **Property 21: File Upload Error Handling**
    - **Validates: Requirements 18.3**

- [ ] 3. Checkpoint - Backend API Core Complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Frontend Console Shell
  - [ ] 4.1 Create console HTML page
    - Create `frontend/console.html`
    - Add two-panel layout structure (LEFT: conversation, RIGHT: context)
    - Add command input bar at bottom
    - Link to `console.css` and `console.js`
    - Match existing dashboard design language
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 4.2 Create console CSS stylesheet
    - Create `frontend/console.css`
    - Implement two-panel layout (60-70% / 30-40% split)
    - Add resizable divider styling
    - Add message bubble styles (user vs AI)
    - Add input bar styles
    - Add context panel styles
    - Add responsive mobile styles (stack vertically)
    - Use Inter Tight font weight 300, brand colors, card backgrounds
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 19.1_

  - [ ] 4.3 Create console JavaScript module
    - Create `frontend/console.js`
    - Implement ConsoleApp class with state management
    - Implement initialization and routing
    - Setup event listeners for input bar
    - _Requirements: 1.1, 1.3_

  - [ ] 4.4 Add console navigation to dashboard
    - Update `frontend/dashboard-subscription.html` to add Console nav item
    - Add route handling for /dashboard/console
    - _Requirements: 1.2, 1.3_

- [ ] 5. Core Messaging Functionality
  - [ ] 5.1 Implement message sending
    - Implement sendMessage() in ConsoleApp
    - Add API call to POST /api/console/message
    - Add credit validation before sending
    - Add tier validation before sending
    - Disable send button when credits insufficient
    - _Requirements: 5.7, 10.5_

  - [ ] 5.2 Implement message rendering
    - Create MessageBubble class
    - Render user messages (left-aligned, distinct styling)
    - Render AI messages (left-aligned, different background)
    - Add timestamps to messages
    - Add avatar/icons (user vs AI)
    - _Requirements: 3.1, 3.2, 3.3, 3.7, 12.1, 12.2, 12.3, 12.4_

  - [ ]* 5.3 Write property test for message chronological ordering
    - **Property 1: Message Chronological Ordering**
    - **Validates: Requirements 3.1**

  - [ ]* 5.4 Write property test for message metadata completeness
    - **Property 10: Message Metadata Completeness**
    - **Validates: Requirements 3.7, 12.3, 12.4**

  - [ ] 5.5 Implement typing indicator
    - Create TypingIndicator component
    - Show animated dots when AI is responding
    - Show operation context ("Analyzing...", "Generating...")
    - Make cancellable by user
    - _Requirements: 3.6, 13.1, 13.3, 13.4, 13.5_

  - [ ]* 5.6 Write property test for typing indicator operation context
    - **Property 24: Typing Indicator Operation Context**
    - **Validates: Requirements 13.4**

  - [ ] 5.7 Implement conversation thread scrolling
    - Add auto-scroll to latest message
    - Add infinite scroll for history
    - _Requirements: 3.4, 3.5_

- [ ] 6. Markdown and Rich Content Rendering
  - [ ] 6.1 Implement markdown renderer
    - Create MarkdownRenderer class
    - Add markdown parsing (using marked.js or similar)
    - Add syntax highlighting for code blocks (using highlight.js or prism.js)
    - Add table rendering support
    - _Requirements: 12.5, 12.6, 12.7_

  - [ ]* 6.2 Write property test for markdown rendering support
    - **Property 12: Markdown Rendering Support**
    - **Validates: Requirements 12.5, 12.6, 12.7**

  - [ ] 6.3 Integrate markdown renderer into message bubbles
    - Update MessageBubble to use MarkdownRenderer
    - Test with code blocks, tables, lists, bold, italic
    - _Requirements: 12.5, 12.6, 12.7_

- [ ] 7. Context Panel Implementation
  - [ ] 7.1 Implement context panel data fetching
    - Implement GET /api/console/context endpoint handler
    - Return tier, credits, workflows, executions, features
    - _Requirements: 14.3_

  - [ ] 7.2 Create ContextPanel class
    - Create ContextPanel component
    - Display tier badge
    - Display credits meter with live updates
    - Display active workflows count
    - Display recent executions (last 5)
    - Display token usage (live during AI response)
    - Display model used
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ] 7.3 Implement real-time context updates
    - Update context panel after each AI response
    - Update credits meter in real-time
    - Animate credit deduction
    - _Requirements: 4.8, 10.2, 10.3_

- [ ] 8. File Upload Functionality
  - [ ] 8.1 Implement file upload UI
    - Create FileUploadHandler class
    - Add drag & drop support
    - Add drag overlay when file dragged over
    - Add click-to-upload file picker
    - Add file preview chips
    - Show file size and type in preview
    - Allow removing uploaded file before sending
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6, 6.10_

  - [ ]* 8.2 Write property test for file preview metadata completeness
    - **Property 30: File Preview Metadata Completeness**
    - **Validates: Requirements 6.10**

  - [ ] 8.3 Implement file upload API integration
    - Call POST /api/console/upload
    - Handle file validation errors
    - Display error toasts for failures
    - Store file ID for message attachment
    - _Requirements: 6.4, 18.3_

  - [ ] 8.4 Implement file badges in messages
    - Display file badges in message bubbles
    - Show filename, size, type
    - _Requirements: 3.8, 12.8_

  - [ ]* 8.5 Write property test for file attachment badge presence
    - **Property 11: File Attachment Badge Presence**
    - **Validates: Requirements 3.8, 12.8, 16.7**

- [ ] 9. Checkpoint - Core Console Features Complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Workflow Generation
  - [ ] 10.1 Create workflow generator service
    - Create `app/services/workflow_generator.py`
    - Implement AI-powered workflow JSON generation
    - Use Sumopod API with appropriate prompts
    - Generate workflow preview (trigger, steps, actions, integrations)
    - _Requirements: 7.1, 7.5_

  - [ ]* 10.2 Write property test for workflow preview completeness
    - **Property 9: Workflow Preview Contains Required Elements**
    - **Validates: Requirements 7.5**

  - [ ] 10.3 Implement workflow generation endpoint
    - Implement POST /api/console/workflow/generate handler
    - Validate tier (Builder: suggestions only, Operator: full, Enterprise: complex)
    - Deduct credits (5-20 based on complexity)
    - Return workflow JSON and preview
    - _Requirements: 7.1, 7.7, 7.8, 7.9, 7.10_

  - [ ]* 10.4 Write property test for workflow generation requires confirmation
    - **Property 8: Workflow Generation Requires Confirmation**
    - **Validates: Requirements 7.3, 7.4**

  - [ ] 10.5 Implement workflow confirmation endpoint
    - Implement POST /api/console/workflow/confirm handler
    - Save workflow to database
    - Return workflow ID and status
    - _Requirements: 7.3, 14.5_

  - [ ] 10.6 Implement workflow preview in context panel
    - Display generated workflow in Context Panel
    - Show trigger, steps, actions, integrations
    - Add edit capability before confirmation
    - Add confirm button
    - _Requirements: 7.2, 7.5, 7.6_

  - [ ] 10.7 Implement workflow attachment
    - Create WorkflowAttacher component
    - Add "Attach Workflow" button to input bar
    - Show workflow selector modal
    - Display selected workflow as badge in input bar
    - Include workflow JSON in message context
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [ ]* 10.8 Write property test for attached workflow AI access
    - **Property 25: Attached Workflow AI Access**
    - **Validates: Requirements 17.5, 17.6**

- [ ] 11. AI Reasoning Panel (Operator & Enterprise)
  - [ ] 11.1 Create ReasoningPanel component
    - Create collapsible reasoning panel
    - Display model used, tokens consumed, confidence score, cost
    - Display routing path (Enterprise only)
    - Display multi-model breakdown (Enterprise only)
    - Position below AI message
    - Use subtle styling
    - _Requirements: 11.1, 11.2, 11.3, 11.6_

  - [ ]* 11.2 Write property test for reasoning panel metadata completeness
    - **Property 13: Reasoning Panel Metadata Completeness**
    - **Validates: Requirements 11.2**

  - [ ]* 11.3 Write property test for reasoning panel updates per response
    - **Property 14: Reasoning Panel Updates Per Response**
    - **Validates: Requirements 11.5**

  - [ ] 11.4 Implement tier-based reasoning panel visibility
    - Hide reasoning panel in Builder tier
    - Show basic reasoning in Operator tier
    - Show full reasoning with routing in Enterprise tier
    - _Requirements: 11.3, 11.4_

  - [ ] 11.5 Update message endpoint to return reasoning metadata
    - Modify POST /api/console/message response
    - Include model, tokens, confidence, cost, routing_path
    - _Requirements: 11.2, 11.3_

- [ ] 12. Tier Gating and Restrictions
  - [ ] 12.1 Implement tier validation service
    - Create `app/services/tier_validator.py` (or extend existing)
    - Implement feature access validation
    - Implement file upload limits (1 for Builder, 5 for Operator, unlimited for Enterprise)
    - Implement rate limiting (10/min Builder, 30/min Operator, 100/min Enterprise)
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 12.2 Implement upgrade prompts
    - Create upgrade modal component
    - Show when user attempts tier-restricted feature
    - Display feature comparison and pricing
    - Add CTA to upgrade
    - _Requirements: 9.5, 10.6_

  - [ ]* 12.3 Write property test for upgrade prompt on tier restriction
    - **Property 27: Upgrade Prompt on Tier Restriction**
    - **Validates: Requirements 9.5**

  - [ ] 12.4 Implement tier badge in context panel
    - Display tier badge (Builder, Operator, Enterprise)
    - Use brand colors for styling
    - _Requirements: 9.6_

- [ ] 13. Session Persistence
  - [ ] 13.1 Implement localStorage conversation storage
    - Save conversation to localStorage after each message
    - Limit to last 50 messages
    - Include message content, timestamp, files, reasoning
    - _Requirements: 20.1, 20.4_

  - [ ]* 13.2 Write property test for session state persistence round-trip
    - **Property 7: Session State Persistence Round-Trip**
    - **Validates: Requirements 20.1, 20.2**

  - [ ]* 13.3 Write property test for message storage limit
    - **Property 28: Message Storage Limit**
    - **Validates: Requirements 20.4**

  - [ ] 13.4 Implement conversation restoration
    - Restore conversation from localStorage on page load
    - Maintain session state when navigating away and back
    - _Requirements: 1.5, 20.2_

  - [ ] 13.5 Implement clear conversation history
    - Add button to clear conversation
    - Clear localStorage
    - Reset UI state
    - _Requirements: 20.3_

- [ ] 14. Error Handling and Logging
  - [ ] 14.1 Implement frontend error handling
    - Add error message display in chat thread
    - Add error toast for file uploads
    - Add insufficient credits modal
    - Add tier restriction modal
    - Add rate limit cooldown timer
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [ ]* 14.2 Write property test for AI request error handling
    - **Property 22: AI Request Error Handling**
    - **Validates: Requirements 18.1**

  - [ ]* 14.3 Write property test for rate limit cooldown display
    - **Property 23: Rate Limit Cooldown Display**
    - **Validates: Requirements 18.4**

  - [ ] 14.4 Implement backend error handling
    - Add validation error responses (400)
    - Add tier restriction responses (403)
    - Add insufficient credits responses (402)
    - Add rate limit responses (429)
    - Add AI service error responses (500, 503, 504)
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [ ] 14.5 Implement audit logging
    - Create `app/services/audit_logger.py`
    - Log all console operations
    - Log user prompt, model response, tokens, routing path, confidence
    - Log errors with timestamp, user ID, tier, error type, context
    - _Requirements: 14.9, 15.7, 18.6_

  - [ ]* 14.6 Write property test for audit logging completeness
    - **Property 19: Audit Logging Completeness**
    - **Validates: Requirements 14.9, 15.7**

  - [ ]* 14.7 Write property test for error logging
    - **Property 20: Error Logging**
    - **Validates: Requirements 18.6**

- [ ] 15. Security and Input Sanitization
  - [ ] 15.1 Implement input sanitization
    - Create sanitization utility function
    - Sanitize user inputs before sending to AI
    - Remove potentially harmful content
    - _Requirements: 15.8_

  - [ ]* 15.2 Write property test for input sanitization
    - **Property 18: Input Sanitization**
    - **Validates: Requirements 15.8**

  - [ ] 15.3 Implement backend AI routing
    - Ensure all AI calls go through backend
    - Never expose API keys to frontend
    - Validate tier and credits on backend
    - _Requirements: 15.1, 15.2_

  - [ ]* 15.4 Write property test for backend AI routing
    - **Property 17: Backend AI Routing**
    - **Validates: Requirements 15.2**

  - [ ] 15.5 Implement Enterprise CMR routing
    - Add CMR (Custom Mechanism Routing) for Enterprise tier
    - Apply CMR before model call
    - _Requirements: 15.3_

- [ ] 16. Checkpoint - Security and Error Handling Complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. AI Command Execution
  - [ ] 17.1 Create log analyzer service
    - Create `app/services/log_analyzer.py`
    - Implement log fetching and aggregation
    - Implement failure analysis
    - Implement execution data aggregation
    - _Requirements: 8.1, 8.2, 8.6_

  - [ ] 17.2 Implement AI command handlers
    - Handle "Why did workflow fail?" command
    - Handle "Analyze last 10 executions" command
    - Handle "Simulate this workflow" command
    - Handle "Optimize for lower token usage" command
    - Handle "Show reasoning for decision D-XXXX" command
    - Fetch logs, reasoning, and model metadata
    - Format responses with structured data (tables, lists, code blocks)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ]* 17.3 Write property test for AI command context fetching
    - **Property 26: Document Reference in AI Responses**
    - **Validates: Requirements 16.5, 16.6**
    - Note: This property also applies to AI commands that reference uploaded documents

  - [ ]* 17.4 Write property test for structured data formatting
    - **Property 12: Markdown Rendering Support** (already tested in task 6.2)
    - This property covers structured data formatting in AI responses

- [ ] 18. Responsive Design and Mobile Support
  - [ ] 18.1 Implement responsive layout
    - Stack panels vertically on mobile (< 768px)
    - Make context panel collapsible on mobile
    - Fix input bar at bottom on mobile
    - Ensure file upload works on mobile
    - _Requirements: 19.1, 19.2, 19.3, 19.4_

  - [ ]* 18.2 Write property test for responsive touch target size
    - **Property 29: Responsive Touch Target Size**
    - **Validates: Requirements 19.5**

  - [ ] 18.3 Test mobile interactions
    - Test drag & drop on mobile
    - Test keyboard behavior on mobile
    - Test touch targets (minimum 44px)
    - _Requirements: 19.4, 19.5_

- [ ] 19. Polish and Final Integration
  - [ ] 19.1 Implement panel resizing
    - Add draggable divider between panels
    - Save panel sizes to localStorage
    - Restore panel sizes on load
    - _Requirements: 2.5_

  - [ ] 19.2 Implement credit cost estimation
    - Show credit cost estimate before expensive operations
    - Allow user to cancel if cost is high
    - _Requirements: 10.7, 10.8_

  - [ ] 19.3 Implement character count for long messages
    - Show character count when message exceeds threshold
    - _Requirements: 5.8_

  - [ ] 19.4 Add keyboard shortcuts
    - Enter to send
    - Shift+Enter for new line
    - _Requirements: 5.6_

  - [ ] 19.5 Implement multi-line input expansion
    - Expand input bar vertically as user types
    - Max 5 lines
    - _Requirements: 5.2_

  - [ ] 19.6 Add credit deduction animation
    - Animate credit meter when credits deducted
    - Use smooth easing
    - _Requirements: 10.4_

- [ ] 20. Final Checkpoint - Complete System Test
  - Ensure all tests pass, ask the user if questions arise.
  - Test end-to-end flows for all three tiers
  - Verify all tier restrictions work correctly
  - Verify credit system works correctly
  - Verify file upload and document intelligence works
  - Verify workflow generation and confirmation works
  - Verify session persistence works
  - Verify responsive design works on mobile

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows the existing AIVORY design language
- All AI calls route through the backend for security
- The console integrates with existing dashboard navigation
