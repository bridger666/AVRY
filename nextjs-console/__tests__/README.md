# n8n Workflow Sync - Property-Based Tests

This directory contains comprehensive property-based tests for the n8n Workflow Sync integration, validating all 12 correctness properties defined in the design document.

## Test Files

### 1. `n8n.properties.test.ts`
**Property 12: n8n Client Uses Proxy Routes**
- Validates: Requirements 6.6
- Tests that all n8n client functions use `/api/n8n/...` proxy routes
- Covers: getWorkflow, updateWorkflow, activateWorkflow, deactivateWorkflow, getExecutions
- 5 tests, 100+ iterations each

### 2. `mapper.properties.test.ts`
**Property 2: n8n to ReactFlow Mapping Preserves Data**
- Validates: Requirements 7.3, 1.2
- Tests bidirectional conversion between n8n and ReactFlow formats
- Verifies preservation of: node IDs, names, types, parameters, positions
- Tests round-trip conversion consistency
- 10 tests, 100+ iterations each

### 3. `api-routes.properties.test.ts`
**Multiple Properties:**
- Property 1: Workflow Fetch on Mount (Requirements 1.1, 1.2, 1.3)
- Property 6: API Key Never Exposed (Requirements 5.7, 10.1, 10.2, 10.3, 10.4)
- Property 7: Workflow ID Validation (Requirements 5.6)
- Property 8: Timeout Handling (Requirements 5.8, 1.6, 2.6)
- Property 9: Error Propagation (Requirements 5.9, 5.10, 10.5)
- 14 tests, 100+ iterations each

### 4. `workflow-operations.properties.test.ts`
**Multiple Properties:**
- Property 3: Save Triggers PUT Request (Requirements 2.1, 2.2, 2.3)
- Property 4: Sync Status Reflects State Changes (Requirements 4.1, 4.2, 4.3, 4.4, 4.5)
- Property 5: Activation Sends Correct Endpoint (Requirements 3.1, 3.2)
- 13 tests, 100+ iterations each

### 5. `offline-execution.properties.test.ts`
**Multiple Properties:**
- Property 10: Offline Mode Caching (Requirements 9.1, 9.2)
- Property 11: Execution Status Mapping (Requirements 8.2)
- 12 tests, 100+ iterations each

## Test Statistics

- **Total Test Files**: 5
- **Total Tests**: 54
- **Total Iterations**: 5,400+ (100+ per test)
- **Pass Rate**: 100%
- **Framework**: Vitest + fast-check
- **Language**: TypeScript

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- __tests__/n8n.properties.test.ts

# Run with coverage
npm test -- --coverage
```

## Test Coverage

### Properties Validated

1. ✅ **Workflow Fetch on Mount** - Fetches from n8n on component mount
2. ✅ **n8n to ReactFlow Mapping** - Preserves all node properties during conversion
3. ✅ **Save Triggers PUT Request** - Sends complete workflow object on save
4. ✅ **Sync Status Reflects State** - Displays correct status for each state
5. ✅ **Activation Sends Correct Endpoint** - Uses correct endpoints for activate/deactivate
6. ✅ **API Key Never Exposed** - API key not in responses or error messages
7. ✅ **Workflow ID Validation** - Rejects invalid workflow IDs with 400 status
8. ✅ **Timeout Handling** - Aborts requests exceeding 5 seconds
9. ✅ **Error Propagation** - Returns appropriate HTTP status codes
10. ✅ **Offline Mode Caching** - Caches workflows to localStorage
11. ✅ **Execution Status Mapping** - Maps statuses to correct colors
12. ✅ **n8n Client Uses Proxy Routes** - All calls use /api/n8n/... routes

## Key Testing Patterns

### Property-Based Testing with fast-check

All tests use fast-check arbitraries to generate random test data:

```typescript
fc.assert(
  fc.property(arbN8nWorkflow, (workflow) => {
    // Test property holds for any generated workflow
    expect(someProperty(workflow)).toBe(true)
  }),
  { numRuns: 100 }
)
```

### Async Property Testing

For async operations like API calls:

```typescript
fc.assert(
  fc.asyncProperty(arbWorkflowId, async (id) => {
    // Test async property
    const result = await getWorkflow(id)
    expect(result).toBeDefined()
  }),
  { numRuns: 100 }
)
```

### Mocking and Spying

Tests use Vitest's `vi.spyOn()` to verify API calls:

```typescript
const fetchSpy = vi.spyOn(global, 'fetch')
// ... test code ...
expect(fetchSpy).toHaveBeenCalledWith(expectedUrl, expectedOptions)
```

## Requirements Traceability

Each test is tagged with the requirements it validates:

- **Requirements 1.1-1.6**: Workflow fetch and offline fallback
- **Requirements 2.1-2.6**: Save workflow changes
- **Requirements 3.1-3.5**: Activate/deactivate workflow
- **Requirements 4.1-4.6**: Sync status display
- **Requirements 5.1-5.10**: API proxy layer
- **Requirements 6.1-6.7**: n8n client utility
- **Requirements 7.1-7.5**: n8n ↔ ReactFlow mapping
- **Requirements 8.1-8.2**: Execution logs
- **Requirements 9.1-9.4**: Offline mode
- **Requirements 10.1-10.5**: API key security

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

```bash
npm test -- --run  # Single run, exit with status code
```

Exit code 0 = all tests passed
Exit code 1 = one or more tests failed

## Debugging Failed Tests

When a property test fails, fast-check provides:

1. **Seed**: Reproducible random seed for the failure
2. **Path**: Shrunk counterexample path
3. **Counterexample**: Minimal failing input
4. **Shrunk N times**: Number of shrinking iterations

Example:
```
Error: Property failed after 1 tests
{ seed: -855674615, path: "0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0", endOnFailure: true }
Counterexample: [{"id":" ","name":" ",...}]
Shrunk 15 time(s)
```

To reproduce: Use the seed value in fast-check configuration.

## Future Enhancements

- Add performance benchmarks for large workflows
- Add integration tests with real n8n instance
- Add visual regression tests for UI components
- Add mutation testing to verify test quality
- Add contract testing with n8n API
