# Requirements Document

## Introduction

Aivory is an AI readiness and operational diagnostics platform designed to help organizations understand their AI readiness, identify automation opportunities, and convert diagnostic insights into monetization paths. The system provides a complete web application experience with three core goals: (1) let users experience AI diagnostics through a quick 12-question assessment, (2) convert diagnostics into tiered monetization offerings, and (3) funnel serious users into automation build and consulting services. The platform uses a Python FastAPI backend with Mistral-7B-Instruct LLM for AI enrichment, running on localhost:8081, with graceful degradation ensuring the UI works even if AI processing fails.

## Glossary

- **Aivory_System**: The complete AI diagnostic platform including frontend, backend, and AI enrichment
- **Quick_Diagnostic**: A 12-question assessment that evaluates AI readiness in under 3 minutes
- **AI_Readiness_Score**: A normalized 0-100 score indicating organizational preparedness for AI adoption
- **Readiness_Category**: Classification of organizations into AI Unready (0-30), AI Curious (31-50), AI Ready (51-70), or AI Native (71-100)
- **AI_Enrichment**: Optional LLM-powered generation of insights, recommendations, and narratives
- **Readiness_Badge**: A downloadable visual representation of the user's AI readiness score
- **Tiered_Offerings**: Three monetization levels (Quick Snapshot $49, Operational Diagnostic $150, Deep Transformation Custom)
- **Mistral_LLM**: The mistralai/Mistral-7B-Instruct model used for AI enrichment
- **Graceful_Degradation**: System behavior that provides static content when AI enrichment fails
- **Homepage**: Landing page with headline, subtext, and three model cards for user journeys
- **Result_Page**: Page displaying AI readiness score, category, insights, recommendations, and badge

## Requirements

### Requirement 1: Homepage Display

**User Story:** As a visitor, I want to see a clear homepage with value proposition and entry points, so that I understand what Aivory offers and can choose my journey.

#### Acceptance Criteria

1. THE Homepage SHALL display the headline "Make AI Make Sense for Your Organization"
2. THE Homepage SHALL display the subtext "Diagnose how your organization really works. Identify where AI creates value. Decide what to build next."
3. THE Homepage SHALL display three model cards with titles and call-to-action buttons
4. THE Homepage SHALL provide a card for "AI Readiness Diagnostic" with a "Start Diagnostic" button
5. THE Homepage SHALL provide a card for "Build Automation with Aivory" with a "Build Automation Now" button
6. THE Homepage SHALL provide a card for "Design Your AI System" with a "Design My AI System" button
7. WHEN a user clicks a card button, THEN THE Aivory_System SHALL navigate to the corresponding section

### Requirement 2: Quick Diagnostic Question Flow

**User Story:** As a user, I want to answer 12 diagnostic questions in a Google Form style interface, so that I can quickly assess my organization's AI readiness.

#### Acceptance Criteria

1. THE Quick_Diagnostic SHALL present exactly 12 questions in sequence
2. THE Quick_Diagnostic SHALL display one question at a time with 4 answer options
3. THE Quick_Diagnostic SHALL include questions covering primary business objective, current AI usage, data availability, process documentation, workflow standardization, ERP integration, automation level, decision-making speed, leadership alignment, budget ownership, change readiness, and internal AI capability
4. WHEN a user selects an answer, THEN THE Quick_Diagnostic SHALL record the selection
5. WHEN a user completes all 12 questions, THEN THE Quick_Diagnostic SHALL submit answers to the backend
6. THE Quick_Diagnostic SHALL provide navigation to move between questions
7. THE Quick_Diagnostic SHALL indicate progress through the question set

### Requirement 3: Question Scoring Mapping

**User Story:** As a system, I want to map each answer option to a numeric score, so that I can calculate AI readiness objectively.

#### Acceptance Criteria

1. THE Aivory_System SHALL assign each answer option a score value of 0, 1, 2, or 3
2. THE Aivory_System SHALL ensure the maximum possible raw score is 36 (12 questions × 3 points)
3. THE Aivory_System SHALL store the scoring mapping in a configuration accessible to the backend
4. THE Aivory_System SHALL calculate the total raw score by summing all answer scores
5. THE Aivory_System SHALL normalize the raw score to a 0-100 scale using the formula: (raw_score / 36) × 100

### Requirement 4: Loading State Display

**User Story:** As a user, I want to see a loading state after submitting my answers, so that I know the system is processing my diagnostic.

#### Acceptance Criteria

1. WHEN the Quick_Diagnostic is submitted, THEN THE Aivory_System SHALL display a loading screen
2. THE Aivory_System SHALL show the message "AI is analyzing how your organization works…"
3. THE Aivory_System SHALL display an animated loader during processing
4. THE Aivory_System SHALL transition from loading state to Result_Page when processing completes
5. THE Aivory_System SHALL display the loading state for a minimum duration to ensure smooth user experience

### Requirement 5: Mandatory Scoring Logic

**User Story:** As a system, I want to calculate AI readiness scores deterministically, so that results are always available even if AI enrichment fails.

#### Acceptance Criteria

1. THE Aivory_System SHALL calculate the normalized AI_Readiness_Score from user answers
2. THE Aivory_System SHALL assign a Readiness_Category based on the score: 0-30 as "AI Unready", 31-50 as "AI Curious", 51-70 as "AI Ready", 71-100 as "AI Native"
3. THE Aivory_System SHALL provide a category explanation for each Readiness_Category
4. THE Aivory_System SHALL complete scoring logic without requiring LLM availability
5. WHEN the AI_Readiness_Score is calculated, THEN THE Aivory_System SHALL return the score and category immediately

### Requirement 6: AI Enrichment with Graceful Degradation

**User Story:** As a user, I want AI-generated insights and recommendations, so that I receive personalized guidance, but I want the system to work even if AI fails.

#### Acceptance Criteria

1. THE Aivory_System SHALL attempt to generate 3 short insights using the Mistral_LLM
2. THE Aivory_System SHALL attempt to generate 1 recommendation paragraph using the Mistral_LLM
3. THE Aivory_System SHALL attempt to assign a readiness narrative using the Mistral_LLM
4. WHEN the Mistral_LLM is unavailable or fails, THEN THE Aivory_System SHALL use static insights based on the Readiness_Category
5. WHEN the Mistral_LLM is unavailable or fails, THEN THE Aivory_System SHALL use static recommendations based on the Readiness_Category
6. THE Aivory_System SHALL complete the diagnostic flow and display results regardless of LLM availability
7. THE Aivory_System SHALL log AI enrichment failures without exposing errors to users

### Requirement 7: Result Page Display

**User Story:** As a user, I want to see my AI readiness results with score, insights, and recommendations, so that I understand my organization's AI maturity.

#### Acceptance Criteria

1. THE Result_Page SHALL display the AI_Readiness_Score as a prominent numeric value
2. THE Result_Page SHALL display the Readiness_Category label
3. THE Result_Page SHALL display a short explanation of the category
4. THE Result_Page SHALL display 3 bullet-point insights
5. THE Result_Page SHALL display a recommendation paragraph
6. THE Result_Page SHALL provide a downloadable Readiness_Badge
7. THE Result_Page SHALL include a hint about social sharing capabilities
8. THE Result_Page SHALL render all content even if AI enrichment failed

### Requirement 8: AI Readiness Badge Generation

**User Story:** As a user, I want to download a visual badge showing my AI readiness score, so that I can share my results or display them internally.

#### Acceptance Criteria

1. THE Aivory_System SHALL generate a Readiness_Badge image containing the AI_Readiness_Score
2. THE Readiness_Badge SHALL include the Readiness_Category label
3. THE Readiness_Badge SHALL use visual design consistent with the Aivory brand
4. WHEN a user clicks the download button, THEN THE Aivory_System SHALL provide the badge as a downloadable image file
5. THE Readiness_Badge SHALL be generated regardless of AI enrichment status

### Requirement 9: Tiered Offerings Display

**User Story:** As a user, I want to see monetization options after my diagnostic, so that I can choose deeper analysis or services that match my needs.

#### Acceptance Criteria

1. THE Aivory_System SHALL display three tiered offerings on the Result_Page or a dedicated offerings section
2. THE Aivory_System SHALL display "Quick AI Snapshot" at $49 with description of high-level diagnosis, score, category, and recommendations
3. THE Aivory_System SHALL display "Operational Diagnostic" at $150 with description of deeper workflow, data, and automation gap analysis with structured report
4. THE Aivory_System SHALL display "Deep AI Transformation" at custom/enterprise pricing with description of end-to-end diagnostic, roadmap, and implementation guidance
5. THE Aivory_System SHALL provide clear call-to-action buttons for each tier
6. WHEN a user clicks a tier button, THEN THE Aivory_System SHALL navigate to the appropriate purchase or contact flow

### Requirement 10: Build Automation Section

**User Story:** As a user interested in automation, I want to learn about building automation with Aivory, so that I can turn diagnostic insights into real implementations.

#### Acceptance Criteria

1. THE Aivory_System SHALL provide a "Build Automation Now" section accessible from the homepage
2. THE Aivory_System SHALL explain how diagnostics translate into workflow automation, AI agents, ERP integration, and decision support
3. THE Aivory_System SHALL display a call-to-action button "Build Automation with Aivory Team"
4. WHEN a user clicks the CTA, THEN THE Aivory_System SHALL navigate to a contact or consultation form
5. THE Aivory_System SHALL highlight the connection between diagnostic results and automation opportunities

### Requirement 11: Design Your AI System Section

**User Story:** As a user planning AI strategy, I want to design my AI system architecture, so that I can create a strategic roadmap based on diagnostic insights.

#### Acceptance Criteria

1. THE Aivory_System SHALL provide a "Design My AI System" section accessible from the homepage
2. THE Aivory_System SHALL explain strategic architecture planning using diagnostic signals
3. THE Aivory_System SHALL display a call-to-action button "Design My AI System"
4. WHEN a user clicks the CTA, THEN THE Aivory_System SHALL navigate to a contact or consultation form
5. THE Aivory_System SHALL emphasize architecture and roadmap focus

### Requirement 12: Contact and Consultation Form

**User Story:** As a user ready for consultation, I want to submit my information and needs, so that the Aivory team can contact me about services.

#### Acceptance Criteria

1. THE Aivory_System SHALL provide a contact form with fields for Name, Company, Email, and "What do you want to build?"
2. THE Aivory_System SHALL validate that all required fields are completed before submission
3. WHEN a user submits the form, THEN THE Aivory_System SHALL send the information to the backend
4. THE Aivory_System SHALL display a confirmation message after successful submission
5. THE Aivory_System SHALL provide a call-to-action "Contact Our Team for Full Consultation"
6. WHEN form submission fails, THEN THE Aivory_System SHALL display an error message and allow retry

### Requirement 13: FastAPI Backend Infrastructure

**User Story:** As a developer, I want a well-structured FastAPI backend, so that the system has a solid foundation for API endpoints and business logic.

#### Acceptance Criteria

1. THE Aivory_System SHALL provide a FastAPI application running on localhost:8081
2. THE Aivory_System SHALL organize code into logical modules for routes, services, models, and LLM integration
3. THE Aivory_System SHALL use Python type hints throughout the codebase
4. THE Aivory_System SHALL provide health check endpoints for service monitoring
5. THE Aivory_System SHALL serve static frontend files or provide API endpoints for frontend consumption

### Requirement 14: Mistral LLM Integration

**User Story:** As a system, I want to integrate with Mistral-7B-Instruct LLM, so that I can generate personalized insights and recommendations.

#### Acceptance Criteria

1. THE Aivory_System SHALL connect to mistralai/Mistral-7B-Instruct model
2. THE Aivory_System SHALL send prompts to the Mistral_LLM for insight generation
3. THE Aivory_System SHALL send prompts to the Mistral_LLM for recommendation generation
4. WHEN the Mistral_LLM is unavailable, THEN THE Aivory_System SHALL handle the failure gracefully without crashing
5. THE Aivory_System SHALL implement timeout handling for LLM requests
6. THE Aivory_System SHALL parse LLM responses into structured data for frontend consumption

### Requirement 15: API Endpoints for Diagnostic Flow

**User Story:** As a frontend, I want REST API endpoints for the diagnostic flow, so that I can submit answers and retrieve results.

#### Acceptance Criteria

1. THE Aivory_System SHALL provide a POST endpoint to submit Quick_Diagnostic answers
2. THE Aivory_System SHALL provide a GET endpoint to retrieve diagnostic results by session or user ID
3. WHEN diagnostic answers are submitted, THEN THE Aivory_System SHALL calculate scores, attempt AI enrichment, and return results
4. THE Aivory_System SHALL return results in JSON format with score, category, insights, and recommendations
5. THE Aivory_System SHALL use appropriate HTTP status codes for success and error responses

### Requirement 16: API Endpoints for Contact Form

**User Story:** As a frontend, I want a REST API endpoint for contact form submission, so that I can send user consultation requests to the backend.

#### Acceptance Criteria

1. THE Aivory_System SHALL provide a POST endpoint to submit contact form data
2. THE Aivory_System SHALL validate contact form data including Name, Company, Email, and message
3. WHEN contact form data is submitted, THEN THE Aivory_System SHALL store or forward the information
4. THE Aivory_System SHALL return a success response after processing the contact form
5. WHEN validation fails, THEN THE Aivory_System SHALL return error details with appropriate HTTP status code

### Requirement 17: Data Models and Validation

**User Story:** As a developer, I want well-defined data models, so that data flows consistently between frontend and backend.

#### Acceptance Criteria

1. THE Aivory_System SHALL define Pydantic models for diagnostic answers, scores, insights, and recommendations
2. THE Aivory_System SHALL define Pydantic models for contact form data
3. THE Aivory_System SHALL validate all incoming data against model schemas
4. WHEN invalid data is provided, THEN THE Aivory_System SHALL return validation errors with field-level details
5. THE Aivory_System SHALL ensure type safety throughout the data pipeline

### Requirement 18: Error Handling and Resilience

**User Story:** As a user, I want the system to work reliably even when components fail, so that I always receive value from the diagnostic.

#### Acceptance Criteria

1. WHEN the Mistral_LLM is unavailable, THEN THE Aivory_System SHALL use static fallback content
2. WHEN invalid input is provided, THEN THE Aivory_System SHALL return clear validation error messages
3. WHEN an unexpected error occurs, THEN THE Aivory_System SHALL log the error and return a user-friendly message
4. THE Aivory_System SHALL use appropriate HTTP status codes for different error types
5. THE Aivory_System SHALL ensure the UI renders and functions even when backend errors occur

### Requirement 19: Frontend User Experience

**User Story:** As a user, I want a smooth, professional web application experience, so that I feel confident in Aivory as a SaaS product.

#### Acceptance Criteria

1. THE Aivory_System SHALL provide a responsive web interface that works on desktop and mobile devices
2. THE Aivory_System SHALL use consistent visual design across all pages and sections
3. THE Aivory_System SHALL provide smooth transitions between pages and states
4. THE Aivory_System SHALL complete the diagnostic flow in under 3 minutes for typical users
5. THE Aivory_System SHALL feel like a real SaaS product without placeholder content or CLI instructions

### Requirement 20: Static Fallback Content

**User Story:** As a system, I want predefined static content for each readiness category, so that I can provide value even when AI enrichment fails.

#### Acceptance Criteria

1. THE Aivory_System SHALL define static insights for each Readiness_Category (AI Unready, AI Curious, AI Ready, AI Native)
2. THE Aivory_System SHALL define static recommendations for each Readiness_Category
3. THE Aivory_System SHALL define static narratives for each Readiness_Category
4. WHEN AI enrichment fails, THEN THE Aivory_System SHALL select static content matching the user's Readiness_Category
5. THE Aivory_System SHALL ensure static content is professional and actionable
