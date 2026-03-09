# Error Handling Documentation

This document describes error handling strategies for the n8n Workflow Sync integration.

## Error Types

### Authentication Errors (401)

**Cause:** n8n API key is invalid or expired

**Symptoms:**
- All n8n requests fail with 401 status
- Error message: "n8n auth failed"

**Recovery:**
1. Check `process.env.N8N_API_KEY` is set correctly
2. Verify API key is valid in n8n
3. Restart the application
4. Show persistent banner to user

**User Experience:**
```
┌─────────────────────────────────────────┐
│ ⚠️  n8n auth failed — check API key     │
│                                         │
│ Contact support if the issue persists   │
└─────────────────────────────────────────┘
```

**Code Example:**

```typescript
try {
  const workflow = await getWorkflow(id)
} catch (error) {
  if (error.status === 401) {
    // Show persistent banner
    showAuthErrorBanner()
    
    // Disable save functionality
    setSaveDisabled(true)
    
    // Allow local editing only
    setOfflineMode(true)
  }
}
```

---

### Not Found Errors (404)

**Cause:** Workflow ID doesn't exist in n8n

**Symptoms:**
- Fetch returns 404 status
- Error message: "Workflow not found"

**Recovery:**
1. Verify workflow ID in `process.env.N8N_WORKFLOW_ID`
2. Check workflow exists in n8n
3. Create workflow if needed

**User Experience:**
```
Toast: "Workflow not found in n8n"
```

**Code Example:**

```typescript
try {
  const workflow = await getWorkflow(id)
} catch (error) {
  if (error.status === 404) {
    showErrorToast('Workflow not found in n8n')
    // Redirect to workflow list
    navigate('/workflows')
  }
}
```

---

### Server Errors (5xx)

**Cause:** n8n server is experiencing issues

**Symptoms:**
- Requests fail with 500, 502, 503, or 504 status
- Error message: "n8n service unavailable"

**Recovery:**
1. Retry request after delay (exponential backoff)
2. Fall back to offline mode
3. Show user-friendly error message

**User Experience:**
```
Toast: "n8n server error — try again later"
Retry button available
```

**Code Example:**

```typescript
async function fetchWithRetry(id: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await getWorkflow(id)
    } catch (error) {
      if (error.status >= 500 && i < maxRetries - 1) {
        // Exponential backoff
        const delay = Math.pow(2, i) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
}
```

---

### Timeout Errors (504)

**Cause:** n8n request exceeded 5-second timeout

**Symptoms:**
- Request aborts after 5 seconds
- Error message: "Request timeout"

**Recovery:**
1. Retry once automatically
2. If retry fails, fall back to offline mode
3. Show user-friendly error message

**User Experience:**
```
During save:
"⏳ Saving..." → "⏳ Retrying..." → "● Sync failed — retry"
```

**Code Example:**

```typescript
try {
  setSyncStatus('saving')
  await updateWorkflow(id, workflow)
  setSyncStatus('synced')
} catch (error) {
  if (error.status === 504) {
    // Retry once
    try {
      await updateWorkflow(id, workflow)
      setSyncStatus('synced')
    } catch (retryError) {
      setSyncStatus('failed')
      showErrorToast('Save failed — try again later')
    }
  } else {
    setSyncStatus('failed')
    showErrorToast(error.message)
  }
}
```

---

### Network Errors

**Cause:** Network is unavailable or connection is lost

**Symptoms:**
- Fetch throws network error
- Error message: "Network error" or "ECONNREFUSED"

**Recovery:**
1. Detect offline mode
2. Cache current workflow
3. Allow local editing
4. Attempt automatic sync on reconnection

**User Experience:**
```
Banner: "n8n offline — editing in local mode"
Save button: "Save (will sync when online)"
```

**Code Example:**

```typescript
try {
  const workflow = await getWorkflow(id)
} catch (error) {
  if (error.message.includes('Network') || error.message.includes('ECONNREFUSED')) {
    // Enter offline mode
    showOfflineBanner()
    
    // Use cached workflow
    const cached = localStorage.getItem(`workflow_${id}`)
    if (cached) {
      const workflow = JSON.parse(cached)
      const { nodes, edges } = n8nToReactFlow(workflow)
      setNodes(nodes)
      setEdges(edges)
    }
  }
}
```

---

## Error Handling Strategies

### Strategy 1: Graceful Degradation

When n8n is unavailable, fall back to local editing:

```typescript
async function loadWorkflow(id: string) {
  try {
    // Try to fetch from n8n
    const workflow = await getWorkflow(id)
    setWorkflow(workflow)
    setOnline(true)
  } catch (error) {
    // Fall back to cached version
    const cached = localStorage.getItem(`workflow_${id}`)
    if (cached) {
      setWorkflow(JSON.parse(cached))
      setOnline(false)
      showWarningToast('Using cached workflow — n8n is offline')
    } else {
      // No cache available
      showErrorToast('Unable to load workflow')
    }
  }
}
```

### Strategy 2: Retry with Exponential Backoff

For transient failures, retry with increasing delays:

```typescript
async function fetchWithBackoff(id: string) {
  const maxRetries = 3
  const baseDelay = 1000 // 1 second

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await getWorkflow(id)
    } catch (error) {
      if (i === maxRetries - 1) throw error

      // Only retry on transient errors
      if (error.status === 504 || error.status >= 500) {
        const delay = baseDelay * Math.pow(2, i)
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        throw error
      }
    }
  }
}
```

### Strategy 3: Optimistic Updates

Update UI immediately, then sync in background:

```typescript
function handleNodeEdit(nodeId: string, label: string) {
  // Update UI immediately
  setNodes(nodes => nodes.map(n =>
    n.id === nodeId ? { ...n, data: { ...n.data, label } } : n
  ))
  setSyncStatus('unsaved')

  // Sync in background
  syncWorkflow()
}

async function syncWorkflow() {
  try {
    setSyncStatus('saving')
    const nodes = getNodes()
    const edges = getEdges()
    const updated = reactFlowToN8n(nodes, edges, baseWorkflow)
    await updateWorkflow(id, updated)
    setSyncStatus('synced')
  } catch (error) {
    setSyncStatus('failed')
    showErrorToast(error.message)
  }
}
```

### Strategy 4: Conflict Resolution

When offline changes conflict with n8n changes:

```typescript
async function handleReconnection() {
  try {
    // Fetch latest from n8n
    const n8nWorkflow = await getWorkflow(id)

    // Get local changes
    const localWorkflow = reactFlowToN8n(getNodes(), getEdges(), baseWorkflow)

    // Check for conflicts
    if (JSON.stringify(localWorkflow) !== JSON.stringify(n8nWorkflow)) {
      // Show merge dialog
      showMergeDialog({
        local: localWorkflow,
        remote: n8nWorkflow,
        onChooseLocal: () => {
          // Save local version
          updateWorkflow(id, localWorkflow)
        },
        onChooseRemote: () => {
          // Use remote version
          const { nodes, edges } = n8nToReactFlow(n8nWorkflow)
          setNodes(nodes)
          setEdges(edges)
        }
      })
    } else {
      // No conflicts, sync automatically
      setSyncStatus('synced')
    }
  } catch (error) {
    showErrorToast('Reconnection failed')
  }
}
```

---

## Error Recovery Flows

### Workflow Fetch Error

```
User opens workflow
    ↓
Fetch from n8n
    ↓
    ├─ Success → Display workflow
    │
    └─ Error
        ├─ 401 → Show auth banner, disable save
        ├─ 404 → Show error, redirect to list
        ├─ 5xx → Retry with backoff
        ├─ 504 → Retry once, then offline mode
        └─ Network → Use cached version, show offline banner
```

### Workflow Save Error

```
User clicks Save
    ↓
Collect changes
    ↓
Send PUT request
    ↓
    ├─ Success → Show "Synced", update UI
    │
    └─ Error
        ├─ 401 → Show auth banner, disable save
        ├─ 404 → Show error, redirect to list
        ├─ 5xx → Retry with backoff
        ├─ 504 → Retry once, then show error
        └─ Network → Cache locally, show offline banner
```

### Reconnection Flow

```
Network comes back online
    ↓
Attempt to fetch from n8n
    ↓
    ├─ Success
    │   ├─ No conflicts → Sync automatically
    │   └─ Conflicts → Show merge dialog
    │
    └─ Error → Show error, stay in offline mode
```

---

## Error Messages

### User-Facing Messages

| Error | Message | Action |
|-------|---------|--------|
| 401 | "n8n auth failed — check API key" | Contact support |
| 404 | "Workflow not found in n8n" | Verify workflow ID |
| 5xx | "n8n server error — try again later" | Retry or wait |
| 504 | "Request timeout — retrying..." | Wait or retry |
| Network | "n8n offline — editing in local mode" | Wait for connection |

### Developer Messages

| Error | Message | Cause |
|-------|---------|-------|
| 401 | "n8n auth failed" | Invalid API key |
| 404 | "Workflow not found" | Invalid workflow ID |
| 500 | "Internal server error" | n8n server issue |
| 503 | "Service unavailable" | n8n is down |
| 504 | "Request timeout" | Request exceeded 5s |

---

## Troubleshooting Guide

### Problem: All requests fail with 401

**Diagnosis:**
1. Check `process.env.N8N_API_KEY` is set
2. Verify API key is valid in n8n
3. Check n8n is running at `process.env.N8N_BASE_URL`

**Solution:**
```bash
# Verify environment variables
echo $N8N_API_KEY
echo $N8N_BASE_URL

# Test n8n connection
curl -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "$N8N_BASE_URL/api/v1/workflows"
```

### Problem: Requests timeout after 5 seconds

**Diagnosis:**
1. Check n8n is responding
2. Check network latency
3. Check n8n is not overloaded

**Solution:**
```bash
# Test n8n response time
time curl -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "$N8N_BASE_URL/api/v1/workflows"

# If slow, check n8n logs
docker logs n8n
```

### Problem: Offline mode not working

**Diagnosis:**
1. Check localStorage is enabled
2. Check workflow was cached before going offline
3. Check browser storage quota

**Solution:**
```typescript
// Check localStorage
console.log(localStorage.getItem(`workflow_${id}`))

// Clear and retry
localStorage.removeItem(`workflow_${id}`)
```

### Problem: Conflicts not resolving

**Diagnosis:**
1. Check merge dialog is showing
2. Check local and remote versions differ
3. Check user selection is being saved

**Solution:**
```typescript
// Log conflict details
console.log('Local:', localWorkflow)
console.log('Remote:', n8nWorkflow)
console.log('Conflict:', JSON.stringify(localWorkflow) !== JSON.stringify(n8nWorkflow))
```

---

## Best Practices

### 1. Always Show User Feedback

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

### 2. Implement Retry Logic

```typescript
// ✅ Good
try {
  return await getWorkflow(id)
} catch (error) {
  if (error.status === 504) {
    return await getWorkflow(id) // Retry once
  }
  throw error
}

// ❌ Bad
return await getWorkflow(id) // No retry
```

### 3. Cache Workflows

```typescript
// ✅ Good
const cached = localStorage.getItem(`workflow_${id}`)
if (cached) {
  return JSON.parse(cached)
}
const workflow = await getWorkflow(id)
localStorage.setItem(`workflow_${id}`, JSON.stringify(workflow))

// ❌ Bad
return await getWorkflow(id) // No caching
```

### 4. Handle All Error Cases

```typescript
// ✅ Good
try {
  await updateWorkflow(id, data)
} catch (error) {
  if (error.status === 401) { /* ... */ }
  else if (error.status === 404) { /* ... */ }
  else if (error.status >= 500) { /* ... */ }
  else if (error.status === 504) { /* ... */ }
  else { /* ... */ }
}

// ❌ Bad
try {
  await updateWorkflow(id, data)
} catch (error) {
  showErrorToast(error.message) // Generic handling
}
```

### 5. Provide Recovery Options

```typescript
// ✅ Good
showErrorToast('Save failed', {
  action: 'Retry',
  onAction: () => updateWorkflow(id, data)
})

// ❌ Bad
showErrorToast('Save failed') // No recovery option
```

---

## Testing Error Scenarios

See `nextjs-console/__tests__/integration.error-scenarios.test.ts` for comprehensive error handling tests.

Test cases include:
- 401 Unauthorized
- 404 Not Found
- 5xx Server Errors
- Timeout (504)
- Network errors
- Graceful error handling
- Error recovery
