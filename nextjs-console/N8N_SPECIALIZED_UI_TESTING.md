# Aivory Specialized UI Testing Guide

## Quick Start

### 1. Start Dev Server
```bash
cd nextjs-console
npm run dev
```

### 2. Open Workflow
Navigate to: `http://localhost:3000/workflows/sdVzJXaKnmFQUUbo`

### 3. What You'll See
- **Left**: Canvas with 4 workflow steps
- **Right**: Empty "Edit Step" panel (select a step to populate)
- **Steps**:
  1. Trigger (green) - "New client record created..."
  2. Action (gray) - "Pull client data and document attachments..."
  3. AI (purple) - "Run NLP validation on documents..."
  4. Action (gray) - "Identify incomplete records..."

## Visual Testing Checklist

### Canvas Display
- [ ] Trigger card shows: "New client record created with 'Onboarding Initiated' status in Salesforce CRM"
- [ ] Trigger subtitle shows: "When this happens..."
- [ ] Trigger description visible (scroll if needed)
- [ ] Action card 1 shows: "Pull client data and document attachments via Salesforce CRM and SharePoint API endpoints"
- [ ] Action card 1 subtitle shows: "Salesforce REST API, SharePoint Graph API"
- [ ] AI card shows: "Run NLP validation on documents using custom AI model and Google Document AI"
- [ ] AI card subtitle shows: "Google Document AI, Aivory NLP Engine (Python)"
- [ ] Action card 2 shows: "Identify incomplete records using rule-based validation..."
- [ ] All cards have proper colors (green trigger, gray actions, purple AI)

### Inspector Panel
- [ ] Panel is 320px wide on the right
- [ ] Panel has "Edit Step" header
- [ ] Panel shows category label (e.g., "When this happens...")
- [ ] Panel has three input fields:
  - "What happens" (textarea)
  - "Tool / service used" (input)
  - "What this produces" (textarea)
- [ ] "Save Changes" button is visible at bottom

### Interaction Testing

#### Select Trigger Step
1. Click the trigger card (green, top)
2. Verify:
   - [ ] Card shows selection ring
   - [ ] Inspector panel populates with data
   - [ ] "What happens" field shows: "New client record created with 'Onboarding Initiated' status in Salesforce CRM"
   - [ ] "Tool / service used" shows: "When this happens..."
   - [ ] "What this produces" shows the description

#### Edit Trigger Step
1. Click in "What happens" field
2. Add text: " (TEST)"
3. Click "Save Changes"
4. Verify:
   - [ ] Card title updates immediately
   - [ ] Text now shows: "New client record created with 'Onboarding Initiated' status in Salesforce CRM (TEST)"
   - [ ] Workflow marked as unsaved (status shows "Unsaved changes")

#### Edit Other Fields
1. Click "Tool / service used" field
2. Add text: " - TEST"
3. Click "Save Changes"
4. Verify:
   - [ ] Card subtitle updates
   - [ ] Shows: "When this happens... - TEST"

#### Edit Description
1. Click "What this produces" field
2. Add text: " TEST"
3. Click "Save Changes"
4. Verify:
   - [ ] Card description updates
   - [ ] Shows updated text

#### Select Different Steps
1. Click Action card (gray, second)
2. Verify:
   - [ ] Inspector updates with new data
   - [ ] Shows correct fields for this step
   - [ ] Category label shows "Run action"

3. Click AI card (purple, third)
4. Verify:
   - [ ] Inspector updates
   - [ ] Category label shows "AI analysis"

5. Click Action card (gray, fourth)
6. Verify:
   - [ ] Inspector updates
   - [ ] Shows correct data

### Save & Sync Testing

#### Save to n8n
1. Make edits to a step (add " - TEST" to title)
2. Click "Save Changes" in inspector
3. Click global "Save changes" button (top right)
4. Verify:
   - [ ] Status shows "Saving..."
   - [ ] Status changes to "Synced"
   - [ ] Success toast appears
   - [ ] No errors in console

#### Verify in n8n
1. Open n8n: `http://43.156.108.96:5678`
2. Navigate to workflow `sdVzJXaKnmFQUUbo`
3. Verify:
   - [ ] Changes are reflected in n8n
   - [ ] Node names/descriptions updated

### Tab Switching

#### Canvas Tab
1. Click "Canvas" tab (should be active)
2. Verify:
   - [ ] Canvas visible
   - [ ] Inspector panel visible on right

#### Execution Logs Tab
1. Click "Execution Logs" tab
2. Verify:
   - [ ] Canvas hidden
   - [ ] Inspector panel hidden
   - [ ] Execution table loads
   - [ ] Shows execution history

3. Click "Canvas" tab again
4. Verify:
   - [ ] Canvas and inspector reappear
   - [ ] Selected node still selected

### Deselection

#### Click Empty Canvas
1. Click empty area of canvas (not on a node)
2. Verify:
   - [ ] No node selected
   - [ ] Inspector shows: "Select a step on the canvas to edit its details."

#### Click Background
1. Click the background grid area
2. Verify:
   - [ ] Inspector clears
   - [ ] Shows placeholder message

### Other Workflows

#### Test Different Workflow
1. Go to workflows list
2. Select a different workflow (not sdVzJXaKnmFQUUbo)
3. Verify:
   - [ ] Cards show auto-detected titles
   - [ ] Inspector still works
   - [ ] No template metadata = uses heuristic detection
   - [ ] All features work normally

## Browser Console Testing

### Check for Errors
1. Open DevTools (F12)
2. Go to Console tab
3. Verify:
   - [ ] No red error messages
   - [ ] No TypeScript errors
   - [ ] No React warnings

### Check Network
1. Open DevTools Network tab
2. Make edits and save
3. Verify:
   - [ ] PUT request to `/api/n8n/workflow/[id]`
   - [ ] Status 200 (success)
   - [ ] No failed requests

## Performance Testing

### Load Time
- [ ] Page loads in < 2 seconds
- [ ] Canvas renders smoothly
- [ ] No visible lag

### Responsiveness
- [ ] Typing in inspector is smooth
- [ ] Clicking nodes is instant
- [ ] Saving is responsive

### Memory
- [ ] No memory leaks on repeated saves
- [ ] Tab switching doesn't leak memory
- [ ] Inspector updates efficiently

## Regression Testing

### Phase 2 Features
- [ ] Fetch workflow from n8n ✓
- [ ] Save changes to n8n ✓
- [ ] Activate/deactivate workflow ✓
- [ ] Offline mode with local cache ✓
- [ ] Execution logs loading ✓
- [ ] Raw JSON dev panel ✓
- [ ] Sync status indicators ✓
- [ ] Error handling and toasts ✓

### UI Features
- [ ] Compact cards render correctly ✓
- [ ] Node categories show correct colors ✓
- [ ] Connectors/edges display properly ✓
- [ ] Auto-layout works ✓
- [ ] Drag nodes still works ✓

## Screenshots to Capture

1. **Full Editor View**
   - File: `specialized-ui-full-view.png`
   - Shows: Canvas + inspector panel

2. **Inspector with Trigger**
   - File: `specialized-ui-trigger-inspector.png`
   - Shows: Trigger step selected with inspector

3. **Inspector with AI Step**
   - File: `specialized-ui-ai-inspector.png`
   - Shows: AI step selected with inspector

4. **After Edit**
   - File: `specialized-ui-after-edit.png`
   - Shows: Updated card after editing

5. **Execution Logs Tab**
   - File: `specialized-ui-execution-logs.png`
   - Shows: Execution logs tab (inspector hidden)

## Success Criteria

✅ All visual elements render correctly
✅ Inspector panel shows/hides appropriately
✅ Edits update cards immediately
✅ Save to n8n works
✅ Changes persist in n8n
✅ No console errors
✅ Phase 2 features still work
✅ Other workflows still work
✅ Performance is acceptable

## Troubleshooting

### Inspector Not Showing
- Make sure you're on Canvas tab
- Click a node to select it
- Check browser console

### Changes Not Appearing
- Click "Save Changes" in inspector
- Then click global "Save changes"
- Check for error messages

### Wrong Data Showing
- Refresh the page
- Verify workflow ID is correct
- Check n8n connection

### Performance Issues
- Check browser DevTools
- Look for memory leaks
- Try closing other tabs

## Next Steps

After testing:
1. Document any issues found
2. Capture screenshots
3. Test with different workflows
4. Gather user feedback
5. Plan for future enhancements

## Quick Commands

```bash
# Start dev server
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Run linter
npm run lint
```

## Support

For issues:
1. Check this testing guide
2. Review browser console
3. Check n8n server status
4. Review implementation docs

Enjoy the specialized UI! 🚀
