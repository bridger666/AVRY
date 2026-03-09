# Offline Mode Documentation

This document describes offline mode behavior, caching strategy, and conflict resolution for the n8n Workflow Sync integration.

## Overview

Offline mode allows users to continue editing workflows when n8n is unavailable. Changes are cached locally and automatically synced when the connection is restored.

### Key Features

- **Automatic Detection**: Detects network failures and enters offline mode
- **Local Caching**: Stores workflows in localStorage for offline access
- **Local Editing**: Allows full editing capabilities while offline
- **Automatic Sync**: Syncs changes when connection is restored
- **Conflict Resolution**: Handles conflicts between local and n8n versions
- **User Feedback**: Shows clear indicators of offline status

---

## Caching Strategy

### Cache Structure

Workflows are cached in localStorage with the following structure:

```typescript
interface CachedWorkflow {
  workflow: N8nWorkflow
  timestamp: number
  localChanges?: {
    nodes: Node[]
    edges: Edge[]
  }
}
```

### Cache Keys

```typescript
const CACHE_KEY = 'aivory_workflow_cache'
const CACHE_TIMESTAMP_KEY = 'aivory_workflow_cache_time'
```

### Cache Lifecycle

```
1. Fetch from n8n (success)
   ↓
   Cache workflow in localStorage
   ↓
2. User edits locally
   ↓
   Update cache with local changes
   ↓
3. Network fails
   ↓
   Use cached workflow
   ↓
4. Network restored
   ↓
   Sync cached changes to n8n
   ↓
   Clear local changes from cache
```

---

## Offline Detection

### Automatic Detection

The system detects offline mode when:

1. **Network Error**: Fetch fails with network error
2. **Service Unavailable**: n8n returns 503 status
3. **Timeout**: Request exceeds 5-second timeout
4. **Connection Refused**: Cannot connect to n8n

### Manual Detection

```typescript
// Check if online
const isOnline = navigator.onLine

// Listen for online/offline events
window.addEventListener('online', handleReconnection)
window.addEventListener('offline', handleOffline)
```

### Detection Code

```typescript
async function loadWorkflow(id: string) {
  try {
    const workflow = await getWorkflow(id)
    setOnline(true)
    return workflow
  } catch (error) {
    if (isNetworkError(error)) {
      setOnline(false)
      showOfflineBanner()
      
      // Use cached version
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        return JSON.parse(cached).workflow
      }
    }
    throw error
  }
}

function isNetworkError(error: any): boolean {
  return (
    error.message.includes('Network') ||
    error.message.includes('ECONNREFUSED') ||
    error.status === 503 ||
    error.status === 504
  )
}
```

---

## Local Editing

### Editing While Offline

When offline, users can:

- Edit node labels
- Change node parameters
- Add/remove connections
- Reorder nodes
- All changes are saved locally

### Local Changes Storage

```typescript
// Save local changes
function handleNodeEdit(nodeId: string, label: string) {
  // Update canvas
  setNodes(nodes => nodes.map(n =>
    n.id === nodeId ? { ...n, data: { ...n.data, label } } : n
  ))

  // Mark as unsaved
  setSyncStatus('unsaved')

  // Cache local changes
  const nodes = getNodes()
  const edges = getEdges()
  const workflow = reactFlowToN8n(nodes, edges, baseWorkflow)
  
  const cached = {
    workflow,
    timestamp: Date.now(),
    localChanges: { nodes, edges }
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
}
```

### UI Indicators

```
Offline Mode Indicators:
┌─────────────────────────────────────────┐
│ ⚠️  n8n offline — editing in local mode │
│                                         │
│ Changes will sync when online           │
└─────────────────────────────────────────┘

Save Button:
"Save (will sync when online)"

Sync Status:
"● Unsaved changes (offline)"
```

---

## Automatic Sync

### Sync on Reconnection

When the network is restored, the system automatically:

1. Detects reconnection
2. Fetches latest workflow from n8n
3. Compares with local changes
4. Syncs if no conflicts
5. Shows merge dialog if conflicts exist

### Sync Code

```typescript
async function handleReconnection() {
  try {
    // Fetch latest from n8n
    const n8nWorkflow = await getWorkflow(id)
    setOnline(true)
    hideOfflineBanner()

    // Get local changes
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) {
      // No local changes, just update
      const { nodes, edges } = n8nToReactFlow(n8nWorkflow)
      setNodes(nodes)
      setEdges(edges)
      return
    }

    const { workflow: localWorkflow } = JSON.parse(cached)

    // Check for conflicts
    if (JSON.stringify(localWorkflow) !== JSON.stringify(n8nWorkflow)) {
      // Show merge dialog
      showMergeDialog(localWorkflow, n8nWorkflow)
    } else {
      // No conflicts, sync automatically
      await updateWorkflow(id, localWorkflow)
      setSyncStatus('synced')
      
      // Clear local changes
      const updated = { workflow: n8nWorkflow, timestamp: Date.now() }
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated))
    }
  } catch (error) {
    showErrorToast('Reconnection failed')
  }
}
```

### Reconnection Detection

```typescript
// Listen for online event
window.addEventListener('online', () => {
  console.log('Network restored')
  handleReconnection()
})

// Listen for successful fetch
async function fetchWithReconnectionDetection(id: string) {
  try {
    const workflow = await getWorkflow(id)
    if (!isOnline) {
      // Was offline, now online
      handleReconnection()
    }
    return workflow
  } catch (error) {
    if (isNetworkError(error) && isOnline) {
      // Was online, now offline
      setOnline(false)
      showOfflineBanner()
    }
    throw error
  }
}
```

---

## Conflict Resolution

### Conflict Detection

Conflicts occur when:

1. User edits workflow while offline
2. Someone else edits the same workflow in n8n
3. Connection is restored
4. Local and n8n versions differ

### Conflict Detection Code

```typescript
function detectConflict(localWorkflow: N8nWorkflow, n8nWorkflow: N8nWorkflow): boolean {
  // Compare node count
  if (localWorkflow.nodes.length !== n8nWorkflow.nodes.length) {
    return true
  }

  // Compare each node
  for (let i = 0; i < localWorkflow.nodes.length; i++) {
    const local = localWorkflow.nodes[i]
    const remote = n8nWorkflow.nodes[i]

    if (JSON.stringify(local) !== JSON.stringify(remote)) {
      return true
    }
  }

  // Compare connections
  if (JSON.stringify(localWorkflow.connections) !== JSON.stringify(n8nWorkflow.connections)) {
    return true
  }

  return false
}
```

### Merge Dialog

When conflicts are detected, show a merge dialog:

```typescript
interface MergeDialogProps {
  local: N8nWorkflow
  remote: N8nWorkflow
  onChooseLocal: () => void
  onChooseRemote: () => void
}

function MergeDialog({ local, remote, onChooseLocal, onChooseRemote }: MergeDialogProps) {
  return (
    <div className="merge-dialog">
      <h2>Workflow Conflict</h2>
      <p>Your local changes conflict with changes in n8n.</p>
      
      <div className="comparison">
        <div className="local">
          <h3>Your Changes</h3>
          <pre>{JSON.stringify(local, null, 2)}</pre>
        </div>
        
        <div className="remote">
          <h3>n8n Version</h3>
          <pre>{JSON.stringify(remote, null, 2)}</pre>
        </div>
      </div>

      <div className="actions">
        <button onClick={onChooseLocal}>Keep My Changes</button>
        <button onClick={onChooseRemote}>Use n8n Version</button>
      </div>
    </div>
  )
}
```

### Conflict Resolution Options

#### Option 1: Keep Local Changes

```typescript
async function handleChooseLocal(localWorkflow: N8nWorkflow) {
  try {
    // Save local version to n8n
    await updateWorkflow(id, localWorkflow)
    
    // Update cache
    const updated = {
      workflow: localWorkflow,
      timestamp: Date.now()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated))
    
    // Update UI
    const { nodes, edges } = n8nToReactFlow(localWorkflow)
    setNodes(nodes)
    setEdges(edges)
    setSyncStatus('synced')
    
    showSuccessToast('Your changes saved to n8n')
  } catch (error) {
    showErrorToast('Failed to save changes')
  }
}
```

#### Option 2: Use n8n Version

```typescript
async function handleChooseRemote(n8nWorkflow: N8nWorkflow) {
  try {
    // Update cache
    const updated = {
      workflow: n8nWorkflow,
      timestamp: Date.now()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated))
    
    // Update UI
    const { nodes, edges } = n8nToReactFlow(n8nWorkflow)
    setNodes(nodes)
    setEdges(edges)
    setSyncStatus('synced')
    
    showSuccessToast('Using n8n version')
  } catch (error) {
    showErrorToast('Failed to update')
  }
}
```

---

## Cache Management

### Cache Size

```typescript
// Check cache size
function getCacheSize(): number {
  const cached = localStorage.getItem(CACHE_KEY)
  if (!cached) return 0
  return new Blob([cached]).size
}

// Monitor cache size
const size = getCacheSize()
console.log(`Cache size: ${(size / 1024).toFixed(2)} KB`)
```

### Cache Expiration

```typescript
// Check if cache is stale (older than 24 hours)
function isCacheStale(): boolean {
  const cached = localStorage.getItem(CACHE_KEY)
  if (!cached) return true
  
  const { timestamp } = JSON.parse(cached)
  const age = Date.now() - timestamp
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours
  
  return age > maxAge
}

// Clear stale cache
if (isCacheStale()) {
  localStorage.removeItem(CACHE_KEY)
}
```

### Cache Cleanup

```typescript
// Clear cache on logout
function handleLogout() {
  localStorage.removeItem(CACHE_KEY)
  localStorage.removeItem(CACHE_TIMESTAMP_KEY)
}

// Clear cache on workflow delete
function handleDeleteWorkflow(id: string) {
  localStorage.removeItem(`workflow_${id}`)
}
```

---

## User Experience Flow

### Offline Workflow

```
1. User opens workflow
   ↓
2. Network fails
   ↓
   Show offline banner
   ↓
3. User edits workflow
   ↓
   Changes saved locally
   ↓
4. Network restored
   ↓
   Attempt automatic sync
   ↓
   ├─ No conflicts → Sync automatically
   │  └─ Show "Synced" indicator
   │
   └─ Conflicts → Show merge dialog
      ├─ User chooses local → Save to n8n
      └─ User chooses remote → Use n8n version
```

### UI States

**Online State:**
```
┌─────────────────────────────────────┐
│ Workflow: My Workflow               │
│ Status: ● Synced                    │
│ [Save Changes]                      │
└─────────────────────────────────────┘
```

**Offline State:**
```
┌─────────────────────────────────────┐
│ ⚠️  n8n offline — editing in local  │
├─────────────────────────────────────┤
│ Workflow: My Workflow               │
│ Status: ● Unsaved (offline)         │
│ [Save (will sync when online)]      │
└─────────────────────────────────────┘
```

**Conflict State:**
```
┌─────────────────────────────────────┐
│ Workflow Conflict                   │
│                                     │
│ Your changes conflict with n8n      │
│                                     │
│ [Keep My Changes] [Use n8n Version] │
└─────────────────────────────────────┘
```

---

## Best Practices

### 1. Always Cache on Fetch

```typescript
// ✅ Good
const workflow = await getWorkflow(id)
localStorage.setItem(CACHE_KEY, JSON.stringify({
  workflow,
  timestamp: Date.now()
}))

// ❌ Bad
const workflow = await getWorkflow(id) // No caching
```

### 2. Handle Offline Gracefully

```typescript
// ✅ Good
try {
  const workflow = await getWorkflow(id)
} catch (error) {
  if (isNetworkError(error)) {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      return JSON.parse(cached).workflow
    }
  }
  throw error
}

// ❌ Bad
const workflow = await getWorkflow(id) // No fallback
```

### 3. Detect Conflicts

```typescript
// ✅ Good
if (detectConflict(localWorkflow, n8nWorkflow)) {
  showMergeDialog(localWorkflow, n8nWorkflow)
}

// ❌ Bad
// Assume no conflicts
await updateWorkflow(id, localWorkflow)
```

### 4. Provide Clear Feedback

```typescript
// ✅ Good
showOfflineBanner()
setSyncStatus('unsaved (offline)')
showSuccessToast('Changes will sync when online')

// ❌ Bad
// No user feedback
```

### 5. Clean Up Cache

```typescript
// ✅ Good
if (isCacheStale()) {
  localStorage.removeItem(CACHE_KEY)
}

// ❌ Bad
// Cache grows indefinitely
```

---

## Testing

See `nextjs-console/__tests__/integration.offline.test.ts` for comprehensive offline mode tests.

Test cases include:
- Cache on fetch
- Fallback to cache on error
- Local editing
- Automatic sync on reconnection
- Conflict detection
- Conflict resolution (local vs remote)
- Multiple offline edits
- Cache expiration
