# Phase 1: Fix "No active blueprint found" Error

## Problem
When generating a workflow from blueprint and navigating to `/workflows/[id]`, the page throws:
```
Error: No active blueprint found
```

This happens because:
1. API returns n8n-style workflow ID (alphanumeric, 16 chars)
2. Blueprint page was saving with blueprint workflow ID (not n8n ID)
3. Navigation used blueprint ID, not n8n ID
4. `/workflows/[id]` page couldn't detect it as n8n workflow (ID pattern didn't match)
5. Page tried to load blueprint, but no blueprint was active

## Solution
Use the n8n workflow ID from API response for both saving and navigation.

## Changes Made

### File: `nextjs-console/app/blueprint/page.tsx`

**Before**:
```typescript
const savedId = saveWorkflow({
  workflow_id: id,  // ❌ Blueprint workflow ID
  title: result.title || wf.name,
  status: 'draft',
  source: 'blueprint',  // ❌ Wrong source
  // ...
})
router.push(`/workflows/${savedId}`)  // ❌ Uses blueprint ID
```

**After**:
```typescript
const savedId = saveWorkflow({
  workflow_id: result.workflow_id,  // ✅ Use n8n ID from API
  title: result.title || wf.name,
  status: 'draft',
  source: 'n8n',  // ✅ Correct source
  // ...
})
router.push(`/workflows/${result.workflow_id}`)  // ✅ Uses n8n ID
```

## How It Works Now

### Flow:
```
1. User clicks "Generate Workflow" on blueprint
   ↓
2. Blueprint page sends POST to /api/console/workflows/from-blueprint
   ↓
3. API returns GeneratedWorkflow with n8n workflow_id (e.g., "abc123def456ghi")
   ↓
4. Blueprint page saves workflow with:
   - workflow_id: "abc123def456ghi" (n8n ID)
   - source: "n8n"
   ↓
5. Blueprint page navigates to /workflows/abc123def456ghi
   ↓
6. /workflows/[id] page detects n8n ID (matches pattern /^[a-zA-Z0-9]{8,32}$/)
   ↓
7. Page renders N8nWorkflowCanvas directly (no blueprint fetch)
   ↓
8. ✅ No "No active blueprint found" error
```

## Verification

✅ No TypeScript errors
✅ No build errors
✅ All diagnostics pass

## Testing

1. Run dev server: `npm run dev`
2. Go to blueprint page
3. Click "Generate Workflow"
4. Verify:
   - No 400 error
   - Auto-navigates to `/workflows/{id}`
   - No "No active blueprint found" error
   - New n8n editor UI renders
   - Compact cards visible
   - Right-side panel visible

## Key Points

- ✅ n8n workflows now use n8n ID (alphanumeric, 16 chars)
- ✅ Blueprint workflows still use blueprint ID
- ✅ `/workflows/[id]` page correctly detects workflow type by ID pattern
- ✅ No blueprint fetch for n8n workflows
- ✅ Source badge shows [n8n] for generated workflows
- ✅ Source badge shows [Blueprint] for blueprint workflows

## Files Modified

1. `nextjs-console/app/blueprint/page.tsx` - Use n8n ID and mark source as 'n8n'

## Files Already Correct

1. `nextjs-console/app/workflows/[id]/page.tsx` - Already has n8n ID detection
2. `nextjs-console/components/workflow/WorkflowCanvas.tsx` - Already renders n8n editor
3. `nextjs-console/app/workflows/page.tsx` - Already shows source badges
