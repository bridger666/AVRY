# Phase 2 Integration - n8n Workflow Sync in Workflow Detail Page

## Overview
Successfully integrated the n8n Workflow Canvas component into the existing workflow detail page. The page now supports both:
1. **Blueprint Workflows** - Traditional workflow modules from blueprints
2. **n8n Workflows** - Direct editing of n8n workflows with real-time sync

## Integration Points

### 1. Workflow Detail Page (`nextjs-console/app/workflows/[id]/page.tsx`)
- Added n8n workflow detection based on workflow ID format
- Workflow IDs matching `/^[a-zA-Z0-9]{8,32}$/` are treated as n8n workflows
- Imported `WorkflowCanvas` from `@/components/workflow/WorkflowCanvas`
- Added `isN8nWorkflow` state to track workflow type

### 2. Workflow Type Detection
```typescript
// Check if this is an n8n workflow ID (alphanumeric, 8-32 chars)
const isN8nId = /^[a-zA-Z0-9]{8,32}$/.test(workflowId)

if (isN8nId) {
  // This is an n8n workflow - render n8n editor
  setIsN8nWorkflow(true)
} else {
  // This is a blueprint workflow - fetch from blueprint
  // ... existing blueprint logic
}
```

### 3. Conditional Rendering
- If `isN8nWorkflow` is true: Renders n8n WorkflowCanvas with full editor
- If `isN8nWorkflow` is false: Renders existing blueprint workflow view
- Maintains backward compatibility with existing blueprint workflows

### 4. UI Components
- **n8n Header**: Shows "n8n Workflow Editor" title with back button
- **n8n Canvas**: Full ReactFlow-based workflow editor with:
  - Workflow fetch on mount
  - Real-time node/edge editing
  - Save to n8n with sync status
  - Offline mode with localStorage caching
  - Activate/deactivate workflow status
  - Error handling and retry logic

## File Changes

### Modified Files
1. `nextjs-console/app/workflows/[id]/page.tsx`
   - Added n8n workflow detection
   - Added conditional rendering for n8n workflows
   - Imported N8nWorkflowCanvas component

2. `nextjs-console/app/workflows/[id]/workflow-detail.module.css`
   - Added `.n8nWorkflowContainer` styles
   - Added `.n8nHeader` styles
   - Added `.n8nTitle` styles

### New/Existing Files
- `nextjs-console/components/workflow/WorkflowCanvas.tsx` - n8n workflow editor
- `nextjs-console/components/workflow/SyncStatus.tsx` - Sync status indicator
- `nextjs-console/lib/n8nMapper.ts` - n8n ↔ ReactFlow bidirectional mapper
- `nextjs-console/lib/n8n.ts` - n8n API client
- `nextjs-console/app/api/n8n/workflow/[id]/route.ts` - GET/PUT proxy
- `nextjs-console/app/api/n8n/workflow/[id]/activate/route.ts` - Activate/deactivate
- `nextjs-console/app/api/n8n/workflow/[id]/executions/route.ts` - Execution logs

## How It Works

### User Flow for n8n Workflows
1. User navigates to `/workflows/[n8n-workflow-id]`
2. Page detects n8n workflow ID format
3. Renders n8n WorkflowCanvas component
4. Component fetches workflow from n8n via `/api/n8n/workflow/{id}`
5. Displays workflow in ReactFlow canvas
6. User can:
   - Edit nodes and edges
   - Save changes (PUT to n8n)
   - Activate/deactivate workflow
   - View sync status
   - Work offline with localStorage caching

### User Flow for Blueprint Workflows
1. User navigates to `/workflows/[blueprint-workflow-id]`
2. Page detects blueprint workflow ID format
3. Fetches blueprint from API
4. Renders existing blueprint workflow view
5. Shows workflow details, steps, integrations, etc.

## Environment Configuration

Required environment variables (already configured):
- `N8N_BASE_URL` - n8n instance URL (e.g., http://43.156.108.96:5678)
- `N8N_API_KEY` - n8n API key (server-side only)
- `N8N_WORKFLOW_ID` - Default workflow ID for validation

## Testing the Integration

### Test n8n Workflow
1. Get an n8n workflow ID from your n8n instance
2. Navigate to `http://localhost:3000/workflows/[n8n-workflow-id]`
3. Should see n8n Workflow Editor with canvas
4. Try editing nodes and saving

### Test Blueprint Workflow
1. Navigate to `http://localhost:3000/workflows/[blueprint-workflow-id]`
2. Should see existing blueprint workflow view
3. Verify all existing functionality works

## Features Implemented

### Core Features
- ✅ Workflow fetch on mount from n8n
- ✅ ReactFlow canvas with node/edge editing
- ✅ Save changes to n8n (PUT request)
- ✅ Sync status indicator (synced/unsaved/saving/error)
- ✅ Offline mode with localStorage caching
- ✅ Activate/deactivate workflow
- ✅ Error handling with retry logic
- ✅ 5s timeout on all requests
- ✅ API key server-side only (never exposed)

### Security Features
- ✅ Workflow ID validation (regex pattern)
- ✅ API key never exposed to client
- ✅ Server-side proxy routes for all n8n calls
- ✅ Generic error messages (no sensitive data)
- ✅ Request logging (server-side only)

### Resilience Features
- ✅ Timeout handling (5s with AbortController)
- ✅ Offline fallback with localStorage
- ✅ Automatic sync on reconnection
- ✅ Retry logic for failed saves
- ✅ Error toast notifications

## Next Steps

### Phase 3: Update Workflows Page
- [ ] Task 9: Update activate/deactivate handlers in workflows list page
- [ ] Add n8n workflow support to workflows list
- [ ] Show n8n workflows alongside blueprint workflows

### Phase 4: Testing
- [ ] Write unit tests for components
- [ ] Write property-based tests for correctness
- [ ] Write integration tests for end-to-end workflows
- [ ] Test error scenarios and edge cases

### Phase 5: Documentation
- [ ] Document API routes
- [ ] Document n8n client usage
- [ ] Document mapper usage
- [ ] Add troubleshooting guide

## Troubleshooting

### Workflow Not Loading
1. Check if workflow ID is valid (alphanumeric, 8-32 chars)
2. Verify n8n instance is running at N8N_BASE_URL
3. Check N8N_API_KEY is valid
4. Check browser console for error messages

### Save Not Working
1. Check network tab for PUT request to `/api/n8n/workflow/{id}`
2. Verify response status is 200
3. Check if offline mode is active (check header)
4. Try clicking retry button on error

### Offline Mode Issues
1. Check localStorage for `aivory:n8n-workflow:{id}` key
2. Verify changes are saved locally
3. Try reconnecting to n8n
4. Check browser console for sync errors

## Architecture

```
Workflow Detail Page
├── n8n Workflow Detection
│   └── Regex: /^[a-zA-Z0-9]{8,32}$/
├── n8n Workflow Path
│   ├── WorkflowCanvas Component
│   │   ├── Fetch workflow on mount
│   │   ├── ReactFlow canvas
│   │   ├── Save handler
│   │   ├── Offline mode
│   │   └── Status dropdown
│   ├── SyncStatus Component
│   │   └── State machine (5 states)
│   └── API Routes
│       ├── GET /api/n8n/workflow/{id}
│       ├── PUT /api/n8n/workflow/{id}
│       ├── POST /api/n8n/workflow/{id}/activate
│       └── GET /api/n8n/workflow/{id}/executions
└── Blueprint Workflow Path
    └── Existing blueprint workflow view
```

## Performance Considerations

- Workflow canvas uses ReactFlow for efficient rendering
- Nodes and edges are memoized to prevent unnecessary re-renders
- localStorage caching reduces network requests
- 5s timeout prevents hanging requests
- Offline mode allows continued editing without network

## Security Considerations

- API key is server-side only (never exposed to client)
- All n8n calls go through proxy routes
- Workflow ID validation prevents injection attacks
- Generic error messages prevent information leakage
- Request logging is server-side only
- No sensitive data in localStorage

## Compatibility

- Works with n8n v2.8.3+ (tested on 43.156.108.96:5678)
- Compatible with existing blueprint workflows
- No breaking changes to existing UI
- Backward compatible with all existing features
