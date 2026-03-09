# n8n Client Library Documentation

The n8n client library (`nextjs-console/lib/n8n.ts`) provides typed helper functions for interacting with n8n workflows through the secure API proxy layer.

## Overview

The client library exports five main functions:

- `getWorkflow(id: string): Promise<N8nWorkflow>` - Fetch a workflow
- `updateWorkflow(id: string, data: N8nWorkflow): Promise<N8nWorkflow>` - Update a workflow
- `activateWorkflow(id: string): Promise<void>` - Activate a workflow
- `deactivateWorkflow(id: string): Promise<void>` - Deactivate a workflow
- `getExecutions(workflowId: string, limit?: number): Promise<N8nExecution[]>` - Fetch execution logs

All functions:

- Use the `/api/n8n/...` proxy routes (never direct n8n calls)
- Implement 5-second timeouts with automatic retry
- Throw typed `N8nError` on failure
- Never expose the API key to the browser

## Type Definitions

### N8nWorkflow

```typescript
interface N8nWorkflow {
  id: string
  name: string
  nodes: N8nNode[]
  connections: N8nConnections
  settings: N8nSettings
  active: boolean
  createdAt: string
  updatedAt: string
}
```

### N8nNode

```typescript
interface N8nNode {
  id: string
  name: string
  type: string
  position: { x: number; y: number }
  parameters: Record<string, any>
  disabled?: boolean
}
```

### N8nConnections

```typescript
interface N8nConnections {
  [sourceNodeId: string]: {
    [outputIndex: number]: Array<{
      node: string
      type: string
      index: number
    }>
  }
}
```

### N8nSettings

```typescript
interface N8nSettings {
  timezone?: string
  saveDataErrorExecution?: string
  saveDataSuccessExecution?: string
}
```

### N8nExecution

```typescript
interface N8nExecution {
  id: string
  workflowId: string
  status: 'success' | 'error' | 'running'
  startTime: string
  endTime?: string
  error?: string
  data?: Record<string, any>
}
```

### N8nError

```typescript
interface N8nError extends Error {
  message: string
  status: number
  code?: string
}
```

## Function Reference

### getWorkflow(id: string)

Fetch a workflow from n8n.

**Parameters:**
- `id` (string) - The workflow ID

**Returns:** Promise<N8nWorkflow>

**Throws:** N8nError on failure

**Example:**

```typescript
import { getWorkflow } from '@/lib/n8n'

try {
  const workflow = await getWorkflow('sdVzJXaKnmFQUUbo')
  console.log(`Loaded workflow: ${workflow.name}`)
  console.log(`Nodes: ${workflow.nodes.length}`)
} catch (error) {
  if (error.status === 401) {
    console.error('Authentication failed - check API key')
  } else if (error.status === 404) {
    console.error('Workflow not found')
  } else if (error.status === 503) {
    console.error('n8n is offline - using cached data')
  } else {
    console.error(`Error: ${error.message}`)
  }
}
```

**Error Handling:**

| Status | Meaning | Action |
|--------|---------|--------|
| 401 | Authentication failed | Check API key configuration |
| 404 | Workflow not found | Verify workflow ID |
| 503 | n8n offline | Fall back to cached data |
| 504 | Request timeout | Retry or use cached data |

---

### updateWorkflow(id: string, data: N8nWorkflow)

Update a workflow in n8n.

**Parameters:**
- `id` (string) - The workflow ID
- `data` (N8nWorkflow) - The updated workflow object

**Returns:** Promise<N8nWorkflow>

**Throws:** N8nError on failure

**Example:**

```typescript
import { updateWorkflow } from '@/lib/n8n'
import { reactFlowToN8n } from '@/lib/n8nMapper'

try {
  // Get current ReactFlow state
  const nodes = getNodes()
  const edges = getEdges()

  // Map to n8n format
  const updatedWorkflow = reactFlowToN8n(nodes, edges, baseWorkflow)

  // Save to n8n
  const saved = await updateWorkflow('sdVzJXaKnmFQUUbo', updatedWorkflow)
  console.log('Workflow saved successfully')

  // Update UI
  setSyncStatus('synced')
  showSuccessToast('Changes saved')
} catch (error) {
  if (error.status === 401) {
    showErrorToast('Authentication failed')
  } else if (error.status === 503) {
    showErrorToast('n8n is offline - changes saved locally')
  } else {
    showErrorToast(`Save failed: ${error.message}`)
  }
}
```

**Important:** Always pass the complete workflow object, including all metadata (name, settings, etc.). The function will merge your changes with the existing workflow structure.

**Error Handling:**

| Status | Meaning | Action |
|--------|---------|--------|
| 400 | Invalid payload | Check workflow structure |
| 401 | Authentication failed | Check API key |
| 404 | Workflow not found | Verify workflow ID |
| 503 | n8n offline | Cache changes locally |
| 504 | Request timeout | Retry with exponential backoff |

---

### activateWorkflow(id: string)

Activate a workflow in n8n.

**Parameters:**
- `id` (string) - The workflow ID

**Returns:** Promise<void>

**Throws:** N8nError on failure

**Example:**

```typescript
import { activateWorkflow } from '@/lib/n8n'

try {
  await activateWorkflow('sdVzJXaKnmFQUUbo')
  console.log('Workflow activated')

  // Update UI
  setStatus('Active')
  setStatusColor('green')
  showSuccessToast('Workflow activated')
} catch (error) {
  if (error.status === 401) {
    showErrorToast('Authentication failed')
  } else if (error.status === 404) {
    showErrorToast('Workflow not found')
  } else {
    showErrorToast(`Activation failed: ${error.message}`)
  }

  // Revert UI
  setStatus('Draft')
}
```

**Error Handling:**

| Status | Meaning | Action |
|--------|---------|--------|
| 401 | Authentication failed | Check API key |
| 404 | Workflow not found | Verify workflow ID |
| 503 | n8n offline | Show offline message |
| 504 | Request timeout | Retry or show error |

---

### deactivateWorkflow(id: string)

Deactivate a workflow in n8n.

**Parameters:**
- `id` (string) - The workflow ID

**Returns:** Promise<void>

**Throws:** N8nError on failure

**Example:**

```typescript
import { deactivateWorkflow } from '@/lib/n8n'

try {
  await deactivateWorkflow('sdVzJXaKnmFQUUbo')
  console.log('Workflow deactivated')

  // Update UI
  setStatus('Draft')
  setStatusColor('gray')
  showSuccessToast('Workflow deactivated')
} catch (error) {
  if (error.status === 401) {
    showErrorToast('Authentication failed')
  } else if (error.status === 404) {
    showErrorToast('Workflow not found')
  } else {
    showErrorToast(`Deactivation failed: ${error.message}`)
  }

  // Revert UI
  setStatus('Active')
}
```

**Error Handling:**

| Status | Meaning | Action |
|--------|---------|--------|
| 401 | Authentication failed | Check API key |
| 404 | Workflow not found | Verify workflow ID |
| 503 | n8n offline | Show offline message |
| 504 | Request timeout | Retry or show error |

---

### getExecutions(workflowId: string, limit?: number)

Fetch execution logs for a workflow.

**Parameters:**
- `workflowId` (string) - The workflow ID
- `limit` (number, optional, default: 20) - Number of executions to fetch

**Returns:** Promise<N8nExecution[]>

**Throws:** N8nError on failure

**Example:**

```typescript
import { getExecutions } from '@/lib/n8n'

try {
  // Fetch last 50 executions
  const executions = await getExecutions('sdVzJXaKnmFQUUbo', 50)

  // Map to display format
  const rows = executions.map(exec => ({
    id: exec.id,
    status: exec.status,
    statusColor: exec.status === 'success' ? 'green' : exec.status === 'error' ? 'red' : 'yellow',
    startTime: new Date(exec.startTime),
    duration: exec.endTime ? new Date(exec.endTime).getTime() - new Date(exec.startTime).getTime() : null,
    error: exec.error
  }))

  // Display in table
  setExecutions(rows)
} catch (error) {
  if (error.status === 401) {
    showErrorToast('Authentication failed')
  } else if (error.status === 503) {
    showErrorToast('Unable to load execution logs')
  } else {
    showErrorToast(`Error: ${error.message}`)
  }
}
```

**Status Mapping:**

| Status | Color | Meaning |
|--------|-------|---------|
| success | green | Workflow completed successfully |
| error | red | Workflow failed with error |
| running | yellow | Workflow is currently running |

**Error Handling:**

| Status | Meaning | Action |
|--------|---------|--------|
| 401 | Authentication failed | Check API key |
| 404 | Workflow not found | Verify workflow ID |
| 503 | n8n offline | Show fallback message |
| 504 | Request timeout | Retry or show error |

---

## Error Handling Patterns

### Basic Error Handling

```typescript
try {
  const workflow = await getWorkflow(id)
  // Use workflow
} catch (error) {
  console.error(`Error: ${error.message}`)
  console.error(`Status: ${error.status}`)
}
```

### Specific Error Handling

```typescript
try {
  const workflow = await getWorkflow(id)
} catch (error) {
  switch (error.status) {
    case 401:
      // Show auth error banner
      showAuthErrorBanner()
      break
    case 404:
      // Show not found toast
      showErrorToast('Workflow not found')
      break
    case 503:
      // Fall back to offline mode
      useOfflineMode()
      break
    case 504:
      // Retry with backoff
      retryWithBackoff()
      break
    default:
      // Show generic error
      showErrorToast(error.message)
  }
}
```

### Retry Logic

```typescript
async function fetchWithRetry(id: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await getWorkflow(id)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      // Exponential backoff
      const delay = Math.pow(2, i) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
```

### Offline Fallback

```typescript
async function getWorkflowWithFallback(id: string) {
  try {
    return await getWorkflow(id)
  } catch (error) {
    if (error.status === 503 || error.status === 504) {
      // Try to use cached version
      const cached = localStorage.getItem(`workflow_${id}`)
      if (cached) {
        showWarningToast('Using cached workflow - n8n is offline')
        return JSON.parse(cached)
      }
    }
    throw error
  }
}
```

---

## Best Practices

### 1. Always Handle Errors

```typescript
// ✅ Good
try {
  const workflow = await getWorkflow(id)
} catch (error) {
  showErrorToast(error.message)
}

// ❌ Bad
const workflow = await getWorkflow(id) // No error handling
```

### 2. Use Typed Responses

```typescript
// ✅ Good
const workflow: N8nWorkflow = await getWorkflow(id)

// ❌ Bad
const workflow = await getWorkflow(id) // No type info
```

### 3. Cache Workflows Locally

```typescript
// ✅ Good
const cached = localStorage.getItem(`workflow_${id}`)
if (cached) {
  return JSON.parse(cached)
}
const workflow = await getWorkflow(id)
localStorage.setItem(`workflow_${id}`, JSON.stringify(workflow))

// ❌ Bad
const workflow = await getWorkflow(id) // No caching
```

### 4. Implement Retry Logic

```typescript
// ✅ Good
try {
  return await updateWorkflow(id, data)
} catch (error) {
  if (error.status === 504) {
    // Retry once
    return await updateWorkflow(id, data)
  }
  throw error
}

// ❌ Bad
return await updateWorkflow(id, data) // No retry
```

### 5. Show User Feedback

```typescript
// ✅ Good
setSyncStatus('saving')
try {
  await updateWorkflow(id, data)
  setSyncStatus('synced')
  showSuccessToast('Saved')
} catch (error) {
  setSyncStatus('failed')
  showErrorToast(error.message)
}

// ❌ Bad
await updateWorkflow(id, data) // No feedback
```

---

## Testing

The client library is tested with:

- Unit tests for each function
- Error handling tests for all error codes
- Timeout and retry tests
- Integration tests for end-to-end workflows

See `nextjs-console/__tests__/n8n.unit.test.ts` and `nextjs-console/__tests__/n8n.properties.test.ts` for test examples.
