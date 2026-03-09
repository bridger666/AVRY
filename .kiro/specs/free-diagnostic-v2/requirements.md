# Requirements Document: Free Diagnostic v2

## Introduction

The Free Diagnostic v2 is a complete rebuild of the legacy 12-question AI readiness assessment, implemented as a modern Next.js application. This feature serves as the entry-level diagnostic product that assesses an organization's AI readiness across 12 key dimensions and produces a scoring card with actionable insights. It acts as a gateway to the more comprehensive Deep Diagnostic and AI System Blueprint offerings.

## Glossary

- **Free_Diagnostic**: The 12-question AI readiness assessment that produces a maturity score
- **Deep_Diagnostic**: The multi-phase comprehensive diagnostic flow (existing feature)
- **Scoring_Card**: The visual result display showing score, maturity level, and key insights
- **VPS_Bridge**: The backend service that handles diagnostic scoring and AI enrichment
- **Maturity_Level**: A categorical assessment (e.g., "Developing", "Emerging", "Advanced")
- **Question_Card**: A single-question UI component displayed one at a time
- **Progress_Indicator**: Visual feedback showing completion percentage and question number
- **Dashboard**: The main user landing page showing diagnostic status and CTAs
- **Diagnostics_Hub**: The /diagnostics page showing both Free and Deep diagnostic options

## Requirements

### Requirement 1: Free Diagnostic Question Flow

**User Story:** As a user, I want to complete a 12-question AI readiness assessment one question at a time, so that I can understand my organization's AI maturity without feeling overwhelmed.

#### Acceptance Criteria

1. WHEN a user navigates to /diagnostics/free, THE System SHALL display the first question card with 4 answer options
2. WHEN a user selects an answer option, THE System SHALL visually indicate the selection with a clear selected state
3. WHEN a user hovers over an answer option, THE System SHALL display a hover state with background change
4. WHEN a user clicks Next without selecting an answer, THE System SHALL display an inline validation error and prevent navigation
5. WHEN a user clicks Next with a valid selection, THE System SHALL save the answer and advance to the next question
6. WHEN a user clicks Previous, THE System SHALL navigate to the previous question and restore the previously selected answer
7. WHEN a user is on question 1, THE System SHALL disable the Previous button with proper disabled styling
8. WHEN a user completes all 12 questions and clicks Submit, THE System SHALL call the VPS Bridge scoring endpoint and navigate to the results page

### Requirement 2: Progress Tracking and Navigation

**User Story:** As a user, I want to see clear progress through the diagnostic, so that I know how far I've come and how much remains.

#### Acceptance Criteria

1. THE System SHALL display a progress bar showing completion percentage from 0% to 100%
2. THE System SHALL display a text label showing "Question X of 12" where X is the current question number
3. WHEN a user advances to a new question, THE System SHALL update both the progress bar and question counter
4. THE System SHALL persist answer selections when navigating backward and forward
5. WHEN a user navigates backward, THE System SHALL maintain all previously selected answers

### Requirement 3: VPS Bridge Integration for Scoring

**User Story:** As a user, I want my diagnostic answers to be scored accurately, so that I receive meaningful insights about my AI readiness.

#### Acceptance Criteria

1. WHEN a user submits the diagnostic, THE System SHALL send a POST request to /diagnostics/free/run with organization_id and answers object
2. THE System SHALL format answers as { question_id: option_index } where option_index is 0-3
3. WHEN the VPS Bridge is processing, THE System SHALL display a loading state to the user
4. WHEN the VPS Bridge returns a response, THE System SHALL extract score, maturity_level, strengths, blockers, opportunities, and narrative
5. THE System SHALL store the diagnostic results in localStorage for dashboard display
6. IF the VPS Bridge request fails, THEN THE System SHALL display an error message and allow the user to retry

### Requirement 4: Results Display and Scoring Card

**User Story:** As a user, I want to see my AI readiness score and personalized insights, so that I understand my current state and next steps.

#### Acceptance Criteria

1. WHEN a user reaches /diagnostics/free/result, THE System SHALL display a scoring card with the AI readiness score out of 100
2. THE System SHALL display the maturity level label (e.g., "Maturity: Developing")
3. THE System SHALL display three bullet points showing strengths, biggest blocker, and biggest opportunity
4. THE System SHALL display a narrative section with 1-2 paragraphs in a warm consultant tone
5. THE System SHALL include a primary CTA button "Continue to Deep Diagnostic" linking to /diagnostics
6. THE System SHALL include a secondary CTA button "See how AI System Blueprint works" linking to /blueprint
7. THE System SHALL include stub buttons for "Download Scoring Card" and "Copy Summary" (functional implementation optional for v1)

### Requirement 5: Diagnostics Hub Integration

**User Story:** As a user, I want to see both Free and Deep diagnostic options clearly separated, so that I can choose the appropriate assessment for my needs.

#### Acceptance Criteria

1. WHEN a user navigates to /diagnostics, THE System SHALL display two distinct sections: Free Diagnostic and Deep Diagnostic
2. THE Free_Diagnostic section SHALL include a description: "12 quick questions to check your AI readiness and get a scoring card"
3. WHEN the user has not completed the Free Diagnostic, THE System SHALL display a CTA "Start Free Diagnostic" linking to /diagnostics/free
4. WHEN the user has completed the Free Diagnostic, THE System SHALL display their last score and a "View Results" button
5. THE Deep_Diagnostic section SHALL include a description: "Multi-phase deep dive to prepare your AI System Blueprint"
6. THE Deep_Diagnostic section SHALL display appropriate CTAs based on completion status

### Requirement 6: Dashboard Integration

**User Story:** As a user, I want to see my diagnostic status on the dashboard, so that I can quickly access my results or continue where I left off.

#### Acceptance Criteria

1. WHEN a user has not completed the Free Diagnostic, THE Dashboard SHALL display a CTA "Start Free Diagnostic"
2. WHEN a user has completed the Free Diagnostic, THE Dashboard SHALL display their last score and a "View Results" button
3. THE Dashboard SHALL include a secondary CTA for "Deep Diagnostic"
4. WHEN a user clicks "View Results", THE System SHALL navigate to /diagnostics/free/result with the stored results

### Requirement 7: Visual Design and Styling

**User Story:** As a user, I want the diagnostic interface to match the modern Aivory console aesthetic, so that I have a cohesive and professional experience.

#### Acceptance Criteria

1. THE System SHALL use the dark warm background color #1e1d1a
2. THE System SHALL use Inter Tight font family throughout the diagnostic interface
3. THE System SHALL use rounded cards with soft borders and subtle shadows only
4. THE System SHALL avoid neon colors, glow effects, and flashy gradients
5. THE System SHALL provide ample breathing room and clear visual hierarchy
6. THE System SHALL use pure CSS with CSS modules (no Tailwind or UI libraries)
7. THE System SHALL match the GPT/Manus/Perplexity console visual language

### Requirement 8: Question Content and Structure

**User Story:** As a user, I want to answer questions about my organization's AI readiness across key dimensions, so that I receive an accurate assessment.

#### Acceptance Criteria

1. THE System SHALL present exactly 12 questions in a fixed order
2. EACH question SHALL have exactly 4 answer options representing a maturity spectrum
3. THE System SHALL include questions covering: business_objective, current_ai_usage, data_availability, process_documentation, workflow_standardization, erp_integration, automation_level, decision_speed, leadership_alignment, budget_ownership, change_readiness, and internal_capability
4. EACH answer option SHALL represent a progression from low maturity (option 0) to high maturity (option 3)
5. THE System SHALL use clear, concise question text that works well in English, Indonesian, and Arabic

### Requirement 9: Data Persistence and State Management

**User Story:** As a user, I want my diagnostic progress and results to be saved, so that I can return to them later without losing my work.

#### Acceptance Criteria

1. THE System SHALL store in-progress answers in component state during the diagnostic flow
2. WHEN a diagnostic is completed, THE System SHALL store the full results in localStorage
3. THE System SHALL store the diagnostic_id, score, maturity_level, and timestamp
4. WHEN a user returns to the dashboard, THE System SHALL retrieve and display the most recent diagnostic results from localStorage
5. THE System SHALL handle cases where localStorage is unavailable or cleared gracefully

### Requirement 10: Error Handling and Loading States

**User Story:** As a user, I want clear feedback when the system is processing or when errors occur, so that I understand what's happening and what to do next.

#### Acceptance Criteria

1. WHEN the VPS Bridge is processing the diagnostic, THE System SHALL display a loading spinner or progress indicator
2. IF the VPS Bridge request fails, THEN THE System SHALL display a user-friendly error message
3. IF the VPS Bridge request fails, THEN THE System SHALL provide a "Retry" button
4. WHEN validation errors occur, THE System SHALL display inline error messages near the relevant input
5. THE System SHALL log errors to the browser console for debugging purposes without exposing sensitive information

### Requirement 11: Accessibility and Interaction States

**User Story:** As a user, I want clear visual feedback for all interactive elements, so that I can confidently navigate the diagnostic.

#### Acceptance Criteria

1. WHEN an answer option is selected, THE System SHALL display a checkmark or clear visual indicator
2. WHEN the Previous button is disabled, THE System SHALL reduce opacity and change cursor to not-allowed
3. WHEN the Next button is disabled due to no selection, THE System SHALL maintain enabled appearance but show validation error on click
4. ALL interactive elements SHALL have appropriate hover states
5. ALL interactive elements SHALL have appropriate focus states for keyboard navigation

### Requirement 12: TypeScript Type Safety

**User Story:** As a developer, I want strong type definitions for diagnostic data structures, so that I can prevent runtime errors and improve code maintainability.

#### Acceptance Criteria

1. THE System SHALL define TypeScript interfaces for FreeDiagnosticQuestion, FreeDiagnosticAnswer, and FreeDiagnosticResult
2. THE System SHALL define TypeScript types for API request and response payloads
3. THE System SHALL use strict TypeScript configuration with no implicit any
4. THE System SHALL validate API responses against expected types
5. THE System SHALL provide type-safe access to localStorage data
