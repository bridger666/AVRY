# Requirements Document

## Introduction

The Deep Diagnostic feature provides a comprehensive, multi-phase diagnostic assessment for AI readiness. Users complete four sequential phases (Business Objective & KPI, Data & Process Readiness, Risk & Constraints, AI Opportunity Mapping), with automatic progress persistence and resume capability. Upon completion, responses are submitted to VPS Bridge for AI scoring, and users are redirected to a results page with blueprint generation capability.

## Glossary

- **Deep_Diagnostic_System**: The multi-phase diagnostic assessment feature
- **Phase**: One of four sequential diagnostic sections (Business Objective & KPI, Data & Process Readiness, Risk & Constraints, AI Opportunity Mapping)
- **Phase_Navigator**: Component managing phase progression and validation
- **Progress_Tracker**: Component displaying completion status per phase
- **Storage_Manager**: Component managing localStorage persistence
- **VPS_Bridge**: Backend service at port 3001 handling diagnostic scoring
- **Results_Page**: Page displaying diagnostic scores and blueprint generation CTA
- **Free_Diagnostic**: Existing diagnostic feature with reusable components
- **Blueprint_Generator**: Service creating AI implementation blueprints
- **Summary_View**: Pre-submission review of all phase responses
- **localStorage_Key**: "aivory_deep_diagnostic"

## Requirements

### Requirement 1: Phase Navigation

**User Story:** As a user, I want to navigate through diagnostic phases sequentially, so that I complete the assessment in the correct order.

#### Acceptance Criteria

1. THE Phase_Navigator SHALL display four phases in order: Business Objective & KPI, Data & Process Readiness, Risk & Constraints, AI Opportunity Mapping
2. WHEN a user completes a phase, THE Phase_Navigator SHALL enable navigation to the next phase
3. THE Phase_Navigator SHALL prevent navigation to incomplete phases
4. WHEN a user attempts to navigate to an incomplete phase, THE Phase_Navigator SHALL display the current phase
5. THE Phase_Navigator SHALL allow navigation to any previously completed phase

### Requirement 2: Progress Tracking

**User Story:** As a user, I want to see my progress through the diagnostic, so that I know how much remains.

#### Acceptance Criteria

1. THE Progress_Tracker SHALL display completion status for each phase
2. WHEN a phase is completed, THE Progress_Tracker SHALL mark that phase as complete
3. THE Progress_Tracker SHALL display the current active phase
4. THE Progress_Tracker SHALL display the total number of phases and completed phases

### Requirement 3: Response Persistence

**User Story:** As a user, I want my responses saved automatically, so that I can resume later without losing progress.

#### Acceptance Criteria

1. WHEN a user answers a question, THE Storage_Manager SHALL save the response to localStorage with key "aivory_deep_diagnostic"
2. WHEN a user completes a phase, THE Storage_Manager SHALL save the phase completion status to localStorage
3. THE Storage_Manager SHALL save responses within 500ms of user input
4. THE Storage_Manager SHALL store phase data as JSON with phase identifier, question responses, and completion status

### Requirement 4: Resume Capability

**User Story:** As a user, I want to resume from my saved progress, so that I can complete the diagnostic across multiple sessions.

#### Acceptance Criteria

1. WHEN the Deep_Diagnostic_System loads, THE Storage_Manager SHALL check localStorage for saved progress
2. WHEN saved progress exists, THE Deep_Diagnostic_System SHALL restore the user to the last incomplete phase
3. WHEN saved progress exists, THE Deep_Diagnostic_System SHALL populate all saved responses
4. WHERE no saved progress exists, THE Deep_Diagnostic_System SHALL start from phase one

### Requirement 5: Fresh Start Option

**User Story:** As a user, I want to start a new diagnostic, so that I can discard previous responses.

#### Acceptance Criteria

1. THE Deep_Diagnostic_System SHALL provide a "Start Fresh" control
2. WHEN a user activates "Start Fresh", THE Storage_Manager SHALL clear all saved progress from localStorage
3. WHEN a user activates "Start Fresh", THE Deep_Diagnostic_System SHALL reset to phase one with empty responses
4. WHEN a user activates "Start Fresh", THE Deep_Diagnostic_System SHALL request user confirmation before clearing data

### Requirement 6: Summary View

**User Story:** As a user, I want to review all my responses before submission, so that I can verify accuracy.

#### Acceptance Criteria

1. WHEN all phases are complete, THE Deep_Diagnostic_System SHALL display a Summary_View
2. THE Summary_View SHALL display all responses organized by phase
3. THE Summary_View SHALL provide navigation to edit any phase
4. THE Summary_View SHALL display a "Submit Diagnostic" control
5. WHEN a user edits from Summary_View, THE Deep_Diagnostic_System SHALL navigate to the selected phase and preserve the summary state

### Requirement 7: Diagnostic Submission

**User Story:** As a user, I want to submit my completed diagnostic for scoring, so that I receive AI readiness results.

#### Acceptance Criteria

1. WHEN a user submits from Summary_View, THE Deep_Diagnostic_System SHALL POST all phase responses to /api/diagnostics/run
2. THE Deep_Diagnostic_System SHALL format the POST payload with phase identifiers and question-response pairs
3. WHEN the POST request succeeds, THE Deep_Diagnostic_System SHALL redirect to the results page
4. IF the POST request fails, THEN THE Deep_Diagnostic_System SHALL display an error message and retain all user data
5. WHILE the POST request is pending, THE Deep_Diagnostic_System SHALL display a loading indicator and disable the submit control

### Requirement 8: VPS Bridge Integration

**User Story:** As a system, I want to communicate with VPS Bridge for scoring, so that diagnostics are processed correctly.

#### Acceptance Criteria

1. THE Deep_Diagnostic_System SHALL send POST requests to VPS_Bridge at port 3001
2. THE Deep_Diagnostic_System SHALL include all phase responses in the request body
3. THE Deep_Diagnostic_System SHALL set request timeout to 30 seconds
4. WHEN VPS_Bridge returns a diagnostic ID, THE Deep_Diagnostic_System SHALL store the ID for results retrieval

### Requirement 9: Results Page Display

**User Story:** As a user, I want to view my diagnostic results, so that I understand my AI readiness score.

#### Acceptance Criteria

1. THE Results_Page SHALL reuse ScoringCard components from Free_Diagnostic
2. THE Results_Page SHALL display scores for all diagnostic dimensions
3. THE Results_Page SHALL display the overall AI readiness score
4. THE Results_Page SHALL display recommendations based on scores
5. THE Results_Page SHALL apply warm gray aesthetic styling consistent with the application

### Requirement 10: Deep vs Free Comparison

**User Story:** As a user, I want to understand the difference between Deep and Free diagnostics, so that I know the value of the Deep assessment.

#### Acceptance Criteria

1. THE Results_Page SHALL display a comparison section titled "Deep vs Free Diagnostic"
2. THE comparison section SHALL list features unique to Deep Diagnostic
3. THE comparison section SHALL list features common to both diagnostics
4. THE comparison section SHALL use CSS modules for styling

### Requirement 11: Blueprint Generation CTA

**User Story:** As a user, I want to generate an AI implementation blueprint from my results, so that I have actionable next steps.

#### Acceptance Criteria

1. THE Results_Page SHALL display a "Generate Blueprint" call-to-action control
2. WHEN a user activates "Generate Blueprint", THE Results_Page SHALL POST to /api/blueprints/generate with the diagnostic ID
3. WHEN the blueprint generation succeeds, THE Results_Page SHALL redirect to the blueprint viewer
4. IF blueprint generation fails, THEN THE Results_Page SHALL display an error message
5. WHILE blueprint generation is pending, THE Results_Page SHALL display a loading indicator

### Requirement 12: Styling and Aesthetics

**User Story:** As a user, I want a visually consistent experience, so that the interface feels professional and cohesive.

#### Acceptance Criteria

1. THE Deep_Diagnostic_System SHALL use warm gray color palette consistent with the application design
2. THE Deep_Diagnostic_System SHALL use CSS modules for all component styling
3. THE Deep_Diagnostic_System SHALL not include mock data in production code
4. THE Deep_Diagnostic_System SHALL maintain visual consistency with Free_Diagnostic components

### Requirement 13: File Organization

**User Story:** As a developer, I want organized code structure, so that the feature is maintainable.

#### Acceptance Criteria

1. THE Deep_Diagnostic_System SHALL locate all pages in nextjs-console/app/diagnostics/deep/
2. THE Deep_Diagnostic_System SHALL locate all components in nextjs-console/components/diagnostics/
3. THE Deep_Diagnostic_System SHALL locate all services in nextjs-console/services/
4. THE Deep_Diagnostic_System SHALL use Next.js 13+ App Router conventions

### Requirement 14: Question Content Management

**User Story:** As a developer, I want diagnostic questions defined separately from components, so that content updates are simple.

#### Acceptance Criteria

1. THE Deep_Diagnostic_System SHALL define all phase questions in a constants file
2. THE constants file SHALL organize questions by phase identifier
3. THE constants file SHALL include question text, input type, and validation rules
4. THE Deep_Diagnostic_System SHALL import questions from the constants file for rendering

### Requirement 15: Data Validation

**User Story:** As a user, I want validation on my responses, so that I submit complete and valid data.

#### Acceptance Criteria

1. WHEN a user attempts to complete a phase, THE Deep_Diagnostic_System SHALL validate all required questions are answered
2. IF required questions are unanswered, THEN THE Deep_Diagnostic_System SHALL display validation messages and prevent phase completion
3. THE Deep_Diagnostic_System SHALL validate response format matches question input type
4. THE Deep_Diagnostic_System SHALL display validation feedback within 200ms of user interaction
