# Zeroclaw Migration Guide

## Overview
Migration from Zenclaw (port 8080) to Zeroclaw (port 3100) gateway.

**Architecture:**
```
Browser → Zeroclaw (port 3100) → n8n ARIA webhook (port 5678)
```

## Part 1: Frontend Changes

### Step 1: Update Constants (Lines 10-11)

**BEFORE:**
```javascript
const ZENCLAW_ENDPOINT = 'http://43.156.108.96:8080/chat';
const ZENCLAW_TRIGGER_ENDPOINT = 'http://43.156.108.96:8080/trigger';
```

**AFTER:**
```javascript
const ZEROCLAW_ENDPOINT = 'http://43.156.108.96:3100/webhook';
const ZEROCLAW_TRIGGER_ENDPOINT = 'http://43.156.108.96:3100/webhook';
```

**Command:**
```bash
cd frontend

cat > /tmp/zeroclaw-constants.js << 'EOF'
const ZEROCLAW_ENDPOINT = 'http://43.156.108.96:3100/webhook';
const ZEROCLAW_TRIGGER_ENDPOINT = 'http://43.156.108.96:3100/webhook';
EOF

node apply-patch.js console-streaming.js 10 11 /tmp/zeroclaw-constants.js
```

### Step 2: Update Connection Test Function (Lines 20-48)

**Command:**
```bash
cat > /tmp/zeroclaw-test.js << 'EOF'
async function testZeroclawConnection() {
    try {
        const response = await fetch(ZEROCLAW_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'ping',
                history: [],
                system_prompt: 'Reply with "pong"'
            })
        });
        
        if (response.ok) {
            console.log('✅ Zeroclaw connection successful');
            return true;
        } else {
            console.warn('⚠️ Zeroclaw returned status:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Zeroclaw connection failed:', error.message);
        console.error('Endpoint:', ZEROCLAW_ENDPOINT);
        console.error('This could be due to:');
        console.error('  1. CORS policy blocking the request');
        console.error('  2. Network/firewall blocking the connection');
        console.error('  3. Server is temporarily unavailable');
        return false;
    }
}
EOF

node apply-patch.js console-streaming.js 20 48 /tmp/zeroclaw-test.js
```

### Step 3: Update Connection Test Call (Line 53)

**Command:**
```bash
cat > /tmp/zeroclaw-test-call.js << 'EOF'
        setTimeout(() => testZeroclawConnection(), 1000);
EOF

node apply-patch.js console-streaming.js 53 53 /tmp/zeroclaw-test-call.js
```

### Step 4: Update Main Message Function (Lines 78, 141-142)

**Command:**
```bash
cat > /tmp/zeroclaw-fetch.js << 'EOF'
        const response = await fetch(ZEROCLAW_ENDPOINT, {
EOF

node apply-patch.js console-streaming.js 78 78 /tmp/zeroclaw-fetch.js
```

**Command:**
```bash
cat > /tmp/zeroclaw-error.js << 'EOF'
        console.error('Zeroclaw fetch error:', error);
        addMessage('assistant', `⚠️ Connection error: ${error.message}\n\nUnable to reach Zeroclaw AI service at ${ZEROCLAW_ENDPOINT}. Please check that the Zeroclaw server is running on port 3100.`);
EOF

node apply-patch.js console-streaming.js 141 142 /tmp/zeroclaw-error.js
```

### Step 5: Update Header Comment (Lines 1-3)

**Command:**
```bash
cat > /tmp/zeroclaw-header.js << 'EOF'
/**
 * AIVORY AI Console - Zeroclaw Integration
 * Handles message streaming and API communication
 */
EOF

node apply-patch.js console-streaming.js 1 4 /tmp/zeroclaw-header.js
```

### Step 6: Update Section Comment (Lines 57-59)

**Command:**
```bash
cat > /tmp/zeroclaw-section.js << 'EOF'
// ============================================================================
// MESSAGE SENDING WITH ZEROCLAW
// ============================================================================
EOF

node apply-patch.js console-streaming.js 57 59 /tmp/zeroclaw-section.js
```

## Complete Migration Script

Run all commands in sequence:

```bash
#!/bin/bash
cd frontend

# Backup original
cp console-streaming.js console-streaming-zenclaw-backup.js

# 1. Update constants
cat > /tmp/zeroclaw-constants.js << 'EOF'
const ZEROCLAW_ENDPOINT = 'http://43.156.108.96:3100/webhook';
const ZEROCLAW_TRIGGER_ENDPOINT = 'http://43.156.108.96:3100/webhook';
EOF
node apply-patch.js console-streaming.js 10 11 /tmp/zeroclaw-constants.js

# 2. Update connection test function
cat > /tmp/zeroclaw-test.js << 'EOF'
async function testZeroclawConnection() {
    try {
        const response = await fetch(ZEROCLAW_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'ping',
                history: [],
                system_prompt: 'Reply with "pong"'
            })
        });
        
        if (response.ok) {
            console.log('✅ Zeroclaw connection successful');
            return true;
        } else {
            console.warn('⚠️ Zeroclaw returned status:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Zeroclaw connection failed:', error.message);
        console.error('Endpoint:', ZEROCLAW_ENDPOINT);
        console.error('This could be due to:');
        console.error('  1. CORS policy blocking the request');
        console.error('  2. Network/firewall blocking the connection');
        console.error('  3. Server is temporarily unavailable');
        return false;
    }
}
EOF
node apply-patch.js console-streaming.js 20 48 /tmp/zeroclaw-test.js

# 3. Update test call
cat > /tmp/zeroclaw-test-call.js << 'EOF'
        setTimeout(() => testZeroclawConnection(), 1000);
EOF
node apply-patch.js console-streaming.js 53 53 /tmp/zeroclaw-test-call.js

# 4. Update fetch call
cat > /tmp/zeroclaw-fetch.js << 'EOF'
        const response = await fetch(ZEROCLAW_ENDPOINT, {
EOF
node apply-patch.js console-streaming.js 78 78 /tmp/zeroclaw-fetch.js

# 5. Update error message
cat > /tmp/zeroclaw-error.js << 'EOF'
        console.error('Zeroclaw fetch error:', error);
        addMessage('assistant', `⚠️ Connection error: ${error.message}\n\nUnable to reach Zeroclaw AI service at ${ZEROCLAW_ENDPOINT}. Please check that the Zeroclaw server is running on port 3100.`);
EOF
node apply-patch.js console-streaming.js 141 142 /tmp/zeroclaw-error.js

# 6. Update header
cat > /tmp/zeroclaw-header.js << 'EOF'
/**
 * AIVORY AI Console - Zeroclaw Integration
 * Handles message streaming and API communication
 */
EOF
node apply-patch.js console-streaming.js 1 4 /tmp/zeroclaw-header.js

# 7. Update section comment
cat > /tmp/zeroclaw-section.js << 'EOF'
// ============================================================================
// MESSAGE SENDING WITH ZEROCLAW
// ============================================================================
EOF
node apply-patch.js console-streaming.js 57 59 /tmp/zeroclaw-section.js

echo "✅ Frontend migration complete!"
echo "Backup saved to: console-streaming-zenclaw-backup.js"
```

## Part 2: Zeroclaw Configuration

Zeroclaw needs to forward requests to n8n ARIA webhook with Basic Auth.

### Required Configuration

**Zeroclaw must:**
1. Listen on port 3100
2. Accept POST requests at `/webhook`
3. Forward to `http://43.156.108.96:5678/webhook/755fcac8`
4. Add Basic Auth header: `Authorization: Basic YWRtaW46c3Ryb25ncGFzc3dvcmQ=`
5. Support mode detection (console/diagnostic/blueprint)

### Expected Request Flow

**Frontend → Zeroclaw:**
```json
{
  "message": "Hello",
  "history": [{"role": "user", "content": "..."}],
  "system_prompt": "..."
}
```

**Zeroclaw → n8n:**
```json
{
  "mode": "console",
  "message": "Hello",
  "history": [{"role": "user", "content": "..."}],
  "meta": {
    "source": "aivory-console",
    "origin": "zeroclaw-gateway"
  }
}
```

**n8n → Zeroclaw:**
```json
{
  "reply": "...",
  "model_used": "...",
  "intent": "..."
}
```

**Zeroclaw → Frontend:**
```json
{
  "reply": "...",
  "model_used": "...",
  "intent": "..."
}
```

## Testing

### Test Frontend Changes

```bash
# 1. Check file was updated
grep -n "ZEROCLAW" frontend/console-streaming.js

# 2. Verify endpoints
grep -n "3100" frontend/console-streaming.js

# 3. Check function names
grep -n "testZeroclaw" frontend/console-streaming.js
```

### Test Connection

Open browser console at `http://localhost:3000/console`:

```javascript
// Should see in console:
// "✅ Zeroclaw connection successful"

// Manual test:
fetch('http://43.156.108.96:3100/webhook', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({message: 'test', history: []})
}).then(r => r.json()).then(console.log)
```

## Rollback

```bash
cd frontend
cp console-streaming-zenclaw-backup.js console-streaming.js
```

## Summary

### Changed Lines
- Lines 1-4: Header comment (Zenclaw → Zeroclaw)
- Lines 10-11: Endpoint constants (port 8080 → 3100)
- Lines 20-48: Connection test function name and messages
- Line 53: Function call name
- Line 57-59: Section comment
- Line 78: Fetch endpoint variable
- Lines 141-142: Error messages

### Unchanged
- Payload structure (message, history, system_prompt)
- Response handling
- UI behavior
- Message flow logic

### Next Steps
1. ✅ Run migration script
2. ⏳ Configure Zeroclaw to forward to n8n
3. ⏳ Test console chat
4. ⏳ Add diagnostic/blueprint modes
