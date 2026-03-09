# Implementation Plan

## Phase 1: Exploratory Testing (Fault Condition)

- [ ] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Blueprint Workflow Generation Fails
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test implementation details from Fault Condition in design:
    - Test that `createWorkflowFromBlueprint()` function exists and is callable
    - Test that API endpoint `/api/console/workflows/from-blueprint` exists and responds
    - Test that workflow is created with proper structure (id, source, n8nId, blueprintId)
    - Test that workflow is stored in localStorage
    - Test that workflow appears in Workflows list
    - Test that source badge is displayed
  - The test assertions should match the Expected Behavior Properties from design
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause:
    - Which assertions fail first?
    - What error messages are returned?
    - What is the actual behavior vs expected?
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

## Phase 2: Preservation Testing (Before Fix)

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing n8n Workflow Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (existing n8n workflows)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - Existing n8n workflows continue to display in Workflows list
    - Existing n8n workflows display with "n8n" source badge
    - Clicking existing n8n workflows opens n8n Workflow Editor
    - Existing n8n workflows are stored and retrieved correctly
    - Blueprint detail page displays correctly
    - Navigation between pages works correctly
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

## Phase 3: Implementation

- [x] 3. Implement Blueprint → Workflow Generation Pipeline

  - [x] 3.1 Create unified Workflow type definition
    - Create file: `nextjs-console/types/workflow.ts`
    - Define `WorkflowSource` type: `'n8n' | 'blueprint'`
    - Define `ConsoleWorkflow` interface with:
      - `id: string` (unique identifier, format: `wf_${uuid}` for console workflows)
      - `name: string`
      - `source: WorkflowSource`
      - `status: 'active' | 'draft' | 'archived'`
      - `n8nId?: string` (for n8n-backed workflows)
      - `blueprintId?: string` (for blueprint-generated workflows)
      - `createdAt: string` (ISO timestamp)
      - `updatedAt: string` (ISO timestamp)
      - `description?: string`
    - Export types for use in other modules
    - _Bug_Condition: isBugCondition(input) where input.action = 'generateWorkflowFromBlueprint'_
    - _Expected_Behavior: ConsoleWorkflow type supports both n8n and blueprint sources_
    - _Preservation: Existing workflow storage and retrieval continues to work_
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Implement API endpoint for workflow generation
    - Create file: `nextjs-console/app/api/console/workflows/from-blueprint/route.ts`
    - Implement POST handler that accepts:
      - `blueprintId: string` (required)
      - `name?: string` (optional, defaults to blueprint name)
      - `context?: Record<string, any>` (optional metadata)
    - Validate `blueprintId` is provided (return 400 if missing)
    - Create n8n workflow instance (call n8n API or mock for now)
    - Generate unique workflow ID (e.g., `wf_${uuid}`)
    - Return `ConsoleWorkflow` object with:
      - `id`: generated workflow ID
      - `source`: 'n8n'
      - `n8nId`: the n8n workflow ID
      - `blueprintId`: reference to source blueprint
      - `status`: 'draft'
      - `createdAt`: ISO timestamp
    - Error handling:
      - Return 400 for missing blueprintId
      - Return 500 for n8n API failures with descriptive message
    - _Bug_Condition: isBugCondition(input) where input.action = 'generateWorkflowFromBlueprint'_
    - _Expected_Behavior: API endpoint creates workflow and returns ConsoleWorkflow_
    - _Preservation: Existing API endpoints continue to work_
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Create frontend client helper for workflow operations
    - Create file: `nextjs-console/lib/consoleWorkflows.ts`
    - Export `createWorkflowFromBlueprint(blueprintId: string, name?: string)` function
    - Calls POST `/api/console/workflows/from-blueprint`
    - Returns `ConsoleWorkflow` on success
    - Throws `Error` on failure with descriptive message
    - Handle network errors and API errors gracefully
    - _Bug_Condition: isBugCondition(input) where input.action = 'generateWorkflowFromBlueprint'_
    - _Expected_Behavior: Frontend client successfully calls API and returns workflow_
    - _Preservation: Existing workflow operations continue to work_
    - _Requirements: 2.1, 2.2_

  - [x] 3.4 Update Blueprint UI with "Generate Workflow" button
    - Modify file: `nextjs-console/app/blueprint/page.tsx`
    - Import `useRouter` from 'next/navigation'
    - Import `createWorkflowFromBlueprint` from `@/lib/consoleWorkflows`
    - Add state for loading: `const [isGenerating, setIsGenerating] = useState(false)`
    - Add state for error: `const [generationError, setGenerationError] = useState<string | null>(null)`
    - Implement `handleGenerateWorkflow()` function:
      - Set `isGenerating` to true
      - Call `createWorkflowFromBlueprint(blueprintId, blueprintName)`
      - On success: `router.push(`/workflows/${workflow.id}`)`
      - On error: Set `generationError` and show toast/alert
      - Set `isGenerating` to false
    - Add "Generate Workflow" button with:
      - Loading spinner while generating
      - Disabled state while loading
      - Error message display if generation fails
      - Click handler calls `handleGenerateWorkflow()`
    - _Bug_Condition: isBugCondition(input) where input.action = 'generateWorkflowFromBlueprint'_
    - _Expected_Behavior: Button triggers workflow generation and navigates to new workflow_
    - _Preservation: Existing blueprint detail page functionality continues to work_
    - _Requirements: 2.1, 2.2_

  - [x] 3.5 Update Workflows list UI with source badges
    - Modify file: `nextjs-console/app/workflows/page.tsx`
    - Update workflow list item rendering to include source badge:
      - "n8n" badge for n8n-backed workflows (teal/blue color)
      - "Blueprint" badge for blueprint-generated workflows (gray color)
    - Badge placement: next to status badge in workflow list item
    - Badge styling: Use existing badge styles or create minimal new styles
    - Click handler: Navigate to `/workflows/[id]` (same for both types)
    - Ensure workflows are loaded from storage and displayed correctly
    - _Bug_Condition: isBugCondition(input) where input.action = 'viewWorkflowsList'_
    - _Expected_Behavior: Workflows list displays both n8n and blueprint workflows with source badges_
    - _Preservation: Existing workflow list functionality continues to work_
    - _Requirements: 2.3, 2.4_

  - [x] 3.6 Update Workflow detail page to handle both workflow types
    - Modify file: `nextjs-console/app/workflows/[id]/page.tsx`
    - Update workflow detection logic:
      - Check if workflow ID matches n8n ID pattern (alphanumeric, 8-32 chars)
      - If not n8n ID, check if it's a console workflow ID (e.g., `wf_*`)
    - For blueprint-generated workflows:
      - Load workflow from storage using console workflow ID
      - Detect that it's n8n-backed (has `n8nId`)
      - Render n8n Workflow Editor (WorkflowCanvas) using `n8nId`
    - Display blueprint source info in header if available:
      - Show "Generated from [Blueprint Name]" subtitle
      - Add link back to blueprint if `blueprintId` available
    - Preserve existing n8n workflow handling
    - _Bug_Condition: isBugCondition(input) where input.action = 'clickWorkflowInList'_
    - _Expected_Behavior: Correct editor opens based on workflow type_
    - _Preservation: Existing n8n workflow detail page continues to work_
    - _Requirements: 2.5, 2.6_

  - [x] 3.7 Extend storage hook to support blueprint-generated workflows
    - Modify file: `nextjs-console/hooks/useWorkflows.ts`
    - Update `SavedWorkflow` interface:
      - Change `source` from hardcoded 'blueprint' to `'n8n' | 'blueprint'`
      - Add `n8nId?: string` field for n8n workflow ID
      - Add `blueprintId?: string` field for source blueprint
      - Add `id?: string` field for console workflow ID (for blueprint-generated workflows)
    - Update `saveWorkflow()` to handle both workflow types
    - Update `loadWorkflows()` to return workflows with proper source attribution
    - Ensure backward compatibility with existing n8n workflows
    - _Bug_Condition: isBugCondition(input) where input.action = 'generateWorkflowFromBlueprint'_
    - _Expected_Behavior: Storage hook supports both workflow types_
    - _Preservation: Existing workflow storage and retrieval continues to work_
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5_

## Phase 4: Verification

- [ ] 4. Verify bug condition exploration test now passes
  - **Property 1: Expected Behavior** - Blueprint Workflow Generation Works
  - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
  - The test from task 1 encodes the expected behavior
  - When this test passes, it confirms the expected behavior is satisfied
  - Run bug condition exploration test from step 1
  - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
  - Verify all assertions pass:
    - `createWorkflowFromBlueprint()` function exists and is callable
    - API endpoint `/api/console/workflows/from-blueprint` exists and responds
    - Workflow is created with proper structure
    - Workflow is stored in localStorage
    - Workflow appears in Workflows list
    - Source badge is displayed
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 5. Verify preservation tests still pass
  - **Property 2: Preservation** - Existing n8n Workflow Behavior Unchanged
  - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
  - Run preservation property tests from step 2
  - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
  - Verify all preservation assertions pass:
    - Existing n8n workflows continue to display in Workflows list
    - Existing n8n workflows display with "n8n" source badge
    - Clicking existing n8n workflows opens n8n Workflow Editor
    - Existing n8n workflows are stored and retrieved correctly
    - Blueprint detail page displays correctly
    - Navigation between pages works correctly
  - Confirm all tests still pass after fix (no regressions)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise
  - Verify no regressions in existing functionality
  - Confirm bug is fixed for all scenarios in design document
