# Implementation Plan: Deep Diagnostic Flow

## Overview

This implementation plan breaks down the Deep Diagnostic Flow feature into discrete, actionable coding tasks. The feature provides a multi-phase AI readiness assessment with automatic progress persistence, resume capability, and integration with VPS Bridge for scoring. The implementation follows a phased approach: core infrastructure → phase flow components → summary and submission → results display → testing and polish.

## Tasks

- [x] 1. Set up core infrastructure and type definitions
  - Create TypeScript interfaces in `nextjs-console/types/deepDiagnostic.ts` for PhaseId, QuestionType, DeepDiagnosticQuestion, PhaseConfig, PhaseData, DeepDiagnosticProgress, API request/response types
  - Create constants file `nextjs-console/constants/deepDiagnosticQuestions.ts` with DEEP_DIAGNOSTIC_PHASES array containing all four phases and their questions
  - Create service file `nextjs-console/services/deepDiagnostic.ts` with DeepDiagnosticService class implementing localStorage operations (saveProgress, loadProgress, clearProgress, validatePhase)
  - Set up routing structure: create directories `nextjs-console/app/diagnostics/deep/`, `nextjs-console/app/diagnostics/deep/summary/`, `nextjs-console/app/diagnostics/deep/result/`
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 14.1, 14.2, 14.3, 14.4_

- [ ]* 1.1 Write property test for question structure completeness
  - **Property 16: Question structure completeness**
  - **Validates: Requirements 14.3**

- [ ] 2. Implement phase flow components
  - [x] 2.1 Create PhaseNavigator component
    - Implement `nextjs-console/components/diagnostics/PhaseNavigator.tsx` with props for phases, currentPhase, completedPhases, onNavigate
    - Display all four phases in order with completion status indicators
    - Enable navigation to completed phases, disable navigation to incomplete phases
    - Highlight current active phase
    - Create `nextjs-console/components/diagnostics/PhaseNavigator.module.css` with warm gray styling
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 2.2 Write property tests for phase navigation
    - **Property 1: Phase navigation follows completion rules**
    - **Property 2: Phase completion enables next phase**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5**

  - [x] 2.3 Create ProgressTracker component
    - Implement `nextjs-console/components/diagnostics/ProgressTracker.tsx` with props for totalPhases, completedPhases, currentPhase
    - Display progress bar showing percentage complete
    - Show "Phase X of 4" label and "X/4 phases complete" status
    - Create `nextjs-console/components/diagnostics/ProgressTracker.module.css` with warm gray styling
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 2.4 Write property test for progress tracker state reflection
    - **Property 3: Progress tracker reflects system state**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [x] 2.5 Create PhaseContent component
    - Implement `nextjs-console/components/diagnostics/PhaseContent.tsx` with props for phase, responses, onResponseChange, validationErrors
    - Render all questions for the current phase with appropriate input types (text, textarea, select, radio, multiselect, number)
    - Display validation errors inline below each question field
    - Implement 500ms debounce on response changes for storage
    - Create `nextjs-console/components/diagnostics/PhaseContent.module.css` with warm gray styling
    - _Requirements: 3.3, 15.2, 15.4_

  - [ ]* 2.6 Write property tests for response validation
    - **Property 17: Phase completion validation**
    - **Property 18: Response type validation**
    - **Property 19: Validation feedback timing**
    - **Validates: Requirements 15.1, 15.2, 15.3, 15.4**

- [ ] 3. Implement main diagnostic flow page
  - [x] 3.1 Create DeepDiagnosticFlow page component
    - Implement `nextjs-console/app/diagnostics/deep/page.tsx` with state for currentPhase, phaseData, isLoading, validationErrors
    - Integrate PhaseNavigator, ProgressTracker, and PhaseContent components
    - Implement phase navigation logic with completion validation
    - Load saved progress from localStorage on mount using DeepDiagnosticService.loadProgress()
    - Save responses to localStorage on change using DeepDiagnosticService.saveProgress() with debouncing
    - Implement "Next Phase" and "Previous Phase" navigation buttons
    - Implement "Start Fresh" button with confirmation dialog
    - Create `nextjs-console/app/diagnostics/deep/deep-diagnostic.module.css` with warm gray styling
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 15.1_

  - [ ]* 3.2 Write property tests for data persistence
    - **Property 4: Response persistence round-trip**
    - **Property 5: Persistence timing**
    - **Property 6: State restoration to correct phase**
    - **Property 7: Start Fresh clears all state**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 4.2, 4.3, 5.2, 5.3**

  - [ ]* 3.3 Write unit tests for edge cases
    - Test no saved progress initialization (Edge Case 1)
    - Test corrupted localStorage data handling (Edge Case 2)
    - Test localStorage unavailable scenario (Edge Case 3)
    - _Requirements: 3.1, 3.2, 3.4, 4.1, 4.4_

- [x] 4. Checkpoint - Ensure phase flow works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement summary view and submission
  - [x] 5.1 Create SummaryView page component
    - Implement `nextjs-console/app/diagnostics/deep/summary/page.tsx` with state for phaseData, isSubmitting, error
    - Load all phase data from localStorage
    - Display all responses organized by phase with phase titles and question labels
    - Provide "Edit" button for each phase that navigates back to that phase
    - Implement "Submit Diagnostic" button
    - Create `nextjs-console/app/diagnostics/deep/summary/summary.module.css` with warm gray styling
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 5.2 Write property tests for summary view
    - **Property 8: Summary view displays complete data**
    - **Property 9: Summary view enables all phase navigation**
    - **Property 10: Summary view appears when complete**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.5**

  - [x] 5.3 Implement diagnostic submission logic
    - Add submitDiagnostic method to DeepDiagnosticService that POSTs to /api/diagnostics/run
    - Format payload with organization_id, mode: "deep", and phases object
    - Handle loading state (disable submit button, show loading indicator)
    - Handle success (save result to localStorage, redirect to /diagnostics/deep/result)
    - Handle errors (display error message, retain user data)
    - Implement 30-second timeout on fetch request
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.3_

  - [ ]* 5.4 Write property tests for API integration
    - **Property 11: Diagnostic submission payload format**
    - **Property 12: API error handling preserves data**
    - **Property 13: Diagnostic ID persistence**
    - **Validates: Requirements 7.1, 7.2, 7.4, 8.4**

  - [ ]* 5.5 Write unit tests for submission flow
    - Test successful submission redirect (Example 4)
    - Test loading state during submission (Example 5)
    - Test API timeout configuration (Example 7)
    - _Requirements: 7.3, 7.5, 8.3_

- [x] 6. Implement VPS Bridge API endpoint
  - Create `nextjs-console/app/api/diagnostics/run/route.ts` with POST handler
  - Validate request body (organization_id, mode, phases)
  - Validate deep diagnostic structure (all four phase IDs present)
  - Forward request to VPS Bridge at port 3001 with API key from environment
  - Implement 30-second timeout using AbortSignal
  - Handle VPS Bridge errors and return appropriate status codes
  - Handle timeout errors with 504 status
  - Return diagnostic result JSON on success
  - _Requirements: 7.1, 7.2, 8.1, 8.2, 8.3_

- [ ]* 6.1 Write unit test for VPS Bridge endpoint configuration
  - Test API calls are made to correct endpoint at port 3001 (Example 6)
  - _Requirements: 8.1_

- [x] 7. Checkpoint - Ensure submission flow works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement results page
  - [x] 8.1 Create DeepDiagnosticResult page component
    - Implement `nextjs-console/app/diagnostics/deep/result/page.tsx` with state for result, isGeneratingBlueprint, error
    - Load result from localStorage using DeepDiagnosticService.loadResult()
    - Import and reuse ScoringCard component from Free Diagnostic
    - Display overall score, maturity level, dimension scores, strengths, blockers, opportunities, narrative, and recommendations
    - Create `nextjs-console/app/diagnostics/deep/result/result.module.css` with warm gray styling
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 8.2 Write property test for results completeness
    - **Property 15: Results completeness**
    - **Validates: Requirements 9.2, 9.3, 9.4**

  - [ ]* 8.3 Write unit test for ScoringCard reuse
    - Test results page imports and uses ScoringCard from Free Diagnostic (Example 8)
    - _Requirements: 9.1_

  - [x] 8.2 Create DeepVsFreeComparison component
    - Implement `nextjs-console/components/diagnostics/DeepVsFreeComparison.tsx`
    - Display comparison section with title "Deep vs Free Diagnostic"
    - List features unique to Deep Diagnostic (4 phases, detailed questions, comprehensive scoring)
    - List features common to both (AI-powered scoring, recommendations, blueprint generation)
    - Create `nextjs-console/components/diagnostics/DeepVsFreeComparison.module.css` with warm gray styling
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 8.3 Write unit test for comparison section
    - Test Deep vs Free comparison section displays correctly (Example 9)
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 8.4 Implement blueprint generation integration
    - Add generateBlueprint method to DeepDiagnosticService that POSTs to /api/blueprints/generate
    - Add "Generate Blueprint" CTA button to results page
    - Handle loading state (disable button, show loading indicator)
    - Handle success (redirect to blueprint viewer using redirect_url from response)
    - Handle errors (display error message)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 8.5 Write property test for blueprint generation
    - **Property 14: Blueprint generation includes diagnostic ID**
    - **Validates: Requirements 11.2**

  - [ ]* 8.6 Write unit tests for blueprint generation flow
    - Test Generate Blueprint button displays (Example 11)
    - Test blueprint generation redirect (Example 12)
    - Test blueprint generation loading state (Example 13)
    - _Requirements: 11.1, 11.3, 11.5_

- [x] 9. Implement error handling and edge cases
  - Add try-catch blocks to all localStorage operations in DeepDiagnosticService
  - Handle localStorage unavailable (private browsing, disabled) with warning message and in-memory fallback
  - Handle localStorage quota exceeded with error message and retry logic
  - Handle corrupted localStorage data by clearing and logging warning
  - Add error boundaries to main page components
  - Implement proper error logging with sanitized data (no PII in production)
  - Add user-friendly error messages for all error scenarios
  - _Requirements: 3.1, 3.2, 3.4, 4.1, 7.4, 11.4_

- [ ]* 9.1 Write unit tests for error scenarios
  - Test network error handling
  - Test server error handling (4xx, 5xx)
  - Test response validation errors
  - Test timeout errors
  - _Requirements: 7.4, 11.4_

- [x] 10. Checkpoint - Ensure results and error handling work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Polish styling and accessibility
  - Apply warm gray color palette consistently across all components (#1e1d1a background, #2a2926 cards, #f5f5f4 text, #d97706 accent)
  - Ensure all CSS modules follow naming conventions (*.module.css)
  - Add keyboard navigation support for all interactive elements
  - Add ARIA labels for screen readers on all controls
  - Ensure focus management during phase navigation
  - Test color contrast ratios meet WCAG AA standards
  - Add smooth transitions for loading states and phase changes
  - Verify responsive design works on mobile, tablet, and desktop
  - _Requirements: 12.1, 12.2, 12.4_

- [ ]* 11.1 Write unit tests for styling and file organization
  - Test CSS modules usage (Example 10)
  - Test no mock data in production (Example 14)
  - Test file organization (Example 15)
  - Test Next.js App Router conventions (Example 16)
  - Test questions in constants file (Example 17)
  - _Requirements: 12.2, 12.3, 13.1, 13.2, 13.3, 13.4, 14.1, 14.2, 14.4_

- [x] 12. Integration testing and final validation
  - Write E2E test for complete flow: answer all phases → review summary → submit → view results → generate blueprint
  - Write E2E test for resume flow: start diagnostic → complete phase 1 → close browser → reopen → resume from phase 2
  - Write E2E test for Start Fresh: complete diagnostic → Start Fresh → confirm → verify all data cleared
  - Write E2E test for edit from summary: complete diagnostic → view summary → edit phase 2 → return to summary
  - Verify all 19 properties have property-based tests with 100+ iterations
  - Verify all 3 edge cases have unit tests
  - Verify all 17 examples have unit tests
  - Run full test suite and ensure 100% pass rate
  - _Requirements: All_

- [x] 13. Final checkpoint - Complete feature validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, edge cases, and integration points
- The implementation uses TypeScript, React, Next.js 13+ App Router, and CSS Modules
- All API communication goes through Next.js API routes as proxy to VPS Bridge
- localStorage is used for progress persistence with proper error handling
- The feature reuses ScoringCard component from the existing Free Diagnostic feature
- Warm gray aesthetic (#1e1d1a, #2a2926, #f5f5f4, #d97706) is applied consistently
