# Implementation Plan: VPS Bridge Production Integration

## Overview

This implementation plan transforms the VPS Bridge into a production-ready service with logical model routing, standardized error handling, comprehensive logging, and health monitoring. The implementation follows an incremental approach: first establishing core infrastructure (routing, error handling, logging), then implementing each endpoint with its specific logic, and finally adding monitoring and cleanup.

## Tasks

- [ ] 1. Set up core infrastructure and configuration
  - Create MODEL_ROUTING configuration object mapping endpoints to model tags and use cases
  - Set up environment variables for ZENCLAW_BASE_URL and ZENCLAW_API_KEY
  - Initialize ajv validators for DiagnosticResult and Blueprint schemas
  - Configure winston logger with structured logging format
  - _Requirements: 1.1, 2.1, 9.4_

- [ ] 2. Implement Zenclaw HTTP client
  - [ ] 2.1 Create Zenclaw client module with axios
    - Configure axios instance with base URL, timeout (60s), and authentication headers
    - Implement sendRequest(envelope) method for non-streaming requests
    - Implement sendStreamingRequest(envelope, responseStream) method for streaming
    - Add error mapping (network errors → 503, timeouts → 504, 5xx → 502)
    - _Requirements: 1.2, 1.3_
  
  - [ ]* 2.2 Write property test for Zenclaw client error handling
    - **Property 3: Error Envelope Format**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.5, 9.3, 11.5**
  
  - [ ]* 2.3 Write unit tests for Zenclaw client
    - Test successful request/response
    - Test network timeout handling
    - Test connection refused handling
    - Test 5xx error from Zenclaw
    - _Requirements: 1.2, 1.3_

- [ ] 3. Implement request enrichment middleware
  - [ ] 3.1 Create enrichRequest middleware function
    - Extract endpoint path from request
    - Look up model tag and use case from MODEL_ROUTING
    - Generate unique request_id using UUID
    - Extract organization_id and session_id from request body
    - Construct Request_Envelope with model, use_case, payload, and metadata
    - Attach enriched envelope to req.envelope
    - _Requirements: 1.2, 2.6_
  
  - [ ]* 3.2 Write property test for request enrichment
    - **Property 1: Request Envelope Construction**
    - **Validates: Requirements 1.2, 1.3, 2.6, 11.4**
  
  - [ ]* 3.3 Write unit tests for request enrichment
    - Test enrichment for each endpoint type
    - Test missing organization_id handling
    - Test request_id generation uniqueness
    - _Requirements: 1.2, 2.6_

- [ ] 4. Implement centralized error handling middleware
  - [ ] 4.1 Create errorHandler middleware
    - Implement error categorization (400/422 → BAD_REQUEST, 502/503 → AI_BACKEND_UNAVAILABLE, 500 → INTERNAL_SERVER_ERROR)
    - Log full error with stack trace, request_id, endpoint, organization_id
    - Construct Error_Envelope with error: true, code, message, details
    - Ensure no stack traces or sensitive info in client response
    - Return appropriate HTTP status code
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ]* 4.2 Write property test for error envelope format
    - **Property 3: Error Envelope Format**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.5, 9.3, 11.5**
  
  - [ ]* 4.3 Write unit tests for error handler
    - Test BAD_REQUEST error formatting
    - Test AI_BACKEND_UNAVAILABLE error formatting
    - Test INTERNAL_SERVER_ERROR error formatting
    - Test stack trace exclusion from client response
    - Test error logging includes all required fields
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 5. Implement console chat streaming endpoint
  - [ ] 5.1 Create POST /console/stream endpoint
    - Validate request body (session_id, organization_id, language, messages required)
    - Apply request enrichment middleware
    - Forward to Zenclaw with model: "qwen-console", use_case: "console"
    - Set up Server-Sent Events (SSE) response headers
    - Stream Zenclaw response chunks to client without buffering
    - Log request with all required fields (request_id, endpoint, organization_id, model_tag, use_case, latency, status)
    - _Requirements: 1.1, 2.2, 3.1, 3.2, 3.3, 9.4_
  
  - [ ]* 5.2 Write unit tests for console endpoint
    - Test valid request returns 200 and streams data
    - Test missing session_id returns 400 BAD_REQUEST
    - Test missing organization_id returns 400 BAD_REQUEST
    - Test Zenclaw unavailable returns 503 AI_BACKEND_UNAVAILABLE
    - _Requirements: 3.1, 3.2, 7.1, 7.2_

- [ ] 6. Implement deep diagnostic endpoint
  - [ ] 6.1 Create POST /diagnostics/run endpoint
    - Validate request body (organization_id, mode: "deep", diagnostic_payload required)
    - Apply request enrichment middleware
    - Forward to Zenclaw with model: "qwen-diagnostic", use_case: "diagnostic"
    - Validate response against DiagnosticResult schema
    - Log validation warnings if schema doesn't match
    - Return validated DiagnosticResult JSON
    - Log request with all required fields
    - _Requirements: 1.1, 2.3, 4.1, 4.2, 4.3, 9.4_
  
  - [ ]* 6.2 Write property test for diagnostic response validation
    - **Property 2: Response Schema Validation**
    - **Validates: Requirements 1.4, 4.3, 5.3, 6.3, 9.2, 11.2**
  
  - [ ]* 6.3 Write unit tests for deep diagnostic endpoint
    - Test valid request returns DiagnosticResult
    - Test missing organization_id returns 400
    - Test invalid mode returns 422
    - Test response schema validation
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 7. Update free diagnostic endpoint
  - [ ] 7.1 Update POST /diagnostics/free/run endpoint
    - Keep existing validation logic (organization_id, mode: "free", answers, language)
    - Apply request enrichment middleware
    - Forward to Zenclaw with model: "qwen-diagnostic", use_case: "diagnostic"
    - Replace current error handling with centralized error handler
    - Validate response against DiagnosticResult schema
    - Return validated DiagnosticResult JSON
    - Log request with all required fields
    - _Requirements: 1.1, 2.4, 5.1, 5.2, 5.3, 9.4_
  
  - [ ]* 7.2 Write unit tests for free diagnostic endpoint
    - Test valid 12-question answers returns DiagnosticResult
    - Test missing answers returns 400
    - Test invalid answer values returns 422
    - Test response schema validation
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 8. Implement blueprint generation endpoint
  - [ ] 8.1 Create POST /blueprints/generate endpoint
    - Validate request body (organization_id, diagnostic_id, objective, constraints, industry required)
    - Apply request enrichment middleware
    - Forward to Zenclaw with model: "qwen-blueprint", use_case: "blueprint"
    - Validate response against Blueprint schema
    - Log validation warnings if schema doesn't match
    - Return validated Blueprint JSON
    - Log request with all required fields
    - _Requirements: 1.1, 2.5, 6.1, 6.2, 6.3, 9.4_
  
  - [ ]* 8.2 Write property test for blueprint response validation
    - **Property 2: Response Schema Validation**
    - **Validates: Requirements 1.4, 4.3, 5.3, 6.3, 9.2, 11.2**
  
  - [ ]* 8.3 Write unit tests for blueprint endpoint
    - Test valid request returns Blueprint
    - Test missing diagnostic_id returns 400
    - Test response schema validation
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 9. Checkpoint - Ensure all endpoints work with error handling
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement health check endpoint
  - [ ] 10.1 Create GET /health endpoint
    - Implement Zenclaw connection check (ping Zenclaw /health with 5s timeout)
    - Implement config_loaded check (verify MODEL_ROUTING is defined)
    - Determine status: "ok" if all pass, "degraded" if Zenclaw fails, "down" if config fails
    - Return JSON with status, timestamp, and checks object
    - Return HTTP 200 for "ok"/"degraded", HTTP 503 for "down"
    - _Requirements: 1.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 11.1_
  
  - [ ]* 10.2 Write unit tests for health check
    - Test all systems operational returns status "ok" with HTTP 200
    - Test Zenclaw down returns status "degraded" with HTTP 200
    - Test config not loaded returns status "down" with HTTP 503
    - Test response includes zenclaw_connection and config_loaded checks
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_

- [ ] 11. Implement comprehensive logging
  - [ ] 11.1 Add request logging middleware
    - Log request start with request_id, endpoint, organization_id, model_tag, use_case
    - Capture request start time
    - Log request completion with latency_ms and status (success/error)
    - Ensure all required fields are logged for every request
    - _Requirements: 7.4, 9.4_
  
  - [ ]* 11.2 Write property test for comprehensive logging
    - **Property 4: Comprehensive Request Logging**
    - **Validates: Requirements 7.4, 9.4**
  
  - [ ]* 11.3 Write unit tests for request logging
    - Test successful request logs all required fields
    - Test failed request logs error details
    - Test latency calculation is accurate
    - _Requirements: 7.4, 9.4_

- [ ] 12. Remove legacy code and mocks
  - [ ] 12.1 Clean up server.js
    - Remove PicoClaw CLI integration code (executePicoClaw function)
    - Remove old /api/chat endpoint
    - Remove n8n webhook integration (triggerN8nWebhook function)
    - Remove escapeShellArg utility (no longer needed)
    - Remove extractJSON utility (no longer needed)
    - Update session management to work with new endpoints
    - _Requirements: 9.1_
  
  - [ ] 12.2 Update documentation
    - Update vps-bridge/DEPLOYMENT.md with new endpoints
    - Update vps-bridge/frontend-integration-example.js with new API contracts
    - Document environment variables required
    - Document error codes and their meanings
    - _Requirements: 9.1_

- [ ] 13. Final checkpoint - Integration testing
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Verify definition of done
  - [ ] 14.1 Run integration tests
    - Test /health returns status "ok" in normal operation
    - Test free diagnostic with valid input returns valid DiagnosticResult JSON
    - Test deep diagnostic with valid input returns valid DiagnosticResult JSON
    - Test blueprint generation with valid input returns valid Blueprint JSON
    - Test all error scenarios return Error_Envelope format
    - Verify no "Internal server error" HTML responses
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- The implementation builds incrementally: infrastructure → endpoints → monitoring → cleanup
- All endpoints use the same error handling and logging infrastructure
- Zenclaw client is reused across all endpoints
- Request enrichment is applied consistently to all AI endpoints
