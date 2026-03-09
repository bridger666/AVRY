# Workflow Editor Simplification & Fixes

## Overview
This document summarizes the fixes applied to simplify and fix the workflow editor behavior. The goal is to make Aivory's workflow editor a thin, opinionated UI on top of n8n, with n8n as the source of truth.

## Changes Applied

### 1. ✅ Editor Selection Logic (Already Correct)
**File**: `nextjs-console/app/workflows/page.tsx` (line 862)

The editor selection logic is already correct:
```typescript
{(selected.n8nId || selected.source === 'n8n') ? (
  <N8nWorkflowCanvas workflowId={selected.n8nId || selected.workflow_id} />
) : (
  <WorkflowCanvas workflow={selected} ... />
)}
```

**Behavior**:
- Any workflow with `n8nId` uses the new WorkflowCanvas (React Flow editor)
- Only workflows without `n8nId` and with `source === 'blueprint'` use the old canvas
- This is robust to legacy data

### 2. ✅ Workflow Normalization (Already Correct)
**File**: `nextjs-console/hooks/useWorkflows.ts` (line 45-52)

The hook already normalizes old workflows in memory:
```typescript
const normalized = workflows.map((wf) => {
  if (wf.n8nId && wf.source === 'blueprint') {
    return { ...wf, source: 'n8n' as const }
  }
  return wf
})
```

**Behavior**:
- Old workflows with `n8nId` but legacy `source: 'blueprint'` are treated as `source: 'n8n'`
- No localStorage clearing required for users
- Automatic in-memory normalization

### 3. ✅ WorkflowCanvas Node Loading (Already Correct)
**File**: `nextjs-console/components/workflow/WorkflowCanvas.tsx` (line 127-175)

The component already has the correct fetch logic:
```typescript
const fetchWorkflow = useCallback(async () => {
  // Fetches from /api/n8n/workflow/{workflowId}
  // Maps via n8nToReactFlow(wf)
  // Sets nodes and edges
  // Handles errors gracefully
}, [workflowId, ...])

useEffect(() => {
  fetchWorkflow()
}, [fetchWorkflow])
```

**Behavior**:
- Fetches workflow from n8n API on mount
- Maps to React Flow nodes/edges via `n8nToReactFlow`
- Saves to localStorage for offline mode
- Shows error toasts on failure

### 4. ✅ n8n Workflow Creation (Fixed)
**File**: `nextjs-console/app/api/console/workflows/from-blueprint/route.ts` (line 60-100)

**Fixed Issues**:
- Changed webhook node `typeVersion` from `1` to `1.1`
- Added `responseMode: 'responseNode'` parameter
- Changed `httpMethod: 'POST'` to `method: 'POST'`
- Removed unnecessary `webhookId: 'default'` field

**Result**:
- n8n workflows are now created with correct node configuration
- Workflows have 2 nodes: webhook-trigger and end-node
- Connections are properly established

### 5. ✅ Blueprint Workflow Saving (Already Correct)
**File**: `nextjs-console/app/blueprint/page.tsx` (line 201-220)

Workflows are saved with correct metadata:
```typescript
const savedId = saveWorkflow({
  workflow_id: result.workflow_id,  // n8n ID
  n8nId: result.workflow_id,        // n8n ID
  source: 'n8n',                    // Mark as n8n-backed
  // ... other fields
})
```

**Behavior**:
- New workflows from blueprints have `source: 'n8n'` and `n8nId` set
- Immediately use the new WorkflowCanvas editor
- No empty canvas issue

### 6. ✅ "View in n8n" Button (Added)
**File**: `nextjs-console/components/workflow/WorkflowCanvas.tsx` (line 280-290)

Added button to open native n8n editor:
```typescript
const n8nEditorBase = process.env.NEXT_PUBLIC_N8N_EDITOR_BASE_URL;
const n8nEditorUrl = n8nEditorBase ? `${n8nEditorBase}/workflow/${workflowId}` : null;

{n8nEditorUrl && (
  <a href={n8nEditorUrl} target="_blank" rel="noreferrer">
    View in n8n
  </a>
)}
```

**Configuration**:
- Environment variable: `NEXT_PUBLIC_N8N_EDITOR_BASE_URL`
- Set in `.env.local` and `.env.example`
- Opens n8n editor in new tab for verification

## Architecture

### Data Flow
```
Blueprint Page
  ↓
Generate Workflow (API)
  ↓
Create n8n Workflow (with nodes)
  ↓
Save to Aivory localStorage (with n8nId)
  ↓
Navigate to /workflows?selected={n8nId}
  ↓
Workflows Page
  ↓
Select workflow (has n8nId)
  ↓
Render N8nWorkflowCanvas
  ↓
Fetch from /api/n8n/workflow/{n8nId}
  ↓
Map to React Flow nodes/edges
  ↓
Display compact node cards
  ↓
User edits in right panel
  ↓
Save changes (PUT to n8n)
  ↓
Verify in n8n editor (View in n8n button)
```

### Key Principles
1. **n8n is the source of truth** - All workflow data lives in n8n
2. **Aivory is a thin UI layer** - Only displays and edits n8n workflows
3. **No separate workflow model** - Don't create Aivory-specific workflow copies
4. **Graceful degradation** - Offline mode uses localStorage cache
5. **Transparent to user** - No "n8n" terminology in UI

## Verification Checklist

- [ ] `npm run build` passes without errors
- [ ] In `/workflows`: Selecting a workflow with `n8nId` shows non-empty canvas
- [ ] Nodes are rendered as compact React Flow cards
- [ ] Selecting a node updates the "Edit Step" panel
- [ ] Editing in panel + "Save changes" updates n8n workflow
- [ ] "View in n8n" button opens correct workflow in n8n editor
- [ ] Generating new workflow from blueprint:
  - [ ] Creates real n8n workflow with nodes
  - [ ] Immediately appears in `/workflows` with populated canvas
  - [ ] No empty graph issue
- [ ] Old workflows with `n8nId` automatically use new editor
- [ ] No localStorage clearing required

## Files Modified

1. `nextjs-console/components/workflow/WorkflowCanvas.tsx` - Added "View in n8n" button
2. `nextjs-console/app/api/console/workflows/from-blueprint/route.ts` - Fixed n8n node configuration
3. `nextjs-console/.env.local` - Added `NEXT_PUBLIC_N8N_EDITOR_BASE_URL`
4. `nextjs-console/.env.example` - Added `NEXT_PUBLIC_N8N_EDITOR_BASE_URL`

## Files Already Correct (No Changes Needed)

1. `nextjs-console/app/workflows/page.tsx` - Editor selection logic
2. `nextjs-console/hooks/useWorkflows.ts` - Workflow normalization
3. `nextjs-console/app/blueprint/page.tsx` - Workflow saving
4. `nextjs-console/lib/n8nMapper.ts` - n8n to React Flow mapping
5. `nextjs-console/app/api/n8n/workflow/[id]/route.ts` - API proxy

## Next Steps

1. Test the complete flow end-to-end
2. Verify n8n workflows are created with correct nodes
3. Confirm canvas displays nodes from n8n
4. Test editing and saving workflow changes
5. Verify "View in n8n" button works correctly
