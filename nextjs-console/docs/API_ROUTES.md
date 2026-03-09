# n8n API Routes Documentation

This document describes the server-side API routes that proxy requests to n8n. All routes are located in `nextjs-console/app/api/n8n/` and use Next.js App Router pattern.

## Overview

The API routes provide a secure proxy layer between the frontend and n8n, ensuring the API key is never exposed to the browser. All routes:

- Validate the workflow ID against `process.env.N8N_WORKFLOW_ID`
- Use `process.env.N8N_API_KEY` server-side only
- Implement 5-second timeouts with AbortController
- Return generic error messages (no API key exposure)
- Support same-origin requests only

## Base URL

All routes are relative to the application base URL:

```
/api/n8n/workflow/{id}
/api/n8n/workflow/{id}/activate
/api/n8n/workflow/{id}/deactivate
/api/n8n/workflow/{id}/executions
```

---

## GET /api/n8n/workflow/{id}

Fetch a workflow from n8n.

### Request

```http
GET /api/n8n/workflow/sdVzJXaKnmFQUUbo
```

### Response (200 OK)

```json
{
  "status": "ok",
  "data": {
    "id": "sdVzJXaKnmFQUUbo",
    "name": "AI-Powered Client Onboarding",
    "nodes": [
      {
        "id": "trigger-1",
        "name": "Manual Trigger",
        "type": "n8n-nodes-base.manualTrigger",
        "position": { "x": 100, "y": 100 },
        "parameters": {},
        "disabled": false
      },
      {
        "id": "step-1",
        "name": "HTTP Request",
        "type": "n8n-nodes-base.httpRequest",
        "position": { "x": 300, "y": 100 },
        "parameters": {
          "url": "https://api.example.com/data",
          "method": "GET"
        },
        "disabled": false
      }
    ],
    "connections": {
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
    },
    "settings": {},
    "active": true,
    "createdAt": "2025-03-06T10:00:00Z",
    "updatedAt": "2025-03-06T10:00:00Z"
  }
}
```

### Error Responses

**400 Bad Request** - Invalid workflow ID:
```json
{
  "error": "Invalid workflow ID"
}
```

**401 Unauthorized** - n8n authentication failed:
```json
{
  "error": "n8n auth failed"
}
```

**404 Not Found** - Workflow not found in n8n:
```json
{
  "error": "Workflow not found"
}
```

**503 Service Unavailable** - n8n is offline:
```json
{
  "error": "n8n service unavailable"
}
```

**504 Gateway Timeout** - Request exceeded 5 seconds:
```json
{
  "error": "Request timeout"
}
```

### Usage Example

```typescript
import { getWorkflow } from '@/lib/n8n'

// Fetch workflow
const workflow = await getWorkflow('sdVzJXaKnmFQUUbo')

// Map to ReactFlow format
const { nodes, edges } = n8nToReactFlow(workflow)

// Display in canvas
setNodes(nodes)
setEdges(edges)
```

---

## PUT /api/n8n/workflow/{id}

Update a workflow in n8n.

### Request

```http
PUT /api/n8n/workflow/sdVzJXaKnmFQUUbo
Content-Type: application/json

{
  "nodes": [
    {
      "id": "trigger-1",
      "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger",
      "position": { "x": 100, "y": 100 },
      "parameters": {},
      "disabled": false
    },
    {
      "id": "step-1",
      "name": "Updated HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "position": { "x": 300, "y": 100 },
      "parameters": {
        "url": "https://api.example.com/updated",
        "method": "POST"
      },
      "disabled": false
    }
  ],
  "connections": {
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
  },
  "settings": {},
  "name": "AI-Powered Client Onboarding"
}
```

### Response (200 OK)

```json
{
  "status": "ok",
  "data": {
    "id": "sdVzJXaKnmFQUUbo",
    "name": "AI-Powered Client Onboarding",
    "nodes": [
      {
        "id": "trigger-1",
        "name": "Manual Trigger",
        "type": "n8n-nodes-base.manualTrigger",
        "position": { "x": 100, "y": 100 },
        "parameters": {},
        "disabled": false
      },
      {
        "id": "step-1",
        "name": "Updated HTTP Request",
        "type": "n8n-nodes-base.httpRequest",
        "position": { "x": 300, "y": 100 },
        "parameters": {
          "url": "https://api.example.com/updated",
          "method": "POST"
        },
        "disabled": false
      }
    ],
    "connections": {
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
    },
    "settings": {},
    "active": true,
    "createdAt": "2025-03-06T10:00:00Z",
    "updatedAt": "2025-03-06T10:30:00Z"
  }
}
```

### Error Responses

**400 Bad Request** - Invalid workflow ID or payload:
```json
{
  "error": "Invalid workflow ID"
}
```

**401 Unauthorized** - n8n authentication failed:
```json
{
  "error": "n8n auth failed"
}
```

**404 Not Found** - Workflow not found:
```json
{
  "error": "Workflow not found"
}
```

**503 Service Unavailable** - n8n is offline:
```json
{
  "error": "n8n service unavailable"
}
```

**504 Gateway Timeout** - Request exceeded 5 seconds:
```json
{
  "error": "Request timeout"
}
```

### Usage Example

```typescript
import { updateWorkflow } from '@/lib/n8n'
import { reactFlowToN8n } from '@/lib/n8nMapper'

// Get current ReactFlow state
const nodes = getNodes()
const edges = getEdges()

// Map back to n8n format
const updatedWorkflow = reactFlowToN8n(nodes, edges, baseWorkflow)

// Save to n8n
const saved = await updateWorkflow('sdVzJXaKnmFQUUbo', updatedWorkflow)

// Update sync status
setSyncStatus('synced')
```

---

## POST /api/n8n/workflow/{id}/activate

Activate a workflow in n8n.

### Request

```http
POST /api/n8n/workflow/sdVzJXaKnmFQUUbo/activate
```

### Response (200 OK)

```json
{
  "status": "ok",
  "active": true
}
```

### Error Responses

**400 Bad Request** - Invalid workflow ID:
```json
{
  "error": "Invalid workflow ID"
}
```

**401 Unauthorized** - n8n authentication failed:
```json
{
  "error": "n8n auth failed"
}
```

**404 Not Found** - Workflow not found:
```json
{
  "error": "Workflow not found"
}
```

**503 Service Unavailable** - n8n is offline:
```json
{
  "error": "n8n service unavailable"
}
```

**504 Gateway Timeout** - Request exceeded 5 seconds:
```json
{
  "error": "Request timeout"
}
```

### Usage Example

```typescript
import { activateWorkflow } from '@/lib/n8n'

// Activate workflow
await activateWorkflow('sdVzJXaKnmFQUUbo')

// Update UI
setStatus('Active')
setStatusColor('green')
```

---

## POST /api/n8n/workflow/{id}/deactivate

Deactivate a workflow in n8n.

### Request

```http
POST /api/n8n/workflow/sdVzJXaKnmFQUUbo/deactivate
```

### Response (200 OK)

```json
{
  "status": "ok",
  "active": false
}
```

### Error Responses

**400 Bad Request** - Invalid workflow ID:
```json
{
  "error": "Invalid workflow ID"
}
```

**401 Unauthorized** - n8n authentication failed:
```json
{
  "error": "n8n auth failed"
}
```

**404 Not Found** - Workflow not found:
```json
{
  "error": "Workflow not found"
}
```

**503 Service Unavailable** - n8n is offline:
```json
{
  "error": "n8n service unavailable"
}
```

**504 Gateway Timeout** - Request exceeded 5 seconds:
```json
{
  "error": "Request timeout"
}
```

### Usage Example

```typescript
import { deactivateWorkflow } from '@/lib/n8n'

// Deactivate workflow
await deactivateWorkflow('sdVzJXaKnmFQUUbo')

// Update UI
setStatus('Draft')
setStatusColor('gray')
```

---

## GET /api/n8n/workflow/{id}/executions

Fetch execution logs for a workflow.

### Request

```http
GET /api/n8n/workflow/sdVzJXaKnmFQUUbo/executions?limit=20
```

### Query Parameters

- `limit` (optional, default: 20) - Number of executions to fetch (max: 100)

### Response (200 OK)

```json
{
  "status": "ok",
  "executions": [
    {
      "id": "exec-123",
      "workflowId": "sdVzJXaKnmFQUUbo",
      "status": "success",
      "startTime": "2025-03-06T10:00:00Z",
      "endTime": "2025-03-06T10:00:05Z",
      "error": null,
      "data": {
        "output": "Success"
      }
    },
    {
      "id": "exec-122",
      "workflowId": "sdVzJXaKnmFQUUbo",
      "status": "error",
      "startTime": "2025-03-06T09:55:00Z",
      "endTime": "2025-03-06T09:55:02Z",
      "error": "HTTP request failed",
      "data": null
    },
    {
      "id": "exec-121",
      "workflowId": "sdVzJXaKnmFQUUbo",
      "status": "running",
      "startTime": "2025-03-06T09:50:00Z",
      "endTime": null,
      "error": null,
      "data": null
    }
  ]
}
```

### Error Responses

**400 Bad Request** - Invalid workflow ID:
```json
{
  "error": "Invalid workflow ID"
}
```

**401 Unauthorized** - n8n authentication failed:
```json
{
  "error": "n8n auth failed"
}
```

**404 Not Found** - Workflow not found:
```json
{
  "error": "Workflow not found"
}
```

**503 Service Unavailable** - n8n is offline:
```json
{
  "error": "n8n service unavailable"
}
```

**504 Gateway Timeout** - Request exceeded 5 seconds:
```json
{
  "error": "Request timeout"
}
```

### Usage Example

```typescript
import { getExecutions } from '@/lib/n8n'

// Fetch execution logs
const executions = await getExecutions('sdVzJXaKnmFQUUbo', 20)

// Map status to colors
const executionRows = executions.map(exec => ({
  id: exec.id,
  status: exec.status,
  color: exec.status === 'success' ? 'green' : exec.status === 'error' ? 'red' : 'yellow',
  startTime: new Date(exec.startTime),
  endTime: exec.endTime ? new Date(exec.endTime) : null
}))

// Display in table
setExecutions(executionRows)
```

---

## Security Considerations

### API Key Protection

- The API key is stored in `process.env.N8N_API_KEY` on the server
- The API key is **never** exposed to the browser
- The API key is **never** logged or included in error messages
- All requests to n8n are made server-side only

### Workflow ID Validation

- All routes validate that the workflow ID matches `process.env.N8N_WORKFLOW_ID`
- Invalid workflow IDs return a 400 error
- This prevents unauthorized access to other workflows

### Same-Origin Check

- Routes verify the request origin matches the application domain
- Cross-origin requests are rejected with a 403 error

### Error Messages

- Error messages are generic and do not expose internal details
- No stack traces or sensitive data are included in responses
- Clients receive only the error type and a user-friendly message

---

## Implementation Details

### Timeout Handling

All routes implement a 5-second timeout using AbortController:

```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 5000)

try {
  const response = await fetch(url, {
    signal: controller.signal,
    headers: { 'X-N8N-API-KEY': apiKey }
  })
  clearTimeout(timeoutId)
  // Handle response
} catch (error) {
  clearTimeout(timeoutId)
  if (error.name === 'AbortError') {
    return NextResponse.json({ error: 'Request timeout' }, { status: 504 })
  }
  // Handle other errors
}
```

### Workflow ID Validation

All routes validate the workflow ID:

```typescript
if (params.id !== process.env.N8N_WORKFLOW_ID) {
  return NextResponse.json(
    { error: 'Invalid workflow ID' },
    { status: 400 }
  )
}
```

### Error Handling

All routes follow a consistent error handling pattern:

```typescript
if (!response.ok) {
  const status = response.status
  if (status === 401) {
    return NextResponse.json({ error: 'n8n auth failed' }, { status: 401 })
  } else if (status === 404) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
  } else if (status >= 500) {
    return NextResponse.json({ error: 'n8n service unavailable' }, { status: 503 })
  }
  return NextResponse.json({ error: 'Request failed' }, { status })
}
```

---

## Testing

All routes are tested with:

- Unit tests for error handling and validation
- Property-based tests for correctness properties
- Integration tests for end-to-end workflows
- Security tests for API key protection

See `nextjs-console/__tests__/` for test files.
