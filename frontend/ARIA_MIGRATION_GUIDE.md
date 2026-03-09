# ARIA n8n Migration Guide

## Overview

This guide provides step-by-step instructions to migrate the Aivory AI Console from Zenclaw to direct ARIA n8n webhook integration.

## Files Created

### 1. Core Files
- `aria-client.js` - ARIA n8n webhook client library
- `console-streaming-aria.js` - Updated console streaming with ARIA integration
- `apply-patch.js` - Universal line-range patcher tool

### 2. File Locations Detected

```
frontend/console-streaming.js     (Current Zenclaw integration)
frontend/console-aria.js           (Empty - can be used for new implementation)
frontend/legacy/console.js         (Legacy console)
```

## Part 1: Universal Patcher Tool

### Installation
The `apply-patch.js` tool is ready to use:

```bash
cd frontend
chmod +x apply-patch.js
```

### Usage Examples

**Example 1: Replace a function block**
```bash
# Create replacement content
cat > /tmp/new-function.js << 'EOF'
async function myNewFunction() {
    console.log('Updated implementation');
    return true;
}
EOF

# Apply patch (replace lines 100-120)
node apply-patch.js console-streaming.js 100 120 /tmp/new-function.js
```

**Example 2: Replace constants section**
```bash
# Create new constants
cat > /tmp/new-constants.js << 'EOF'
const N8N_URL = "http://43.156.108.96:5678/webhook/755fcac8";
const N8N_AUTH_USER = "admin";
const N8N_AUTH_PASSWORD = "strongpassword";
EOF

# Replace lines 10-13 (old Zenclaw constants)
node apply-patch.js console-streaming.js 10 13 /tmp/new-constants.js
```

**Example 3: Replace entire function**
```bash
# Get line numbers first
nl -ba console-streaming.js | grep -A 5 "async function sendMessageWithSimulatedStreaming"

# Create replacement
cat > /tmp/new-send-message.js << 'EOF'
async function sendMessageWithSimulatedStreaming(userMessage) {
    const data = await window.AriaClient.sendConsoleMessage(userMessage, history);
    addMessage('assistant', data.reply);
}
EOF

# Apply patch
node apply-patch.js console-streaming.js 62 150 /tmp/new-send-message.js
```

## Part 2: Integration Steps

### Step 1: Add ARIA Client to HTML

Add to your main HTML file (e.g., `console.html` or `index.html`):

```html
<!-- ARIA n8n Client -->
<script src="aria-client.js"></script>

<!-- Updated Console Streaming -->
<script src="console-streaming-aria.js"></script>
```

**OR** if you want to patch the existing file:

```html
<!-- Replace this: -->
<script src="console-streaming.js"></script>

<!-- With this: -->
<script src="aria-client.js"></script>
<script src="console-streaming-aria.js"></script>
```

### Step 2: Update Console Streaming (Option A - Replace File)

**Simplest approach:**

```bash
cd frontend
cp console-streaming.js console-streaming-zenclaw-backup.js
cp console-streaming-aria.js console-streaming.js
```

### Step 3: Update Console Streaming (Option B - Patch Existing)

**If you want to preserve custom modifications:**

```bash
cd frontend

# 1. Replace constants section (lines 10-13)
cat > /tmp/aria-constants.js << 'EOF'
// ARIA n8n configuration loaded from aria-client.js
// No constants needed here - using window.AriaClient
EOF

node apply-patch.js console-streaming.js 10 13 /tmp/aria-constants.js

# 2. Replace sendMessageWithSimulatedStreaming function (lines 62-150)
cat > /tmp/aria-send-message.js << 'EOF'
async function sendMessageWithSimulatedStreaming(userMessage) {
    showTypingIndicator('Thinking...');
    const startTime = Date.now();
    
    const history = ConsoleState.messages
        .slice(-10)
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));
    
    try {
        const data = await window.AriaClient.sendConsoleMessage(userMessage, history, {
            userId: ConsoleState.userId || 'anonymous',
            sessionId: ConsoleState.sessionId || generateSessionId(),
        });
        
        const reply = data.reply || 'No response received.';
        const thinkingTime = ((Date.now() - startTime) / 1000).toFixed(1);
        
        if (typeof ConsoleState !== 'undefined' && ConsoleState.credits) {
            ConsoleState.credits = Math.max(0, ConsoleState.credits - 1);
            if (typeof updateUI === 'function') updateUI();
        }
        
        hideTypingIndicator();
        
        addMessage('assistant', reply, [], {
            tokens: reply.split(' ').length,
            confidence: 0.95,
            cost: 1,
            model: data.model || 'unknown',
            intent: data.intent || 'general',
            thinkingTime: thinkingTime
        });
        
        if (typeof saveConversation === 'function') saveConversation();
        
    } catch (error) {
        hideTypingIndicator();
        console.error('ARIA fetch error:', error);
        addMessage('assistant', `⚠️ Connection error: ${error.message}\n\nUnable to reach ARIA AI service.`);
        if (typeof saveConversation === 'function') saveConversation();
    }
}
EOF

node apply-patch.js console-streaming.js 62 150 /tmp/aria-send-message.js
```

## Part 3: Diagnostic Integration

### Find Diagnostic Functions

```bash
# Locate diagnostic functions
grep -n "function.*diagnostic\|runDiagnostic" frontend/app.js
```

### Add Diagnostic Helper

Add to `app.js` or create `diagnostic-aria.js`:

```javascript
/**
 * Run diagnostic via ARIA
 */
async function runDiagnosticViaAria(diagnosticQuery, history = []) {
    try {
        showLoadingIndicator('Running diagnostic...');
        
        const result = await window.AriaClient.runDiagnostic(diagnosticQuery, history, {
            userId: getUserId(),
            diagnosticType: 'free' // or 'snapshot' or 'deep'
        });
        
        hideLoadingIndicator();
        return result;
        
    } catch (error) {
        hideLoadingIndicator();
        console.error('Diagnostic error:', error);
        alert('Diagnostic failed: ' + error.message);
        throw error;
    }
}
```

### Update Existing Diagnostic Calls

**Before (Zenclaw):**
```javascript
async function submitFreeDiagnostic() {
    const response = await fetch('/api/diagnostic', {
        method: 'POST',
        body: JSON.stringify({ answers: freeDiagnosticAnswers })
    });
    const result = await response.json();
    displayFreeDiagnosticResults(result);
}
```

**After (ARIA):**
```javascript
async function submitFreeDiagnostic() {
    const diagnosticQuery = JSON.stringify({ 
        type: 'free',
        answers: freeDiagnosticAnswers 
    });
    
    const result = await runDiagnosticViaAria(diagnosticQuery, []);
    displayFreeDiagnosticResults(result);
}
```

## Part 4: Blueprint Integration

### Add Blueprint Helper

```javascript
/**
 * Generate blueprint via ARIA
 */
async function generateBlueprintViaAria(blueprintPrompt) {
    try {
        showLoadingIndicator('Generating blueprint...');
        
        const result = await window.AriaClient.generateBlueprint(blueprintPrompt, {
            userId: getUserId(),
            diagnosticId: getDiagnosticId(),
        });
        
        hideLoadingIndicator();
        return result;
        
    } catch (error) {
        hideLoadingIndicator();
        console.error('Blueprint generation error:', error);
        alert('Blueprint generation failed: ' + error.message);
        throw error;
    }
}
```

### Update Existing Blueprint Calls

**Before:**
```javascript
async function runBlueprint() {
    const response = await fetch('/api/blueprint/generate', {
        method: 'POST',
        body: JSON.stringify({ objective: userObjective })
    });
    const result = await response.json();
    displayBlueprintResults(result);
}
```

**After:**
```javascript
async function runBlueprint() {
    const blueprintPrompt = `Generate AI System Blueprint for: ${userObjective}`;
    const result = await generateBlueprintViaAria(blueprintPrompt);
    displayBlueprintResults(result);
}
```

## Part 5: Testing

### Test Connection

Open browser console and run:

```javascript
// Test ARIA connection
await window.AriaClient.testAriaConnection();

// Test console message
const result = await window.AriaClient.sendConsoleMessage('Hello ARIA', []);
console.log('Reply:', result.reply);

// Test diagnostic
const diagnostic = await window.AriaClient.runDiagnostic('Test diagnostic', []);
console.log('Diagnostic:', diagnostic);

// Test blueprint
const blueprint = await window.AriaClient.generateBlueprint('Create workflow for email automation');
console.log('Blueprint:', blueprint);
```

### Verify Network Requests

1. Open DevTools → Network tab
2. Send a message in console
3. Look for request to `43.156.108.96:5678/webhook/755fcac8`
4. Check request headers include `Authorization: Basic ...`
5. Verify response contains expected data

## Part 6: Error Handling

### Common Issues

**Issue 1: CORS Error**
```
Access to fetch at 'http://43.156.108.96:5678/webhook/755fcac8' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:** Configure n8n to allow CORS:
```bash
# On VPS, add to n8n environment:
N8N_CORS_ORIGIN=http://localhost:3000,http://localhost:9000
```

**Issue 2: 401 Unauthorized**
```
ARIA error 401: Unauthorized
```

**Solution:** Verify Basic Auth credentials in `aria-client.js`:
```javascript
const N8N_AUTH_USER = "admin";
const N8N_AUTH_PASSWORD = "strongpassword";
```

**Issue 3: Network Timeout**
```
TypeError: Failed to fetch
```

**Solution:** Check n8n is running:
```bash
ssh user@43.156.108.96
docker ps | grep n8n
curl -u admin:strongpassword http://localhost:5678/webhook/755fcac8
```

## Part 7: Rollback Plan

If issues occur, rollback is simple:

```bash
cd frontend

# Restore original file
cp console-streaming-zenclaw-backup.js console-streaming.js

# Or restore from backup created by apply-patch.js
cp console-streaming.js.backup console-streaming.js

# Update HTML to use original
# Remove: <script src="aria-client.js"></script>
# Keep: <script src="console-streaming.js"></script>
```

## Summary of Changes

### Files Modified
- `console-streaming.js` → Uses ARIA instead of Zenclaw
- `app.js` → Diagnostic functions use ARIA
- `app.js` → Blueprint functions use ARIA

### Old vs New Endpoints

| Feature | Old Endpoint | New Endpoint |
|---------|-------------|--------------|
| Console Chat | `http://43.156.108.96:8080/chat` | `http://43.156.108.96:5678/webhook/755fcac8` |
| Diagnostic | `/api/diagnostic` | `http://43.156.108.96:5678/webhook/755fcac8` (mode: diagnostic) |
| Blueprint | `/api/blueprint/generate` | `http://43.156.108.96:5678/webhook/755fcac8` (mode: blueprint) |

### Authentication

| Old | New |
|-----|-----|
| No auth | HTTP Basic Auth (admin:strongpassword) |

### Payload Format

**Console (Old - Zenclaw):**
```json
{
  "message": "Hello",
  "history": [...],
  "system_prompt": "..."
}
```

**Console (New - ARIA):**
```json
{
  "mode": "console",
  "messages": [...],
  "meta": {
    "source": "aivory-console-local",
    "userId": "...",
    "sessionId": "..."
  }
}
```

## Next Steps

1. ✅ Add `aria-client.js` to HTML
2. ✅ Replace or patch `console-streaming.js`
3. ✅ Update diagnostic functions in `app.js`
4. ✅ Update blueprint functions in `app.js`
5. ✅ Test all three modes (console, diagnostic, blueprint)
6. ✅ Monitor browser console for errors
7. ✅ Verify n8n webhook receives requests correctly

## Support

If you encounter issues:

1. Check browser console for errors
2. Check n8n logs: `docker logs n8n`
3. Verify network connectivity: `curl -u admin:strongpassword http://43.156.108.96:5678/webhook/755fcac8`
4. Review this guide's troubleshooting section
