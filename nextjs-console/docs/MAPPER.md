# n8n ↔ ReactFlow Mapper Documentation

The mapper library (`nextjs-console/lib/n8nMapper.ts`) provides bidirectional conversion between n8n workflow format and ReactFlow canvas format.

## Overview

The mapper exports two main functions:

- `n8nToReactFlow(workflow: N8nWorkflow): { nodes: Node[], edges: Edge[] }` - Convert n8n to ReactFlow
- `reactFlowToN8n(nodes: Node[], edges: Edge[], baseWorkflow: N8nWorkflow): N8nWorkflow` - Convert ReactFlow to n8n

These functions enable seamless synchronization between the n8n data model and the ReactFlow canvas visualization.

## Data Structure Mapping

### n8n to ReactFlow

The mapper converts n8n nodes to ReactFlow nodes with the following mapping:

| n8n Property | ReactFlow Property | Notes |
|--------------|-------------------|-------|
| `node.id` | `node.id` | Preserved as-is |
| `node.name` | `node.data.label` | Display name in canvas |
| `node.type` | `node.type` | Mapped to ReactFlow node type |
| `node.position` | `node.position` | Canvas coordinates |
| `node.parameters` | `node.data.tool`, `node.data.output` | Tool configuration |
| `node.disabled` | `node.data.disabled` | Disabled state |

### ReactFlow to n8n

The mapper converts ReactFlow nodes back to n8n format:

| ReactFlow Property | n8n Property | Notes |
|-------------------|--------------|-------|
| `node.id` | `node.id` | Preserved as-is |
| `node.data.label` | `node.name` | Display name |
| `node.type` | `node.type` | Node type |
| `node.position` | `node.position` | Canvas coordinates |
| `node.data.tool` | `node.parameters.resource` | Tool type |
| `node.data.output` | `node.parameters.output` | Output configuration |

### Connections

Connections are converted between n8n and ReactFlow edge formats:

**n8n Connections:**
```json
{
  "trigger-1": {
    "main": [
      [
        {
          "node": "step-1",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
}
```

**ReactFlow Edges:**
```json
[
  {
    "id": "trigger-1-step-1",
    "source": "trigger-1",
    "target": "step-1",
    "animated": true
  }
]
```

## Function Reference

### n8nToReactFlow(workflow: N8nWorkflow)

Convert an n8n workflow to ReactFlow nodes and edges.

**Parameters:**
- `workflow` (N8nWorkflow) - The n8n workflow object

**Returns:** `{ nodes: Node[], edges: Edge[] }`

**Example:**

```typescript
import { n8nToReactFlow } from '@/lib/n8nMapper'
import { getWorkflow } from '@/lib/n8n'

// Fetch workflow from n8n
const workflow = await getWorkflow('sdVzJXaKnmFQUUbo')

// Convert to ReactFlow format
const { nodes, edges } = n8nToReactFlow(workflow)

// Display in canvas
setNodes(nodes)
setEdges(edges)
```

**Detailed Example:**

```typescript
const workflow = {
  id: 'workflow-1',
  name: 'My Workflow',
  nodes: [
    {
      id: 'trigger-1',
      name: 'Manual Trigger',
      type: 'n8n-nodes-base.manualTrigger',
      position: { x: 100, y: 100 },
      parameters: {},
      disabled: false
    },
    {
      id: 'step-1',
      name: 'HTTP Request',
      type: 'n8n-nodes-base.httpRequest',
      position: { x: 300, y: 100 },
      parameters: {
        url: 'https://api.example.com/data',
        method: 'GET'
      },
      disabled: false
    }
  ],
  connections: {
    'trigger-1': {
      main: [
        [
          {
            node: 'step-1',
            type: 'main',
            index: 0
          }
        ]
      ]
    }
  },
  settings: {},
  active: false
}

const { nodes, edges } = n8nToReactFlow(workflow)

// Result:
// nodes = [
//   {
//     id: 'trigger-1',
//     data: { label: 'Manual Trigger', type: 'trigger' },
//     position: { x: 100, y: 100 },
//     type: 'triggerNode'
//   },
//   {
//     id: 'step-1',
//     data: { label: 'HTTP Request', tool: 'httpRequest', type: 'step' },
//     position: { x: 300, y: 100 },
//     type: 'stepNode'
//   }
// ]
//
// edges = [
//   {
//     id: 'trigger-1-step-1',
//     source: 'trigger-1',
//     target: 'step-1',
//     animated: true
//   }
// ]
```

**Edge Cases Handled:**

- Missing node positions (defaults to { x: 0, y: 0 })
- Undefined parameters (defaults to {})
- Empty connections (returns empty edges array)
- Disabled nodes (preserves disabled state)

---

### reactFlowToN8n(nodes: Node[], edges: Edge[], baseWorkflow: N8nWorkflow)

Convert ReactFlow nodes and edges back to n8n workflow format.

**Parameters:**
- `nodes` (Node[]) - ReactFlow nodes
- `edges` (Edge[]) - ReactFlow edges
- `baseWorkflow` (N8nWorkflow) - Original n8n workflow (for metadata)

**Returns:** N8nWorkflow

**Example:**

```typescript
import { reactFlowToN8n } from '@/lib/n8nMapper'

// Get current canvas state
const nodes = getNodes()
const edges = getEdges()

// Convert back to n8n format
const updatedWorkflow = reactFlowToN8n(nodes, edges, baseWorkflow)

// Save to n8n
await updateWorkflow('sdVzJXaKnmFQUUbo', updatedWorkflow)
```

**Detailed Example:**

```typescript
const nodes = [
  {
    id: 'trigger-1',
    data: { label: 'Manual Trigger', type: 'trigger' },
    position: { x: 100, y: 100 },
    type: 'triggerNode'
  },
  {
    id: 'step-1',
    data: { label: 'Updated HTTP Request', tool: 'httpRequest', type: 'step' },
    position: { x: 300, y: 100 },
    type: 'stepNode'
  }
]

const edges = [
  {
    id: 'trigger-1-step-1',
    source: 'trigger-1',
    target: 'step-1',
    animated: true
  }
]

const baseWorkflow = {
  id: 'workflow-1',
  name: 'My Workflow',
  nodes: [...],
  connections: {...},
  settings: {},
  active: false
}

const updatedWorkflow = reactFlowToN8n(nodes, edges, baseWorkflow)

// Result:
// {
//   id: 'workflow-1',
//   name: 'My Workflow',
//   nodes: [
//     {
//       id: 'trigger-1',
//       name: 'Manual Trigger',
//       type: 'n8n-nodes-base.manualTrigger',
//       position: { x: 100, y: 100 },
//       parameters: {},
//       disabled: false
//     },
//     {
//       id: 'step-1',
//       name: 'Updated HTTP Request',
//       type: 'n8n-nodes-base.httpRequest',
//       position: { x: 300, y: 100 },
//       parameters: {
//         resource: 'httpRequest',
//         output: undefined
//       },
//       disabled: false
//     }
//   ],
//   connections: {
//     'trigger-1': {
//       main: [
//         [
//           {
//             node: 'step-1',
//             type: 'main',
//             index: 0
//           }
//         ]
//       ]
//     }
//   },
//   settings: {},
//   active: false
// }
```

**Important:** The `baseWorkflow` parameter is required to preserve workflow metadata (name, settings, etc.). Only the nodes and connections are updated from the ReactFlow state.

**Edge Cases Handled:**

- Missing node positions (preserved from base workflow)
- Undefined parameters (preserved from base workflow)
- Disconnected nodes (creates empty connections)
- Removed nodes (removed from connections)

---

## Round-Trip Conversion

The mapper is designed to preserve data through round-trip conversions:

```typescript
// Start with n8n workflow
const original = await getWorkflow(id)

// Convert to ReactFlow
const { nodes, edges } = n8nToReactFlow(original)

// Convert back to n8n
const roundTrip = reactFlowToN8n(nodes, edges, original)

// Should be equivalent
expect(roundTrip.nodes).toEqual(original.nodes)
expect(roundTrip.connections).toEqual(original.connections)
```

This ensures that:

1. No data is lost during conversion
2. Edits can be made in ReactFlow and saved back to n8n
3. Multiple round-trips don't corrupt data

---

## Node Type Mapping

The mapper handles various n8n node types:

| n8n Type | ReactFlow Type | Display |
|----------|----------------|---------|
| `n8n-nodes-base.manualTrigger` | `triggerNode` | Manual Trigger |
| `n8n-nodes-base.httpRequest` | `stepNode` | HTTP Request |
| `n8n-nodes-base.code` | `stepNode` | Code |
| `n8n-nodes-base.set` | `stepNode` | Set |
| `n8n-nodes-base.merge` | `stepNode` | Merge |
| (any other) | `stepNode` | Generic Step |

---

## Usage Patterns

### Pattern 1: Load and Display

```typescript
// Load workflow
const workflow = await getWorkflow(id)

// Convert to canvas format
const { nodes, edges } = n8nToReactFlow(workflow)

// Display
setNodes(nodes)
setEdges(edges)

// Cache for offline use
localStorage.setItem(`workflow_${id}`, JSON.stringify(workflow))
```

### Pattern 2: Edit and Save

```typescript
// Get current canvas state
const nodes = getNodes()
const edges = getEdges()

// Convert back to n8n format
const updated = reactFlowToN8n(nodes, edges, baseWorkflow)

// Save to n8n
try {
  await updateWorkflow(id, updated)
  setSyncStatus('synced')
} catch (error) {
  setSyncStatus('failed')
}
```

### Pattern 3: Conflict Resolution

```typescript
// Local version
const localWorkflow = reactFlowToN8n(localNodes, localEdges, baseWorkflow)

// n8n version
const n8nWorkflow = await getWorkflow(id)

// Compare
if (JSON.stringify(localWorkflow) !== JSON.stringify(n8nWorkflow)) {
  // Show merge dialog
  showMergeDialog(localWorkflow, n8nWorkflow)
}
```

### Pattern 4: Validation

```typescript
// Validate workflow structure
const { nodes, edges } = n8nToReactFlow(workflow)

if (nodes.length === 0) {
  showError('Workflow has no nodes')
  return
}

if (edges.length === 0) {
  showWarning('Workflow has no connections')
}

// Proceed with display
setNodes(nodes)
setEdges(edges)
```

---

## Best Practices

### 1. Always Preserve Base Workflow

```typescript
// ✅ Good
const updated = reactFlowToN8n(nodes, edges, baseWorkflow)

// ❌ Bad
const updated = reactFlowToN8n(nodes, edges, {}) // Loses metadata
```

### 2. Handle Edge Cases

```typescript
// ✅ Good
const { nodes, edges } = n8nToReactFlow(workflow)
if (nodes.length === 0) {
  showError('Empty workflow')
  return
}

// ❌ Bad
const { nodes, edges } = n8nToReactFlow(workflow)
setNodes(nodes) // May crash if empty
```

### 3. Cache Workflows

```typescript
// ✅ Good
const cached = localStorage.getItem(`workflow_${id}`)
if (cached) {
  const workflow = JSON.parse(cached)
  const { nodes, edges } = n8nToReactFlow(workflow)
  setNodes(nodes)
  setEdges(edges)
}

// ❌ Bad
const { nodes, edges } = n8nToReactFlow(workflow) // No caching
```

### 4. Validate After Conversion

```typescript
// ✅ Good
const updated = reactFlowToN8n(nodes, edges, baseWorkflow)
if (!updated.nodes || updated.nodes.length === 0) {
  showError('Invalid workflow')
  return
}
await updateWorkflow(id, updated)

// ❌ Bad
const updated = reactFlowToN8n(nodes, edges, baseWorkflow)
await updateWorkflow(id, updated) // No validation
```

### 5. Preserve User Edits

```typescript
// ✅ Good
const nodes = getNodes()
const edges = getEdges()
const updated = reactFlowToN8n(nodes, edges, baseWorkflow)
// User edits are preserved in nodes/edges

// ❌ Bad
const updated = reactFlowToN8n([], [], baseWorkflow) // Loses edits
```

---

## Testing

The mapper is tested with:

- Unit tests for conversion accuracy
- Round-trip tests to verify data preservation
- Edge case tests for missing/undefined values
- Integration tests with real workflows

See `nextjs-console/__tests__/n8nMapper.unit.test.ts` and `nextjs-console/__tests__/mapper.properties.test.ts` for test examples.
