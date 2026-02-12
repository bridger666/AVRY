# Implementation Plan: Aivory AI Readiness Platform

## Overview

This implementation plan transforms the Aivory design into a complete web application with frontend, backend, and AI enrichment capabilities. The approach prioritizes graceful degradation, ensuring the system provides value even when AI components fail. Tasks are organized to build incrementally, with early validation through testing and checkpoints.

## Tasks

- [x] 1. Update backend infrastructure and configuration
  - Update FastAPI configuration to run on localhost:8081
  - Add CORS middleware configuration for frontend
  - Create configuration module for LLM settings (model name, timeout, base URL)
  - Add health check endpoint that reports LLM availability status
  - _Requirements: 13.1, 13.4, 13.5_

- [x] 2. Implement mandatory scoring service
  - [x] 2.1 Create scoring configuration with question-to-score mapping
    - Define 12 questions with 4 options each (0-3 scoring)
    - Store configuration in a Python module or JSON file
    - _Requirements: 2.3, 3.1, 3.2, 3.3_
  
  - [x] 2.2 Implement score calculation function
    - Calculate raw score by summing answer values
    - Normalize to 0-100 scale using formula: (raw_score / 36) × 100
    - Assign category based on score ranges
    - Return ScoringResult with raw_score, normalized_score, category
    - _Requirements: 3.4, 3.5, 5.1, 5.2_
  
  - [ ]* 2.3 Write property test for score calculation
    - **Property 3: Score Calculation Correctness**
    - **Validates: Requirements 3.4, 3.5, 5.1**
  
  - [ ]* 2.4 Write property test for category assignment
    - **Property 4: Category Assignment Boundaries**
    - **Validates: Requirements 5.2**
  
  - [ ]* 2.5 Write unit tests for boundary cases
    - Test score=0, 30, 31, 50, 51, 70, 71, 100
    - Test category assignment at each boundary
    - _Requirements: 5.2_

- [x] 3. Implement static fallback service
  - [x] 3.1 Create static content definitions
    - Define 3 insights for each category (AI Unready, AI Curious, AI Ready, AI Native)
    - Define 1 recommendation paragraph for each category
    - Define 1 narrative for each category
    - Store in Python module or JSON configuration
    - _Requirements: 20.1, 20.2, 20.3_
  
  - [x] 3.2 Implement fallback content retrieval function
    - Accept category as input
    - Return insights, recommendation, narrative for that category
    - _Requirements: 20.4_
  
  - [ ]* 3.3 Write property test for static content completeness
    - **Property 7: Static Fallback Completeness**
    - **Validates: Requirements 20.1, 20.2, 20.3**
  
  - [ ]* 3.4 Write property test for category explanation completeness
    - **Property 5: Category Explanation Completeness**
    - **Validates: Requirements 5.3**

- [x] 4. Implement AI enrichment service with graceful degradation
  - [x] 4.1 Create LLM client wrapper for Mistral-7B-Instruct
    - Connect to mistralai/Mistral-7B-Instruct model
    - Implement generate() method with timeout parameter
    - Handle TimeoutError, ConnectionError, and LLMError exceptions
    - _Requirements: 14.1, 14.2, 14.3, 14.5_
  
  - [x] 4.2 Implement prompt templates for AI enrichment
    - Create insights prompt template
    - Create recommendation prompt template
    - Create narrative prompt template
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 4.3 Implement AI enrichment function with fallback logic
    - Attempt to generate insights, recommendation, narrative using LLM
    - Set timeout to 5 seconds
    - On failure, log warning and return None
    - _Requirements: 6.1, 6.2, 6.3, 6.7_
  
  - [ ]* 4.4 Write property test for LLM failure non-crash
    - **Property 11: LLM Failure Non-Crash**
    - **Validates: Requirements 14.4**
  
  - [ ]* 4.5 Write property test for error logging without user exposure
    - **Property 10: Error Logging Without User Exposure**
    - **Validates: Requirements 6.7**
  
  - [ ]* 4.6 Write unit test for LLM timeout fallback
    - Mock LLM to timeout
    - Verify function returns None
    - Verify warning is logged
    - _Requirements: 6.4, 6.5_

- [x] 5. Implement badge generation service
  - [x] 5.1 Create SVG badge generation function
    - Accept score and category as inputs
    - Generate SVG with score as large number
    - Include category label
    - Use color scheme based on category
    - Return SVG as string
    - _Requirements: 8.1, 8.2_
  
  - [ ]* 5.2 Write property test for badge score inclusion
    - **Property 13: Badge Score Inclusion**
    - **Validates: Requirements 8.1**
  
  - [ ]* 5.3 Write property test for badge category inclusion
    - **Property 14: Badge Category Inclusion**
    - **Validates: Requirements 8.2**
  
  - [ ]* 5.4 Write property test for badge generation independence
    - **Property 15: Badge Generation Independence**
    - **Validates: Requirements 8.5**

- [x] 6. Implement diagnostic API endpoint
  - [x] 6.1 Create data models for diagnostic flow
    - Define DiagnosticAnswer model (question_id, selected_option)
    - Define DiagnosticSubmission model (answers list, timestamp)
    - Define ScoringResult model (raw_score, normalized_score, category)
    - Define AIEnrichment model (insights, recommendation, narrative)
    - Define DiagnosticResult model (score, category, insights, recommendation, badge_svg, enriched_by_ai)
    - _Requirements: 17.1_
  
  - [x] 6.2 Implement POST /api/v1/diagnostic/run endpoint
    - Accept DiagnosticSubmission
    - Validate exactly 12 answers provided
    - Calculate mandatory score
    - Attempt AI enrichment with timeout
    - Fall back to static content if AI fails
    - Generate badge
    - Return DiagnosticResult
    - _Requirements: 15.1, 15.3_
  
  - [ ]* 6.3 Write property test for scoring independence from LLM
    - **Property 6: Scoring Independence from LLM**
    - **Validates: Requirements 5.4, 5.5**
  
  - [ ]* 6.4 Write property test for diagnostic flow completion guarantee
    - **Property 9: Diagnostic Flow Completion Guarantee**
    - **Validates: Requirements 6.6**
  
  - [ ]* 6.5 Write property test for graceful degradation to static content
    - **Property 8: Graceful Degradation to Static Content**
    - **Validates: Requirements 6.4, 6.5, 18.1, 20.4**
  
  - [ ]* 6.6 Write property test for diagnostic response structure
    - **Property 24: Diagnostic Response Structure**
    - **Validates: Requirements 15.4**
  
  - [ ]* 6.7 Write unit test for complete diagnostic flow
    - Submit valid diagnostic with 12 answers
    - Verify response contains all required fields
    - _Requirements: 15.3, 15.4_

- [x] 7. Implement contact form API endpoint
  - [x] 7.1 Create data models for contact form
    - Define ContactForm model (name, company, email, message)
    - Define ContactResponse model (success, message)
    - _Requirements: 17.2_
  
  - [x] 7.2 Implement POST /api/v1/contact endpoint
    - Accept ContactForm
    - Validate all required fields
    - Store or forward contact information (log to file for MVP)
    - Return ContactResponse with success status
    - _Requirements: 16.1, 16.3, 16.4_
  
  - [ ]* 7.3 Write property test for form validation enforcement
    - **Property 21: Form Validation Enforcement**
    - **Validates: Requirements 12.2, 16.2, 17.3**
  
  - [ ]* 7.4 Write property test for validation error detail
    - **Property 22: Validation Error Detail**
    - **Validates: Requirements 17.4, 18.2**
  
  - [ ]* 7.5 Write unit test for contact form email validation
    - Submit form with invalid email
    - Verify validation error is returned
    - _Requirements: 16.2_

- [x] 8. Checkpoint - Backend services complete
  - Ensure all backend tests pass
  - Verify health check endpoint works
  - Test diagnostic endpoint with sample data
  - Test contact endpoint with sample data
  - Ask the user if questions arise

- [x] 9. Implement frontend homepage
  - [x] 9.1 Create homepage HTML structure
    - Add header with headline and subtext
    - Create 3 model cards with titles and buttons
    - Add navigation event handlers
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  
  - [x] 9.2 Style homepage with CSS
    - Responsive layout for desktop and mobile
    - Card styling with hover effects
    - Button styling consistent with design
    - _Requirements: 19.1_
  
  - [x] 9.3 Implement navigation logic
    - "Start Diagnostic" → Show diagnostic flow
    - "Build Automation Now" → Show automation section
    - "Design My AI System" → Show design section
    - _Requirements: 1.7_
  
  - [ ]* 9.4 Write unit test for homepage card structure
    - **Property 16: Homepage Card Structure**
    - **Validates: Requirements 1.3**

- [x] 10. Implement diagnostic flow frontend
  - [x] 10.1 Create question flow HTML structure
    - Create container for displaying one question at a time
    - Add 4 radio button options per question
    - Add navigation buttons (Next, Previous)
    - Add progress indicator
    - _Requirements: 2.1, 2.2, 2.6, 2.7_
  
  - [x] 10.2 Implement question data and rendering
    - Define 12 questions with 4 options each
    - Map options to scores (0-3)
    - Render current question dynamically
    - _Requirements: 2.3, 3.1_
  
  - [x] 10.3 Implement answer recording and navigation
    - Record selected answer when user clicks option
    - Enable Next button when answer selected
    - Allow navigation between questions
    - Update progress indicator
    - _Requirements: 2.4, 2.6, 2.7_
  
  - [x] 10.4 Implement form submission
    - Validate all 12 questions answered
    - Build DiagnosticSubmission JSON
    - POST to /api/v1/diagnostic/run
    - Show loading screen
    - _Requirements: 2.5_
  
  - [ ]* 10.5 Write property test for question display format
    - **Property 17: Question Display Format**
    - **Validates: Requirements 2.2**
  
  - [ ]* 10.6 Write property test for answer recording
    - **Property 18: Answer Recording**
    - **Validates: Requirements 2.4**
  
  - [ ]* 10.7 Write unit test for diagnostic submission
    - Complete all 12 questions
    - Verify submission is sent to backend
    - _Requirements: 2.5_

- [x] 11. Implement loading state frontend
  - [x] 11.1 Create loading screen HTML structure
    - Add animated spinner
    - Add message "AI is analyzing how your organization works…"
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 11.2 Implement loading state transitions
    - Show loading screen on form submission
    - Minimum display time of 1 second
    - Transition to results when API responds
    - _Requirements: 4.4, 4.5_
  
  - [ ]* 11.3 Write unit test for loading state display
    - Verify loading screen shows on submission
    - _Requirements: 4.1_

- [x] 12. Implement results page frontend
  - [x] 12.1 Create results page HTML structure
    - Score section with large number and category
    - Insights section with 3 bullet points
    - Recommendation section with paragraph
    - Badge section with download button
    - Tiered offerings section with 3 tiers
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 9.1_
  
  - [x] 12.2 Implement results rendering logic
    - Parse API response
    - Display score and category
    - Render insights as bullet list
    - Render recommendation paragraph
    - Display badge SVG
    - Render 3 tiered offerings with prices and CTAs
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 9.2, 9.3, 9.4_
  
  - [x] 12.3 Implement badge download functionality
    - Convert SVG to downloadable file
    - Trigger download on button click
    - _Requirements: 7.6, 8.4_
  
  - [x] 12.4 Implement tier CTA navigation
    - Tier 1 & 2 buttons → Contact form
    - Tier 3 button → Contact form
    - _Requirements: 9.5, 9.6_
  
  - [ ]* 12.5 Write property test for UI rendering resilience
    - **Property 12: UI Rendering Resilience**
    - **Validates: Requirements 7.8, 18.5**
  
  - [ ]* 12.6 Write property test for tiered offering CTA presence
    - **Property 20: Tiered Offering CTA Presence**
    - **Validates: Requirements 9.5**
  
  - [ ]* 12.7 Write unit test for results page rendering
    - Mock API response
    - Verify all sections render correctly
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 13. Implement Build Automation section
  - [x] 13.1 Create automation section HTML structure
    - Add headline and description
    - Add CTA button "Build Automation with Aivory Team"
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 13.2 Implement navigation to contact form
    - CTA button → Show contact form
    - _Requirements: 10.4_

- [x] 14. Implement Design AI System section
  - [x] 14.1 Create design section HTML structure
    - Add headline and description
    - Add CTA button "Design My AI System"
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [x] 14.2 Implement navigation to contact form
    - CTA button → Show contact form
    - _Requirements: 11.4_

- [x] 15. Implement contact form frontend
  - [x] 15.1 Create contact form HTML structure
    - Add fields: Name, Company, Email, Message
    - Add submit button "Contact Our Team for Full Consultation"
    - _Requirements: 12.1, 12.5_
  
  - [x] 15.2 Implement form validation
    - Validate all required fields before submission
    - Validate email format
    - Display field-level error messages
    - _Requirements: 12.2_
  
  - [x] 15.3 Implement form submission
    - POST to /api/v1/contact
    - Show confirmation message on success
    - Show error message on failure with retry option
    - _Requirements: 12.3, 12.4, 12.6_
  
  - [ ]* 15.4 Write unit test for contact form validation
    - Submit form with missing fields
    - Verify validation errors are shown
    - _Requirements: 12.2_

- [x] 16. Implement error handling across frontend
  - [x] 16.1 Add network error handling
    - Catch fetch() failures
    - Display user-friendly error messages
    - Provide retry options
    - _Requirements: 18.5_
  
  - [x] 16.2 Add validation error handling
    - Parse validation errors from API
    - Display field-level error messages
    - Allow user to correct and resubmit
    - _Requirements: 18.2_
  
  - [ ]* 16.3 Write property test for error message user-friendliness
    - **Property 27: Error Message User-Friendliness**
    - **Validates: Requirements 18.3**

- [x] 17. Implement comprehensive error handling in backend
  - [x] 17.1 Add validation error handling
    - Return 422 with field-level details for validation errors
    - _Requirements: 18.2_
  
  - [x] 17.2 Add system error handling
    - Catch unexpected exceptions
    - Log full error with stack trace
    - Return user-friendly 500 error message
    - _Requirements: 18.3_
  
  - [x] 17.3 Add HTTP status code logic
    - 200/201 for success
    - 400/422 for validation errors
    - 500 for system errors
    - _Requirements: 18.4_
  
  - [ ]* 17.4 Write property test for HTTP status code appropriateness
    - **Property 25: HTTP Status Code Appropriateness**
    - **Validates: Requirements 15.5, 18.4**

- [x] 18. Final checkpoint - Complete system integration
  - Run all backend tests (unit + property)
  - Run all frontend tests
  - Test complete user flow: Homepage → Diagnostic → Results → Contact
  - Test graceful degradation with LLM disabled
  - Test error scenarios (invalid input, network failures)
  - Verify system runs on localhost:8081
  - Ensure all tests pass, ask the user if questions arise

- [x] 19. Polish and final validation
  - [x] 19.1 Review UI consistency and styling
    - Ensure consistent colors, fonts, spacing
    - Verify responsive design on mobile
    - _Requirements: 19.1, 19.2_
  
  - [x] 19.2 Verify all content is production-ready
    - No placeholder text
    - No CLI instructions
    - Professional copy throughout
    - _Requirements: 19.5_
  
  - [x] 19.3 Test complete user journey timing
    - Verify diagnostic completes in under 3 minutes
    - _Requirements: 19.4_

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and allow for user feedback
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- The implementation prioritizes graceful degradation to ensure the system always provides value

