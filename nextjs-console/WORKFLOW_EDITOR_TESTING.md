# Workflow Editor Testing Guide

## Quick Test Procedure

### Test 1: Generate Workflow from Blueprint
1. Navigate to `/blueprint`
2. Click "Generate Workflow" on any workflow module
3. Wait for generation to complete
4. Should see "View in Workflows →" button
5. Click it or navigate to `/workflows`

**Expected Result**:
- Workflow appears in left sidebar with `source: 'n8n'`
- Canvas shows 2 nodes (webhook-trigger and end-node)
- Nodes are rendered as compact React Flow cards
- No empty canvas message

### Test 2: View in n8n
1. In `/workflows`, select a workflow with `n8nId`
2. Look for "View in n8n" button in header (next to status dropdown)
3. Click it

**Expected Result**:
- Opens n8n editor in new tab
- Shows the same workflow with same nodes
- Can verify the workflow structure in native n8n UI

### Test 3: Edit Workflow
1. In `/workflows`, select a workflow with `n8nId`
2. Click on a node in the canvas
3. Right panel should show "Edit Step" with node details

**Expected Result**:
- Node is highlighted in canvas
- Right panel shows node configuration
- Can edit fields (action, tool, output, etc.)

### Test 4: Save Changes
1. Edit a node in the right panel
2. Click "Save changes" button
3. Should see sync status update

**Expected Result**:
- Sync status shows "Saving..." then "Synced"
- Changes are persisted to n8n
- Can verify in n8n editor by clicking "View in n8n"

### Test 5: Offline Mode
1. Disconnect network or close n8n
2. Try to load a workflow
3. Should fall back to localStorage cache

**Expected Result**:
- Canvas still shows nodes from cache
- Status shows "Offline (local mode)"
- Can still edit locally
- Changes sync when n8n comes back online

### Test 6: Legacy Workflow Migration
1. Create a workflow with old `source: 'blueprint'` but with `n8nId`
2. Reload the page
3. Select the workflow

**Expected Result**:
- Uses new WorkflowCanvas (not old blueprint canvas)
- Shows nodes from n8n
- No localStorage clearing required

## Debugging

### Canvas is Empty
1. Check browser console for errors
2. Check network tab for `/api/n8n/workflow/{id}` request
3. Verify response has `data.nodes` array
4. Check if `n8nToReactFlow` is returning nodes

### "View in n8n" Button Missing
1. Check if `NEXT_PUBLIC_N8N_EDITOR_BASE_URL` is set in `.env.local`
2. Check if workflow has `n8nId` set
3. Verify URL format: `{base}/workflow/{id}`

### Workflow Not Saving
1. Check if `N8N_API_KEY` is valid
2. Check if `N8N_BASE_URL` is correct
3. Check network tab for PUT request to `/api/n8n/workflow/{id}`
4. Check n8n API response for errors

### Nodes Not Displaying
1. Check if `n8nToReactFlow` is being called
2. Verify workflow has `nodes` array
3. Check if `WorkflowStepNode` component is rendering
4. Check CSS for node styling

## Environment Variables

Required for full functionality:

```bash
# n8n API (server-side)
N8N_BASE_URL=http://43.156.108.96:5678
N8N_API_KEY=<your-api-key>

# n8n Editor (client-side, for "View in n8n" button)
NEXT_PUBLIC_N8N_EDITOR_BASE_URL=http://43.156.108.96:5678
```

## Key Files to Monitor

- `nextjs-console/components/workflow/WorkflowCanvas.tsx` - Main canvas component
- `nextjs-console/lib/n8nMapper.ts` - n8n to React Flow mapping
- `nextjs-console/app/api/n8n/workflow/[id]/route.ts` - API proxy
- `nextjs-console/app/api/console/workflows/from-blueprint/route.ts` - Workflow generation
- `nextjs-console/hooks/useWorkflows.ts` - Workflow storage and normalization

## Common Issues & Solutions

### Issue: Canvas shows "Select a step on the canvas to edit its details"
**Cause**: No nodes loaded from n8n
**Solution**: 
1. Check if workflow exists in n8n
2. Verify n8n API is responding
3. Check if `n8nToReactFlow` returns empty array

### Issue: "View in n8n" button not visible
**Cause**: `NEXT_PUBLIC_N8N_EDITOR_BASE_URL` not set
**Solution**: Add to `.env.local`:
```
NEXT_PUBLIC_N8N_EDITOR_BASE_URL=http://43.156.108.96:5678
```

### Issue: Changes not saving to n8n
**Cause**: API key invalid or n8n offline
**Solution**:
1. Verify `N8N_API_KEY` is valid
2. Check if n8n is running
3. Check network tab for error responses

### Issue: Old workflows still use old canvas
**Cause**: Normalization not working
**Solution**:
1. Verify workflow has `n8nId` set
2. Check if `loadWorkflows()` is normalizing
3. Reload page to trigger normalization

## Performance Notes

- Canvas loads workflow on mount (useEffect)
- Nodes are cached in localStorage for offline mode
- Sync status updates in real-time
- No polling - only fetches on demand

## Security Notes

- API key is server-side only (never exposed to client)
- Credentials are stored in localStorage (user's browser)
- "View in n8n" opens in new tab with referrer policy
- All API calls use HTTPS in production
