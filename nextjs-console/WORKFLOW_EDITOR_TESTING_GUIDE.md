# Workflow Editor UI - Testing Guide

## Quick Start

### 1. Start Development Server
```bash
cd nextjs-console
npm run dev
```

### 2. Navigate to Workflow Editor
```
http://localhost:3000/workflows/sdVzJXaKnmFQUUbo
```
(Replace `sdVzJXaKnmFQUUbo` with any valid n8n workflow ID)

---

## Visual Verification

### Expected Appearance

**Canvas Area (Left)**
- Compact rounded-square cards (not wide rectangles)
- Each card shows:
  - Category label (e.g., "When this happens...", "Run action")
  - Title text (main action description)
  - Subtitle (tool/service name)
  - Description (what it produces)
- Cards have colored borders based on category
- Selection ring appears when clicked (emerald green)
- Smooth curved connectors between nodes

**Right Panel**
- 320px wide panel on the right side
- Shows when a node is selected
- Three editable sections:
  1. "What happens" - textarea with node title
  2. "Tool / service used" - input with node subtitle
  3. "What this produces" - textarea with node description
- "Save Changes" button at bottom

**Header**
- Status indicator (Online/Offline/Loading)
- Sync status (Synced/Unsaved/Saving)
- Canvas / Execution Logs tabs
- Status dropdown (Active/Draft/Archived)
- "Save changes" button

---

## Interaction Testing

### Test 1: Select a Node
1. Click on any node card
2. **Expected**: 
   - Node gets emerald ring around it
   - Right panel appears with node data
   - Panel shows the node's title, subtitle, description

### Test 2: Edit Node Data
1. Select a node (see Test 1)
2. Click in "What happens" textarea
3. Change the text
4. **Expected**:
   - Text updates in real-time
   - Node card title updates immediately
   - Workflow shows "Unsaved" status

### Test 3: Save Changes
1. Edit a node (see Test 2)
2. Click "Save Changes" button in right panel
3. **Expected**:
   - Node data updates
   - Workflow still shows "Unsaved" (local changes)
4. Click "Save changes" button in header
5. **Expected**:
   - Status changes to "Saving..."
   - After 1-2 seconds: "Synced"
   - Toast message: "Workflow synced with n8n"

### Test 4: Deselect Node
1. Select a node
2. Click on empty canvas area
3. **Expected**:
   - Node loses selection ring
   - Right panel shows "Select a step on the canvas..."

### Test 5: Multiple Nodes
1. Click different nodes in sequence
2. **Expected**:
   - Selection ring moves to new node
   - Right panel updates with new node data
   - Previous node loses selection

---

## Data Persistence Testing

### Test 6: Refresh After Save
1. Edit a node and save (see Test 3)
2. Refresh the page (Cmd+R or F5)
3. **Expected**:
   - Workflow reloads from n8n
   - Changes are persisted
   - Node shows updated data

### Test 7: Offline Mode
1. Disconnect internet or block n8n API
2. Refresh page
3. **Expected**:
   - Status shows "Offline (local mode)"
   - Workflow loads from localStorage
   - Can still edit nodes
   - Changes saved to localStorage

### Test 8: Reconnect After Offline
1. Work in offline mode (see Test 7)
2. Reconnect internet
3. Click "Save changes" button
4. **Expected**:
   - Status changes to "Saving..."
   - Syncs to n8n
   - Status shows "Synced"

---

## Edge Cases

### Test 9: Condition Nodes
1. Find a condition node (if workflow has one)
2. Click on it
3. **Expected**:
   - Node shows YES/NO handles at bottom
   - Edges connect to both YES and NO branches
   - Right panel shows condition data

### Test 10: Large Workflow
1. Open a workflow with 20+ nodes
2. Scroll/pan around canvas
3. **Expected**:
   - No lag or stuttering
   - Smooth panning and zooming
   - All nodes render correctly

### Test 11: Empty Workflow
1. Create or find an empty workflow
2. Navigate to it
3. **Expected**:
   - Canvas shows empty
   - No errors in console
   - Right panel shows "Select a step..."

### Test 12: Error Handling
1. Disconnect internet
2. Try to save changes
3. **Expected**:
   - Error message appears
   - Status shows "Save error"
   - "Retry" button appears
   - Can retry after reconnecting

---

## Performance Testing

### Test 13: Drag Performance
1. Click and drag a node
2. **Expected**:
   - Smooth dragging (60fps)
   - No lag or jank
   - Connectors update smoothly

### Test 14: Large Edit
1. Select a node
2. Paste large text into "What happens" field
3. **Expected**:
   - Text updates smoothly
   - No lag in typing
   - Card resizes if needed

### Test 15: Rapid Saves
1. Edit multiple nodes quickly
2. Click "Save changes" multiple times
3. **Expected**:
   - Requests queue properly
   - No duplicate saves
   - Final state is correct

---

## Browser DevTools Checks

### Console
- [ ] No errors or warnings
- [ ] No 404s for API calls
- [ ] Network requests complete successfully

### Network Tab
- [ ] GET `/api/n8n/workflow/{id}` - 200 OK
- [ ] PUT `/api/n8n/workflow/{id}` - 200 OK (on save)
- [ ] Response times < 2 seconds

### Performance Tab
- [ ] No long tasks (> 50ms)
- [ ] Smooth 60fps animations
- [ ] Memory usage stable

---

## Troubleshooting

### Issue: Nodes appear as rectangles
**Solution**: Check that `WorkflowStepNode` is imported and `nodeTypes` includes it
```javascript
const nodeTypes = useMemo(
  () => ({ workflowStep: WorkflowStepNode }),
  [],
);
```

### Issue: Right panel doesn't appear
**Solution**: Verify `StepInspector` is rendered in the layout
```jsx
{activeTab === 'canvas' && (
  <div className="w-[320px] border-l bg-background/90">
    <StepInspector
      selectedNodeId={selectedNodeId}
      nodeData={selectedNodeData}
      onChange={handleInspectorChange}
    />
  </div>
)}
```

### Issue: Changes don't persist
**Solution**: Verify `handleSave` is called and syncs to n8n
```javascript
const handleSave = useCallback(async () => {
  // ... sync logic
}, [rawWorkflow, nodes, edges, workflowId, saveToLocal, status]);
```

### Issue: Offline mode not working
**Solution**: Check localStorage is accessible and `loadFromLocal` is called
```javascript
const loadFromLocal = useCallback(() => {
  if (typeof window === 'undefined') return false;
  const raw = window.localStorage.getItem(localStorageKey);
  // ... parse and restore
}, [localStorageKey, setNodes, setEdges]);
```

---

## Success Criteria

✅ All tests pass
✅ No console errors
✅ Smooth 60fps performance
✅ Changes persist after refresh
✅ Offline mode works
✅ Error handling works
✅ Visual design matches spec

---

## Screenshots to Capture

1. **Canvas with nodes** - Show compact rounded cards
2. **Selected node** - Show selection ring and right panel
3. **Right panel editing** - Show all three sections
4. **Condition node** - Show YES/NO handles
5. **Offline mode** - Show "Offline" status
6. **Error state** - Show error message and retry button

---

## Reporting Issues

If you find any issues:

1. **Screenshot**: Capture the problem
2. **Console**: Check for errors (F12 → Console)
3. **Network**: Check API calls (F12 → Network)
4. **Steps**: List exact steps to reproduce
5. **Expected**: What should happen
6. **Actual**: What actually happened

---

**Ready to test!** 🚀
