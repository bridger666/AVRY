# Implementation Plan: Free Diagnostic v2

## Overview

This implementation plan breaks down the Free Diagnostic v2 feature into discrete, incremental coding tasks. The approach follows a bottom-up strategy: first establishing the data layer and types, then building core components, then integrating them into pages, and finally wiring everything together with the dashboard and VPS Bridge API.

Each task builds on previous work, ensuring no orphaned code. Testing tasks are marked as optional with `*` to allow for faster MVP delivery while maintaining the option for comprehensive test coverage.

## Tasks

- [x] 1. Set up TypeScript types and constants
  - Create `types/freeDiagnostic.ts` with all interfaces (FreeDiagnosticQuestion, FreeDiagnosticAnswers, FreeDiagnosticRequest, FreeDiagnosticResponse, FreeDiagnosticResult, QuestionFlowState, ResultPageState)
  - Create `constants/freeDiagnosticQuestions.ts` with the 12 questions array
  - Ensure strict TypeScript configuration in tsconfig.json (noImplicitAny, strictNullChecks)
  - _Requirements: 8.1, 8.2, 8.3, 12.1, 12.2, 12.3_

- [ ]* 1.1 Write property test for question data structure
  - **Property 12: Question structure validation**
  - **Validates: Requirements 8.2**
  - Test that all questions have exactly 4 options

- [ ]* 1.2 Write unit tests for TypeScript types
  - Test that all required interfaces are defined
  - Test that tsconfig.json has strict mode enabled
  - **Validates: Requirements 12.1, 12.2, 12.3, 12.5**

- [x] 2. Implement FreeDiagnosticService
  - Create `services/freeDiagnostic.ts` with FreeDiagnosticService class
  - Implement `submitDiagnostic()` method for VPS Bridge API calls
  - Implement `saveResult()`, `getResult()`, `isCompleted()`, `clearResult()` for localStorage
  - Add error handling with try-catch blocks for all localStorage operations
  - Add TypeScript type validation for API responses
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 9.2, 9.3, 9.5, 12.4_

- [ ]* 2.1 Write property test for answer payload formatting
  - **Property 6: Answer payload format**
  - **Validates: Requirements 3.2**
  - Test that answers are formatted as { question_id: option_index }

- [ ]* 2.2 Write property test for localStorage structure
  - **Property 8: localStorage structure**
  - **Validates: Requirements 9.3**
  - Test that stored results contain all required fields

- [ ]* 2.3 Write property test for API response parsing
  - **Property 9: API response parsing**
  - **Validates: Requirements 3.4**
  - Test that all required fields are extracted from API responses

- [ ]* 2.4 Write property test for TypeScript type validation
  - **Property 10: TypeScript type validation**
  - **Validates: Requirements 12.4**
  - Test that API responses are validated against expected types

- [ ]* 2.5 Write unit test for localStorage error handling
  - **Edge Case 3: localStorage unavailable**
  - **Validates: Requirements 9.5**
  - Test graceful handling when localStorage is unavailable

- [x] 3. Create base UI components
  - Create `components/diagnostics/QuestionCard.tsx` component
    - Props: question (FreeDiagnosticQuestion), selectedOption (number | null), onSelect (function)
    - Render question text and 4 options with click handlers
    - Apply selected state styling when option is selected
  - Create `components/diagnostics/ProgressIndicator.tsx` component
    - Props: currentQuestion (number), totalQuestions (number)
    - Render progress bar with percentage fill
    - Render "Question X of Y" label
  - Create `components/diagnostics/NavigationControls.tsx` component
    - Props: onPrevious (function), onNext (function), isPreviousDisabled (boolean), isNextDisabled (boolean), isLastQuestion (boolean)
    - Render Previous and Next/Submit buttons
    - Apply disabled styling to Previous when isPreviousDisabled is true
  - Create CSS modules for each component with warm gray theme (#1e1d1a background, Inter Tight font)
  - _Requirements: 1.2, 1.7, 2.1, 2.2, 7.1, 7.2, 7.6, 11.2_

- [ ]* 3.1 Write property test for answer selection UI state
  - **Property 1: Answer selection updates UI state**
  - **Validates: Requirements 1.2, 11.1**
  - Test that selecting an option displays selected state

- [ ]* 3.2 Write property test for progress indicators
  - **Property 5: Progress indicators update with navigation**
  - **Validates: Requirements 2.1, 2.2, 2.3**
  - Test that progress bar and label show correct values for any question index

- [ ]* 3.3 Write unit test for component rendering
  - Test that QuestionCard renders question text and options
  - Test that ProgressIndicator shows correct percentage
  - Test that NavigationControls renders buttons correctly
  - **Validates: Requirements 1.1, 2.1, 2.2**

- [x] 4. Implement question flow page
  - Create `app/diagnostics/free/page.tsx` with FreeDiagnosticFlow component
  - Implement state management: currentQuestionIndex, answers, isSubmitting, validationError
  - Implement handleSelectOption() to update answers state
  - Implement handleNext() with validation (show error if no selection, advance if valid)
  - Implement handlePrevious() to navigate backward
  - Implement handleSubmit() to call FreeDiagnosticService.submitDiagnostic()
  - Add loading state during API submission
  - Navigate to /diagnostics/free/result on successful submission
  - Store result in localStorage using FreeDiagnosticService.saveResult()
  - Create `app/diagnostics/free/free-diagnostic.module.css` with page styling
  - _Requirements: 1.1, 1.4, 1.5, 1.6, 1.8, 2.3, 2.4, 3.1, 3.3, 9.1_

- [ ]* 4.1 Write property test for navigation without selection
  - **Property 2: Navigation without selection shows validation error**
  - **Validates: Requirements 1.4, 10.4, 11.3**
  - Test that clicking Next without selection shows error

- [ ]* 4.2 Write property test for navigation with selection
  - **Property 3: Navigation with selection advances and saves**
  - **Validates: Requirements 1.5**
  - Test that clicking Next with selection saves and advances

- [ ]* 4.3 Write property test for backward navigation
  - **Property 4: Backward navigation preserves state**
  - **Validates: Requirements 1.6, 2.4, 2.5**
  - Test that Previous button restores saved answers

- [ ]* 4.4 Write property test for state management
  - **Property 7: State management during flow**
  - **Validates: Requirements 9.1**
  - Test that answers are stored in state and retrievable

- [ ]* 4.5 Write unit test for submission flow
  - **Example 2: Submission flow**
  - **Validates: Requirements 1.8, 3.1, 3.3, 10.1**
  - Test complete flow from Q1 to Q12 and submission

- [ ]* 4.6 Write unit test for API failure handling
  - **Edge Case 2: API failure shows error and retry**
  - **Validates: Requirements 3.6, 10.2, 10.3**
  - Test error message and retry button on API failure

- [x] 5. Checkpoint - Ensure question flow works end-to-end
  - Manually test navigating through all 12 questions
  - Verify Previous/Next buttons work correctly
  - Verify validation error appears when clicking Next without selection
  - Verify progress bar updates correctly
  - Ask the user if questions arise

- [x] 6. Create scoring card component
  - Create `components/diagnostics/ScoringCard.tsx` component
  - Props: result (FreeDiagnosticResult)
  - Render score display (large number out of 100)
  - Render maturity level label
  - Render three bullet points: strengths, blocker, opportunity
  - Create CSS module with card styling
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 6.1 Write property test for results display
  - **Property 11: Results page displays all insights**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
  - Test that all result fields are displayed

- [x] 7. Implement results page
  - Create `app/diagnostics/free/result/page.tsx` with FreeDiagnosticResult component
  - Retrieve result from localStorage using FreeDiagnosticService.getResult()
  - Handle case where no result exists (redirect to /diagnostics/free)
  - Render ScoringCard component with result data
  - Render narrative section (1-2 paragraphs)
  - Add primary CTA button "Continue to Deep Diagnostic" linking to /diagnostics
  - Add secondary CTA button "See how AI System Blueprint works" linking to /blueprint
  - Add stub buttons for "Download Scoring Card" and "Copy Summary" (no functionality for v1)
  - Create `app/diagnostics/free/result/result.module.css` with page styling
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ]* 7.1 Write unit test for results page CTAs
  - **Example 7: Results page CTAs**
  - **Validates: Requirements 4.5, 4.6, 4.7**
  - Test that all buttons exist with correct links

- [ ]* 7.2 Write unit test for results persistence
  - **Example 3: Results persistence**
  - **Validates: Requirements 3.5, 9.2**
  - Test that results are stored in localStorage

- [x] 8. Create diagnostics hub page
  - Create or update `app/diagnostics/page.tsx` with DiagnosticsHub component
  - Check localStorage for free diagnostic completion using FreeDiagnosticService.isCompleted()
  - Render Free Diagnostic section with description: "12 quick questions to check your AI readiness and get a scoring card"
  - If not completed: show "Start Free Diagnostic" button linking to /diagnostics/free
  - If completed: show last score and "View Results" button linking to /diagnostics/free/result
  - Render Deep Diagnostic section with description: "Multi-phase deep dive to prepare your AI System Blueprint"
  - Add appropriate CTAs for Deep Diagnostic based on existing implementation
  - Create or update `app/diagnostics/diagnostics.module.css` with hub styling
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ]* 8.1 Write unit test for hub page structure
  - **Example 4: Hub page structure**
  - **Validates: Requirements 5.1, 5.2, 5.5**
  - Test that two sections exist with correct descriptions

- [ ]* 8.2 Write unit test for conditional rendering on hub
  - **Example 5: Conditional rendering on hub**
  - **Validates: Requirements 5.3, 5.4**
  - Test CTAs change based on completion status

- [x] 9. Update dashboard with diagnostic status card
  - Create `components/dashboard/DiagnosticStatusCard.tsx` component
  - Check localStorage for free diagnostic completion
  - If not completed: show "Start Free Diagnostic" button
  - If completed: show score and "View Results" button
  - Always show secondary CTA for "Deep Diagnostic"
  - Integrate component into existing dashboard page
  - Create CSS module matching dashboard styling
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 9.1 Write unit test for dashboard integration
  - **Example 6: Dashboard integration**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
  - Test conditional rendering on dashboard

- [x] 10. Add VPS Bridge API endpoint (if not exists)
  - Verify VPS Bridge has `/diagnostics/free/run` endpoint
  - If missing, add endpoint to vps-bridge/server.js
  - Implement scoring logic: calculate raw score, normalize to 0-100, map to maturity level
  - Implement AI enrichment: generate strengths, blockers, opportunities, narrative
  - Return response matching FreeDiagnosticResponse interface
  - Add error handling and validation
  - _Requirements: 3.1, 3.2, 3.4_

- [ ]* 10.1 Write unit test for VPS Bridge endpoint
  - Test endpoint accepts correct request format
  - Test endpoint returns correct response format
  - Test scoring calculation is accurate
  - **Validates: Requirements 3.1, 3.2, 3.4**

- [x] 11. Environment configuration and deployment prep
  - Add NEXT_PUBLIC_VPS_BRIDGE_URL to .env.local
  - Add NEXT_PUBLIC_VPS_API_KEY to .env.local
  - Update README.md with setup instructions for Free Diagnostic v2
  - Verify no console errors exist in browser
  - Test in development mode (npm run dev)
  - _Requirements: 7.6, 10.5_

- [ ]* 11.1 Write unit test for styling verification
  - **Example 8: Styling verification**
  - **Validates: Requirements 7.1, 7.2, 7.6**
  - Test background color, font family, no Tailwind classes

- [ ]* 11.2 Write unit test for error logging
  - **Example 11: Error logging**
  - **Validates: Requirements 10.5**
  - Test that errors are logged without sensitive data

- [x] 12. Accessibility and keyboard navigation
  - Add aria-labels to all interactive elements
  - Add aria-live region for validation errors
  - Add aria-describedby for progress indicators
  - Ensure all buttons and options are keyboard accessible (tab navigation)
  - Add focus styles to all interactive elements
  - Test keyboard navigation through entire flow
  - _Requirements: 11.5_

- [ ]* 12.1 Write property test for keyboard accessibility
  - **Property 13: Keyboard accessibility**
  - **Validates: Requirements 11.5**
  - Test that all interactive elements have focus states

- [x] 13. Final checkpoint - End-to-end testing
  - Test complete user flow: start diagnostic → answer all questions → view results → navigate to dashboard → view results again
  - Test error scenarios: API failure, localStorage unavailable
  - Test edge cases: first question Previous button, validation errors
  - Verify no console errors or warnings
  - Verify styling matches design system (warm gray, Inter Tight, no neon)
  - Ensure all tests pass, ask the user if questions arise

- [ ]* 13.1 Write integration tests for complete flows
  - Test flow: complete diagnostic → view results → navigate to Deep Diagnostic
  - Test flow: complete diagnostic → return to dashboard → view results again
  - **Validates: All requirements end-to-end**

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints (tasks 5 and 13) ensure incremental validation
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- The VPS Bridge endpoint (task 10) may already exist - verify before implementing
- All TypeScript code should use strict mode with no implicit any
- All CSS should use CSS modules (no Tailwind, no inline styles)
- All components should follow the existing Next.js console design patterns
