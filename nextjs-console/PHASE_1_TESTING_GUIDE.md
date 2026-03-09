# Phase 1 Testing Guide - Blueprint → Workflow Generation

## Quick Start

### Prerequisites
- Dev server running: `npm run dev`
- Access to http://localhost:3000

---

## Test 1: Generate Workflow from Blueprint

### Steps
1. Navigate to http://localhost:3000/blueprint
2. Scroll to any workflow module (e.g., "Client Onboarding")
3. Click the "Generate Workflow" button
4. **Expected Result**: 
   - No error message
   - Auto-navigates to `/workflows/{id}` (where id is alphanumeric, ~16 chars)
   - New workflow appears in the list

### What to Check
- ✅ No 400 Bad Request error
- ✅ No console errors
- ✅ URL changes to `/workflows/{id}`
- ✅ Page loads without errors

---

## Test 2: View New Workflow Editor

### Steps
1. After generating a workflow (or navigate to an existing n8n workflow)
2. Open http://localhost:3000/workflows/{id}
3. **Expected Result**:
   - Compact rounded-square cards appear (not old wide rectangles)
   - Right-side panel appears (320px width)
   - Header shows "Online" status
   - "Save changes" button is visible

### What to Check
- ✅ Nodes are compact cards (260-320px width)
- ✅ Cards have rounded corners (border-radius: 1rem)
- ✅ Cards show title, subtitle, description
- ✅ Right-side panel is visible
- ✅ Panel header says "Edit Step"
- ✅ No old editor UI visible

### Visual Verification
- Cards should look like this:
  ```
  ┌─────────────────────┐
  │ When this happens... │
  │ Send Email          │
  │ Notify customer     │
  │ of order status     │
  └─────────────────────┘
  ```

---

## Test 3: Select and Edit a Node

### Steps
1. Click on any node in the canvas
2. **Expected Result**:
   - Node shows selection ring (emerald-400 color)
   - Right-side panel updates with node data
   - Panel shows three editable fields:
     - "What happens" (textarea)
     - "Tool / service used" (input)
     - "What this produces" (textarea)

### What to Check
- ✅ Selection ring appears around clicked node
- ✅ Panel shows correct node data
- ✅ Fields are editable
- ✅ "Save Changes" button is visible

### Edit Test
1. Click in "What happens" field
2. Change the text
3. Click "Save Changes" button
4. **Expected Result**:
   - Card updates immediately
   - "Save changes" button in header becomes enabled
   - No errors in console

---

## Test 4: Sync with n8n

### Steps
1. Make changes to a node (see Test 3)
2. Click "Save changes" button in header
3. **Expected Result**:
   - Button shows "Saving..." state
   - After 1-2 seconds, shows "Synced"
   - Toast notification: "Workflow synced with n8n"
   - No errors in console

### What to Check
- ✅ Sync status updates
- ✅ Toast appears
- ✅ No HTTP errors
- ✅ Changes persist on page reload

---

## Test 5: Workflows List with Source Badges

### Steps
1. Navigate to http://localhost:3000/workflows
2. **Expected Result**:
   - List shows all workflows
   - Each workflow has a source badge:
     - `[Blueprint]` for blueprint-sourced workflows
     - `[n8n]` for n8n workflows
   - Generated workflow shows `[n8n]` badge

### What to Check
- ✅ Badges appear next to workflow names
- ✅ Correct badge type for each workflow
- ✅ Badges are styled consistently
- ✅ Clicking workflow opens editor

---

## Test 6: Offline Mode (Optional)

### Steps
1. Stop n8n or disconnect from network
2. Try to load a workflow
3. **Expected Result**:
   - Toast: "n8n offline — editing in local mode"
   - Workflow loads from localStorage
   - Can still edit nodes
   - "Save changes" button shows error state

### What to Check
- ✅ Graceful fallback to local mode
- ✅ Can still edit
- ✅ Error state is clear
- ✅ No crashes

---

## Test 7: Multiple Outputs (Condition Nodes)

### Steps
1. Find a workflow with condition nodes
2. Click on a condition node
3. **Expected Result**:
   - Node shows multiple output handles
   - Each output labeled (e.g., "Yes", "No")
   - Edges connect to correct outputs

### What to Check
- ✅ Multiple handles appear
- ✅ Handles are positioned correctly
- ✅ Edges connect properly
- ✅ No overlapping handles

---

## Troubleshooting

### Issue: 400 Bad Request Error
**Solution**: 
- Check that `/api/console/workflows/from-blueprint/route.ts` has the correct payload handling
- Verify blueprint page sends: `workflow_id`, `workflow_title`, `workflow_steps`, `diagnostic_context`, `company_name`

### Issue: Old Editor UI Still Shows
**Solution**:
- Check that `/workflows/[id]/page.tsx` renders `N8nWorkflowCanvas` for n8n IDs
- Verify n8n ID detection regex: `/^[a-zA-Z0-9]{8,32}$/`
- Clear browser cache and reload

### Issue: Right-side Panel Not Showing
**Solution**:
- Check that `WorkflowCanvas.tsx` imports `StepInspector`
- Verify `activeTab === 'canvas'` condition for panel visibility
- Check browser console for errors

### Issue: Nodes Not Rendering
**Solution**:
- Check that `nodeTypes` is defined: `{ workflowStep: WorkflowStepNode }`
- Verify `n8nMapper.ts` creates nodes with `type: 'workflowStep'`
- Check browser console for React Flow errors

### Issue: Changes Not Saving
**Solution**:
- Check that "Save changes" button is enabled
- Verify n8n API is accessible
- Check browser console for fetch errors
- Verify n8n workflow ID is valid

---

## Console Checks

### Expected Console Output
```
✅ No errors
✅ No warnings about missing props
✅ No React Flow warnings
✅ Fetch requests to /api/n8n/workflow/{id} succeed
```

### Common Console Errors to Avoid
```
❌ "Cannot read property 'data' of undefined" - Node data missing
❌ "nodeTypes is not defined" - Missing nodeTypes setup
❌ "StepInspector is not a function" - Import error
❌ "HTTP 400" - Payload mismatch
```

---

## Performance Checks

### Expected Performance
- Page load: < 2 seconds
- Node selection: Instant
- Panel update: < 100ms
- Save to n8n: 1-2 seconds

### What to Monitor
- Network tab: Check fetch requests
- Performance tab: Check for long tasks
- Memory: Should not grow unbounded

---

## Success Criteria

✅ **All tests pass** if:
1. Generate workflow works without 400 error
2. New UI renders with compact cards
3. Right-side panel works
4. Node selection works
5. Editing and saving works
6. Source badges appear
7. No console errors
8. No crashes

---

## Next Steps After Testing

If all tests pass:
1. ✅ Phase 1 is complete
2. Ready for Phase 2 (full n8n integration)
3. Ready for Phase 3 (advanced features)

If tests fail:
1. Check troubleshooting section
2. Review file modifications
3. Check browser console for errors
4. Verify all imports are correct
