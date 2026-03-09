# Aivory Workflow Tab ↔ n8n Integration Spec

## Goal
Establish bidirectional sync between Aivory Workflow Tab and n8n instance. Every change in Aivory must sync to n8n, and workflow data must be read from n8n as the single source of truth.

---

## Context

### n8n Instance Details
- **URL**: http://43.156.108.96:5678 (public IP — use this for server-side fetch)
- **Version**: 2.8.3
- **API Base**: http://43.156.108.96:5678/api/v1
- **Auth Header**: X-N8N-API-KEY
- **Workflow ID**: sdVzJXaKnmFQUUbo
- **Workflow Name**: AI-Powered Client Onboarding
- **Current Structure**: Trigger + Step 1–5 (all "manual"/Set nodes)
- **Deployment**: Running inside Docker container (not directly on host)
- **Data Storage**: SQLite at `/home/node/.n8n/database.sqlite` (inside container)

### Environment Setup
API key already configured in `.env.local`:
```
N8N_BASE_URL=http://43.156.108.96:5678
N8N_API_KEY=<already set — use process.env.N8N_API_KEY>
N8N_WORKFLOW_ID=sdVzJXaKnmFQUUbo
```

**CRITICAL SECURITY NOTES**:
- ✅ API key stays server-side only — never exposed to browser
- ✅ Do NOT attempt to read API key from VPS or hardcode it anywhere
- ✅ Use `process.env.N8N_API_KEY` from `.env.local` only
- ✅ N8N_BASE_URL must be the public IP (http://43.156.108.96:5678), not localhost
- ✅ Next.js server-side fetch goes to public IP (not container localhost)
- ✅ Direct database access NOT needed — use n8n REST API only

---

## CRITICAL IMPLEMENTATION NOTES

### Network Architecture
```
Next.js Server (running on local/dev machine)
    ↓
    Uses process.env.N8N_BASE_URL = http://43.156.108.96:5678
    ↓
n8n Instance (running in Docker on VPS at 43.156.108.96)
    ↓
    SQLite Database (/home/node/.n8n/database.sqlite inside container)
```

### Key Points for Implementation

1. **Use Public IP, Not Localhost**
   - ✅ Correct: `http://43.156.108.96:5678/api/v1/workflows/{id}`
   - ❌ Wrong: `http://localhost:5678/api/v1/workflows/{id}`
   - ❌ Wrong: `http://127.0.0.1:5678/api/v1/workflows/{id}`
   - Reason: Next.js server runs on different machine than n8n container

2. **API Key Management**
   - ✅ Read from: `process.env.N8N_API_KEY` (from `.env.local`)
   - ❌ Do NOT: Hardcode API key in code
   - ❌ Do NOT: Try to read from VPS filesystem
   - ❌ Do NOT: Expose to browser/client-side code
   - Reason: Security — API key is sensitive credential

3. **REST API Only**
   - ✅ Use: n8n REST API endpoints (`/api/v1/workflows/...`)
   - ❌ Do NOT: Try to access SQLite database directly
   - ❌ Do NOT: SSH into VPS to read database
   - Reason: n8n API is the official, supported interface

4. **Server-Side Fetch**
   - ✅ Fetch from: Next.js API routes (`/api/n8n/...`)
   - ✅ Server-side code uses: `process.env.N8N_API_KEY`
   - ❌ Do NOT: Fetch directly from browser/client
   - Reason: Protects API key from exposure

### Example: Correct Implementation Pattern

```typescript
// ✅ CORRECT: In Next.js API route (server-side)
export async function GET(req: Request) {
  const baseUrl = process.env.N8N_BASE_URL  // http://43.156.108.96:5678
  const apiKey = process.env.N8N_API_KEY    // from .env.local
  
  const response = await fetch(
    `${baseUrl}/api/v1/workflows/sdVzJXaKnmFQUUbo`,
    {
      headers: {
        'X-N8N-API-KEY': apiKey
      }
    }
  )
  
  return response.json()
}

// ❌ WRONG: In client-side code
const response = await fetch(
  'http://localhost:5678/api/v1/workflows/...',  // Wrong IP
  {
    headers: {
      'X-N8N-API-KEY': 'sk-...'  // Exposed to browser!
    }
  }
)
```

---

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

---

## Data Flow

### 1. Load Workflow (On Mount)
```
User opens Workflow Tab
    ↓
WorkflowCanvas mounts
    ↓
Call GET /api/n8n/workflow/sdVzJXaKnmFQUUbo
    ↓
Server fetches from n8n using N8N_API_KEY
    ↓
Response: Full n8n workflow object
    ↓
Map n8n nodes → ReactFlow nodes
    ↓
Display in canvas
    ↓
Store raw n8n workflow in state (for merge on save)
```

### 2. Edit Workflow (User Changes)
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
Server pushes to n8n
    ↓
Show "⏳ Saving..." indicator
    ↓
On success: Show "● Synced" (green flash)
    ↓
On error: Show "● Sync failed — retry" (red, clickable)
```

### 3. Activate/Deactivate
```
User clicks "Activate" button
    ↓
Call POST /api/n8n/workflow/sdVzJXaKnmFQUUbo/activate
    ↓
Server sends to n8n
    ↓
Update local status to "active"
    ↓
Show success toast
```

---

## Implementation Tasks

### Task 1: Create n8n API Client Utility
**File**: `nextjs-console/lib/n8n.ts`

Typed helpers for n8n REST API:
- `getWorkflow(id: string)` — Fetch workflow
- `updateWorkflow(id: string, data: N8nWorkflow)` — Push updates
- `activateWorkflow(id: string)` — Activate
- `deactivateWorkflow(id: string)` — Deactivate
- `getExecutions(workflowId: string, limit?: number)` — Fetch execution logs

**Requirements**:
- Use `fetch` with proper error handling
- Include X-N8N-API-KEY header
- Timeout: 5 seconds
- Retry logic for transient failures
- Type-safe responses

### Task 2: Create n8n ↔ ReactFlow Mapper
**File**: `nextjs-console/lib/n8nMapper.ts`

Map between n8n workflow format and ReactFlow nodes:

**n8n → ReactFlow**:
```
n8n node.name        → ReactFlow node.data.label
n8n node.type        → ReactFlow nodeType:
  "n8n-nodes-base.manualTrigger" → "triggerNode"
  "n8n-nodes-base.set"           → "stepNode"
  "n8n-nodes-base.httpRequest"   → "stepNode"
  AI-related types               → "stepNode"
n8n node.parameters  → node.data.tool, node.data.output
n8n node.position    → node.position { x, y }
n8n node.id          → node.id
```

**ReactFlow → n8n**:
```
ReactFlow node.data.label → n8n node.name
ReactFlow node.data.tool  → n8n node.parameters.resource
ReactFlow node.data.output → n8n node.parameters.output
ReactFlow node.position   → n8n node.position
```

**Requirements**:
- Preserve n8n node IDs (don't regenerate)
- Handle missing/optional fields gracefully
- Maintain n8n workflow structure (connections, settings)
- Type-safe with full TypeScript support

### Task 3: Create Next.js API Route — Workflow Proxy
**File**: `nextjs-console/app/api/n8n/workflow/[id]/route.ts`

**GET** — Fetch workflow from n8n:
```ts
GET /api/n8n/workflow/sdVzJXaKnmFQUUbo
Response: {
  status: 'ok',
  workflow: { /* full n8n workflow */ },
  lastSync: '2025-03-06T10:30:00Z'
}
```

**PUT** — Push updates to n8n:
```ts
PUT /api/n8n/workflow/sdVzJXaKnmFQUUbo
Body: {
  nodes: [...],
  connections: {...},
  settings: {...}
}
Response: {
  status: 'ok',
  workflow: { /* updated n8n workflow */ }
}
```

**Requirements**:
- Validate workflow ID matches env var
- Use server-side N8N_API_KEY (never expose)
- Timeout: 5 seconds
- Error handling:
  - 401 → "n8n auth failed"
  - 404 → "workflow not found"
  - 5xx → "n8n offline"
- Log all requests (server-side only)
- Same-origin check

### Task 4: Create Activate/Deactivate Route
**File**: `nextjs-console/app/api/n8n/workflow/[id]/activate/route.ts`

**POST** — Activate workflow:
```ts
POST /api/n8n/workflow/sdVzJXaKnmFQUUbo/activate
Response: { status: 'ok', active: true }
```

**POST** — Deactivate workflow:
```ts
POST /api/n8n/workflow/sdVzJXaKnmFQUUbo/deactivate
Response: { status: 'ok', active: false }
```

**Requirements**:
- Call n8n POST /workflows/{id}/activate
- Call n8n POST /workflows/{id}/deactivate
- Handle errors gracefully
- Return current active status

### Task 5: Update WorkflowCanvas Component
**File**: `nextjs-console/components/WorkflowCanvas.tsx`

**On Mount**:
- Fetch workflow from GET /api/n8n/workflow/[id]
- Show loading skeleton while fetching
- Map n8n response to ReactFlow nodes
- Store raw n8n workflow in state (for merge on save)
- Fall back to cached local data on error with warning toast

**On Save**:
- Collect current ReactFlow nodes
- Map to n8n format
- Merge with stored raw n8n workflow
- Call PUT /api/n8n/workflow/[id]
- Show sync status indicator
- Handle errors with retry option

**Requirements**:
- Use `useEffect` for initial fetch
- Implement proper loading/error states
- Cache workflow data in state
- Show sync status in header

### Task 6: Create Sync Status Indicator Component
**File**: `nextjs-console/components/SyncStatus.tsx`

Display sync state in canvas header (left of Save button):

| State | Display | Color |
|-------|---------|-------|
| Loaded, no changes | ● Synced | Green (#00e59e) |
| Unsaved local changes | ● Unsaved changes | Yellow (#ffa500) |
| Saving in progress | ⏳ Saving... | Gray (#828282) |
| Save successful | ● Synced | Green (flash) |
| Save failed | ● Sync failed — retry | Red (#ff6b6b) |

**Requirements**:
- Show current sync state
- Clickable retry on error
- Smooth transitions
- Tooltip with details

### Task 7: Update Activate/Deactivate Handlers
**File**: `nextjs-console/app/workflows/page.tsx`

Modify existing `handleActivate` and `handleDeactivate`:
- Call POST /api/n8n/workflow/[id]/activate
- Call POST /api/n8n/workflow/[id]/deactivate
- Update local status
- Show success/error toast

**Requirements**:
- Use existing dropdown UI
- Maintain current UX
- Handle errors gracefully

### Task 8: Execution Logs Integration (Bonus)
**File**: `nextjs-console/app/api/n8n/workflow/[id]/executions/route.ts`

Fetch execution logs from n8n:
```ts
GET /api/n8n/workflow/sdVzJXaKnmFQUUbo/executions?limit=20
Response: {
  status: 'ok',
  executions: [
    { id, status, startTime, endTime, error }
  ]
}
```

Map status:
- `success` → Green
- `error` → Red
- `running` → Yellow

---

## Error Handling Strategy

| Error | Handling |
|-------|----------|
| Network error | Toast: "n8n offline — editing in local mode" |
| 401 Unauthorized | Persistent banner: "n8n auth failed — check API key" |
| Timeout >5s | Retry once, then fall back to offline mode |
| PUT error | Toast with n8n error message, keep local state intact |
| 404 Not Found | Toast: "Workflow not found in n8n" |
| 5xx Server Error | Toast: "n8n server error — try again later" |

---

## Security Checklist

- ✅ N8N_API_KEY stays server-side only
- ✅ All n8n calls go through /api/n8n/... routes
- ✅ Never expose API key to browser
- ✅ Validate workflow ID matches env var
- ✅ Add same-origin check in API routes
- ✅ Log requests server-side only (no sensitive data)
- ✅ Use HTTPS in production

---

## Testing Checklist

- [ ] Fetch workflow on mount — all nodes display correctly
- [ ] Edit node label — local state updates
- [ ] Save changes — PUT request sent to n8n
- [ ] Sync status indicator shows correct state
- [ ] Activate workflow — POST /activate called
- [ ] Deactivate workflow — POST /deactivate called
- [ ] Network error — falls back to offline mode
- [ ] Auth error — shows persistent banner
- [ ] Timeout — retries once, then offline mode
- [ ] Execution logs — fetched and displayed correctly

---

## Files to Create/Modify

| File | Action | Priority |
|------|--------|----------|
| `nextjs-console/lib/n8n.ts` | CREATE | P0 |
| `nextjs-console/lib/n8nMapper.ts` | CREATE | P0 |
| `nextjs-console/app/api/n8n/workflow/[id]/route.ts` | CREATE | P0 |
| `nextjs-console/app/api/n8n/workflow/[id]/activate/route.ts` | CREATE | P0 |
| `nextjs-console/components/WorkflowCanvas.tsx` | MODIFY | P0 |
| `nextjs-console/components/SyncStatus.tsx` | CREATE | P1 |
| `nextjs-console/app/workflows/page.tsx` | MODIFY | P1 |
| `nextjs-console/app/api/n8n/workflow/[id]/executions/route.ts` | CREATE | P2 |

---

## n8n REST API Reference (v2.8.3)

```
GET    /api/v1/workflows/{id}
PUT    /api/v1/workflows/{id}
POST   /api/v1/workflows/{id}/activate
POST   /api/v1/workflows/{id}/deactivate
GET    /api/v1/executions?workflowId={id}&limit=20
GET    /api/v1/executions/{executionId}
```

All requests require header: `X-N8N-API-KEY: <value>`

---

## Implementation Order

1. **Phase 1 (Core Sync)**
   - Task 1: n8n API client
   - Task 2: n8n ↔ ReactFlow mapper
   - Task 3: Workflow proxy route
   - Task 5: Update WorkflowCanvas

2. **Phase 2 (Activation & Status)**
   - Task 4: Activate/deactivate route
   - Task 6: Sync status indicator
   - Task 7: Update handlers

3. **Phase 3 (Bonus)**
   - Task 8: Execution logs integration

---

## Success Criteria

- ✅ Workflow loads from n8n on mount
- ✅ All 6 nodes display correctly in ReactFlow
- ✅ User edits sync to n8n on Save
- ✅ Sync status indicator shows current state
- ✅ Activate/deactivate works with n8n
- ✅ Error handling graceful (offline mode fallback)
- ✅ API key never exposed to browser
- ✅ No breaking changes to existing UI
