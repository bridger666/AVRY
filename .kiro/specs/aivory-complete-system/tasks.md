# Implementation Plan: Aivory Complete System

## Overview

This implementation plan converts the Aivory Complete System design into actionable coding tasks. The system extends the existing free diagnostic with three new paid tiers (AI Snapshot, Deep Diagnostic, AI Operating Partner) while maintaining backward compatibility. Implementation follows a phased approach: backend foundation, frontend dashboard, integration, and polish.

## Tasks

- [ ] 1. Extend environment configuration and validation
  - Update .env.local template with new required variables
  - Add validation for SUMOPOD_API_KEY and SUMOPOD_BASE_URL at startup
  - Implement format validation for environment variables
  - Add clear error messages for missing/invalid configuration
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ]* 1.1 Write property test for environment configuration validation
  - **Property 1: Environment Configuration Validation**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.5**

- [ ] 2. Implement AI Snapshot endpoint
  - [ ] 2.1 Create POST /api/v1/diagnostic/snapshot endpoint
    - Accept free_diagnostic_answers and language parameters
    - Validate exactly 30 questions including business_objective
    - Format answers for LLM prompt
    - _Requirements: 3.1, 3.2_
  
  - [ ] 2.2 Implement Sumopod integration with fallback logic
    - Call deepseek-v3-2-251201 as primary model
    - Implement fallback to kimi-k2-250905 on failure
    - Add 60-second timeout handling
    - Implement JSON parsing with retry logic
    - _Requirements: 3.3, 3.4, 11.1, 11.2, 11.4_
  
  - [ ] 2.3 Build snapshot prompt construction
    - Create system prompt for snapshot analysis
    - Inject language instruction based on language parameter
    - Format free diagnostic answers into readable context
    - _Requirements: 9.2_
  
  - [ ] 2.4 Implement snapshot response validation
    - Validate JSON structure matches SnapshotResult model
    - Ensure all required fields present
    - Strip markdown code blocks from LLM response
    - _Requirements: 3.5_

- [ ]* 2.5 Write property test for free diagnostic isolation
  - **Property 2: Free Diagnostic Isolation**
  - **Validates: Requirements 2.2**

- [ ]* 2.6 Write property test for diagnostic response completeness
  - **Property 3: Diagnostic Response Completeness**
  - **Validates: Requirements 2.3, 3.5, 4.3**

- [ ]* 2.7 Write property test for model fallback behavior
  - **Property 4: Model Fallback Behavior**
  - **Validates: Requirements 3.4**

- [ ] 3. Implement Deep Diagnostic endpoint
  - [ ] 3.1 Create POST /api/v1/diagnostic/deep endpoint
    - Accept free_diagnostic_answers and language parameters
    - Format answers for LLM prompt
    - _Requirements: 4.1_
  
  - [ ] 3.2 Implement blueprint generation with glm-4-7-251222
    - Call Sumopod API with glm-4-7-251222 model
    - Add 90-second timeout handling
    - Implement JSON parsing with retry logic
    - _Requirements: 4.2, 11.1, 11.2, 11.4_
  
  - [ ] 3.3 Build blueprint prompt construction
    - Create system prompt for blueprint generation
    - Inject language instruction based on language parameter
    - Include A-to-A pseudo-code format instructions
    - Explicitly exclude tool-specific references (n8n, Claude, Make, Zapier)
    - _Requirements: 4.8, 4.9, 8.1, 8.2, 8.3, 9.2_
  
  - [ ] 3.4 Implement blueprint response validation
    - Validate JSON structure matches BlueprintResult model
    - Ensure all required fields present
    - Validate A-to-A pseudo-code format
    - Check for absence of tool-specific names
    - _Requirements: 4.3, 4.8, 4.9_

- [ ]* 3.5 Write property test for A-to-A pseudo-code format compliance
  - **Property 5: A-to-A Pseudo-Code Format Compliance**
  - **Validates: Requirements 4.8, 4.9, 8.1, 8.2, 8.3**

- [ ] 4. Checkpoint - Ensure backend endpoints functional
  - Test snapshot endpoint with sample data
  - Test deep diagnostic endpoint with sample data
  - Verify error handling and retry logic
  - Ensure all tests pass, ask the user if questions arise

- [ ] 5. Implement A-to-A Pseudo-Code Service
  - [ ] 5.1 Create A2APseudoCodeService class
    - Implement generate_pseudo_code method
    - Implement parse_pseudo_code method
    - Define A-to-A format validation rules
    - _Requirements: 8.1, 8.2_
  
  - [ ] 5.2 Implement pseudo-code storage
    - Store pseudo-code in structured format
    - Add retrieval methods for future decoder
    - _Requirements: 8.4_

- [ ]* 5.3 Write property test for A-to-A pseudo-code storage
  - **Property 9: A-to-A Pseudo-Code Storage**
  - **Validates: Requirements 8.4**

- [ ] 6. Implement Workflow Deployment Service
  - [ ] 6.1 Create WorkflowDeploymentService class
    - Implement convert_blueprint_to_workflow method
    - Implement simulate_execution method
    - Generate unique workflow IDs
    - _Requirements: 7.3, 7.5_
  
  - [ ] 6.2 Implement workflow conversion logic
    - Extract workflow data from blueprint
    - Convert to Workflow model format
    - Preserve A-to-A pseudo-code
    - _Requirements: 7.3_

- [ ]* 6.3 Write property test for blueprint to workflow conversion
  - **Property 8: Blueprint to Workflow Conversion**
  - **Validates: Requirements 7.3**

- [ ] 7. Implement Tier Management Service
  - [ ] 7.1 Create TierManagementService class
    - Define tier configurations (Builder, Operator, Enterprise)
    - Implement check_workflow_limit method
    - Implement check_execution_limit method
    - Implement check_credit_balance method
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ] 7.2 Add tier validation to workflow operations
    - Check limits before adding workflows
    - Check limits before executing workflows
    - Return appropriate error messages when limits exceeded
    - _Requirements: 6.7_

- [ ] 8. Implement Report Generation Service
  - [ ] 8.1 Create ReportGenerationService class
    - Implement generate_free_report method
    - Implement generate_snapshot_report method
    - Implement generate_blueprint_report method
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ] 8.2 Design PDF templates
    - Create simple template for free diagnostic
    - Create structured template for snapshot
    - Create premium template for blueprint
    - Apply brand styling (Inter Tight font, brand colors)
    - _Requirements: 10.4, 10.5_
  
  - [ ] 8.3 Implement PDF generation logic
    - Use ReportLab or WeasyPrint library
    - Render templates with diagnostic data
    - Generate downloadable PDF bytes
    - _Requirements: 3.10, 4.6_

- [ ]* 8.4 Write property test for PDF report generation
  - **Property 7: PDF Report Generation**
  - **Validates: Requirements 3.10, 4.6, 10.1, 10.2, 10.3, 10.4**

- [ ] 9. Checkpoint - Ensure backend services complete
  - Test all service classes with sample data
  - Verify PDF generation works
  - Test tier limit enforcement
  - Ensure all tests pass, ask the user if questions arise

- [ ] 10. Implement unified dashboard component
  - [ ] 10.1 Create UnifiedDashboard class in JavaScript
    - Add constructor with mode, data, language parameters
    - Implement render method with mode switching logic
    - Implement switchMode method for dynamic content updates
    - Implement downloadReport method
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ] 10.2 Implement mode-specific rendering
    - Create renderFreeMode method
    - Create renderSnapshotMode method
    - Create renderBlueprintMode method
    - Create renderOperateMode method
    - _Requirements: 5.2_
  
  - [ ] 10.3 Add download functionality to dashboard
    - Add download buttons for each mode
    - Implement PDF download via API calls
    - Handle download errors gracefully
    - _Requirements: 5.10_

- [ ]* 10.4 Write property test for dashboard mode switching
  - **Property 6: Dashboard Mode Switching**
  - **Validates: Requirements 5.2, 5.3**

- [ ]* 10.5 Write property test for download functionality availability
  - **Property 16: Download Functionality Availability**
  - **Validates: Requirements 5.10**

- [ ] 11. Implement snapshot dashboard mode
  - [ ] 11.1 Create snapshot results display
    - Render readiness score prominently
    - Display executive summary
    - Show key gaps as list
    - Show automation opportunities as list
    - Display priority actions as list
    - _Requirements: 3.6_
  
  - [ ] 11.2 Add before/after comparison section
    - Display free diagnostic score
    - Display snapshot score
    - Show improvement insights
    - _Requirements: 3.7_
  
  - [ ] 11.3 Add upgrade CTA to deep diagnostic
    - Display "Run Deep Diagnostic - $99" button
    - Wire button to startBlueprint function
    - _Requirements: 3.8_

- [ ] 12. Implement blueprint dashboard mode
  - [ ] 12.1 Create blueprint results display
    - Render executive summary section
    - Display system overview with confidence level
    - Show workflow architecture with steps
    - Display agent structure as cards
    - Show expected impact metrics
    - Display deployment complexity
    - _Requirements: 4.4, 4.5_
  
  - [ ] 12.2 Add deploy CTA button
    - Display "Deploy This System" button
    - Wire button to tier selection flow
    - _Requirements: 7.1_

- [ ] 13. Implement operating partner dashboard mode
  - [ ] 13.1 Create tier overview section
    - Display current tier information
    - Show tier limits (workflows, executions, credits)
    - Show current usage statistics
    - Display upgrade options
    - _Requirements: 6.5, 6.6_
  
  - [ ] 13.2 Create workflow panel component
    - Display list of deployed workflows
    - Show workflow status (active, paused, draft)
    - Add execute workflow buttons
    - Show execution count per workflow
    - _Requirements: 6.6_
  
  - [ ] 13.3 Create execution monitor section
    - Display recent executions
    - Show execution status (success, failed, running)
    - Display execution timestamps
    - _Requirements: 6.6_
  
  - [ ] 13.4 Create intelligence credit meter
    - Display current credit balance
    - Show credit usage history
    - Add "Add Credits" button (simulated)
    - _Requirements: 6.6_
  
  - [ ] 13.5 Create orchestration status section
    - Display system health status
    - Show active workflows count
    - Display recent activity
    - _Requirements: 6.6_

- [ ] 14. Implement tier selection flow
  - [ ] 14.1 Create TierSelector component
    - Display three tier cards (Builder, Operator, Enterprise)
    - Show tier features and pricing
    - Add select buttons for each tier
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ] 14.2 Implement tier selection logic
    - Handle tier selection button clicks
    - Store selected tier in local state
    - Trigger workflow conversion on selection
    - Navigate to operating partner dashboard
    - _Requirements: 7.2, 7.3, 7.4_

- [ ] 15. Implement workflow deployment flow
  - [ ] 15.1 Wire deploy button to tier selection
    - Show tier selector modal on deploy click
    - Pass blueprint data to tier selector
    - _Requirements: 7.1, 7.2_
  
  - [ ] 15.2 Implement workflow conversion on tier selection
    - Call WorkflowDeploymentService API
    - Convert blueprint to workflow card
    - Add workflow to local state
    - _Requirements: 7.3_
  
  - [ ] 15.3 Add workflow card to workflow panel
    - Display new workflow in panel
    - Show workflow details
    - Enable execution button
    - _Requirements: 7.4_
  
  - [ ] 15.4 Implement simulated workflow execution
    - Handle execute button clicks
    - Show loading state
    - Display simulated execution results
    - Update execution count
    - _Requirements: 7.5_

- [ ] 16. Checkpoint - Ensure frontend dashboard complete
  - Test all dashboard modes render correctly
  - Test mode switching works smoothly
  - Test workflow deployment flow end-to-end
  - Ensure all tests pass, ask the user if questions arise

- [ ] 17. Implement multilingual support
  - [ ] 17.1 Add language state management
    - Add language selector UI component
    - Store language preference in local state
    - Default to English
    - _Requirements: 9.1_
  
  - [ ] 17.2 Implement language prompt injection
    - Modify snapshot endpoint to inject language instruction
    - Modify deep diagnostic endpoint to inject language instruction
    - _Requirements: 9.2_
  
  - [ ] 17.3 Implement dashboard text localization
    - Create translation dictionaries for English and Indonesian
    - Implement text switching based on language state
    - Apply translations to all dashboard modes
    - _Requirements: 9.4_
  
  - [ ] 17.4 Implement language persistence across modes
    - Preserve language state when switching modes
    - Ensure all text remains in selected language
    - _Requirements: 9.5_

- [ ]* 17.5 Write property test for language prompt injection
  - **Property 10: Language Prompt Injection**
  - **Validates: Requirements 9.2**

- [ ]* 17.6 Write property test for language state persistence
  - **Property 11: Language State Persistence**
  - **Validates: Requirements 9.4, 9.5**

- [ ] 18. Implement comprehensive error handling
  - [ ] 18.1 Add LLM error retry logic
    - Implement JSON parse failure retry with modified prompt
    - Add retry counter to prevent infinite loops
    - Return user-friendly error after retry failure
    - _Requirements: 11.1, 11.2_
  
  - [ ] 18.2 Add timeout handling for all LLM requests
    - Set appropriate timeouts (60s snapshot, 90s deep)
    - Handle timeout exceptions gracefully
    - Return appropriate error messages
    - _Requirements: 11.4_
  
  - [ ] 18.3 Implement error logging without data exposure
    - Log detailed errors for debugging
    - Sanitize user-facing error messages
    - Never expose API keys, stack traces, or internal paths
    - _Requirements: 11.5_
  
  - [ ] 18.4 Add API unavailability handling
    - Detect connection errors to Sumopod API
    - Return appropriate "service unavailable" messages
    - Log errors for monitoring
    - _Requirements: 11.6_
  
  - [ ] 18.5 Add server crash prevention
    - Wrap all LLM calls in try-catch blocks
    - Ensure server continues running on LLM failures
    - Return 500 errors instead of crashing
    - _Requirements: 11.3_

- [ ]* 18.6 Write property test for LLM error retry logic
  - **Property 12: LLM Error Retry Logic**
  - **Validates: Requirements 11.1, 11.2, 11.3**

- [ ]* 18.7 Write property test for LLM request timeout handling
  - **Property 13: LLM Request Timeout Handling**
  - **Validates: Requirements 11.4**

- [ ]* 18.8 Write property test for error logging without data exposure
  - **Property 14: Error Logging Without Data Exposure**
  - **Validates: Requirements 11.5**

- [ ]* 18.9 Write property test for API unavailability handling
  - **Property 15: API Unavailability Handling**
  - **Validates: Requirements 11.6**

- [ ] 19. Implement state preservation across modes
  - [ ] 19.1 Add diagnostic data storage in local state
    - Store free diagnostic answers
    - Store snapshot results
    - Store blueprint results
    - _Requirements: 14.6_
  
  - [ ] 19.2 Implement data retrieval when switching modes
    - Load stored data when returning to previous modes
    - Ensure data remains accessible
    - _Requirements: 14.6_

- [ ]* 19.3 Write property test for diagnostic data preservation
  - **Property 17: Diagnostic Data Preservation**
  - **Validates: Requirements 14.6**

- [ ] 20. Apply design system styling
  - [ ] 20.1 Update CSS with design system variables
    - Add color variables (brand purple, button purple, progress green)
    - Set Inter Tight font throughout
    - Define spacing scale (8px base unit)
    - _Requirements: 5.6, 5.7, 5.8, 5.9, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_
  
  - [ ] 20.2 Style buttons with Apple-style rounded design
    - Apply border-radius: 9999px to all buttons
    - Use solid colors only
    - Add hover states
    - _Requirements: 5.7, 13.2_
  
  - [ ] 20.3 Style progress bars with mint green
    - Apply #07d197 color to all progress bars
    - Ensure consistent styling across modes
    - _Requirements: 5.9, 13.4_
  
  - [ ] 20.4 Ensure homepage layout unchanged
    - Verify no modifications to existing homepage
    - Test that free diagnostic flow unchanged
    - _Requirements: 2.5_

- [ ] 21. Implement loading states and user feedback
  - [ ] 21.1 Add loading indicators for async operations
    - Show loading spinner during snapshot generation
    - Show loading spinner during blueprint generation
    - Show loading spinner during workflow execution
    - _Requirements: 12.4_
  
  - [ ] 21.2 Add success/error toast notifications
    - Show success message on successful operations
    - Show error message on failures
    - Auto-dismiss after 5 seconds
  
  - [ ] 21.3 Add progress indicators for multi-step flows
    - Show progress during diagnostic submission
    - Show progress during workflow deployment
    - Update progress as steps complete

- [ ] 22. Checkpoint - Ensure integration complete
  - Test complete user flows end-to-end
  - Test error handling with various failure scenarios
  - Test multilingual support in all modes
  - Ensure all tests pass, ask the user if questions arise

- [ ] 23. Write unit tests for backend endpoints
  - [ ] 23.1 Write unit tests for snapshot endpoint
    - Test with valid input
    - Test with missing required fields
    - Test with invalid language parameter
    - _Requirements: 3.1, 3.2_
  
  - [ ] 23.2 Write unit tests for deep diagnostic endpoint
    - Test with valid input
    - Test with missing required fields
    - Test with invalid language parameter
    - _Requirements: 4.1_
  
  - [ ] 23.3 Write unit tests for tier management service
    - Test tier limit checks
    - Test tier configuration retrieval
    - Test limit enforcement
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.7_
  
  - [ ] 23.4 Write unit tests for A-to-A service
    - Test pseudo-code generation
    - Test pseudo-code parsing
    - Test format validation
    - _Requirements: 8.1, 8.2_
  
  - [ ] 23.5 Write unit tests for report generation service
    - Test PDF generation for each tier
    - Test with various data inputs
    - Test error handling
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 24. Write integration tests for user flows
  - [ ] 24.1 Write integration test for free diagnostic flow
    - Test complete flow from homepage to results
    - Verify upgrade options displayed
    - _Requirements: 14.1_
  
  - [ ] 24.2 Write integration test for snapshot flow
    - Test complete flow from free diagnostic to snapshot results
    - Verify all sections render correctly
    - _Requirements: 14.2_
  
  - [ ] 24.3 Write integration test for blueprint flow
    - Test complete flow from free diagnostic to blueprint results
    - Verify all sections render correctly
    - _Requirements: 14.3_
  
  - [ ] 24.4 Write integration test for deployment flow
    - Test complete flow from blueprint to operating partner dashboard
    - Verify workflow appears in panel
    - Test simulated execution
    - _Requirements: 14.4_

- [ ] 25. Create documentation
  - [ ] 25.1 Write API documentation
    - Document all endpoints with request/response examples
    - Document error codes and messages
    - Document authentication requirements (none for prototype)
  
  - [ ] 25.2 Write user guide
    - Document how to run free diagnostic
    - Document how to upgrade to paid tiers
    - Document how to deploy workflows
    - Document how to use operating partner dashboard
  
  - [ ] 25.3 Write deployment guide
    - Document environment variable setup
    - Document how to start backend server
    - Document how to serve frontend
    - Document testing procedures
  
  - [ ] 25.4 Write developer guide
    - Document codebase structure
    - Document how to add new features
    - Document testing strategy
    - Document A-to-A pseudo-code format

- [ ] 26. Final checkpoint - Complete system validation
  - Run all unit tests and verify passing
  - Run all property tests and verify passing
  - Run all integration tests and verify passing
  - Test complete system end-to-end
  - Verify all requirements met
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- Integration tests validate complete user flows
- The system maintains backward compatibility with existing free diagnostic
- All paid features operate in prototype mode (no auth, no payments, local state only)
- Design system styling must be applied consistently across all modes
- Error handling must be comprehensive to ensure system stability
