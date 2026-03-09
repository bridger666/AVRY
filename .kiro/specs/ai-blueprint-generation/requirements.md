# Requirements Document

## Introduction

The AI System Blueprint ($79) generation pipeline is Step 2 in the Aivory monetization funnel: Free Diagnostic → AI Snapshot ($15) → AI Blueprint ($79) → Deploy (subscription). This feature generates comprehensive, machine-readable and human-readable blueprints that translate AI Snapshot outputs into actionable system designs. The blueprints enable both immediate human understanding and future automated deployment through n8n workflow translation. The system provides instant access for the GrandMasterRCH super admin while requiring $79 payment for all other users.

## Glossary

- **AI_Blueprint**: A comprehensive system design document generated from AI Snapshot output, consisting of both JSON and PDF formats
- **Blueprint_JSON**: Machine-readable structured file containing agents, workflows, integrations, and pseudo logic for n8n translation
- **Blueprint_PDF**: Human-readable branded document with executive summary, diagrams, and locked sections
- **AI_Snapshot**: The $15 tier output that serves as input for Blueprint generation (not the free diagnostic)
- **Blueprint_ID**: Unique identifier in format "bp_[unique_id]" embedded in both JSON and PDF
- **Schema_Version**: Version identifier (e.g., "aivory-v1") indicating Blueprint format for AI Console interpretation
- **Pseudo_Logic**: Simplified conditional logic notation (IF/ELSE/THEN) describing agent behavior
- **AI_Console**: Step 3 subscription feature where users upload blueprints for automated n8n translation
- **Locked_Section**: PDF content that shows preview only, with full details available in dashboard or upon subscription
- **GrandMasterRCH**: Super admin user with bypass access to all payment gates and full system features
- **Dashboard_View**: Post-purchase interface displaying full Blueprint content with download options
- **Fast_Path**: AI Console mode that directly translates aivory-v1 schema blueprints to n8n workflows
- **Fallback_Mode**: AI Console mode for external/unknown schema blueprints requiring manual interpretation

## Requirements

### Requirement 1: Blueprint Purchase Gate

**User Story:** As a user, I want to purchase the AI Blueprint for $79, so that I can access comprehensive system design based on my AI Snapshot.

#### Acceptance Criteria

1. WHEN a user completes AI Snapshot ($15 tier), THEN THE System SHALL display an option to purchase AI Blueprint for $79
2. WHEN a user initiates Blueprint purchase, THEN THE System SHALL process payment before generating the Blueprint
3. WHEN payment is successful, THEN THE System SHALL trigger Blueprint generation immediately
4. WHERE the user is GrandMasterRCH super admin, THE System SHALL bypass all payment gates and provide instant access
5. WHEN a non-admin user attempts to access Blueprint without payment, THEN THE System SHALL redirect to purchase flow

### Requirement 2: Blueprint Generation Trigger

**User Story:** As a system, I want to trigger Blueprint generation from the correct input source, so that blueprints are based on enriched AI Snapshot data.

#### Acceptance Criteria

1. THE System SHALL use AI Snapshot output as the input for Blueprint generation
2. THE System SHALL NOT use free diagnostic output directly for Blueprint generation
3. WHEN Blueprint generation is triggered, THEN THE System SHALL retrieve the user's AI Snapshot data
4. WHEN AI Snapshot data is unavailable, THEN THE System SHALL return an error indicating Snapshot is required
5. WHERE user is GrandMasterRCH, THE System SHALL generate Blueprint instantly without payment validation

### Requirement 3: Blueprint JSON Generation

**User Story:** As a system, I want to generate machine-readable Blueprint JSON, so that AI Console can translate it to n8n workflows.

#### Acceptance Criteria

1. THE System SHALL generate a Blueprint_JSON file containing blueprint_id, version, system_name, generated_for, agents, workflows, integrations_required, deployment_estimate, and schema_version fields
2. THE System SHALL assign a unique blueprint_id in format "bp_[unique_id]"
3. THE System SHALL set schema_version to "aivory-v1"
4. THE System SHALL generate system_name using AI based on Snapshot data
5. THE System SHALL populate generated_for field with user email
6. THE System SHALL generate agents array with id, name, trigger, tools, and pseudo_logic fields
7. THE System SHALL generate workflows array describing agent interactions
8. THE System SHALL generate integrations_required array listing external services needed
9. THE System SHALL generate deployment_estimate indicating implementation time
10. THE System SHALL ensure Blueprint_JSON is valid JSON format

### Requirement 4: Agent Definition Structure

**User Story:** As a developer, I want detailed agent definitions in Blueprint JSON, so that I can understand and implement each agent's behavior.

#### Acceptance Criteria

1. WHEN defining an agent, THEN THE System SHALL include a unique id field
2. WHEN defining an agent, THEN THE System SHALL include a descriptive name field
3. WHEN defining an agent, THEN THE System SHALL include a trigger field specifying activation conditions
4. WHEN defining an agent, THEN THE System SHALL include a tools array listing required capabilities
5. WHEN defining an agent, THEN THE System SHALL include a pseudo_logic array with IF/ELSE/THEN conditional statements
6. THE System SHALL ensure pseudo_logic uses simplified notation understandable by both humans and AI

### Requirement 5: Blueprint PDF Generation

**User Story:** As a user, I want a professional PDF blueprint, so that I can review and share my AI system design.

#### Acceptance Criteria

1. THE System SHALL generate a Blueprint_PDF file containing executive summary, system overview diagram, agent list, tools & integrations, workflow pseudo code, and footer metadata
2. THE System SHALL include full executive summary in PDF
3. THE System SHALL include text/ASCII flow diagram for system overview
4. THE System SHALL include full agent list with roles in PDF
5. THE System SHALL include high-level names only for tools & integrations
6. THE System SHALL include workflow pseudo code preview for 1 agent only, with remaining agents locked
7. THE System SHALL include footer with blueprint_id and schema_version as embedded metadata
8. THE System SHALL apply Aivory branding with logo, purple theme, and Inter Tight font
9. THE System SHALL ensure PDF is professionally formatted and print-ready

### Requirement 6: PDF Locked Sections

**User Story:** As a business, I want to lock detailed workflow pseudo code in PDF, so that users are incentivized to subscribe for full deployment access.

#### Acceptance Criteria

1. WHEN generating workflow pseudo code section in PDF, THEN THE System SHALL show full details for exactly 1 agent
2. WHEN generating workflow pseudo code section in PDF, THEN THE System SHALL show locked placeholder for remaining agents
3. THE System SHALL display message "Full workflow details available in dashboard and Step 3 subscription"
4. THE System SHALL ensure locked sections are visually distinct with lock icon or similar indicator
5. THE System SHALL NOT lock executive summary, system overview, or agent list sections

### Requirement 7: Blueprint Storage

**User Story:** As a system, I want to store generated blueprints securely, so that users can access them after purchase.

#### Acceptance Criteria

1. WHEN Blueprint generation completes, THEN THE System SHALL store Blueprint_JSON in persistent storage
2. WHEN Blueprint generation completes, THEN THE System SHALL store Blueprint_PDF in persistent storage
3. THE System SHALL associate stored blueprints with user account
4. THE System SHALL associate stored blueprints with blueprint_id for retrieval
5. THE System SHALL ensure blueprints are accessible only to the owning user and super admins

### Requirement 8: Dashboard Blueprint View

**User Story:** As a user who purchased Blueprint, I want to view my full blueprint in the dashboard, so that I can review all details including locked PDF sections.

#### Acceptance Criteria

1. WHEN a user accesses dashboard after Blueprint purchase, THEN THE System SHALL display full Blueprint content
2. THE System SHALL render executive summary in dashboard
3. THE System SHALL render system overview diagram in dashboard
4. THE System SHALL render complete agent list with roles in dashboard
5. THE System SHALL render full tools & integrations list in dashboard
6. THE System SHALL render complete workflow pseudo code for ALL agents in dashboard (not locked)
7. THE System SHALL provide download buttons for Blueprint_JSON and Blueprint_PDF
8. THE System SHALL display deployment instructions section with Step 3 subscription CTA

### Requirement 9: Blueprint File Downloads

**User Story:** As a user, I want to download Blueprint JSON and PDF files, so that I can use them offline or upload to AI Console.

#### Acceptance Criteria

1. WHEN a user clicks download button for Blueprint_JSON, THEN THE System SHALL provide the file as downloadable JSON
2. WHEN a user clicks download button for Blueprint_PDF, THEN THE System SHALL provide the file as downloadable PDF
3. THE System SHALL name downloaded files with format "[system_name]_blueprint.json" and "[system_name]_blueprint.pdf"
4. THE System SHALL ensure downloaded files contain complete data matching stored versions
5. THE System SHALL track download events for analytics

### Requirement 10: Deployment Instructions Display

**User Story:** As a user, I want to see deployment instructions in dashboard, so that I understand next steps for implementation.

#### Acceptance Criteria

1. THE System SHALL display deployment instructions section in Blueprint dashboard view
2. THE System SHALL show message "Available when you subscribe to Step 3"
3. THE System SHALL provide a clear CTA button for Step 3 subscription
4. WHEN user clicks Step 3 CTA, THEN THE System SHALL navigate to subscription purchase flow
5. THE System SHALL explain that Step 3 enables AI Console for automated n8n translation

### Requirement 11: AI Console Blueprint Upload

**User Story:** As a Step 3 subscriber, I want to upload my Blueprint PDF to AI Console, so that it can be translated to n8n workflows.

#### Acceptance Criteria

1. WHEN a Step 3 subscriber accesses AI Console, THEN THE System SHALL provide a Blueprint upload interface
2. WHEN a user uploads a PDF file, THEN THE System SHALL extract embedded blueprint_id and schema_version metadata
3. THE System SHALL validate that uploaded file contains required metadata
4. WHEN metadata extraction fails, THEN THE System SHALL return error message indicating invalid Blueprint format
5. THE System SHALL store uploaded Blueprint reference for translation processing

### Requirement 12: AI Console Fast Path Detection

**User Story:** As AI Console, I want to detect Aivory-generated blueprints, so that I can use optimized translation for known schemas.

#### Acceptance Criteria

1. WHEN AI Console detects schema_version = "aivory-v1", THEN THE System SHALL activate fast path mode
2. WHEN in fast path mode, THEN THE System SHALL use direct JSON-to-n8n translation logic
3. WHEN in fast path mode, THEN THE System SHALL retrieve Blueprint_JSON using blueprint_id
4. THE System SHALL parse Blueprint_JSON agents, workflows, and integrations for n8n workflow generation
5. THE System SHALL display message "Aivory Blueprint detected - using optimized translation"

### Requirement 13: AI Console Fallback Mode

**User Story:** As AI Console, I want to handle external blueprints gracefully, so that users can upload non-Aivory designs for interpretation.

#### Acceptance Criteria

1. WHEN AI Console detects schema_version is NOT "aivory-v1" or is missing, THEN THE System SHALL activate fallback mode
2. WHEN in fallback mode, THEN THE System SHALL use manual interpretation mode with AI assistance
3. WHEN in fallback mode, THEN THE System SHALL display notice "External blueprint detected - using interpretation mode"
4. THE System SHALL attempt to extract system design information from PDF text
5. THE System SHALL provide user interface for manual refinement of interpreted design

### Requirement 14: Super Admin Bypass

**User Story:** As GrandMasterRCH super admin, I want instant access to all Blueprint features, so that I can test and demonstrate the system without payment friction.

#### Acceptance Criteria

1. WHEN user is authenticated as GrandMasterRCH, THEN THE System SHALL bypass $79 payment gate
2. WHEN GrandMasterRCH accesses Blueprint generation, THEN THE System SHALL generate Blueprint immediately
3. WHEN GrandMasterRCH accesses dashboard, THEN THE System SHALL display full Blueprint view
4. WHEN GrandMasterRCH accesses AI Console, THEN THE System SHALL provide full upload and translation features
5. THE System SHALL log super admin access for audit purposes

### Requirement 15: Blueprint Generation API Endpoint

**User Story:** As a frontend, I want a REST API endpoint for Blueprint generation, so that I can trigger generation after payment.

#### Acceptance Criteria

1. THE System SHALL provide a POST endpoint to trigger Blueprint generation
2. THE System SHALL validate user authentication before processing
3. THE System SHALL validate payment status before processing (except for super admin)
4. WHEN generation is triggered, THEN THE System SHALL return generation job ID
5. THE System SHALL provide a GET endpoint to check generation status
6. WHEN generation completes, THEN THE System SHALL return Blueprint_JSON and PDF download URLs

### Requirement 16: Blueprint Retrieval API Endpoint

**User Story:** As a frontend, I want a REST API endpoint to retrieve user's blueprints, so that I can display them in dashboard.

#### Acceptance Criteria

1. THE System SHALL provide a GET endpoint to retrieve user's Blueprint list
2. THE System SHALL return array of Blueprint metadata including blueprint_id, system_name, created_at, and download URLs
3. THE System SHALL provide a GET endpoint to retrieve specific Blueprint by blueprint_id
4. WHEN retrieving specific Blueprint, THEN THE System SHALL return full Blueprint_JSON content
5. THE System SHALL enforce access control ensuring users can only retrieve their own Blueprints

### Requirement 17: AI-Powered System Name Generation

**User Story:** As a system, I want to generate meaningful system names, so that blueprints are immediately identifiable.

#### Acceptance Criteria

1. WHEN generating Blueprint, THEN THE System SHALL analyze AI Snapshot data to determine system purpose
2. THE System SHALL use AI to generate a concise, descriptive system_name (2-5 words)
3. THE System SHALL ensure system_name reflects primary business objective from Snapshot
4. THE System SHALL ensure system_name is professional and suitable for client presentation
5. WHEN AI generation fails, THEN THE System SHALL use fallback format "[Company] AI System"

### Requirement 18: AI-Powered Agent Generation

**User Story:** As a system, I want to generate relevant agents based on Snapshot data, so that blueprints address user's specific needs.

#### Acceptance Criteria

1. WHEN generating agents, THEN THE System SHALL analyze AI Snapshot workflow and automation data
2. THE System SHALL generate 2-5 agents based on identified automation opportunities
3. THE System SHALL assign each agent a descriptive name reflecting its purpose
4. THE System SHALL define appropriate triggers for each agent (schedule, webhook, event, manual)
5. THE System SHALL assign relevant tools to each agent based on required capabilities
6. THE System SHALL generate pseudo_logic describing agent decision-making process

### Requirement 19: AI-Powered Integration Detection

**User Story:** As a system, I want to identify required integrations, so that blueprints include necessary external services.

#### Acceptance Criteria

1. WHEN generating integrations_required, THEN THE System SHALL analyze AI Snapshot for mentioned systems and tools
2. THE System SHALL identify ERP systems, CRM platforms, communication tools, and data sources
3. THE System SHALL generate integration list with service names and integration types
4. THE System SHALL prioritize integrations based on Snapshot data quality and process documentation scores
5. THE System SHALL include common integrations relevant to user's industry when detected

### Requirement 20: Deployment Estimate Calculation

**User Story:** As a user, I want to see estimated deployment time, so that I can plan implementation timeline.

#### Acceptance Criteria

1. WHEN generating deployment_estimate, THEN THE System SHALL calculate based on number of agents, integrations, and workflow complexity
2. THE System SHALL express estimate in hours (e.g., "40-60 hours")
3. THE System SHALL consider AI readiness score from Snapshot when calculating estimate
4. THE System SHALL provide higher estimates for lower readiness scores (more foundational work needed)
5. THE System SHALL include estimate in both Blueprint_JSON and Blueprint_PDF

### Requirement 21: Blueprint Metadata Embedding

**User Story:** As AI Console, I want to extract Blueprint metadata from PDF, so that I can identify and process Aivory blueprints.

#### Acceptance Criteria

1. THE System SHALL embed blueprint_id in PDF footer as visible text
2. THE System SHALL embed schema_version in PDF footer as visible text
3. THE System SHALL embed blueprint_id in PDF metadata properties
4. THE System SHALL embed schema_version in PDF metadata properties
5. THE System SHALL ensure metadata is extractable by standard PDF parsing libraries

### Requirement 22: Error Handling for Blueprint Generation

**User Story:** As a user, I want clear error messages when Blueprint generation fails, so that I can resolve issues.

#### Acceptance Criteria

1. WHEN AI Snapshot data is missing, THEN THE System SHALL return error "AI Snapshot required for Blueprint generation"
2. WHEN AI generation fails, THEN THE System SHALL retry with fallback prompts
3. WHEN all generation attempts fail, THEN THE System SHALL return error with support contact information
4. THE System SHALL log all generation errors for debugging
5. THE System SHALL ensure partial failures (e.g., PDF generation fails but JSON succeeds) are handled gracefully

### Requirement 23: Blueprint Versioning

**User Story:** As a system, I want to track Blueprint versions, so that users can regenerate or update blueprints over time.

#### Acceptance Criteria

1. THE System SHALL include version field in Blueprint_JSON (starting at "1.0")
2. WHEN a user regenerates Blueprint from same Snapshot, THEN THE System SHALL increment version number
3. THE System SHALL store all Blueprint versions for user access
4. THE System SHALL display version history in dashboard
5. THE System SHALL allow users to download any previous Blueprint version

### Requirement 24: Blueprint Branding Consistency

**User Story:** As a business, I want consistent branding across all Blueprint outputs, so that materials reflect Aivory's professional identity.

#### Acceptance Criteria

1. THE System SHALL use Aivory logo in PDF header
2. THE System SHALL use purple color theme (#7C3AED or similar) for PDF design elements
3. THE System SHALL use Inter Tight font family for all PDF text
4. THE System SHALL ensure PDF layout is clean, professional, and print-ready
5. THE System SHALL include Aivory contact information in PDF footer

### Requirement 25: Dashboard Access Control

**User Story:** As a system, I want to enforce access control for Blueprint dashboard, so that only authorized users can view blueprints.

#### Acceptance Criteria

1. WHEN a user accesses Blueprint dashboard, THEN THE System SHALL verify authentication
2. WHEN a user accesses specific Blueprint, THEN THE System SHALL verify ownership or super admin status
3. WHEN access is denied, THEN THE System SHALL return 403 Forbidden with clear message
4. THE System SHALL allow GrandMasterRCH super admin to access all user blueprints
5. THE System SHALL log all Blueprint access attempts for security audit
