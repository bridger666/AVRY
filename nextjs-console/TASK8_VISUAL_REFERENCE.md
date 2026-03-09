# TASK 8: Visual Reference - n8n Editor Embedding

## Page Structure (After Embedding)

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Workflows | Workflow Editor                       │  ← Header (existing layout)
├─────────────────────────────────────────────────────────────┤
│ Online / Synced | Canvas | Execution Logs | Status | Save   │  ← Controls (WorkflowCanvas header)
├──────────────────────────────────┬──────────────────────────┤
│                                  │                          │
│                                  │                          │
│      Canvas Area                 │   Edit Step Panel        │
│   (ReactFlow with nodes)         │   (StepInspector)        │
│                                  │                          │
│                                  │                          │
│                                  │                          │
└──────────────────────────────────┴──────────────────────────┘
```

## Component Hierarchy

```
WorkflowDetailPage (/workflows/[id])
├── n8nWorkflowContainer (full height flex)
│   ├── n8nHeader
│   │   ├── Back button
│   │   └── "Workflow Editor" title
│   └── n8nCanvasWrapper (flex: 1)
│       └── WorkflowCanvas
│           ├── Header (compact, integrated)
│           │   ├── Status indicator
│           │   ├── Canvas/Execution Logs tabs
│           │   ├── Show Raw JSON (dev-only)
│           │   ├── Status dropdown
│           │   └── Save button
│           ├── Canvas area
│           │   └── ReactFlow with WorkflowStepNode cards
│           ├── Right panel
│           │   └── StepInspector
│           └── Raw JSON panel (dev-only, bottom)
```

## CSS Layout Flow

```
pageContainer (padding: 0 for n8n)
  ↓
n8nWorkflowContainer (display: flex, flex-direction: column, height: 100vh)
  ↓
n8nHeader (flex-shrink: 0, border-bottom)
  ↓
n8nCanvasWrapper (flex: 1, overflow: hidden, min-height: 0)
  ↓
WorkflowCanvas (flex h-full flex-col)
  ↓
Canvas area (flex-1 overflow-hidden)
  ↓
ReactFlow (full height/width)
```

## Dev-Only UI Visibility

### Development Mode
```
Header:
  ✓ Show Raw JSON button visible
  
Bottom:
  ✓ Raw JSON panel visible
```

### Production Mode
```
Header:
  ✗ Show Raw JSON button hidden
  
Bottom:
  ✗ Raw JSON panel hidden
```

## User Journey

### Step 1: Workflows List
```
/workflows
├── Workflow 1 (blueprint)
├── Workflow 2 (n8n)
└── Workflow 3 (blueprint)
```

### Step 2: Click Workflow
```
User clicks "Workflow 2 (n8n)"
  ↓
Router navigates to /workflows/{n8n-id}
```

### Step 3: Page Loads
```
WorkflowDetailPage detects n8n ID
  ↓
Renders n8nWorkflowContainer
  ↓
Embeds WorkflowCanvas inside
```

### Step 4: User Sees
```
┌─────────────────────────────────────────┐
│ ← Back to Workflows | Workflow Editor   │
├─────────────────────────────────────────┤
│ Online | Canvas | Execution Logs | ...  │
├──────────────────────┬──────────────────┤
│                      │                  │
│   Canvas with nodes  │  Edit Step panel │
│                      │                  │
└──────────────────────┴──────────────────┘
```

### Step 5: Edit & Save
```
User clicks node
  ↓
StepInspector shows 3 fields
  ↓
User edits fields
  ↓
User clicks "Save Changes"
  ↓
WorkflowCanvas syncs with n8n
```

### Step 6: Navigate Back
```
User clicks "← Back to Workflows"
  ↓
Router navigates to /workflows
  ↓
Returns to workflows list
```

## Comparison: Before vs After

### Before (Separate Page)
```
/workflows/[id]
  ↓
Detects n8n ID
  ↓
Renders n8nWorkflowContainer (separate layout)
  ↓
Shows "n8n Workflow Editor" title
  ↓
Feels disconnected
```

### After (Embedded)
```
/workflows/[id]
  ↓
Detects n8n ID
  ↓
Renders existing pageContainer
  ↓
Embeds WorkflowCanvas inside
  ↓
Shows "Workflow Editor" title (same as blueprint)
  ↓
Feels integrated
```

## Key Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **Layout** | Separate container | Embedded in existing page |
| **Header** | "n8n Workflow Editor" | "Workflow Editor" (consistent) |
| **Dev UI** | Always visible | Hidden in production |
| **Navigation** | Separate back button | Same as other pages |
| **UX Feel** | Disconnected | Integrated |
| **Code** | Duplicate layout | Reused layout |

## Testing Scenarios

### Scenario 1: Generate & Edit
```
1. Go to /blueprint
2. Generate workflow from blueprint
3. Navigate to /workflows/{n8n-id}
4. Verify embedded editor renders
5. Click a node
6. Edit fields in StepInspector
7. Click "Save Changes"
8. Verify sync status updates
```

### Scenario 2: Dev Mode
```
1. Set NODE_ENV=development
2. Open /workflows/{n8n-id}
3. Verify "Show Raw JSON" button visible
4. Click button
5. Verify Raw JSON panel appears at bottom
6. Click button again
7. Verify Raw JSON panel disappears
```

### Scenario 3: Production Mode
```
1. Set NODE_ENV=production
2. Open /workflows/{n8n-id}
3. Verify "Show Raw JSON" button NOT visible
4. Verify Raw JSON panel NOT visible
5. Verify clean, user-facing UI
```

### Scenario 4: Navigation
```
1. Open /workflows/{n8n-id}
2. Click "← Back to Workflows"
3. Verify navigation to /workflows
4. Verify workflows list renders
5. Verify no errors in console
```

---

## Summary

The n8n editor is now seamlessly embedded in the existing Workflow detail layout, providing a unified and cohesive user experience. Dev-only UI elements are properly hidden in production, and the page structure is clean and maintainable.

**Status**: ✅ Ready for testing
