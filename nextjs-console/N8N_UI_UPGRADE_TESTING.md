# Aivory Workflow Editor UI Upgrade - Visual Testing Guide

## Quick Start
1. Ensure Next.js dev server is running: `npm run dev`
2. Navigate to: `http://localhost:3000/workflows/sdVzJXaKnmFQUUbo`
3. Wait for workflow to load from n8n

## Visual Inspection Checklist

### Node Styling
- [ ] **Trigger Node** (first node)
  - Emerald green border and background
  - ⚡ icon visible
  - "When this happens..." label
  - Compact card format

- [ ] **Action Nodes** (most nodes)
  - Slate gray border and background
  - ⚙️ icon visible
  - "Run action" label
  - Consistent sizing

- [ ] **AI Nodes** (if present)
  - Indigo border and background
  - 🤖 icon visible
  - "AI analysis" label

- [ ] **Condition Nodes** (if present)
  - Amber border and background
  - 🔀 icon visible
  - "Condition" label
  - YES/NO output labels visible

- [ ] **Channel Nodes** (if present)
  - Teal border and background
  - 📢 icon visible
  - "Channel" label

### Connectors & Layout
- [ ] **Top Handles** (input ports)
  - Small circular dots at top of each card
  - Colored to match category
  - Properly positioned

- [ ] **Bottom Handles** (output ports)
  - Single dot for most nodes
  - Multiple dots for condition nodes (YES/NO)
  - Properly positioned

- [ ] **Edges**
  - Smooth curved lines connecting nodes
  - Animated (subtle animation)
  - Vertical flow from top to bottom
  - No overlapping edges

- [ ] **Layout**
  - Trigger node at top
  - Nodes arranged vertically
  - Consistent horizontal spacing
  - Clean, readable arrangement

### Interactions
- [ ] **Drag Node**
  - Click and drag a node
  - Edges follow the node
  - Position updates smoothly
  - No visual glitches

- [ ] **Pan/Zoom**
  - Scroll to zoom in/out
  - Click and drag background to pan
  - Controls visible in bottom-right

- [ ] **Selection**
  - Click a node to select
  - Selected node shows emerald ring
  - Ring has offset for visibility

### Header Controls
- [ ] **Tab Buttons**
  - "Canvas" tab active by default
  - "Execution Logs" tab available
  - Tab switching works smoothly

- [ ] **Status Dropdown**
  - Shows current status (Active/Draft/Archived)
  - Can change status
  - Updates reflect in n8n

- [ ] **Save Button**
  - Enabled when changes exist
  - Disabled while saving
  - Shows success message

- [ ] **Dev Toggle** (dev mode only)
  - "Show Raw JSON" button visible
  - Clicking shows/hides JSON panel
  - JSON displays correctly formatted

### Execution Logs Tab
- [ ] **Tab Click**
  - Switches to Execution Logs view
  - Shows loading indicator
  - Fetches execution data

- [ ] **Execution Table**
  - Displays execution ID
  - Shows status with color coding:
    - Green for success
    - Red for error
    - Yellow for running
  - Shows start and stop times
  - Properly formatted dates

### Offline Mode
- [ ] **Stop n8n Server**
  - Temporarily stop n8n
  - Reload workflow editor
  - Should show "Offline (local mode)"
  - Canvas loads from cache

- [ ] **Restart n8n**
  - Bring n8n back online
  - Click "Save changes"
  - Should sync successfully
  - Status returns to "Online"

### Browser Console
- [ ] **No Errors**
  - Open DevTools (F12)
  - Check Console tab
  - No red error messages
  - No TypeScript errors

- [ ] **No Warnings**
  - Check for yellow warnings
  - Should be minimal/none
  - No React warnings about keys

## Screenshot Locations

Save screenshots to document the upgrade:

1. **Full Editor View**
   - File: `n8n-ui-upgrade-full-view.png`
   - Shows: Entire workflow with all nodes visible

2. **Node Details**
   - File: `n8n-ui-upgrade-node-details.png`
   - Shows: Close-up of different node types

3. **Condition Node**
   - File: `n8n-ui-upgrade-condition-node.png`
   - Shows: YES/NO outputs clearly visible

4. **Execution Logs**
   - File: `n8n-ui-upgrade-execution-logs.png`
   - Shows: Execution table with status colors

5. **Dev Panel**
   - File: `n8n-ui-upgrade-dev-panel.png`
   - Shows: Raw JSON panel (dev mode)

## Performance Testing

### Load Time
- [ ] Initial load < 2 seconds
- [ ] Auto-layout completes instantly
- [ ] No visible lag when dragging nodes

### Responsiveness
- [ ] Smooth 60fps animations
- [ ] No jank when panning/zooming
- [ ] Edges update smoothly when dragging

### Memory
- [ ] No memory leaks on repeated saves
- [ ] Offline mode doesn't consume excessive memory
- [ ] Tab switching doesn't leak resources

## Regression Testing

### Phase 2 Features Still Work
- [ ] Fetch workflow from n8n ✓
- [ ] Save changes to n8n ✓
- [ ] Activate/deactivate workflow ✓
- [ ] Offline mode with local cache ✓
- [ ] Execution logs loading ✓
- [ ] Raw JSON dev panel ✓
- [ ] Sync status indicators ✓
- [ ] Error handling and toasts ✓

## Known Limitations

- Auto-layout is heuristic-based (may not be perfect for complex graphs)
- Manual node positioning is preserved on save
- Condition node YES/NO mapping assumes standard n8n structure
- Edge routing doesn't avoid node overlaps (manual adjustment needed)

## Success Criteria

✅ All visual elements render correctly
✅ Node categorization works as expected
✅ Connectors are properly positioned
✅ Auto-layout creates clean vertical flow
✅ All interactions are smooth and responsive
✅ No console errors or warnings
✅ Phase 2 features still work
✅ Offline mode functions correctly
✅ Performance is acceptable

## Troubleshooting

### Nodes Not Showing
- Check browser console for errors
- Verify n8n server is running
- Try refreshing the page
- Check network tab for failed requests

### Edges Not Connecting
- Verify nodes have proper IDs
- Check n8n connections are valid
- Try dragging nodes to refresh layout
- Check browser console for errors

### Colors Not Showing
- Verify Tailwind CSS is loaded
- Check browser DevTools for CSS errors
- Try clearing browser cache
- Verify no CSS conflicts

### Performance Issues
- Check browser DevTools Performance tab
- Verify no excessive re-renders
- Check for memory leaks
- Try reducing workflow complexity

## Next Steps

After visual testing:
1. Document any issues found
2. Capture screenshots for documentation
3. Test with different workflow types
4. Gather user feedback
5. Plan for future enhancements
