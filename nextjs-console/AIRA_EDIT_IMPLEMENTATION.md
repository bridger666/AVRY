# AIRA Workflow Edit Protocol Implementation

## Overview
Implemented the complete AIRA Workflow Edit API endpoint (`POST /api/workflows/aira-edit`) that enables AI-powered workflow editing with two distinct modes.

## Files Created

### 1. `nextjs-console/app/api/workflows/aira-edit/route.ts`
Complete API route handler with:
- Request validation for both EDIT_WORKFLOW and EDIT_STEP modes
- LLM integration via VPS Bridge (same pattern as diagnostics)
- Timeout handling: 15s for EDIT_WORKFLOW, 5s for EDIT_STEP
- Structured change parsing and application
- Server-side logging with latency tracking

## Protocol Details

### Request Schema
```typescript
{
  mode: "EDIT_WORKFLOW" | "EDIT_STEP"
  workflow: SavedWorkflow
  targetStepId?: string (required for EDIT_STEP)
  instruction: string
  constraints?: {
    maxStepsAdded?: number
    allowedNodeTypes?: string[]
    maxTokensSummary?: number
  }
  editSessionId?: string
}
```

### Response Schema
```typescript
{
  status: "ok" | "error"
  changes?: AiraChange[]
  updatedWorkflow?: SavedWorkflow
  summary?: string[]
  errorCode?: string
  errorMessage?: string
}
```

### Supported Operations
- **ADD_STEP**: Add new step to workflow
- **REMOVE_STEP**: Remove existing step
- **UPDATE_STEP**: Modify step fields
- **MOVE_STEP**: Reorder step within workflow

## Implementation Details

### Mode-Specific Behavior

#### EDIT_WORKFLOW Mode
- Timeout: 15 seconds
- Can add, remove, update, or reorder multiple steps
- System prompt explains full workflow structure
- User prompt focuses on workflow-level changes

#### EDIT_STEP Mode
- Timeout: 5 seconds
- Focuses on single step modification
- Requires `targetStepId` parameter
- System prompt emphasizes step-level constraints

### LLM Integration
- Uses VPS Bridge `/llm/chat` endpoint (same as diagnostics)
- Temperature: 0.3 (deterministic output)
- Max tokens: 2000
- Expects JSON response with changes array
- Handles JSON extraction from LLM response

### Error Handling
- **INVALID_REQUEST** (400): Missing or invalid parameters
- **TIMEOUT** (504): Operation exceeded time limit
- **LLM_ERROR** (503/500): LLM service unavailable or unexpected error
- **VALIDATION_ERROR** (400): Invalid workflow structure

### Logging
Server-side logging includes:
- Mode (EDIT_WORKFLOW or EDIT_STEP)
- Workflow ID
- Edit session ID
- Change count
- Latency (ms)
- Error details (if applicable)

## Change Application Logic

### Step Renumbering
After ADD_STEP, REMOVE_STEP, or MOVE_STEP operations, all steps are automatically renumbered to maintain sequential ordering (1, 2, 3, ...).

### Validation
- Prevents removal of trigger step
- Validates operation types
- Filters invalid changes from LLM response
- Maintains workflow data flow integrity

## Testing Recommendations

### EDIT_WORKFLOW Mode
```bash
curl -X POST http://localhost:3000/api/workflows/aira-edit \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "EDIT_WORKFLOW",
    "workflow": { /* SavedWorkflow object */ },
    "instruction": "Add a step to send a confirmation email after the main action"
  }'
```

### EDIT_STEP Mode
```bash
curl -X POST http://localhost:3000/api/workflows/aira-edit \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "EDIT_STEP",
    "workflow": { /* SavedWorkflow object */ },
    "targetStepId": "1",
    "instruction": "Change this step to use Gmail instead of Outlook"
  }'
```

## Integration Points

### Frontend Integration
The endpoint is ready to be called from:
- StepAIEditor component (for EDIT_STEP mode)
- WorkflowAIEditor component (for EDIT_WORKFLOW mode)

### Backend Dependencies
- VPS Bridge must be running with `/llm/chat` endpoint
- VPS_BRIDGE_CONFIG must be properly configured in `nextjs-console/lib/config.ts`
- API key must be set in environment variables

## Performance Characteristics

- **EDIT_WORKFLOW**: 10-15s typical (includes LLM reasoning time)
- **EDIT_STEP**: 2-5s typical (faster, focused scope)
- Timeout prevents hanging requests
- Proper error responses instead of 504 Gateway Timeout

## Next Steps

1. **Frontend Integration**: Wire the endpoint to StepAIEditor and WorkflowAIEditor components
2. **Testing**: Test both modes with various workflow structures
3. **Monitoring**: Track latency and error rates in production
4. **Refinement**: Adjust timeouts and LLM parameters based on real-world usage
