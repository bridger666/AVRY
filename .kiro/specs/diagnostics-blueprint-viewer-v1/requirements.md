# Requirements Document

## Introduction

This document specifies the requirements for implementing Diagnostics v1 and Blueprint Viewer v1 features in the Next.js Aivory application. These features form the core product flow: Diagnostics → AI System Blueprint → Workflows. The implementation focuses on a form-based assessment tool and a JSON viewer with clean UI, both using static/sample data for v1.

## Glossary

- **Diagnostic_System**: The form-based assessment tool that collects business context, pain points, data readiness, and strategic goals
- **Blueprint_Viewer**: The interactive viewer that displays AI System Blueprint JSON in a structured, readable format
- **AI_Readiness_Score**: A numerical score (0-100) indicating an organization's readiness for AI implementation
- **Maturity_Level**: A categorical assessment (e.g., "Emerging", "Developing", "Advanced") of AI adoption readiness
- **Workflow_Module**: A discrete automation workflow defined in the blueprint with triggers, steps, and integrations
- **System_Architecture**: The technical layers of the AI system including data sources, processing, decision engine, memory, and execution
- **Blueprint_JSON**: The structured data format containing diagnostic summary, architecture, workflows, risks, and deployment plan
- **Phase**: A logical grouping of related diagnostic questions (Business Context, Operational Pain Points, Data Readiness, Strategic Goals)
- **Next.js_Console**: The Next.js 14 application using App Router, TypeScript, and pure CSS (no Tailwind)

## Requirements

### Requirement 1: Diagnostics Page Structure

**User Story:** As a user, I want to access a structured diagnostic assessment, so that I can provide information about my business before generating an AI blueprint.

#### Acceptance Criteria

1. WHEN a user navigates to /diagnostics, THE Diagnostic_System SHALL display a page with header section containing title "AI Readiness Diagnostic" and a 1-2 line description
2. THE Diagnostic_System SHALL organize the assessment into four phases displayed as separate card sections on a single page
3. THE Diagnostic_System SHALL display Phase A (Business Context) with fields for industry, revenue model, channels, and tools
4. THE Diagnostic_System SHALL display Phase B (Operational Pain Points) with fields for time waste, manual processes, and delays
5. THE Diagnostic_System SHALL display Phase C (Data & Automation Readiness) with fields for CRM, structured data, and APIs/integrations
6. THE Diagnostic_System SHALL display Phase D (Strategic Goals) with fields for objectives, KPIs, and timeline
7. WHEN displaying each phase, THE Diagnostic_System SHALL include a card title and helper text
8. THE Diagnostic_System SHALL use clean form fields including text inputs, textareas, and select dropdowns

### Requirement 2: Diagnostic Summary and Score

**User Story:** As a user, I want to see a summary of my diagnostic assessment, so that I understand my AI readiness before proceeding to blueprint generation.

#### Acceptance Criteria

1. WHEN all diagnostic phases are displayed, THE Diagnostic_System SHALL show a summary card at the bottom of the page
2. THE Diagnostic_System SHALL display a placeholder AI_Readiness_Score in the summary card
3. THE Diagnostic_System SHALL display a placeholder Maturity_Level in the summary card
4. THE Diagnostic_System SHALL include a primary CTA button labeled "Generate AI System Blueprint" in the summary card
5. WHEN the "Generate AI System Blueprint" button is clicked, THE Diagnostic_System SHALL navigate to /blueprint with a sample data flag

### Requirement 3: Diagnostic Data Management

**User Story:** As a developer, I want diagnostic data structured for future backend integration, so that the v1 implementation can be easily upgraded.

#### Acceptance Criteria

1. THE Diagnostic_System SHALL store diagnostic form data in client-side state during user interaction
2. THE Diagnostic_System SHALL structure diagnostic data with properties: diagnostic.business, diagnostic.operations, diagnostic.data_readiness, and diagnostic.objectives
3. THE Diagnostic_System SHALL use hardcoded values for AI_Readiness_Score and Maturity_Level in v1
4. THE Diagnostic_System SHALL prepare data structure compatible with future backend API integration

### Requirement 4: Diagnostics Visual Design

**User Story:** As a user, I want the diagnostics page to match the existing application aesthetic, so that I have a consistent experience.

#### Acceptance Criteria

1. THE Diagnostic_System SHALL use the same color palette as the dashboard and console (dark warm background #1e1d1a)
2. THE Diagnostic_System SHALL use Inter Tight font family with weights 300, 400, 500, and 600
3. THE Diagnostic_System SHALL display form elements with simple card layouts and subtle borders
4. THE Diagnostic_System SHALL be fully responsive on desktop and mobile devices
5. THE Diagnostic_System SHALL avoid "test" labels and maintain a production-ready appearance

### Requirement 5: Blueprint Viewer Page Structure

**User Story:** As a user, I want to view my AI System Blueprint in a clear, organized format, so that I can understand the proposed AI architecture and workflows.

#### Acceptance Criteria

1. WHEN a user navigates to /blueprint, THE Blueprint_Viewer SHALL display a page with header section showing "AI System Blueprint" title
2. THE Blueprint_Viewer SHALL display subtitle with Blueprint ID, Version, and Status
3. THE Blueprint_Viewer SHALL display pills showing Maturity_Level and Estimated ROI
4. THE Blueprint_Viewer SHALL render an Executive Summary card showing primary goal, AI_Readiness_Score, Maturity_Level, and top 2-3 constraints
5. WHEN coming from the Diagnostic_System, THE Blueprint_Viewer SHALL display a banner stating "This is a sample AI System Blueprint..."

### Requirement 6: Blueprint Architecture Display

**User Story:** As a user, I want to see the system architecture layers, so that I understand how the AI system is structured.

#### Acceptance Criteria

1. THE Blueprint_Viewer SHALL display a "System Architecture" section with a title
2. THE Blueprint_Viewer SHALL render architecture layers as a vertical list including Data Sources, Processing Layers, Decision Engine, Memory Layer, and Execution Layer
3. WHEN displaying each architecture layer, THE Blueprint_Viewer SHALL show it as a card with title, items list, and description
4. THE Blueprint_Viewer SHALL extract architecture data from Blueprint_JSON structure

### Requirement 7: Blueprint Workflow Modules Display

**User Story:** As a user, I want to see the workflow modules defined in my blueprint, so that I understand what automation workflows are proposed.

#### Acceptance Criteria

1. THE Blueprint_Viewer SHALL display a "Workflow Modules" section with a title
2. THE Blueprint_Viewer SHALL render each Workflow_Module as a card showing name, trigger, steps list, and required integrations
3. THE Blueprint_Viewer SHALL include Edit and Simulate buttons for each workflow (disabled in v1)
4. THE Blueprint_Viewer SHALL include a Deploy button that links to /workflows
5. THE Blueprint_Viewer SHALL extract workflow data from Blueprint_JSON.workflow_modules array

### Requirement 8: Blueprint Risk and Deployment Display

**User Story:** As a user, I want to see risk assessment and deployment planning information, so that I understand implementation considerations.

#### Acceptance Criteria

1. THE Blueprint_Viewer SHALL display a "Risk & Deployment" section
2. THE Blueprint_Viewer SHALL render two cards side-by-side on desktop and stacked on mobile
3. THE Blueprint_Viewer SHALL display a Risk & Governance card showing data_risks and fallback_strategy from Blueprint_JSON
4. THE Blueprint_Viewer SHALL display a Deployment Plan card showing phase, estimated_impact, and estimated_roi_months from Blueprint_JSON

### Requirement 9: Blueprint Data Structure

**User Story:** As a developer, I want the blueprint data structured according to specification, so that the viewer can render all required information.

#### Acceptance Criteria

1. THE Blueprint_Viewer SHALL expect Blueprint_JSON with properties: blueprint_id, version, organization, diagnostic_summary, strategic_objective, system_architecture, workflow_modules, risk_assessment, and deployment_plan
2. THE Blueprint_Viewer SHALL use sample/dummy Blueprint_JSON data for v1 implementation
3. THE Blueprint_Viewer SHALL structure data for future backend API integration
4. WHEN Blueprint_JSON is missing or invalid, THE Blueprint_Viewer SHALL display an error state

### Requirement 10: Blueprint Visual Design

**User Story:** As a user, I want the blueprint viewer to match the existing application aesthetic, so that I have a consistent experience.

#### Acceptance Criteria

1. THE Blueprint_Viewer SHALL use the same color palette as the dashboard and console (dark warm background #1e1d1a)
2. THE Blueprint_Viewer SHALL use Inter Tight font family with weights 300, 400, 500, and 600
3. THE Blueprint_Viewer SHALL display content with card layouts, subtle borders, and generous spacing
4. THE Blueprint_Viewer SHALL be fully responsive on desktop and mobile devices
5. THE Blueprint_Viewer SHALL avoid "test" labels and maintain a production-ready appearance

### Requirement 11: Navigation Integration

**User Story:** As a user, I want to navigate between diagnostics, blueprint, and other pages, so that I can move through the product flow.

#### Acceptance Criteria

1. THE Next.js_Console SHALL include /diagnostics route accessible from the dashboard
2. THE Next.js_Console SHALL include /blueprint route accessible from diagnostics and dashboard
3. WHEN on the diagnostics page, THE Diagnostic_System SHALL provide navigation to /blueprint via the "Generate AI System Blueprint" button
4. WHEN on the blueprint page, THE Blueprint_Viewer SHALL provide navigation to /workflows via the Deploy button
5. THE Next.js_Console SHALL maintain the existing sidebar navigation with new routes added

### Requirement 12: Technical Implementation Standards

**User Story:** As a developer, I want the implementation to follow established technical standards, so that the code is maintainable and consistent.

#### Acceptance Criteria

1. THE Next.js_Console SHALL use Next.js 14 App Router for all routing
2. THE Next.js_Console SHALL use TypeScript for all components and pages
3. THE Next.js_Console SHALL use pure CSS with CSS modules (no Tailwind, no UI libraries)
4. THE Next.js_Console SHALL reuse design tokens and CSS patterns from existing dashboard and console implementations
5. THE Next.js_Console SHALL implement fully responsive layouts that work on desktop and mobile devices
6. THE Next.js_Console SHALL structure components for future backend API integration without requiring major refactoring
