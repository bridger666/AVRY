# Requirements Document: Aivory Complete System

## Introduction

The Aivory Complete System is a unified 4-tier AI diagnostic and operating partner platform that guides businesses from initial assessment through full AI system deployment. The system provides progressive value through Free Diagnostic (rule-based), AI Snapshot ($15), Deep Diagnostic ($99), and AI Operating Partner (subscription tiers). The platform must maintain existing functionality while adding new capabilities, support multilingual operations, and operate in prototype mode without authentication or payment processing.

## Glossary

- **System**: The complete Aivory platform including all four tiers
- **Free_Diagnostic**: Rule-based assessment tool (existing functionality)
- **AI_Snapshot**: $15 LLM-powered diagnostic with 30-question assessment
- **Deep_Diagnostic**: $99 LLM-powered blueprint generation service
- **AI_Operating_Partner**: Subscription-based workflow execution and monitoring service
- **Dashboard**: Unified interface displaying different modes (free, snapshot, blueprint, operate)
- **Blueprint**: Detailed AI system architecture and deployment plan
- **Workflow**: Automated business process represented in A-to-A pseudo-code
- **Readiness_Score**: Numerical assessment of AI implementation readiness
- **Sumopod**: External LLM API service for AI-powered diagnostics
- **A-to-A_Pseudo_Code**: Agent-to-Agent structured format for workflow representation
- **Intelligence_Credit**: Unit of measurement for AI operation consumption
- **Tier**: Subscription level (Builder, Operator, Enterprise)

## Requirements

### Requirement 1: Environment Configuration Management

**User Story:** As a system administrator, I want secure API key management through environment variables, so that sensitive credentials are never exposed in code.

#### Acceptance Criteria

1. THE System SHALL load configuration from .env.local file using python-dotenv
2. THE System SHALL require SUMOPOD_API_KEY and SUMOPOD_BASE_URL environment variables
3. THE System SHALL reject requests IF environment variables are missing
4. THE System SHALL NOT include hardcoded API keys in any source files
5. WHEN environment variables are loaded, THE System SHALL validate their format before use

### Requirement 2: Free Diagnostic Preservation

**User Story:** As a product owner, I want the existing free diagnostic to remain unchanged, so that current users experience no disruption.

#### Acceptance Criteria

1. THE System SHALL maintain endpoint POST /api/v1/diagnostic/run for free diagnostics
2. THE Free_Diagnostic SHALL use rule-based scoring without Sumopod API calls
3. WHEN free diagnostic completes, THE System SHALL return score, category, basic insights, and downloadable readiness score
4. THE Dashboard SHALL display free diagnostic results WHEN mode=free
5. THE System SHALL NOT modify homepage layout during implementation

### Requirement 3: AI Snapshot Implementation

**User Story:** As a business user, I want a $15 AI-powered snapshot diagnostic, so that I can get deeper insights than the free version.

#### Acceptance Criteria

1. THE System SHALL provide endpoint POST /api/v1/diagnostic/snapshot for AI Snapshot
2. THE AI_Snapshot SHALL require exactly 30 questions including business objective question
3. THE AI_Snapshot SHALL use deepseek-v3-2-251201 as primary model
4. IF deepseek-v3-2-251201 fails, THEN THE System SHALL fallback to kimi-k2-250905
5. THE AI_Snapshot SHALL return strict JSON containing: readiness_score, readiness_level, executive_summary, business_objective_detected, key_gaps, automation_opportunities, recommended_system_outline, priority_actions, upgrade_recommendation
6. THE Dashboard SHALL display snapshot results WHEN mode=snapshot
7. THE Dashboard SHALL show before/after comparison with free diagnostic results
8. THE Dashboard SHALL include "Run Deep Diagnostic - $99" upgrade button
9. THE AI_Snapshot SHALL complete within 2-5 seconds
10. THE System SHALL generate downloadable PDF report for snapshot results

### Requirement 4: Deep Diagnostic Blueprint Generation

**User Story:** As a business user, I want a $99 deep diagnostic that generates a complete AI system blueprint, so that I have a clear implementation roadmap.

#### Acceptance Criteria

1. THE System SHALL provide endpoint POST /api/v1/diagnostic/deep for Deep Diagnostic
2. THE Deep_Diagnostic SHALL use glm-4-7-251222 model
3. THE Deep_Diagnostic SHALL return strict JSON containing: executive_summary, system_overview (system_name, description, confidence_level), workflow_architecture (trigger, steps, tools_suggested), agent_structure (agent_name, role, responsibilities), expected_impact (automation_potential_percent, estimated_time_saved_hours_per_week, projected_roi), deployment_complexity, recommended_subscription_tier
4. THE Dashboard SHALL display blueprint results WHEN mode=blueprint
5. THE Dashboard SHALL render sections: Executive Summary, System Overview, Workflow Architecture, Agent Structure, Expected Impact, Deploy CTA
6. THE System SHALL generate downloadable Blueprint PDF with premium layout
7. THE Deep_Diagnostic SHALL complete within 5-12 seconds
8. THE Blueprint SHALL use A-to-A pseudo-code format for workflow representation
9. THE Blueprint SHALL NOT mention specific tools (n8n, Claude, Make, Zapier)

### Requirement 5: Unified Dashboard System

**User Story:** As a user, I want a single dashboard that adapts to different diagnostic modes, so that I have a consistent experience across all tiers.

#### Acceptance Criteria

1. THE System SHALL provide single route /dashboard for all modes
2. THE Dashboard SHALL support modes: free, snapshot, blueprint, operate
3. THE Dashboard SHALL dynamically switch content based on mode parameter
4. THE Dashboard SHALL NOT require user authentication
5. THE Dashboard SHALL use local state for tier selection (null, "builder", "operator", "enterprise")
6. THE Dashboard SHALL maintain Inter Tight font throughout
7. THE Dashboard SHALL use Apple-style rounded buttons (border-radius: 9999px)
8. THE Dashboard SHALL use solid colors only
9. THE Dashboard SHALL display progress bars in color #07d197
10. THE Dashboard SHALL include downloadable readiness scoring for all modes

### Requirement 6: AI Operating Partner Subscription Tiers

**User Story:** As a business user, I want subscription-based AI operating partner tiers, so that I can choose the service level that matches my needs.

#### Acceptance Criteria

1. THE System SHALL provide three subscription tiers: Builder, Operator, Enterprise
2. THE Builder_Tier SHALL include: $199/month, 3 workflows, 2,500 executions, 50 intelligence credits
3. THE Operator_Tier SHALL include: $499/month, 10 workflows, 10,000 executions, 300 intelligence credits
4. THE Enterprise_Tier SHALL include: $1,200+/month, unlimited workflows, 50,000 executions, 2,000 intelligence credits
5. THE Dashboard SHALL display tier information WHEN mode=operate
6. THE Dashboard SHALL show sections: Tier Overview, Workflow Panel, Execution Monitor, Intelligence Credit Meter, Orchestration Status, Upgrade Panel
7. THE System SHALL enforce tier limits using local state only (prototype mode)
8. THE System SHALL NOT integrate real payment processing (Stripe)

### Requirement 7: Workflow Deployment Flow

**User Story:** As a user, I want to deploy blueprints as workflows, so that I can transition from planning to execution.

#### Acceptance Criteria

1. WHEN viewing blueprint mode, THE Dashboard SHALL display "Deploy This System" button
2. WHEN user clicks deploy, THE System SHALL prompt tier selection
3. WHEN tier is selected, THE System SHALL convert blueprint pseudo-code to workflow card
4. THE System SHALL add workflow card to Workflow Panel
5. THE System SHALL simulate workflow execution (no real n8n execution)
6. THE Workflow SHALL be stored in local state only

### Requirement 8: A-to-A Pseudo Code Layer

**User Story:** As a system architect, I want blueprints in A-to-A pseudo-code format, so that AI agents can interpret and execute workflows without tool-specific dependencies.

#### Acceptance Criteria

1. THE Blueprint SHALL output structured pseudo-code in A-to-A format
2. THE A-to-A_Pseudo_Code SHALL use format: TRIGGER → IF/ELSE → ROUTE TO agents
3. THE Blueprint SHALL NOT reference specific tools (n8n, Claude, Make, Zapier)
4. THE System SHALL store A-to-A pseudo-code internally for future decoder
5. THE A-to-A_Pseudo_Code SHALL be readable by AI agents

### Requirement 9: Multilingual Support

**User Story:** As an international user, I want the system to support English and Indonesian languages, so that I can use the platform in my preferred language.

#### Acceptance Criteria

1. THE System SHALL support English and Indonesian languages
2. WHEN language is "id", THE System SHALL append "Generate output in Indonesian" to LLM prompts
3. WHEN language is "en", THE System SHALL generate output in English
4. THE Dashboard SHALL auto-switch text based on language state
5. THE System SHALL maintain language preference across dashboard modes

### Requirement 10: Downloadable Reports

**User Story:** As a user, I want to download diagnostic reports, so that I can share results with stakeholders.

#### Acceptance Criteria

1. THE Free_Diagnostic SHALL generate simple readiness score PDF
2. THE AI_Snapshot SHALL generate structured readiness summary PDF
3. THE Deep_Diagnostic SHALL generate full AI System Blueprint PDF with premium layout
4. THE System SHALL include all relevant data in downloadable reports
5. THE Reports SHALL maintain brand styling (Inter Tight font, brand colors)

### Requirement 11: Error Handling and Resilience

**User Story:** As a system operator, I want robust error handling, so that the system remains stable under failure conditions.

#### Acceptance Criteria

1. IF LLM returns invalid JSON, THEN THE System SHALL retry once with "Return STRICT JSON only" instruction
2. IF retry fails, THEN THE System SHALL return user-friendly error message
3. THE System SHALL NOT crash server on LLM failures
4. THE System SHALL implement timeout handling for all LLM requests
5. THE System SHALL log errors for debugging without exposing sensitive data to users
6. WHEN Sumopod API is unavailable, THE System SHALL return appropriate error message

### Requirement 12: Performance Requirements

**User Story:** As a user, I want fast diagnostic responses, so that I can make decisions quickly.

#### Acceptance Criteria

1. THE AI_Snapshot SHALL complete within 2-5 seconds
2. THE Deep_Diagnostic SHALL complete within 5-12 seconds
3. THE System SHALL implement timeout handling for requests exceeding expected duration
4. THE Dashboard SHALL display loading indicators during processing
5. THE System SHALL optimize LLM prompt size for faster responses

### Requirement 13: Design System Consistency

**User Story:** As a designer, I want consistent visual design across all tiers, so that users have a cohesive brand experience.

#### Acceptance Criteria

1. THE System SHALL use Inter Tight font throughout all interfaces
2. THE System SHALL use Apple-style rounded buttons with border-radius: 9999px
3. THE System SHALL use solid colors only (no gradients)
4. THE System SHALL use #07d197 for progress bars
5. THE System SHALL use #4020a5 for brand purple
6. THE System SHALL use #3c229f for button purple
7. THE System SHALL maintain existing homepage layout without modifications

### Requirement 14: User Flow Integration

**User Story:** As a user, I want seamless transitions between diagnostic tiers, so that I can progressively upgrade my assessment.

#### Acceptance Criteria

1. THE System SHALL support flow: Homepage → Free Diagnostic → Dashboard (Free)
2. THE System SHALL support flow: Homepage → AI Snapshot → Dashboard (Snapshot Mode)
3. THE System SHALL support flow: Homepage → Deep Diagnostic → Dashboard (Blueprint Mode)
4. THE System SHALL support flow: Blueprint → Deploy → Choose Tier → Operating Partner Dashboard
5. THE Dashboard SHALL provide clear upgrade paths between tiers
6. THE System SHALL preserve diagnostic data when transitioning between modes

### Requirement 15: Prototype Mode Enforcement

**User Story:** As a developer, I want the system to operate in prototype mode, so that we can validate functionality before implementing authentication and payments.

#### Acceptance Criteria

1. THE System SHALL NOT require user authentication for any feature
2. THE System SHALL NOT integrate Stripe payment processing
3. THE System SHALL use local state for all tier selections
4. THE System SHALL simulate workflow executions without real n8n integration
5. THE System SHALL clearly indicate prototype status in documentation
