# n8n Integration — Implementation Gotchas & Best Practices

## Critical Gotchas to Avoid

### 1. ❌ Using Localhost Instead of Public IP

**WRONG:**
```typescript
const baseUrl = 'http://localhost:5678'  // ❌ Won't work!
const response = await fetch(`${baseUrl}/api/v1/workflows/...`)
```

**WHY**: n8n runs in Docker container on VPS. Next.js server can't reach localhost:5678 from your machine.

**CORRECT:**
```typescript
const baseUrl = process.env.N8N_BASE_URL  // http://43.156.108.96:5678
const response = await fetch(`${baseUrl}/api/v1/workflows/...`)
```

---

### 2. ❌ Exposing API Key to Browser

**WRONG:**
```typescript
// Client-side code
const apiKey = 'sk-...'  // ❌ Exposed to browser!
const response = await fetch('/api/v1/workflows/...', {
  headers: { 'X-N8N-API-KEY': apiKey }
})
```

**WHY**: Anyone can inspect browser network requests and steal the API key.

**CORRECT:**
```typescript
// Client-side code
const response = await fetch('/api/n8n/workflow/sdVzJXaKnmFQUUbo')

// Server-side code (/api/n8n/workflow/[id]/route.ts)
const apiKey = process.env.N8N_API_KEY  // ✅ Server-side only
const n8nResponse = await fetch(
  `${process.env.N8N_BASE_URL}/api/v1/workflows/...`,
  { headers: { 'X-N8N-API-KEY': apiKey } }
)
```

---

### 3. ❌ Hardcoding API Key in Code

**WRONG:**
```typescript
const apiKey = 'sk-abc123def456'  // ❌ Hardcoded!
```

**WHY**: API key gets committed to git, exposed in version control.

**CORRECT:**
```typescript
const apiKey = process.env.N8N_API_KEY  // ✅ From .env.local
```

---

### 4. ❌ Trying to Access SQLite Database Directly

**WRONG:**
```typescript
// Don't do this!
import sqlite3 from 'sqlite3'
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite')
```

**WHY**: 
- Database is inside Docker container (not accessible from host)
- n8n API is the official, supported interface
- Direct DB access bypasses n8n's validation and business logic

**CORRECT:**
```typescript
// Use n8n REST API
const response = await fetch(
  `${process.env.N8N_BASE_URL}/api/v1/workflows/sdVzJXaKnmFQUUbo`,
  { headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY } }
)
```

---

### 5. ❌ Forgetting X-N8N-API-KEY Header

**WRONG:**
```typescript
const response = await fetch(
  `${baseUrl}/api/v1/workflows/sdVzJXaKnmFQUUbo`
  // ❌ Missing auth header!
)
```

**WHY**: n8n requires authentication. Request will fail with 401.

**CORRECT:**
```typescript
const response = await fetch(
  `${baseUrl}/api/v1/workflows/sdVzJXaKnmFQUUbo`,
  {
    headers: {
      'X-N8N-API-KEY': process.env.N8N_API_KEY  // ✅ Required
    }
  }
)
```

---

### 6. ❌ Not Handling Timeouts

**WRONG:**
```typescript
const response = await fetch(`${baseUrl}/api/v1/workflows/...`)
// ❌ No timeout — request could hang forever
```

**WHY**: Network requests can hang. Need timeout to fail gracefully.

**CORRECT:**
```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 5000)  // 5s timeout

try {
  const response = await fetch(`${baseUrl}/api/v1/workflows/...`, {
    signal: controller.signal,
    headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY }
  })
  clearTimeout(timeoutId)
  return response.json()
} catch (error) {
  if (error.name === 'AbortError') {
    return { error: 'Request timeout' }
  }
  throw error
}
```

---

### 7. ❌ Not Validating Workflow ID

**WRONG:**
```typescript
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const workflowId = params.id  // ❌ Could be anything!
  const response = await fetch(
    `${process.env.N8N_BASE_URL}/api/v1/workflows/${workflowId}`,
    { headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY } }
  )
}
```

**WHY**: Attacker could request any workflow ID. Should only allow the configured one.

**CORRECT:**
```typescript
export async function GET(req: Request, { params }: { params: { id: string } }) {
  // ✅ Validate workflow ID matches env var
  if (params.id !== process.env.N8N_WORKFLOW_ID) {
    return new Response(JSON.stringify({ error: 'Invalid workflow ID' }), {
      status: 400
    })
  }
  
  const response = await fetch(
    `${process.env.N8N_BASE_URL}/api/v1/workflows/${params.id}`,
    { headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY } }
  )
}
```

---

### 8. ❌ Not Handling n8n Errors Gracefully

**WRONG:**
```typescript
const response = await fetch(`${baseUrl}/api/v1/workflows/...`)
const data = response.json()  // ❌ Crashes if response is error
return data
```

**WHY**: n8n might return 401, 404, 500, etc. Need to handle errors.

**CORRECT:**
```typescript
const response = await fetch(`${baseUrl}/api/v1/workflows/...`, {
  headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY }
})

if (!response.ok) {
  const error = await response.json()
  return {
    status: 'error',
    errorCode: response.status === 401 ? 'AUTH_FAILED' : 'N8N_ERROR',
    errorMessage: error.message || 'n8n request failed'
  }
}

return { status: 'ok', data: await response.json() }
```

---

## Best Practices

### 1. ✅ Always Use Environment Variables

```typescript
// ✅ Good
const baseUrl = process.env.N8N_BASE_URL
const apiKey = process.env.N8N_API_KEY
const workflowId = process.env.N8N_WORKFLOW_ID

// ❌ Bad
const baseUrl = 'http://43.156.108.96:5678'
const apiKey = 'sk-...'
const workflowId = 'sdVzJXaKnmFQUUbo'
```

### 2. ✅ Validate Environment Variables on Startup

```typescript
// In your API route or initialization
if (!process.env.N8N_BASE_URL) {
  throw new Error('N8N_BASE_URL not configured')
}
if (!process.env.N8N_API_KEY) {
  throw new Error('N8N_API_KEY not configured')
}
if (!process.env.N8N_WORKFLOW_ID) {
  throw new Error('N8N_WORKFLOW_ID not configured')
}
```

### 3. ✅ Create Reusable n8n Client

```typescript
// lib/n8n.ts
export async function fetchFromN8n(
  endpoint: string,
  options: RequestInit = {}
) {
  const baseUrl = process.env.N8N_BASE_URL
  const apiKey = process.env.N8N_API_KEY
  
  if (!baseUrl || !apiKey) {
    throw new Error('n8n not configured')
  }
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        'X-N8N-API-KEY': apiKey
      }
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`n8n error: ${response.status}`)
    }
    
    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}
```

### 4. ✅ Log Requests (Server-Side Only)

```typescript
// ✅ Good — server-side logging
console.log(`[n8n] GET /workflows/${workflowId}`)

// ❌ Bad — logs API key
console.log(`[n8n] Auth: ${apiKey}`)
```

### 5. ✅ Use Same-Origin Check

```typescript
export async function GET(req: Request) {
  // ✅ Verify request is from same origin
  const origin = req.headers.get('origin')
  if (origin && !origin.includes('localhost') && !origin.includes('yourdomain.com')) {
    return new Response('Forbidden', { status: 403 })
  }
  
  // ... rest of handler
}
```

### 6. ✅ Cache Workflow Data Appropriately

```typescript
// ✅ Cache for 5 minutes to reduce n8n API calls
const CACHE_TTL = 5 * 60 * 1000  // 5 minutes

let cachedWorkflow: any = null
let cacheTime: number = 0

export async function getWorkflow(id: string) {
  const now = Date.now()
  
  if (cachedWorkflow && (now - cacheTime) < CACHE_TTL) {
    return cachedWorkflow
  }
  
  const workflow = await fetchFromN8n(`/api/v1/workflows/${id}`)
  cachedWorkflow = workflow
  cacheTime = now
  
  return workflow
}
```

---

## Testing Checklist

- [ ] Verify N8N_BASE_URL is public IP (43.156.108.96), not localhost
- [ ] Verify N8N_API_KEY is read from process.env, not hardcoded
- [ ] Verify API key is never logged or exposed to browser
- [ ] Verify X-N8N-API-KEY header is included in all requests
- [ ] Verify timeout is set (5 seconds recommended)
- [ ] Verify workflow ID is validated against env var
- [ ] Verify errors are handled gracefully (no crashes)
- [ ] Verify 401 errors show auth failure message
- [ ] Verify 404 errors show workflow not found message
- [ ] Verify network errors fall back to offline mode

---

## Quick Reference: Correct Pattern

```typescript
// ✅ CORRECT: Next.js API route
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
  
  // 2. Get credentials from env (server-side only)
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
          'X-N8N-API-KEY': apiKey  // ✅ Server-side only
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

This is the pattern to follow for all n8n API routes!
