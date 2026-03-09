# Implementation Plan: AI System Blueprint ($79) Generation Pipeline

## Overview

This implementation plan builds the complete AI Blueprint generation pipeline as Step 2 in the Aivory monetization funnel. The system generates dual-format blueprints (JSON + PDF) from AI Snapshot data, with payment gates, super admin bypass, dashboard views, and AI Console integration for n8n workflow translation.

Implementation approach:
1. Core data models and storage infrastructure
2. Payment validation and access control
3. AI-powered Blueprint generation (JSON)
4. PDF rendering with branding and locking
5. Dashboard UI for Blueprint viewing
6. AI Console upload and schema detection
7. Testing and integration

## Tasks

- [x] 1. Set up Blueprint data models and database schema
  - Create Pydantic models for BlueprintJSON, AgentDefinition, WorkflowDefinition, IntegrationRequirement
  - Create database schema for Blueprint storage (blueprint_id, user_id, version, json_path, pdf_path, created_at)
  - Create database schema for Blueprint metadata tracking
  - Set up file storage structure (blueprints/{user_id}/{blueprint_id}/v{version}/)
  - _Requirements: 3.1, 3.2, 7.1, 7.2, 7.3, 7.4, 23.1_

- [ ]* 1.1 Write property test for Blueprint JSON structure
  - **Property 9: JSON Field Completeness**
  - **Validates: Requirements 3.1**

- [ ]* 1.2 Write property test for Blueprint ID format and uniqueness
  - **Property 10: Blueprint ID Format and Uniqueness**
  - **Validates: Requirements 3.2**

- [x] 2. Implement payment validation and access control service
  - [x] 2.1 Create PaymentValidationService with super admin bypass logic
    - Implement is_super_admin() check for GrandMasterRCH
    - Implement validate_blueprint_access() with payment status check
    - Add payment gate enforcement for non-admin users
    - _Requirements: 1.2, 1.4, 1.5, 14.1, 15.2, 15.3_

  - [ ]* 2.2 Write property test for super admin payment bypass
    - **Property 1: Super Admin Payment Bypass**
    - **Validates: Requirements 1.4, 2.5, 14.1, 14.2**

  - [ ]* 2.3 Write property test for payment gate enforcement
    - **Property 2: Payment Gate Enforcement**
    - **Validates: Requirements 1.2, 1.5, 15.3**

  - [x] 2.4 Create BlueprintStorageService with access control
    - Implement store_blueprint() with user association
    - Implement retrieve_blueprint_json() with ownership validation
    - Implement retrieve_blueprint_pdf() with ownership validation
    - Implement list_user_blueprints() for dashboard
    - Add super admin universal access logic
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 16.5, 25.2, 25.4_

  - [ ]* 2.5 Write property test for access control enforcement
    - **Property 4: Access Control Enforcement**
    - **Validates: Requirements 7.5, 16.5, 25.2, 25.3**

  - [ ]* 2.6 Write property test for super admin universal access
    - **Property 5: Super Admin Universal Access**
    - **Validates: Requirements 14.3, 14.4, 25.4**

- [x] 3. Checkpoint - Ensure access control tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement AI generation service for Blueprint content
  - [x] 4.1 Create AIGenerationService with OpenRouter LLM integration
    - Set up OpenRouter client with API key from config
    - Implement generate_system_name() with prompt template
    - Add fallback to "[Company] AI System" format on failure
    - Implement retry logic with fallback prompts
    - _Requirements: 3.4, 17.1, 17.2, 17.5, 22.2_

  - [ ]* 4.2 Write property test for system name generation
    - **Property 14: System Name Generation**
    - **Validates: Requirements 3.4, 17.2**

  - [ ]* 4.3 Write property test for system name fallback
    - **Property 15: System Name Fallback**
    - **Validates: Requirements 17.5**

  - [x] 4.2 Implement generate_agents() for agent creation
    - Create prompt template for agent generation from Snapshot data
    - Parse LLM response into AgentDefinition objects
    - Assign unique agent IDs (agent_01, agent_02, ...)
    - Validate agent count is 2-5
    - Ensure all agents have required fields (name, trigger, tools, pseudo_logic)
    - _Requirements: 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 18.1, 18.2_

  - [ ]* 4.3 Write property test for agent count range
    - **Property 16: Agent Count Range**
    - **Validates: Requirements 18.2**

  - [ ]* 4.4 Write property test for agent structure completeness
    - **Property 17: Agent Structure Completeness**
    - **Validates: Requirements 3.6, 4.1, 4.2, 4.3, 4.4, 4.5**

  - [ ]* 4.5 Write property test for agent ID uniqueness
    - **Property 18: Agent ID Uniqueness**
    - **Validates: Requirements 4.1**

  - [ ]* 4.6 Write property test for pseudo logic notation
    - **Property 19: Pseudo Logic Notation**
    - **Validates: Requirements 4.6**

  - [x] 4.3 Implement detect_integrations() for integration identification
    - Extract mentioned systems from Snapshot data
    - Analyze agent tools to infer integration needs
    - Create IntegrationRequirement objects with service_name, type, priority, reason
    - _Requirements: 3.8, 19.1, 19.2, 19.3, 19.4_

  - [ ]* 4.4 Write property test for integration structure
    - **Property 22: Integration Structure**
    - **Validates: Requirements 19.3, 19.4**

  - [x] 4.4 Implement calculate_deployment_estimate() for time estimation
    - Calculate base hours: len(agents) * 8
    - Calculate integration hours: len(integrations) * 4
    - Apply complexity multiplier based on readiness score
    - Format as "X-Y hours" range
    - _Requirements: 3.9, 20.1, 20.2, 20.3, 20.4_

  - [ ]* 4.5 Write property test for deployment estimate format
    - **Property 23: Deployment Estimate Format**
    - **Validates: Requirements 3.9, 20.2**

  - [ ]* 4.6 Write property test for deployment estimate calculation
    - **Property 24: Deployment Estimate Calculation**
    - **Validates: Requirements 20.1, 20.3**

  - [ ]* 4.7 Write property test for readiness score inverse relationship
    - **Property 25: Readiness Score Inverse Relationship**
    - **Validates: Requirements 20.4**

- [x] 5. Implement JSON assembly service
  - [x] 5.1 Create JSONAssemblyService for Blueprint JSON construction
    - Implement assemble_blueprint_json() to structure all components
    - Generate unique blueprint_id with "bp_" prefix
    - Set version to "1.0" for new Blueprints
    - Set schema_version to "aivory-v1"
    - Populate generated_for with user email
    - Add timestamp for generated_at
    - Validate JSON structure against Pydantic model
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.10_

  - [ ]* 5.2 Write property test for schema version constant
    - **Property 11: Schema Version Constant**
    - **Validates: Requirements 3.3**

  - [ ]* 5.3 Write property test for user email population
    - **Property 12: User Email Population**
    - **Validates: Requirements 3.5**

  - [ ]* 5.4 Write property test for JSON validity
    - **Property 13: JSON Validity**
    - **Validates: Requirements 3.10**

- [x] 6. Checkpoint - Ensure Blueprint JSON generation works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement PDF rendering service with branding
  - [x] 7.1 Set up PDF generation library (ReportLab or WeasyPrint)
    - Install PDF generation dependencies
    - Configure Inter Tight font family
    - Set up Aivory purple color theme (#7C3AED)
    - Load Aivory logo asset
    - _Requirements: 5.8, 24.1, 24.2, 24.3_

  - [x] 7.2 Create PDFRenderingService with section rendering methods
    - Implement _render_header() with logo and system name
    - Implement _render_executive_summary() with AI-generated summary
    - Implement _render_system_diagram() with ASCII flow diagram
    - Implement _render_agents_section() with full agent list
    - Implement _render_integrations_section() with high-level names
    - Implement _render_footer() with blueprint_id and schema_version
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 24.5_

  - [ ]* 7.3 Write property test for PDF section completeness
    - **Property 26: PDF Section Completeness**
    - **Validates: Requirements 5.1**

  - [ ]* 7.4 Write property test for PDF non-locked sections
    - **Property 27: PDF Non-Locked Sections**
    - **Validates: Requirements 5.2, 5.3, 5.4, 6.5**

  - [ ]* 7.5 Write property test for PDF branding elements
    - **Property 32: PDF Branding Elements**
    - **Validates: Requirements 5.8, 24.1, 24.2, 24.3, 24.5**

  - [x] 7.3 Implement _render_workflow_pseudo_code() with locking logic
    - Show full pseudo_logic for first agent (agents[0])
    - Show lock icon and placeholder for remaining agents
    - Add message "Full workflow details available in dashboard and Step 3 subscription"
    - Ensure locked sections are visually distinct
    - _Requirements: 5.6, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 7.4 Write property test for PDF workflow locking
    - **Property 28: PDF Workflow Locking**
    - **Validates: Requirements 5.6, 6.1, 6.2, 6.3**

  - [ ]* 7.5 Write property test for PDF lock visual distinction
    - **Property 29: PDF Lock Visual Distinction**
    - **Validates: Requirements 6.4**

- [x] 8. Implement metadata embedding service
  - [x] 8.1 Create MetadataEmbeddingService for PDF metadata
    - Implement embed_metadata() to add blueprint_id and schema_version
    - Embed as visible text in footer
    - Embed as PDF metadata properties (using PyPDF2)
    - Set custom metadata fields for blueprint_id and schema_version
    - _Requirements: 5.7, 21.1, 21.2, 21.3, 21.4_

  - [ ]* 8.2 Write property test for PDF metadata embedding
    - **Property 30: PDF Metadata Embedding**
    - **Validates: Requirements 5.7, 21.1, 21.2, 21.3, 21.4**

  - [x] 8.2 Implement extract_metadata() for PDF parsing
    - Parse footer text for blueprint_id and schema_version
    - Read PDF metadata properties
    - Return BlueprintMetadata or None if not found
    - _Requirements: 11.2, 21.5_

  - [ ]* 8.3 Write property test for PDF metadata extractability
    - **Property 31: PDF Metadata Extractability**
    - **Validates: Requirements 21.5**

- [x] 9. Implement Blueprint generation orchestration service
  - [x] 9.1 Create BlueprintGenerationService to orchestrate full pipeline
    - Implement generate_blueprint() main method
    - Validate payment status (with super admin bypass)
    - Retrieve AI Snapshot data
    - Call AI generation service for system name, agents, integrations, estimate
    - Call JSON assembly service
    - Call PDF rendering service
    - Call metadata embedding service
    - Store both files via storage service
    - Return BlueprintGenerationResult with URLs
    - _Requirements: 1.3, 2.1, 2.3, 15.4, 15.6_

  - [ ]* 9.2 Write property test for payment-triggered generation
    - **Property 3: Payment-Triggered Generation**
    - **Validates: Requirements 1.3**

  - [ ]* 9.3 Write property test for Snapshot data source requirement
    - **Property 6: Snapshot Data Source Requirement**
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [x] 9.2 Add error handling for missing Snapshot data
    - Raise SnapshotNotFoundError with clear message
    - Return error "AI Snapshot required for Blueprint generation"
    - _Requirements: 2.4, 22.1_

  - [ ]* 9.3 Write property test for missing Snapshot error handling
    - **Property 7: Missing Snapshot Error Handling**
    - **Validates: Requirements 2.4, 22.1**

  - [x] 9.3 Add retry logic and error handling for AI generation
    - Retry AI generation with fallback prompts on failure
    - Log all generation errors
    - Return error with support contact if all attempts fail
    - Handle partial failures gracefully (JSON succeeds, PDF fails)
    - _Requirements: 22.2, 22.3, 22.4, 22.5_

  - [ ]* 9.4 Write property test for AI generation retry
    - **Property 48: AI Generation Retry**
    - **Validates: Requirements 22.2**

  - [ ]* 9.5 Write property test for complete failure error response
    - **Property 49: Complete Failure Error Response**
    - **Validates: Requirements 22.3**

  - [ ]* 9.6 Write property test for error logging
    - **Property 50: Error Logging**
    - **Validates: Requirements 22.4, 14.5, 25.5**

  - [ ]* 9.7 Write property test for partial failure graceful handling
    - **Property 51: Partial Failure Graceful Handling**
    - **Validates: Requirements 22.5**

- [x] 10. Checkpoint - Ensure end-to-end Blueprint generation works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement Blueprint API endpoints
  - [x] 11.1 Create POST /api/v1/blueprint/generate endpoint
    - Accept BlueprintGenerationRequest (user_id, snapshot_id, bypass_payment)
    - Validate user authentication
    - Call BlueprintGenerationService.generate_blueprint()
    - Return BlueprintGenerationResult with blueprint_id and download URLs
    - _Requirements: 15.1, 15.2, 15.4, 15.6_

  - [ ]* 11.2 Write property test for authentication requirement
    - **Property 8: Authentication Requirement**
    - **Validates: Requirements 15.2, 25.1**

  - [x] 11.2 Create GET /api/v1/blueprint/list endpoint
    - Validate user authentication
    - Call storage service to list user's Blueprints
    - Return array of BlueprintMetadata
    - _Requirements: 16.1, 16.2_

  - [x] 11.3 Create GET /api/v1/blueprint/{blueprint_id} endpoint
    - Validate user authentication
    - Validate access control (owner or super admin)
    - Retrieve Blueprint JSON from storage
    - Return full Blueprint JSON content
    - _Requirements: 16.3, 16.4, 16.5_

  - [x] 11.4 Create GET /api/v1/blueprint/{blueprint_id}/download/json endpoint
    - Validate access control
    - Retrieve Blueprint JSON file
    - Set filename to "[system_name]_blueprint.json"
    - Return file as downloadable attachment
    - Log download event
    - _Requirements: 9.1, 9.3, 9.4, 9.5_

  - [ ]* 11.5 Write property test for download file naming
    - **Property 35: Download File Naming**
    - **Validates: Requirements 9.3**

  - [ ]* 11.6 Write property test for download content integrity
    - **Property 36: Download Content Integrity**
    - **Validates: Requirements 9.4**

  - [ ]* 11.7 Write property test for download event tracking
    - **Property 52: Download Event Tracking**
    - **Validates: Requirements 9.5**

  - [x] 11.5 Create GET /api/v1/blueprint/{blueprint_id}/download/pdf endpoint
    - Validate access control
    - Retrieve Blueprint PDF file
    - Set filename to "[system_name]_blueprint.pdf"
    - Return file as downloadable attachment
    - Log download event
    - _Requirements: 9.2, 9.3, 9.4, 9.5_

- [x] 12. Implement Blueprint versioning logic
  - [x] 12.1 Add version tracking to storage service
    - Check for existing Blueprints with same snapshot_id
    - Increment version number if regenerating
    - Store all versions in separate directories
    - _Requirements: 23.1, 23.2, 23.3_

  - [ ]* 12.2 Write property test for initial version assignment
    - **Property 39: Initial Version Assignment**
    - **Validates: Requirements 23.1**

  - [ ]* 12.3 Write property test for version incrementing
    - **Property 40: Version Incrementing**
    - **Validates: Requirements 23.2**

  - [ ]* 12.4 Write property test for version history retention
    - **Property 41: Version History Retention**
    - **Validates: Requirements 23.3, 23.5**

  - [x] 12.2 Add version history display to list endpoint
    - Include all versions in Blueprint metadata response
    - Allow download of any previous version
    - _Requirements: 23.4, 23.5_

- [x] 13. Implement Dashboard Blueprint view UI
  - [x] 13.1 Create Blueprint dashboard page (dashboard-blueprint.html)
    - Add page structure with sections for all Blueprint content
    - Include executive summary section
    - Include system overview diagram section
    - Include complete agent list with roles
    - Include full tools & integrations list
    - Include complete workflow pseudo code for ALL agents (unlocked)
    - Add download buttons for JSON and PDF
    - Add deployment instructions section with Step 3 CTA
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 10.1, 10.2, 10.3_

  - [ ]* 13.2 Write property test for dashboard content completeness
    - **Property 37: Dashboard Content Completeness**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

  - [ ]* 13.3 Write property test for dashboard pseudo code unlocking
    - **Property 38: Dashboard Pseudo Code Unlocking**
    - **Validates: Requirements 8.6**

  - [x] 13.2 Create Blueprint dashboard JavaScript (dashboard-blueprint.js)
    - Fetch Blueprint data from API on page load
    - Render all sections dynamically
    - Implement download button handlers
    - Implement Step 3 CTA navigation
    - Handle loading and error states
    - _Requirements: 8.1, 9.1, 9.2, 10.4_

  - [x] 13.3 Style Blueprint dashboard with Aivory branding
    - Apply purple theme and Inter Tight font
    - Style sections with clear visual hierarchy
    - Add responsive layout for mobile/desktop
    - Style download buttons prominently
    - _Requirements: 24.1, 24.2, 24.3_

- [x] 14. Implement AI Console Blueprint upload integration
  - [x] 14.1 Create AI Console upload UI (console-blueprint-upload.html)
    - Add file upload interface for PDF files
    - Show upload progress indicator
    - Display schema detection result
    - Show translation status message
    - _Requirements: 11.1_

  - [x] 14.2 Create POST /api/v1/console/blueprint/upload endpoint
    - Validate Step 3 subscription status
    - Accept PDF file upload
    - Extract metadata using MetadataEmbeddingService
    - Detect schema type (aivory-v1, external-known, external-unknown)
    - Store upload reference
    - Return UploadResult with schema type and translation status
    - _Requirements: 11.2, 11.3, 11.4, 11.5_

  - [ ]* 14.3 Write property test for metadata extraction from upload
    - **Property 42: Metadata Extraction from Upload**
    - **Validates: Requirements 11.2**

  - [ ]* 14.4 Write property test for upload validation
    - **Property 43: Upload Validation**
    - **Validates: Requirements 11.3, 11.4**

  - [x] 14.3 Implement AIConsoleService for schema-based routing
    - Implement detect_schema() to determine Blueprint type
    - Route to fast path for aivory-v1 schema
    - Route to fallback mode for external schemas
    - _Requirements: 12.1, 13.1_

  - [ ]* 14.4 Write property test for schema-based mode selection
    - **Property 44: Schema-Based Mode Selection**
    - **Validates: Requirements 12.1, 13.1**

  - [x] 14.4 Implement translate_aivory_blueprint() for fast path
    - Retrieve Blueprint JSON using blueprint_id
    - Parse agents, workflows, and integrations
    - Map to n8n workflow nodes and connections
    - Return n8n workflow JSON for user review
    - Display message "Aivory Blueprint detected - using optimized translation"
    - _Requirements: 12.2, 12.3, 12.4, 12.5_

  - [ ]* 14.5 Write property test for fast path JSON retrieval
    - **Property 45: Fast Path JSON Retrieval**
    - **Validates: Requirements 12.3**

  - [ ]* 14.6 Write property test for fast path JSON parsing
    - **Property 46: Fast Path JSON Parsing**
    - **Validates: Requirements 12.4**

  - [x] 14.5 Implement interpret_external_blueprint() for fallback mode
    - Extract text from PDF using pdfplumber
    - Use LLM to interpret system design
    - Present interpretation to user for refinement
    - Display notice "External blueprint detected - using interpretation mode"
    - _Requirements: 13.2, 13.3, 13.4, 13.5_

  - [ ]* 14.6 Write property test for fallback mode text extraction
    - **Property 47: Fallback Mode Text Extraction**
    - **Validates: Requirements 13.4**

- [x] 15. Checkpoint - Ensure AI Console integration works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Implement purchase flow integration
  - [x] 16.1 Add Blueprint purchase option to AI Snapshot result page
    - Display "Upgrade to AI Blueprint ($79)" CTA after Snapshot completion
    - Link to payment processing
    - _Requirements: 1.1_

  - [x] 16.2 Integrate with payment processing system
    - Trigger Blueprint generation on successful $79 payment
    - Update user's payment status in database
    - Redirect to Blueprint dashboard after generation
    - _Requirements: 1.2, 1.3_

- [x] 17. Add audit logging for security and analytics
  - [x] 17.1 Implement audit logging for super admin access
    - Log all super admin Blueprint access attempts
    - Log super admin payment bypasses
    - _Requirements: 14.5_

  - [x] 17.2 Implement audit logging for access denials
    - Log unauthorized access attempts with user_id and blueprint_id
    - Log 403 responses for security monitoring
    - _Requirements: 25.5_

  - [x] 17.3 Implement analytics logging for downloads
    - Log all Blueprint JSON downloads
    - Log all Blueprint PDF downloads
    - Track download timestamps and user_ids
    - _Requirements: 9.5_

- [x] 18. Integration testing and end-to-end validation
  - [ ]* 18.1 Write integration test for complete Blueprint generation flow
    - Create test Snapshot data
    - Trigger Blueprint generation
    - Verify JSON structure and content
    - Verify PDF generation and metadata
    - Verify storage and retrieval
    - Verify download URLs work

  - [ ]* 18.2 Write integration test for AI Console upload flow
    - Generate test Blueprint PDF
    - Upload to AI Console
    - Verify metadata extraction
    - Verify schema detection
    - Verify fast path activation
    - Verify JSON retrieval and n8n translation

  - [ ]* 18.3 Write integration test for access control
    - Test owner can access their Blueprint
    - Test non-owner cannot access others' Blueprints
    - Test super admin can access any Blueprint
    - Test 403 response for unauthorized access

  - [ ]* 18.4 Write integration test for versioning
    - Generate initial Blueprint (version 1.0)
    - Regenerate from same Snapshot (version 1.1)
    - Verify both versions are stored
    - Verify both versions are downloadable

- [x] 19. Final checkpoint - Ensure all features work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- Super admin bypass (GrandMasterRCH) must be tested thoroughly for security
- PDF generation requires careful attention to branding consistency
- AI Console integration is critical for Step 3 monetization
