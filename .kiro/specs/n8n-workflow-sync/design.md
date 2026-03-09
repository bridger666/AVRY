# Design Document: n8n Workflow Sync Integration

## Overview

The Aivory Workflow Tab must establish bidirectional synchronization with n8n (v2.8.3) running at http://43.156.108.96:5678. This design document outlines the architecture, components, data structures, and implementation patterns required to achieve seamless workflow sync while maintaining security and offline resilience.

### Key Design Principles

1. **Single Source of Truth**: n8n is the authoritative source for workflow data
2. **Security First**: API key never exposed to browser; all n8n calls proxied server-side
3. **Offline Resilience**: Local caching and conflict resolution for network failures
4. **Type Safety**: Full TypeScript support for all n8n interactions
5. **User Feedback**: Real-time sync status indicators and error handling

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────┐
│ Aivory Frontend (React/Next.js)                         │
│ ┌──────────────────────────────────────────────────┐   │
│ │ WorkflowCanvas (ReactFlow)                       │   │
│ │ - Fetch workflow on mount                        │   │
│ │ - Display nodes from n8n                         │   │
│ │ - Handle user edits                             │   │
│ │ - Show sync status indicator                    │   │
│ └──────────────────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────────────┐   │
│ │ SyncStatus Component                             │   │
│ │ - Display current sync state                     │   │
│ │ - Show error messages                            │   │
│ │ - Provide retry functionality                    │   │
│ └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Next.js API Routes (Server-side)                        │
│ ┌──────────────────────────────────────────────────┐   │
│ │ /api/n8n/workflow/[id]/route.ts                 │   │
│ │ - GET: Fetch workflow from n8n                  │   │
│ │ - PUT: Push updates to n8n                      │   │
│ │ - Uses process.env.N8N_API_KEY (secure)        │   │
│ └──────────────────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────────────┐   │
│ │ /api/n8n/workflow/[id]/activate/route.ts        │   │
│ │ - POST: Activate workflow                       │   │
│ │ - POST: Deactivate workflow                     │   │
│ └──────────────────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────────────┐   │
│ │ /api/n8n/workflow/[id]/executions/route.ts      │   │
│ │ - GET: Fetch execution logs                     │   │
│ └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ n8n REST API (http://43.156.108.96:5678/api/v1)        │
│ - GET /workflows/{id}                                   │
│ - PUT /workflows/{id}                                   │
│ - POST /workflows/{id}/activate                         │
│ - POST /workflows/{id}/deactivate                       │
│ - GET /executions?workflowId={id}                       │
└─────────────────────────────────────────────────────────┘
```

### Data Flow: Load Workflow

```
User opens Workflow Tab
    ↓
WorkflowCanvas mounts
    ↓
useEffect triggers fetch
    ↓
Call GET /api/n8n/workflow/sdVzJXaKnmFQUUbo
    ↓
Server fetches from n8n using N8N_API_KEY
    ↓
Response: Full n8n workflow object
    ↓
Map n8n nodes → ReactFlow nodes
    ↓
Cache raw n8n workflow in state
    ↓
Display in canvas
    ↓
Show "● Synced" indicator
```

### Data Flow: Save Workflow

```
User edits node label/tool/output
    ↓
Update local ReactFlow state
    ↓
Show "● Unsaved changes" indicator
    ↓
User clicks "Save Changes"
    ↓
Collect current ReactFlow nodes
    ↓
Map ReactFlow nodes → n8n format
    ↓
Merge with stored raw n8n workflow
    ↓
Call PUT /api/n8n/workflow/sdVzJXaKnmFQUUbo
    ↓
Show "⏳ Saving..." indicator
    ↓
On success: Show "● Synced" (green flash)
    ↓
On error: Show "● Sync failed — retry" (red)
```

---

## Components and Interfaces

### 1. WorkflowCanvas Component

**Location**: `nextjs-console/components/WorkflowCanvas.tsx`

**Responsibilities**:
- Fetch workflow from n8n on mount
- Map n8n nodes to ReactFlow format
- Handle user edits (node label, tool, output changes)
- Collect changes and send to n8n on save
- Display loading skeleton during fetch
- Handle errors with offline fallback

**Key Props**:
```typescript
interface WorkflowCanvasProps {
  workflow: SavedWorkflow
  editTarget: { type: 'trigger' | 'step'; index?: number } | null
  onSelectTrigger: () => void
  onSelectStep: (index: number) => void
}
```

**State Management**:
```typescript
// Local state
const [nodes, setNodes] = useNodesState(initialNodes)
const [edges, setEdges] = useEdgesState(initialEdges)
const [syncStatus, setSyncStatus] = useState<'synced' | 'unsaved' | 'saving' | 'failed'>('synced')
const [rawN8nWorkflow, setRawN8nWorkflow] = useState<N8nWorkflow | null>(null)
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
```

**Lifecycle**:
1. On mount: Fetch workflow from n8n
2. On nodes/edges change: Update sync status to "unsaved"
3. On save click: Map to n8n format and PUT
4. On error: Show toast and fall back to cached data

### 2. SyncStatus Component

**Location**: `nextjs-console/components/SyncStatus.tsx`

**Responsibilities**:
- Display current sync state with visual indicator
- Show error messages with retry button
- Animate state transitions

**State Machine**:
```
┌─────────────┐
│   Synced    │ (green, ●)
└──────┬──────┘
       │ user edits
       ↓
┌──────────────────┐
│ Unsaved changes  │ (yellow, ●)
└──────┬───────────┘
       │ user clicks save
       ↓
┌──────────────┐
│   Saving...  │ (gray, ⏳)
└──────┬───────┘
       │
       ├─ success ──→ Synced (green flash)
       │
       └─ error ───→ Sync failed (red, ●)
                     (clickable retry)
```

**Props**:
```typescript
interface SyncStatusProps {
  status: 'synced' | 'unsaved' | 'saving' | 'failed'
  error?: string
  onRetry?: () => void
}
```

### 3. n8n API Client Utility

**Location**: `nextjs-console/lib/n8n.ts`

**Exported Functions**:
```typescript
export async function getWorkflow(id: string): Promise<N8nWorkflow>
export async function updateWorkflow(id: string, data: N8nWorkflow): Promise<N8nWorkflow>
export async function activateWorkflow(id: string): Promise<void>
export async function deactivateWorkflow(id: string): Promise<void>
export async function getExecutions(workflowId: string, limit?: number): Promise<N8nExecution[]>
```

**Error Handling**:
- Throws typed `N8nError` with `message` and `status` properties
- Handles timeouts (5s) with AbortController
- Retries transient failures once
- Never exposes API key in error messages

### 4. n8n ↔ ReactFlow Mapper

**Location**: `nextjs-console/lib/n8nMapper.ts`

**Exported Functions**:
```typescript
export function n8nToReactFlow(workflow: N8nWorkflow): { nodes: Node[]; edges: Edge[] }
export function reactFlowToN8n(nodes: Node[], edges: Edge[], baseWorkflow: N8nWorkflow): N8nWorkflow
```

**Mapping Rules**:

**n8n → ReactFlow**:
- `node.name` → `node.data.label`
- `node.type` → `nodeType` (triggerNode, stepNode)
- `node.parameters` → `node.data.tool`, `node.data.output`
- `node.position` → `node.position { x, y }`
- `node.id` → `node.id` (preserved)

**ReactFlow → n8n**:
- `node.data.label` → `node.name`
- `node.data.tool` → `node.parameters.resource`
- `node.data.output` → `node.parameters.output`
- `node.position` → `node.position`
- Preserve all other n8n workflow properties

---

## API Route Design

### GET /api/n8n/workflow/[id]

**Purpose**: Fetch workflow from n8n

**Request**:
```
GET /api/n8n/workflow/sdVzJXaKnmFQUUbo
```

**Response (200 OK)**:
```json
{
  "status": "ok",
  "workflow": {
    "id": "sdVzJXaKnmFQUUbo",
    "name": "AI-Powered Client Onboarding",
    "nodes": [...],
    "connections": {...},
    "settings": {...},
    "active": true
  },
  "lastSync": "2025-03-06T10:30:00Z"
}
```

**Error Responses**:
- 400: Invalid workflow ID
- 401: n8n auth failed
- 404: Workflow not found
- 503: n8n offline
- 504: Request timeout

### PUT /api/n8n/workflow/[id]

**Purpose**: Update workflow in n8n

**Request**:
```json
{
  "nodes": [...],
  "connections": {...},
  "settings": {...}
}
```

**Response (200 OK)**:
```json
{
  "status": "ok",
  "workflow": { /* updated workflow */ }
}
```

**Error Responses**:
- 400: Invalid workflow ID or payload
- 401: n8n auth failed
- 404: Workflow not found
- 503: n8n offline
- 504: Request timeout

### POST /api/n8n/workflow/[id]/activate

**Purpose**: Activate workflow

**Response (200 OK)**:
```json
{
  "status": "ok",
  "active": true
}
```

### POST /api/n8n/workflow/[id]/deactivate

**Purpose**: Deactivate workflow

**Response (200 OK)**:
```json
{
  "status": "ok",
  "active": false
}
```

### GET /api/n8n/workflow/[id]/executions

**Purpose**: Fetch execution logs

**Query Parameters**:
- `limit` (optional, default 20): Number of executions to fetch

**Response (200 OK)**:
```json
{
  "status": "ok",
  "executions": [
    {
      "id": "exec-123",
      "status": "success",
      "startTime": "2025-03-06T10:00:00Z",
      "endTime": "2025-03-06T10:00:05Z",
      "error": null
    }
  ]
}
```

---

## Data Structures

### n8n Workflow Object

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

interface N8nNode {
  id: string
  name: string
  type: string
  position: { x: number; y: number }
  parameters: Record<string, any>
  disabled?: boolean
}

interface N8nConnections {
  [sourceNodeId: string]: {
    [outputIndex: number]: Array<{
      node: string
      type: string
      index: number
    }>
  }
}

interface N8nSettings {
  timezone?: string
  saveDataErrorExecution?: string
  saveDataSuccessExecution?: string
}
```

### ReactFlow Node/Edge

```typescript
interface Node {
  id: string
  data: {
    label: string
    tool?: string
    output?: string
    type: 'trigger' | 'step'
    index?: number
    isSelected?: boolean
  }
  position: { x: number; y: number }
  type: 'triggerNode' | 'stepNode'
}

interface Edge {
  id: string
  source: string
  target: string
  animated: boolean
}
```

### Sync Status State

```typescript
type SyncStatus = 'synced' | 'unsaved' | 'saving' | 'failed'

interface SyncState {
  status: SyncStatus
  error?: string
  lastSyncTime?: string
  retryCount: number
}
```

### Execution Log

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

### Error Response

```typescript
interface N8nError {
  message: string
  status: number
  code?: string
}
```

---

## State Management Strategy

### WorkflowCanvas State

```typescript
// Workflow data
const [nodes, setNodes] = useNodesState(initialNodes)
const [edges, setEdges] = useEdgesState(initialEdges)

// Sync state
const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced')
const [syncError, setSyncError] = useState<string | null>(null)

// Cache
const [rawN8nWorkflow, setRawN8nWorkflow] = useState<N8nWorkflow | null>(null)
const [cachedWorkflow, setCachedWorkflow] = useState<N8nWorkflow | null>(null)

// UI state
const [isLoading, setIsLoading] = useState(true)
const [isOnline, setIsOnline] = useState(true)
```

### Offline Mode State

```typescript
// localStorage keys
const CACHE_KEY = 'aivory_workflow_cache'
const CACHE_TIMESTAMP_KEY = 'aivory_workflow_cache_time'

// Cache structure
interface CachedWorkflow {
  workflow: N8nWorkflow
  timestamp: number
  localChanges?: {
    nodes: Node[]
    edges: Edge[]
  }
}
```

---

## Error Handling & Resilience

### Network Error Handling

| Error | Handling |
|-------|----------|
| Network unreachable | Toast: "n8n offline — editing in local mode" + cache fallback |
| Timeout (>5s) | Retry once, then offline mode |
| 401 Unauthorized | Persistent banner: "n8n auth failed — check API key" |
| 404 Not Found | Toast: "Workflow not found in n8n" |
| 5xx Server Error | Toast: "n8n server error — try again later" |

### Offline Mode Behavior

1. **On Offline Detection**:
   - Cache current workflow to localStorage
   - Show warning banner
   - Allow local editing

2. **On Reconnection**:
   - Attempt automatic sync
   - If conflicts exist, show merge dialog
   - User chooses: keep local or use n8n version

3. **Merge Dialog**:
   - Show diff between local and n8n versions
   - Allow user to select which version to keep
   - Sync selected version to n8n

### Timeout Implementation

```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 5000)

try {
  const response = await fetch(url, {
    signal: controller.signal,
    headers: { 'X-N8N-API-KEY': apiKey }
  })
  clearTimeout(timeoutId)
  return response.json()
} catch (error) {
  clearTimeout(timeoutId)
  if (error.name === 'AbortError') {
    // Timeout occurred
    return { error: 'Request timeout' }
  }
  throw error
}
```

---

## Security Design

### API Key Protection

1. **Storage**: `process.env.N8N_API_KEY` (server-side only)
2. **Never Exposed**: Not in client code, responses, or logs
3. **Server-Side Injection**: API key added in Next.js route handlers
4. **Error Messages**: Generic messages sent to client (no key exposure)

### Workflow ID Validation

```typescript
// In all API routes
if (params.id !== process.env.N8N_WORKFLOW_ID) {
  return NextResponse.json(
    { error: 'Invalid workflow ID' },
    { status: 400 }
  )
}
```

### Same-Origin Check

```typescript
const origin = req.headers.get('origin')
if (origin && !isAllowedOrigin(origin)) {
  return new Response('Forbidden', { status: 403 })
}
```

### Request Logging

- Log all requests server-side (no sensitive data)
- Never log API key or full workflow data
- Log: timestamp, endpoint, status, error type

---

## Implementation Patterns

### Correct n8n API Route Pattern

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Validate workflow ID
  if (params.id !== process.env.N8N_WORKFLOW_ID) {
    return NextResponse.json(
      { error: 'Invalid workflow ID' },
      { status: 400 }
    )
  }

  // 2. Get credentials from env
  const baseUrl = process.env.N8N_BASE_URL
  const apiKey = process.env.N8N_API_KEY

  if (!baseUrl || !apiKey) {
    return NextResponse.json(
      { error: 'n8n not configured' },
      { status: 500 }
    )
  }

  // 3. Set timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    // 4. Fetch from n8n with public IP
    const response = await fetch(
      `${baseUrl}/api/v1/workflows/${params.id}`,
      {
        signal: controller.signal,
        headers: {
          'X-N8N-API-KEY': apiKey
        }
      }
    )

    clearTimeout(timeoutId)

    // 5. Handle errors
    if (!response.ok) {
      return NextResponse.json(
        { error: 'n8n request failed' },
        { status: response.status }
      )
    }

    // 6. Return data
    const data = await response.json()
    return NextResponse.json({ status: 'ok', data })

  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Workflow Fetch on Mount

*For any* WorkflowCanvas component mount, the system should fetch the workflow from n8n using GET /api/n8n/workflow/{id} and display the fetched nodes in ReactFlow format.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: n8n to ReactFlow Mapping Preserves Data

*For any* n8n workflow object, converting to ReactFlow format and back should preserve all node properties (id, name, type, parameters, position).

**Validates: Requirements 1.2, 7.3**

### Property 3: Save Triggers PUT Request

*For any* modified workflow state, clicking Save Changes should send a PUT request to /api/n8n/workflow/{id} with the complete workflow object.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 4: Sync Status Reflects State Changes

*For any* workflow state transition (loaded → unsaved → saving → synced), the SyncStatus component should display the correct status indicator and color.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 5: Activation Sends Correct Endpoint

*For any* activation/deactivation action, the system should send POST to /api/n8n/workflow/{id}/activate or /api/n8n/workflow/{id}/deactivate respectively.

**Validates: Requirements 3.1, 3.2**

### Property 6: API Key Never Exposed

*For any* API request to /api/n8n/..., the response should not contain the N8N_API_KEY and the API key should only be used server-side.

**Validates: Requirements 5.7, 10.1, 10.2, 10.3, 10.4**

### Property 7: Workflow ID Validation

*For any* API request with an invalid workflow ID, the system should return a 400 error and not forward the request to n8n.

**Validates: Requirements 5.6**

### Property 8: Timeout Handling

*For any* n8n request that exceeds 5 seconds, the system should abort the request and return a 504 Gateway Timeout error.

**Validates: Requirements 5.8, 1.6, 2.6**

### Property 9: Error Propagation

*For any* n8n error response (401, 404, 5xx), the API proxy should return the appropriate HTTP status code with a generic error message (no API key exposure).

**Validates: Requirements 5.9, 5.10, 10.5**

### Property 10: Offline Mode Caching

*For any* network failure, the system should cache the last successfully fetched workflow to localStorage and allow local editing with a warning banner.

**Validates: Requirements 9.1, 9.2**

### Property 11: Execution Status Mapping

*For any* execution log fetched from n8n, the status should be correctly mapped to display colors (success → green, error → red, running → yellow).

**Validates: Requirements 8.2**

### Property 12: n8n Client Uses Proxy Routes

*For any* n8n client function call, the request should target /api/n8n/... proxy routes, not direct n8n endpoints.

**Validates: Requirements 6.6**

---

## Testing Strategy

### Unit Testing

Unit tests verify specific examples, edge cases, and error conditions:

- **Mapping Tests**: n8n ↔ ReactFlow conversions with various node types
- **Component Tests**: SyncStatus state transitions and UI rendering
- **Error Tests**: Timeout, 401, 404, 5xx error handling
- **Offline Tests**: Cache storage and retrieval
- **Validation Tests**: Workflow ID validation, payload validation

### Property-Based Testing

Property-based tests verify universal properties across all inputs:

- **Fetch Property**: For any workflow ID, fetching should return valid n8n structure
- **Mapping Property**: For any n8n workflow, round-trip conversion should preserve data
- **Save Property**: For any modified nodes, save should send complete workflow object
- **Status Property**: For any state change, sync status should reflect current state
- **Timeout Property**: For any request exceeding 5s, should timeout and retry
- **Security Property**: For any API response, should not contain API key

**Configuration**:
- Minimum 100 iterations per property test
- Tag format: `Feature: n8n-workflow-sync, Property {number}: {property_text}`
- Each property test references corresponding design property

---

## Error Handling Flows

### Network Error Flow

```
Network Error Detected
    ↓
Show Toast: "n8n offline — editing in local mode"
    ↓
Cache current workflow to localStorage
    ↓
Allow local editing
    ↓
Show warning banner
    ↓
On reconnection: Attempt automatic sync
```

### Auth Error Flow

```
401 Unauthorized Response
    ↓
Show Persistent Banner: "n8n auth failed — check API key"
    ↓
Disable save functionality
    ↓
Allow local editing only
    ↓
User must fix API key in environment
```

### Timeout Flow

```
Request Exceeds 5 Seconds
    ↓
Abort request
    ↓
Retry once
    ↓
If retry fails: Fall back to offline mode
    ↓
Show error toast with retry button
```

---

## Implementation Checklist

- [ ] Create `lib/n8n.ts` with typed API client
- [ ] Create `lib/n8nMapper.ts` with bidirectional mapping
- [ ] Create `/api/n8n/workflow/[id]/route.ts` (GET, PUT)
- [ ] Create `/api/n8n/workflow/[id]/activate/route.ts` (POST)
- [ ] Create `/api/n8n/workflow/[id]/executions/route.ts` (GET)
- [ ] Update `WorkflowCanvas.tsx` with fetch on mount
- [ ] Create `SyncStatus.tsx` component
- [ ] Update `workflows/page.tsx` activate/deactivate handlers
- [ ] Implement offline caching in localStorage
- [ ] Implement conflict resolution merge dialog
- [ ] Add error handling and retry logic
- [ ] Add security validation (workflow ID, API key)
- [ ] Add timeout handling with AbortController
- [ ] Add request logging (server-side only)
- [ ] Write unit tests for all components
- [ ] Write property-based tests for all properties
- [ ] Test offline mode and reconnection
- [ ] Test error scenarios (401, 404, 5xx, timeout)
- [ ] Verify API key never exposed
- [ ] Performance test with large workflows

---

## Success Criteria

- ✅ Workflow loads from n8n on mount
- ✅ All nodes display correctly in ReactFlow
- ✅ User edits sync to n8n on Save
- ✅ Sync status indicator shows current state
- ✅ Activate/deactivate works with n8n
- ✅ Error handling graceful (offline mode fallback)
- ✅ API key never exposed to browser
- ✅ No breaking changes to existing UI
- ✅ Offline mode with caching works
- ✅ Conflict resolution on reconnection
- ✅ All properties pass with 100+ iterations
- ✅ All unit tests pass
