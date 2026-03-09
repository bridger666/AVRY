# Phase 2 End-to-End Testing Guide

## Overview
This guide provides step-by-step instructions to validate the n8n Workflow Sync integration in the workflow detail page. All tests should be performed with the Next.js dev server running on port 3000 and n8n accessible at http://43.156.108.96:5678.

## Prerequisites

### Environment Setup
- ✅ Next.js dev server running: `npm run dev` (port 3000)
- ✅ n8n instance running at: http://43.156.108.96:5678
- ✅ Environment variables configured in `.env.local`:
  - `N8N_BASE_URL=http://43.156.108.96:5678`
  - `N8N_API_KEY=<your-api-key>`
  - `N8N_WORKFLOW_ID=sdVzJXaKnmFQUUbo` (or your test workflow ID)

### Test Workflow
- Target workflow ID: `sdVzJXaKnmFQUUbo`
- Expected structure: Trigger + 5 steps
- Status: Should be editable

## Test Execution Plan

### Test 1: Workflow Detection & Page Load

**Objective**: Verify that n8n workflows are correctly detected and the editor loads.

**Steps**:
1. Open browser to: `http://localhost:3000/workflows/sdVzJXaKnmFQUUbo`
2. Wait for page to load (should take ~1-2 seconds)
3. Observe the page header

**Expected Results**:
- ✅ Page shows "n8n Workflow Editor" title (not blueprint workflow view)
- ✅ Header displays "Online" status
- ✅ SyncStatus shows "Synced" (green indicator)
- ✅ ReactFlow canvas is visible with nodes
- ✅ No JavaScript errors in browser console

**Artifacts to Capture**:
- Screenshot: `test1-editor-loaded.png`
- Browser console output (copy & paste)

**Pass Criteria**: All expected results visible, no errors

---

### Test 2: Initial Workflow Fetch

**Objective**: Verify workflow is fetched from n8n on mount and displayed correctly.

**Steps**:
1. From Test 1, observe the canvas
2. Count the nodes visible (should be 6: 1 trigger + 5 steps)
3. Check the browser Network tab for API calls
4. Look for GET request to `/api/n8n/workflow/sdVzJXaKnmFQUUbo`

**Expected Results**:
- ✅ Canvas displays all nodes from n8n workflow
- ✅ Nodes are arranged vertically (trigger at top, steps below)
- ✅ Network tab shows GET request with 200 status
- ✅ Response contains workflow data with nodes and connections
- ✅ No 401/403/404 errors

**Artifacts to Capture**:
- Screenshot: `test2-canvas-nodes.png`
- Network tab screenshot showing GET request
- Response JSON (copy from Network tab)

**Pass Criteria**: All nodes visible, GET request successful

---

### Test 3: SyncStatus State Machine

**Objective**: Verify SyncStatus component correctly reflects workflow state.

**Steps**:
1. From Test 2, observe the SyncStatus indicator in header
2. Reload the page (Ctrl+R)
3. Watch the status during load:
   - Should show "Loading from n8n..." briefly
   - Then transition to "Online" + "Synced"
4. Move a node slightly in the canvas
5. Observe SyncStatus change

**Expected Results**:
- ✅ Initial load shows loading state
- ✅ After fetch completes: "Online" + "Synced" (green)
- ✅ After moving node: "Unsaved changes" (amber)
- ✅ Status indicator color changes (green → amber)
- ✅ No errors in console

**Artifacts to Capture**:
- Screenshot: `test3-synced-state.png`
- Screenshot: `test3-unsaved-state.png`
- Browser console logs

**Pass Criteria**: All state transitions visible and correct

---

### Test 4: Save Workflow Changes

**Objective**: Verify save functionality and PUT request to n8n.

**Steps**:
1. From Test 3, with unsaved changes visible
2. Click "Save changes" button in header
3. Watch the SyncStatus during save:
   - Should show "Saving..." (animated)
   - Then "Synced" (green) on success
4. Check Network tab for PUT request
5. Verify response status is 200

**Expected Results**:
- ✅ SyncStatus shows "Saving..." with animation
- ✅ PUT request sent to `/api/n8n/workflow/sdVzJXaKnmFQUUbo`
- ✅ Request includes updated workflow data in body
- ✅ Response status is 200
- ✅ SyncStatus returns to "Synced" (green)
- ✅ Success toast appears (check console)
- ✅ No errors in console

**Artifacts to Capture**:
- Screenshot: `test4-saving-state.png`
- Screenshot: `test4-synced-after-save.png`
- Network tab PUT request (headers + body + response)
- Browser console logs

**Pass Criteria**: PUT request successful, status transitions correct

---

### Test 5: Verify Changes in n8n UI

**Objective**: Confirm that changes saved from editor are reflected in n8n.

**Steps**:
1. From Test 4, note the node position you changed
2. Open n8n UI: http://43.156.108.96:5678
3. Navigate to workflow with ID `sdVzJXaKnmFQUUbo`
4. Compare node positions with what you see in the editor

**Expected Results**:
- ✅ Node positions match between editor and n8n UI
- ✅ All nodes are in the same layout
- ✅ Connections between nodes are preserved
- ✅ No data loss or corruption

**Artifacts to Capture**:
- Screenshot: `test5-editor-final-state.png`
- Screenshot: `test5-n8n-ui-state.png`

**Pass Criteria**: Node positions match exactly

---

### Test 6: Activate/Deactivate Workflow

**Objective**: Verify workflow status can be changed from editor.

**Steps**:
1. Return to editor: `http://localhost:3000/workflows/sdVzJXaKnmFQUUbo`
2. In header, find the status dropdown (currently shows "Draft" or "Active")
3. Click dropdown and select "Active"
4. Wait for any loading indication
5. Check Network tab for POST request
6. Verify response status is 200

**Expected Results**:
- ✅ Status dropdown changes to "Active"
- ✅ POST request sent to `/api/n8n/workflow/sdVzJXaKnmFQUUbo/activate?action=activate`
- ✅ Response status is 200
- ✅ Success toast appears (check console)
- ✅ No errors in console

**Artifacts to Capture**:
- Screenshot: `test6-editor-active.png`
- Network tab POST request (headers + response)
- Browser console logs

**Pass Criteria**: POST request successful, status updated

---

### Test 7: Verify Activation in n8n UI

**Objective**: Confirm workflow activation is reflected in n8n.

**Steps**:
1. From Test 6, note that workflow is now "Active" in editor
2. Open n8n UI: http://43.156.108.96:5678
3. Navigate to workflow `sdVzJXaKnmFQUUbo`
4. Check the workflow status indicator

**Expected Results**:
- ✅ Workflow shows as "Active" in n8n UI
- ✅ Status matches what you set in editor
- ✅ No errors or warnings

**Artifacts to Capture**:
- Screenshot: `test7-n8n-active.png`

**Pass Criteria**: Workflow status matches editor

---

### Test 8: Deactivate Workflow

**Objective**: Verify deactivation works correctly.

**Steps**:
1. Return to editor
2. In status dropdown, select "Draft"
3. Wait for POST request to complete
4. Check Network tab for POST request with `action=deactivate`

**Expected Results**:
- ✅ Status dropdown changes to "Draft"
- ✅ POST request sent with `action=deactivate`
- ✅ Response status is 200
- ✅ Success toast appears
- ✅ No errors in console

**Artifacts to Capture**:
- Screenshot: `test8-editor-draft.png`
- Network tab POST request

**Pass Criteria**: Deactivation POST request successful

---

### Test 9: Offline Mode - Network Failure

**Objective**: Verify offline mode activates when n8n is unreachable.

**Steps**:
1. Stop or block the n8n server (stop Docker container or process)
2. Reload the editor page: `http://localhost:3000/workflows/sdVzJXaKnmFQUUbo`
3. Wait for page to load
4. Observe the header status

**Expected Results**:
- ✅ Page loads (from localStorage cache)
- ✅ Header shows "Offline (local mode)"
- ✅ Canvas displays workflow from cache
- ✅ Warning toast appears: "n8n offline — editing in local mode"
- ✅ No JavaScript errors (graceful degradation)

**Artifacts to Capture**:
- Screenshot: `test9-offline-header.png`
- Screenshot: `test9-offline-toast.png`
- Browser console logs

**Pass Criteria**: Offline mode activates gracefully

---

### Test 10: Local Editing in Offline Mode

**Objective**: Verify workflow can be edited locally while offline.

**Steps**:
1. From Test 9, with n8n still down
2. Move a node in the canvas
3. Observe SyncStatus change to "Unsaved changes"
4. Click "Save changes" button
5. Observe error handling

**Expected Results**:
- ✅ Node moves successfully
- ✅ SyncStatus shows "Unsaved changes" (amber)
- ✅ Click Save → SyncStatus shows "Saving..."
- ✅ Save fails with error (n8n unreachable)
- ✅ SyncStatus shows "Sync failed — retry" (red)
- ✅ Error message is generic (no API key exposure)
- ✅ Retry button is available

**Artifacts to Capture**:
- Screenshot: `test10-offline-unsaved.png`
- Screenshot: `test10-offline-error.png`
- Browser console logs

**Pass Criteria**: Error handling works, no sensitive data exposed

---

### Test 11: Reconnection & Automatic Sync

**Objective**: Verify automatic sync when n8n comes back online.

**Steps**:
1. From Test 10, with changes pending and n8n still down
2. Restart n8n server (start Docker container or process)
3. Wait 5-10 seconds for reconnection detection
4. Click "Save changes" button again
5. Observe sync completion

**Expected Results**:
- ✅ After n8n restarts, page detects reconnection
- ✅ Header status changes from "Offline" to "Online"
- ✅ Click Save → SyncStatus shows "Saving..."
- ✅ Save succeeds (HTTP 200)
- ✅ SyncStatus returns to "Synced" (green)
- ✅ Success toast appears
- ✅ Changes are persisted in n8n

**Artifacts to Capture**:
- Screenshot: `test11-reconnected.png`
- Screenshot: `test11-synced-after-reconnect.png`
- Network tab PUT request (after reconnection)
- Browser console logs

**Pass Criteria**: Automatic reconnection and sync work

---

### Test 12: Error Handling - Invalid Workflow ID

**Objective**: Verify graceful error handling for invalid IDs.

**Steps**:
1. Navigate to: `http://localhost:3000/workflows/invalid-id-123`
2. Wait for page to load
3. Observe error handling

**Expected Results**:
- ✅ Page shows error message
- ✅ Error message is generic (e.g., "Workflow not found")
- ✅ No sensitive data in error message
- ✅ "Back to Workflows" button is available
- ✅ No JavaScript errors in console

**Artifacts to Capture**:
- Screenshot: `test12-invalid-id-error.png`
- Browser console logs

**Pass Criteria**: Error handled gracefully

---

### Test 13: Error Handling - API Timeout

**Objective**: Verify timeout handling for slow n8n responses.

**Steps**:
1. Simulate slow network (use browser DevTools Network throttling)
2. Set throttling to "Slow 3G" or similar
3. Reload editor page
4. Wait for timeout (should be ~5 seconds)

**Expected Results**:
- ✅ Page waits for timeout
- ✅ After 5 seconds, shows error or falls back to offline mode
- ✅ Error message is generic
- ✅ No sensitive data exposed
- ✅ Retry option available

**Artifacts to Capture**:
- Screenshot: `test13-timeout-error.png`
- Browser console logs

**Pass Criteria**: Timeout handled gracefully

---

### Test 14: Blueprint Workflow Still Works

**Objective**: Verify backward compatibility with blueprint workflows.

**Steps**:
1. Navigate to a blueprint workflow (non-n8n ID)
2. Example: `http://localhost:3000/workflows/wf_1`
3. Wait for page to load

**Expected Results**:
- ✅ Page shows blueprint workflow view (not n8n editor)
- ✅ Displays workflow details, steps, integrations
- ✅ All existing functionality works
- ✅ No errors in console

**Artifacts to Capture**:
- Screenshot: `test14-blueprint-workflow.png`

**Pass Criteria**: Blueprint workflows unaffected

---

## Test Summary Template

Use this template to document your test results:

```
# Phase 2 E2E Test Results

## Environment
- Next.js: http://localhost:3000
- n8n: http://43.156.108.96:5678
- Workflow ID: sdVzJXaKnmFQUUbo
- Test Date: [DATE]
- Tester: [NAME]

## Test Results

### Test 1: Workflow Detection & Page Load
- Status: [PASS/FAIL]
- Notes: [Any issues or observations]

### Test 2: Initial Workflow Fetch
- Status: [PASS/FAIL]
- Notes: [Any issues or observations]

### Test 3: SyncStatus State Machine
- Status: [PASS/FAIL]
- Notes: [Any issues or observations]

### Test 4: Save Workflow Changes
- Status: [PASS/FAIL]
- Notes: [Any issues or observations]

### Test 5: Verify Changes in n8n UI
- Status: [PASS/FAIL]
- Notes: [Any issues or observations]

### Test 6: Activate/Deactivate Workflow
- Status: [PASS/FAIL]
- Notes: [Any issues or observations]

### Test 7: Verify Activation in n8n UI
- Status: [PASS/FAIL]
- Notes: [Any issues or observations]

### Test 8: Deactivate Workflow
- Status: [PASS/FAIL]
- Notes: [Any issues or observations]

### Test 9: Offline Mode - Network Failure
- Status: [PASS/FAIL]
- Notes: [Any issues or observations]

### Test 10: Local Editing in Offline Mode
- Status: [PASS/FAIL]
- Notes: [Any issues or observations]

### Test 11: Reconnection & Automatic Sync
- Status: [PASS/FAIL]
- Notes: [Any issues or observations]

### Test 12: Error Handling - Invalid Workflow ID
- Status: [PASS/FAIL]
- Notes: [Any issues or observations]

### Test 13: Error Handling - API Timeout
- Status: [PASS/FAIL]
- Notes: [Any issues or observations]

### Test 14: Blueprint Workflow Still Works
- Status: [PASS/FAIL]
- Notes: [Any issues or observations]

## Overall Result
- Total Tests: 14
- Passed: [X]
- Failed: [Y]
- Success Rate: [X/14]

## Issues Found
[List any issues, bugs, or unexpected behavior]

## Recommendations
[Any improvements or next steps]
```

## Troubleshooting

### Page Won't Load
- Check if Next.js dev server is running: `npm run dev`
- Check if port 3000 is available
- Check browser console for errors

### Workflow Not Fetching
- Verify n8n is running at http://43.156.108.96:5678
- Check if N8N_API_KEY is valid
- Check if workflow ID is correct
- Check browser Network tab for API errors

### Save Not Working
- Verify n8n is accessible
- Check Network tab for PUT request
- Check response status and body
- Look for error messages in console

### Offline Mode Not Activating
- Verify n8n is actually down
- Check browser console for network errors
- Check localStorage for cached workflow
- Try reloading page

### Status Dropdown Not Working
- Check Network tab for POST request
- Verify response status is 200
- Check for error messages in console
- Try refreshing page

## Performance Benchmarks

Expected performance metrics:
- Page load: < 2 seconds
- Workflow fetch: < 500ms
- Canvas render: < 100ms
- Save operation: < 1 second
- Activate/deactivate: < 500ms

## Security Checklist

Verify during testing:
- ✅ API key never appears in browser console
- ✅ API key never appears in Network tab
- ✅ API key never appears in error messages
- ✅ Workflow ID is validated on all routes
- ✅ No sensitive data in localStorage
- ✅ Error messages are generic

## Completion Criteria

All tests pass when:
- ✅ All 14 tests show PASS status
- ✅ No JavaScript errors in console
- ✅ No security issues detected
- ✅ Performance meets benchmarks
- ✅ Offline mode works correctly
- ✅ Blueprint workflows unaffected

## Next Steps After Testing

1. Document any issues found
2. Create bug reports for failures
3. Verify fixes for any issues
4. Proceed to Phase 3 (Unit Tests)
5. Proceed to Phase 4 (Error Handling & Security)
