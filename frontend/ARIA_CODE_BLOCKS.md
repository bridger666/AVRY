# ARIA Integration - Copy-Paste Code Blocks

## Quick Reference

All code blocks below are ready to copy-paste directly.

---

## 1. ARIA Client Helper (aria-client.js)

**Location:** `frontend/aria-client.js` ✅ CREATED

**Usage in HTML:**
```html
<script src="aria-client.js"></script>
```

**Key Functions:**
- `window.AriaClient.sendConsoleMessage(message, history, meta)`
- `window.AriaClient.runDiagnostic(query, history, meta)`
- `window.AriaClient.generateBlueprint(prompt, meta)`
- `window.AriaClient.testAriaConnection()`

---

## 2. Updated Console Streaming (console-streaming-aria.js)

**Location:** `frontend/console-streaming-aria.js` ✅ CREATED

**To use:** Replace `console-streaming.js` with this file:
```bash
cd frontend
cp console-streaming.js console-streaming-zenclaw-backup.js
cp console-streaming-aria.js console-streaming.js
```

---

## 3. Universal Patcher Tool (apply-patch.js)

**Location:** `frontend/apply-patch.js` ✅ CREATED

**Usage:**
```bash
node apply-patch.js <file> <startLine> <endLine> <replacementFile>
```

**Example:**
```bash
# Create replacement content
cat > /tmp/new-code.js << 'EOF'
function myNewFunction() {
    console.log('Updated');
}
EOF

# Apply patch
node apply-patch.js console.js 100 120 /tmp/new-code.js
```

---

## 4. Console Message Integration

### Current Code (Zenclaw):
```javascript
async function sendMessageWithSimulatedStreaming(userMessage) {
    const response = await fetch('http://43.156.108.96:8080/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: userMessage,
            history: history,
            system_prompt: AIVORY_SYSTEM_PROMPT
        })
    });
    const data = await response.json();
    addMessage('assistant', data.reply);
}
```

### New Code (ARIA):
```javascript
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
        
        hideTypingIndicator();
        
        addMessage('assistant', reply, [], {
            tokens: reply.split(' ').length,
            model: data.model || 'unknown',
            intent: data.intent || 'general',
            thinkingTime: thinkingTime
        });
        
        if (typeof saveConversation === 'function') {
            saveConversation();
        }
        
    } catch (error) {
        hideTypingIndicator();
        console.error('ARIA error:', error);
        addMessage('assistant', `⚠️ Connection error: ${error.message}`);
    }
}
```

---

## 5. Diagnostic Integration

### Add to app.js or create diagnostic-aria.js:

```javascript
/**
 * Run diagnostic via ARIA n8n webhook
 * @param {string} diagnosticQuery - Diagnostic question or context
 * @param {Array} history - Conversation history
 * @returns {Promise<Object>} Diagnostic result
 */
async function runDiagnosticViaAria(diagnosticQuery, history = []) {
    try {
        // Show loading indicator
        const loadingEl = document.getElementById('diagnostic-loading');
        if (loadingEl) loadingEl.style.display = 'block';
        
        const result = await window.AriaClient.runDiagnostic(diagnosticQuery, history, {
            userId: getUserId ? getUserId() : 'anonymous',
            diagnosticType: 'free', // or 'snapshot' or 'deep'
            timestamp: new Date().toISOString()
        });
        
        // Hide loading indicator
        if (loadingEl) loadingEl.style.display = 'none';
        
        return result;
        
    } catch (error) {
        // Hide loading indicator
        const loadingEl = document.getElementById('diagnostic-loading');
        if (loadingEl) loadingEl.style.display = 'none';
        
        console.error('Diagnostic error:', error);
        alert('Diagnostic failed: ' + error.message);
        throw error;
    }
}
```

### Update submitFreeDiagnostic:

**Before:**
```javascript
async function submitFreeDiagnostic() {
    const response = await fetch(`${API_BASE_URL}/api/v1/diagnostic/free`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            mode: 'free',
            answers: freeDiagnosticAnswers,
            language: 'en'
        })
    });
    const result = await response.json();
    displayFreeDiagnosticResults(result);
}
```

**After:**
```javascript
async function submitFreeDiagnostic() {
    // Build diagnostic query
    const diagnosticQuery = JSON.stringify({
        type: 'free',
        answers: freeDiagnosticAnswers,
        language: 'en'
    });
    
    // Call ARIA
    const result = await runDiagnosticViaAria(diagnosticQuery, []);
    
    // Display results (existing function)
    displayFreeDiagnosticResults(result);
}
```

---

## 6. Blueprint Integration

### Add to app.js:

```javascript
/**
 * Generate blueprint via ARIA n8n webhook
 * @param {string} blueprintPrompt - Blueprint generation prompt
 * @returns {Promise<Object>} Blueprint/workflow object
 */
async function generateBlueprintViaAria(blueprintPrompt) {
    try {
        // Show loading indicator
        const loadingEl = document.getElementById('blueprint-loading');
        if (loadingEl) loadingEl.style.display = 'block';
        
        const result = await window.AriaClient.generateBlueprint(blueprintPrompt, {
            userId: getUserId ? getUserId() : 'anonymous',
            diagnosticId: getDiagnosticId ? getDiagnosticId() : null,
            timestamp: new Date().toISOString()
        });
        
        // Hide loading indicator
        if (loadingEl) loadingEl.style.display = 'none';
        
        return result;
        
    } catch (error) {
        // Hide loading indicator
        const loadingEl = document.getElementById('blueprint-loading');
        if (loadingEl) loadingEl.style.display = 'none';
        
        console.error('Blueprint generation error:', error);
        alert('Blueprint generation failed: ' + error.message);
        throw error;
    }
}
```

### Update runBlueprint:

**Before:**
```javascript
async function runBlueprint() {
    showSection('blueprint-loading');
    
    const response = await fetch(`${API_BASE_URL}/api/v1/blueprint/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            diagnostic_id: getDiagnosticId(),
            objective: userObjective,
            constraints: {},
            industry: 'general'
        })
    });
    
    const result = await response.json();
    displayBlueprintResults(result);
}
```

**After:**
```javascript
async function runBlueprint() {
    showSection('blueprint-loading');
    
    // Build blueprint prompt
    const blueprintPrompt = `Generate AI System Blueprint for the following objective: ${userObjective}. 
    Diagnostic ID: ${getDiagnosticId()}. 
    Industry: general.`;
    
    // Call ARIA
    const result = await generateBlueprintViaAria(blueprintPrompt);
    
    // Display results (existing function)
    displayBlueprintResults(result);
}
```

---

## 7. HTML Integration

### Update your main HTML file:

**Before:**
```html
<!-- Old Zenclaw integration -->
<script src="console-streaming.js"></script>
```

**After:**
```html
<!-- ARIA n8n integration -->
<script src="aria-client.js"></script>
<script src="console-streaming.js"></script>
```

**Or if using separate files:**
```html
<!-- ARIA n8n integration -->
<script src="aria-client.js"></script>
<script src="console-streaming-aria.js"></script>
<script src="diagnostic-aria.js"></script>
```

---

## 8. Testing Code

### Test in Browser Console:

```javascript
// Test 1: Connection
await window.AriaClient.testAriaConnection();
// Expected: ✅ ARIA n8n connection successful

// Test 2: Console message
const result = await window.AriaClient.sendConsoleMessage('Hello ARIA', [], {
    userId: 'test-user',
    sessionId: 'test-session'
});
console.log('Reply:', result.reply);
console.log('Model:', result.model);

// Test 3: Diagnostic
const diagnostic = await window.AriaClient.runDiagnostic(
    JSON.stringify({ type: 'test', question: 'What is AI readiness?' }),
    [],
    { userId: 'test-user' }
);
console.log('Diagnostic result:', diagnostic);

// Test 4: Blueprint
const blueprint = await window.AriaClient.generateBlueprint(
    'Create a workflow for email automation',
    { userId: 'test-user' }
);
console.log('Blueprint:', blueprint);
```

---

## 9. Configuration Reference

### ARIA Endpoint Configuration:

```javascript
// In aria-client.js (already configured)
const N8N_URL = "http://43.156.108.96:5678/webhook/755fcac8";
const N8N_AUTH_USER = "admin";
const N8N_AUTH_PASSWORD = "strongpassword";
```

### Payload Formats:

**Console Mode:**
```json
{
  "mode": "console",
  "messages": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi there!" }
  ],
  "meta": {
    "source": "aivory-console-local",
    "userId": "user123",
    "sessionId": "session456",
    "timestamp": "2024-03-01T12:00:00Z"
  }
}
```

**Diagnostic Mode:**
```json
{
  "mode": "diagnostic",
  "messages": [
    { "role": "user", "content": "{\"type\":\"free\",\"answers\":{...}}" }
  ],
  "meta": {
    "source": "diagnostic-panel",
    "userId": "user123",
    "diagnosticType": "free",
    "timestamp": "2024-03-01T12:00:00Z"
  }
}
```

**Blueprint Mode:**
```json
{
  "mode": "blueprint",
  "prompt": "Generate AI System Blueprint for revenue growth",
  "meta": {
    "source": "blueprint-panel",
    "userId": "user123",
    "diagnosticId": "diag_abc123",
    "timestamp": "2024-03-01T12:00:00Z"
  }
}
```

---

## 10. Quick Migration Commands

```bash
# Navigate to frontend directory
cd frontend

# Make patcher executable
chmod +x apply-patch.js

# Backup current files
cp console-streaming.js console-streaming-zenclaw-backup.js

# Replace with ARIA version
cp console-streaming-aria.js console-streaming.js

# Or run the automated script
chmod +x QUICK_MIGRATION.sh
./QUICK_MIGRATION.sh
```

---

## 11. Rollback Commands

```bash
# Restore original Zenclaw version
cd frontend
cp console-streaming-zenclaw-backup.js console-streaming.js

# Or use the backup created by apply-patch.js
cp console-streaming.js.backup console-streaming.js
```

---

## 12. Troubleshooting

### Check ARIA Connection:
```bash
curl -u admin:strongpassword \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"mode":"console","messages":[{"role":"user","content":"ping"}],"meta":{"source":"test"}}' \
  http://43.156.108.96:5678/webhook/755fcac8
```

### Check n8n Status:
```bash
ssh user@43.156.108.96
docker ps | grep n8n
docker logs n8n
```

### Enable CORS on n8n:
```bash
# Add to n8n environment variables
N8N_CORS_ORIGIN=http://localhost:3000,http://localhost:9000
```

---

## Summary

✅ **Files Created:**
- `aria-client.js` - ARIA webhook client
- `console-streaming-aria.js` - Updated console streaming
- `apply-patch.js` - Universal patcher tool
- `ARIA_MIGRATION_GUIDE.md` - Complete guide
- `QUICK_MIGRATION.sh` - Automated migration script

✅ **Integration Points:**
- Console chat → `sendConsoleMessage()`
- Diagnostic → `runDiagnostic()`
- Blueprint → `generateBlueprint()`

✅ **Endpoint Change:**
- Old: `http://43.156.108.96:8080/chat` (Zenclaw)
- New: `http://43.156.108.96:5678/webhook/755fcac8` (ARIA n8n)

✅ **Authentication:**
- HTTP Basic Auth: `admin:strongpassword`
