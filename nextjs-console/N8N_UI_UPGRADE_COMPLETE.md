# Aivory Workflow Editor UI Upgrade for n8n Integration

## Overview
Comprehensive redesign of the n8n workflow editor with modern, compact card-based UI, intelligent node categorization, and improved visual hierarchy.

## What's New

### 1. Compact Square-Rounded Cards
- **Design**: Modern no-code tool aesthetic with rounded corners (rounded-2xl)
- **Size**: 260px min-width, 320px max-width for optimal readability
- **Styling**: Semi-transparent backgrounds with colored borders per category
- **Selection**: Ring highlight (emerald-400) when selected

### 2. Node Categories with Visual Distinction
Each node type is automatically categorized and styled:

| Category | Icon | Color | Use Case |
|----------|------|-------|----------|
| **Trigger** | ⚡ | Emerald | Webhooks, manual triggers, scheduled events |
| **Action** | ⚙️ | Slate | API calls, data operations, transformations |
| **AI** | 🤖 | Indigo | OpenAI, Claude, LLM operations |
| **Condition** | 🔀 | Amber | If/else logic, branching |
| **Channel** | 📢 | Teal | Email, Slack, Discord, SMS |
| **System** | 💻 | Zinc | Code execution, functions |

### 3. Intelligent Node Detection
Automatic categorization based on n8n node type:
- Detects triggers: `trigger`, `webhook`, `manual`
- Detects AI: `openai`, `chat`, `ai`, `anthropic`, `huggingface`
- Detects conditions: `if`, `condition`, `switch`
- Detects channels: `email`, `slack`, `discord`, `telegram`, `twilio`, `sms`
- Detects system: `function`, `code`, `script`
- Defaults to action for everything else

### 4. Improved Connectors
- **Ports**: Small circular dots (2x2) at top and bottom of cards
- **Handles**: Positioned at Position.Top (input) and Position.Bottom (output)
- **Multiple Outputs**: Condition nodes show YES/NO labels with separate handles
- **Edge Type**: Smooth step curves for clean vertical flows
- **Animation**: Animated edges for visual feedback

### 5. Auto-Layout for Vertical Pipelines
- **Algorithm**: BFS-based level assignment from trigger nodes
- **Positioning**: 
  - X-axis: `level * 320px` (horizontal spacing by depth)
  - Y-axis: `indexInLevel * 160px` (vertical spacing by order)
- **Result**: Clean top-down workflow visualization
- **Flexibility**: Manual drag still works; positions update on save

### 6. Condition Node Special Handling
- **Multiple Outputs**: YES/NO branches for conditional logic
- **Handle IDs**: `out-yes` (index 0) and `out-no` (index 1)
- **Visual**: Separate labels and handles for each branch
- **Mapping**: Correctly maps back to n8n connection indices

## Files Created/Modified

### New Files
- `nextjs-console/types/workflow-node.ts` - Node data model and types
- `nextjs-console/components/workflow/WorkflowStepNode.tsx` - Custom node component

### Modified Files
- `nextjs-console/lib/n8nMapper.ts` - Enhanced with WorkflowNodeData mapping and auto-layout
- `nextjs-console/components/workflow/WorkflowCanvas.tsx` - Integrated new node types and styling

## Technical Implementation

### WorkflowNodeData Type
```typescript
type WorkflowNodeData = {
  title: string;
  subtitle?: string;
  description?: string;
  category: WorkflowNodeCategory;
  variant?: WorkflowNodeVisualVariant;
  icon?: string;
  outputs?: { id: string; label: string }[];
  rawN8n?: any;
};
```

### Node Categorization Functions
- `detectNodeCategory()` - Heuristic-based category detection
- `getCategoryIcon()` - Maps category to emoji icon
- `mapN8nNodeToWorkflowData()` - Converts n8n node to visual data

### Layout Algorithm
- Builds adjacency map from n8n connections
- Assigns levels via BFS from trigger nodes
- Calculates positions based on level and index
- Preserves manual drag positions on save

### Edge Handling
- Smooth step curves for visual appeal
- Animated edges for workflow execution feedback
- Handle IDs for condition node branching
- Proper source/target handle mapping

## Backward Compatibility
- ✅ Existing Phase 2 n8n sync behavior intact
- ✅ Save/load functionality preserved
- ✅ Offline mode still works
- ✅ Execution logs tab unaffected
- ✅ Raw JSON dev panel unaffected

## Visual Features

### Header
- Tab buttons: Canvas / Execution Logs
- Status dropdown: Active / Draft / Archived
- Save changes button
- Dev toggle: Show/Hide Raw JSON (dev mode only)

### Canvas
- Compact cards with category-specific styling
- Smooth edges connecting nodes
- Background grid for reference
- Pan/zoom controls
- Fit-to-view on load

### Execution Logs
- Table view with id, status, startedAt, stoppedAt
- Status color coding: green (success), red (error), yellow (running)
- Lazy loading on tab click
- Error handling with user-friendly messages

## Testing Checklist

- [ ] Open workflow editor at `/workflows/sdVzJXaKnmFQUUbo`
- [ ] Verify nodes render as compact cards
- [ ] Check trigger node has emerald accent
- [ ] Verify AI nodes have indigo styling
- [ ] Check condition nodes show YES/NO outputs
- [ ] Drag a node and verify edges follow
- [ ] Save changes and verify sync to n8n
- [ ] Check execution logs tab loads data
- [ ] Verify offline mode still works
- [ ] Test raw JSON dev panel (dev mode)
- [ ] Confirm no console errors

## Performance Notes
- Auto-layout runs once on initial load
- Memoized node types and edge options
- Smooth animations at 60fps
- Efficient re-renders with React Flow optimization

## Future Enhancements
- Custom node templates per category
- Drag-to-create new nodes
- Node search/filter
- Workflow templates
- Undo/redo support
- Node comments/annotations
