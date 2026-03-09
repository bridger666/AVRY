# Implementation Plan: n8n Workflow Sync Integration

## Overview

This implementation plan breaks down the n8n Workflow Sync Integration into discrete, incremental coding tasks. Each task builds on previous steps, with property-based tests validating correctness properties and unit tests covering edge cases. The workflow is implemented in TypeScript using Next.js API routes and React components.

## Tasks

- [x] 1. Create n8n API Client Utility
  - [x] 1.1 Create `nextjs-console/lib/n8n.ts` with typed functions
    - Implement `getWorkflow(id: string): Promise<N8nWorkflow>`
    - Implement `updateWorkflow(id: string, data: N8nWorkflow): Promise<N8nWorkflow>`
    - Implement `activateWorkflow(id: string): Promise<void>`
    - Implement `deactivateWorkflow(id: string): Promise<void>`
    - Implement `getExecutions(workflowId: string, limit?: number): Promise<N8nExecution[]>`
    - Add timeout handling (5s) with AbortController
    - Add error handling with typed N8nError
    - Add retry logic for transient failures
    - Ensure all functions use /api/n8n/... proxy routes
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 1.2 Write property test for n8n client proxy routes
    - **Property 12: n8n Client Uses Proxy Routes**
    - **Validates: Requirements 6.6**

- [x] 2. Create n8n ↔ ReactFlow Mapper
  - [x] 2.1 Create `nextjs-console/lib/n8nMapper.ts` with bidirectional mapping
    - Implement `n8nToReactFlow(workflow: N8nWorkflow): { nodes: Node[], edges: Edge[] }`
    - Implement `reactFlowToN8n(nodes: Node[], edges: Edge[], baseWorkflow: N8nWorkflow): N8nWorkflow`
    - Handle n8n node type mapping (manualTrigger → triggerNode, etc.)
    - Preserve all node properties during conversion
    - Handle edge cases (missing positions, undefined parameters, empty connections)
    - Add comprehensive TypeScript type definitions
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 2.2 Write property test for n8n to ReactFlow mapping
    - **Property 2: n8n to ReactFlow Mapping Preserves Data**
    - **Validates: Requirements 7.3, 1.2_

- [x] 3. Create Workflow Proxy Route (GET/PUT)
  - [x] 3.1 Create `nextjs-console/app/api/n8n/workflow/[id]/route.ts`
    - Implement GET handler to fetch workflow from n8n
    - Implement PUT handler to update workflow in n8n
    - Add workflow ID validation against N8N_WORKFLOW_ID env var
    - Add timeout handling (5s) with AbortController
    - Add error handling for 401, 404, 5xx, timeout
    - Ensure API key is server-side only (never exposed)
    - Add request logging (no sensitive data)
    - Add same-origin check
    - _Requirements: 5.1, 5.2, 5.6, 5.7, 5.8, 5.9, 5.10_

  - [x] 3.2 Write property test for workflow fetch on mount
    - **Property 1: Workflow Fetch on Mount**
    - **Validates: Requirements 1.1, 1.2, 1.3_

  - [x] 3.3 Write property test for API key never exposed
    - **Property 6: API Key Never Exposed**
    - **Validates: Requirements 5.7, 10.1, 10.2, 10.3, 10.4_

  - [x] 3.4 Write property test for workflow ID validation
    - **Property 7: Workflow ID Validation**
    - **Validates: Requirements 5.6_

  - [x] 3.5 Write property test for timeout handling
    - **Property 8: Timeout Handling**
    - **Validates: Requirements 5.8, 1.6, 2.6_

  - [x] 3.6 Write property test for error propagation
    - **Property 9: Error Propagation**
    - **Validates: Requirements 5.9, 5.10, 10.5_

- [x] 4. Create Activate/Deactivate Route
  - [x] 4.1 Create `nextjs-console/app/api/n8n/workflow/[id]/activate/route.ts`
    - Implement POST handler for activate
    - Implement POST handler for deactivate
    - Add workflow ID validation
    - Add timeout handling (5s)
    - Add error handling for all error cases
    - Return current active status in response
    - _Requirements: 5.3, 5.4, 3.1, 3.2_

  - [x] 4.2 Write property test for activation sends correct endpoint
    - **Property 5: Activation Sends Correct Endpoint**
    - **Validates: Requirements 3.1, 3.2_

- [x] 5. Create Executions Route
  - [x] 5.1 Create `nextjs-console/app/api/n8n/workflow/[id]/executions/route.ts`
    - Implement GET handler to fetch execution logs
    - Support limit query parameter (default 20)
    - Add workflow ID validation
    - Add timeout handling (5s)
    - Add error handling
    - Map execution status to display format
    - _Requirements: 5.5, 8.1, 8.2_

  - [x] 5.2 Write property test for execution status mapping
    - **Property 11: Execution Status Mapping**
    - **Validates: Requirements 8.2_

- [x] 6. Checkpoint - Core Infrastructure Complete
  - Ensure all API routes respond correctly
  - Verify n8n client functions work with proxy routes
  - Verify mapper handles all node types
  - Ask the user if questions arise

- [x] 7. Update WorkflowCanvas Component
  - [x] 7.1 Add workflow fetch on mount and sync status management
    - Add useEffect to fetch workflow on mount using n8n client
    - Show loading skeleton during fetch
    - Map n8n response to ReactFlow nodes using mapper
    - Cache raw n8n workflow in state
    - Handle fetch errors with offline fallback
    - Initialize sync status to "synced"
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 7.2 Implement save handler and PUT request
    - Implement save handler to collect current ReactFlow nodes/edges
    - Map ReactFlow state back to n8n format using mapper
    - Send PUT request to /api/n8n/workflow/{id} on save
    - Update sync status during save (unsaved → saving → synced/failed)
    - Handle save errors with retry option
    - Show error toast on failure
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 7.3 Implement offline mode with localStorage caching
    - Add localStorage caching for workflows
    - Detect network errors and show warning banner
    - Allow local editing in offline mode
    - Attempt automatic sync on reconnection
    - Implement conflict detection
    - Create merge dialog for conflicts
    - Allow user to choose version (local vs n8n)
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 7.4 Write property test for save triggers PUT request
    - **Property 3: Save Triggers PUT Request**
    - **Validates: Requirements 2.1, 2.2, 2.3_

  - [x] 7.5 Write property test for offline mode caching
    - **Property 10: Offline Mode Caching**
    - **Validates: Requirements 9.1, 9.2_

- [x] 8. Create SyncStatus Component
  - [x] 8.1 Create `nextjs-console/components/SyncStatus.tsx` with state machine
    - Implement state machine (synced → unsaved → saving → synced/failed)
    - Display correct status text and color for each state
    - Show error message on failure with clickable retry button
    - Add smooth state transitions
    - Position left of Save Changes button
    - Add tooltip with sync details
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 8.2 Write property test for sync status reflects state changes
    - **Property 4: Sync Status Reflects State Changes**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 9. Update Workflows Page
  - [x] 9.1 Update activate/deactivate handlers
    - Modify `handleActivate` to call POST /api/n8n/workflow/{id}/activate
    - Modify `handleDeactivate` to call POST /api/n8n/workflow/{id}/deactivate
    - Update local status on success
    - Show success/error toast
    - Revert dropdown on error
    - Handle timeout and retry
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 10. Checkpoint - Frontend Integration Complete
  - Verify WorkflowCanvas fetches and displays workflows
  - Verify save functionality works end-to-end
  - Verify SyncStatus displays all states correctly
  - Verify activate/deactivate works
  - Verify offline mode caching works
  - Ask the user if questions arise

- [ ] 11. Implement Error Handling & Resilience
  - [ ] 11.1 Implement comprehensive error handling
    - Handle 401 Unauthorized with persistent banner
    - Handle 404 Not Found with error toast
    - Handle 5xx Server Error with retry option
    - Handle timeout with retry logic
    - Handle network errors with offline fallback
    - Ensure generic error messages (no API key exposure)
    - Add error logging (server-side only)
    - _Requirements: 1.4, 1.5, 1.6, 2.5, 2.6, 3.2, 5.8, 5.9, 5.10, 10.2_

  - [ ] 11.2 Implement timeout and retry logic
    - Add 5s timeout to all n8n requests
    - Implement retry logic (retry once on timeout)
    - Show "Saving..." indicator during retry
    - Fall back to offline mode after retry fails
    - Add exponential backoff for multiple retries
    - _Requirements: 1.6, 2.6, 5.8_

- [ ] 12. Implement Security Validation
  - [ ] 12.1 Verify and test security measures
    - Verify API key is server-side only (never in client code)
    - Verify API key never in logs or error messages
    - Verify workflow ID validation on all routes
    - Verify same-origin check on API routes
    - Verify no sensitive data in responses
    - Test with invalid workflow IDs
    - Test with missing API key
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 5.6, 5.7_

- [ ] 13. Checkpoint - Error Handling & Security Complete
  - Verify all error scenarios handled gracefully
  - Verify API key never exposed
  - Verify offline mode works with reconnection
  - Verify conflict resolution works
  - Ask the user if questions arise

- [ ] 14. Write Unit Tests
  - [x] 14.1 Write unit tests for n8n client functions
    - Test each function with valid inputs
    - Test error handling for each function
    - Test timeout handling
    - Test retry logic
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7_

  - [x] 14.2 Write unit tests for mapper functions
    - Test n8n → ReactFlow conversion with various node types
    - Test ReactFlow → n8n conversion
    - Test edge case handling (missing positions, undefined parameters)
    - Test round-trip conversion preserves data
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 14.3 Write unit tests for SyncStatus component
    - Test all state transitions
    - Test UI rendering for each state
    - Test retry button functionality
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 14.4 Write unit tests for error handling
    - Test 401 Unauthorized handling
    - Test 404 Not Found handling
    - Test 5xx Server Error handling
    - Test timeout handling
    - Test network error handling
    - _Requirements: 1.4, 1.5, 1.6, 2.5, 2.6, 5.8, 5.9, 5.10_

  - [x] 14.5 Write unit tests for offline mode
    - Test localStorage caching
    - Test offline detection
    - Test local editing in offline mode
    - Test automatic sync on reconnection
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 14.6 Write unit tests for API routes
    - Test GET /api/n8n/workflow/{id}
    - Test PUT /api/n8n/workflow/{id}
    - Test POST /api/n8n/workflow/{id}/activate
    - Test POST /api/n8n/workflow/{id}/deactivate
    - Test GET /api/n8n/workflow/{id}/executions
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 15. Write Property-Based Tests
  - [x] 15.1 Configure property test framework
    - Set up fast-check or similar for TypeScript
    - Configure minimum 100 iterations per test
    - Set up test tagging system
    - _Requirements: All_

  - [x] 15.2 Implement all 12 correctness properties
    - Property 1: Workflow fetch on mount (Requirements 1.1, 1.2, 1.3)
    - Property 2: n8n to ReactFlow mapping preserves data (Requirements 7.3, 1.2)
    - Property 3: Save triggers PUT request (Requirements 2.1, 2.2, 2.3)
    - Property 4: Sync status reflects state changes (Requirements 4.1, 4.2, 4.3, 4.4, 4.5)
    - Property 5: Activation sends correct endpoint (Requirements 3.1, 3.2)
    - Property 6: API key never exposed (Requirements 5.7, 10.1, 10.2, 10.3, 10.4)
    - Property 7: Workflow ID validation (Requirements 5.6)
    - Property 8: Timeout handling (Requirements 5.8, 1.6, 2.6)
    - Property 9: Error propagation (Requirements 5.9, 5.10, 10.5)
    - Property 10: Offline mode caching (Requirements 9.1, 9.2)
    - Property 11: Execution status mapping (Requirements 8.2)
    - Property 12: n8n client uses proxy routes (Requirements 6.6)
    - _Requirements: All_

- [ ] 16. Write Integration Tests
  - [x] 16.1 Test full workflow load → edit → save cycle
    - Load workflow from n8n
    - Edit nodes in canvas
    - Save changes
    - Verify changes persisted in n8n
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_

  - [x] 16.2 Test activate/deactivate workflow
    - Activate workflow via dropdown
    - Verify status updated
    - Deactivate workflow
    - Verify status updated
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 16.3 Test offline mode with reconnection
    - Simulate network failure
    - Edit workflow locally
    - Simulate reconnection
    - Verify automatic sync
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 16.4 Test conflict resolution
    - Simulate offline changes
    - Simulate n8n changes during offline period
    - Verify merge dialog appears
    - Test choosing local version
    - Test choosing n8n version
    - _Requirements: 9.4_

  - [x] 16.5 Test error scenarios
    - Test 401 Unauthorized
    - Test 404 Not Found
    - Test 5xx Server Error
    - Test timeout
    - Verify graceful error handling
    - _Requirements: 1.4, 1.5, 1.6, 2.5, 2.6, 5.8, 5.9, 5.10_

  - [x] 16.6 Test with large workflows
    - Test with 10+ nodes
    - Test with various node types
    - Verify performance acceptable
    - _Requirements: 1.2, 7.3_

  - [x] 16.7 Test concurrent save attempts
    - Attempt multiple saves in quick succession
    - Verify only one PUT request sent
    - Verify final state is correct
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 17. Checkpoint - All Tests Complete
  - Ensure all unit tests pass
  - Ensure all property tests pass (100+ iterations)
  - Ensure all integration tests pass
  - Ask the user if questions arise

- [ ] 18. Documentation
  - [x] 18.1 Document API routes
    - Document GET /api/n8n/workflow/{id}
    - Document PUT /api/n8n/workflow/{id}
    - Document POST /api/n8n/workflow/{id}/activate
    - Document POST /api/n8n/workflow/{id}/deactivate
    - Document GET /api/n8n/workflow/{id}/executions
    - Add examples and error responses
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 18.2 Document n8n client usage
    - Document each function signature
    - Add usage examples
    - Document error handling
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 18.3 Document mapper usage
    - Document n8nToReactFlow function
    - Document reactFlowToN8n function
    - Add examples
    - _Requirements: 7.1, 7.2_

  - [x] 18.4 Document error handling
    - Document all error types
    - Document recovery strategies
    - Add troubleshooting guide
    - _Requirements: 1.4, 1.5, 1.6, 2.5, 2.6, 5.8, 5.9, 5.10_

  - [x] 18.5 Document offline mode behavior
    - Document caching strategy
    - Document conflict resolution
    - Document reconnection behavior
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 18.6 Add code comments for complex logic
    - Comment timeout implementation
    - Comment retry logic
    - Comment conflict resolution
    - Comment state machine
    - _Requirements: All_

- [ ] 19. Final Checkpoint - Implementation Complete
  - Verify all tasks completed
  - Verify all tests passing
  - Verify no API key exposure
  - Verify offline mode working
  - Verify error handling graceful
  - Verify no breaking changes to existing UI
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and allow user feedback
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- All code is written in TypeScript for type safety
- All API routes use Next.js App Router pattern
- All components use React hooks for state management
