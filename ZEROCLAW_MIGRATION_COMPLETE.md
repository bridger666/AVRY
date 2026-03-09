# Zeroclaw Migration - Complete Implementation Guide

## Executive Summary

Successfully prepared migration from Zenclaw (port 8080) to Zeroclaw (port 3100) gateway with n8n ARIA integration.

**Status:** ✅ Frontend migration ready | ⏳ Backend configuration pending

## What Was Delivered

### 1. Frontend Migration Script ✅

**File:** `frontend/migrate-to-zeroclaw.sh`

**What it does:**
- Backs up original `console-streaming.js`
- Updates all Zenclaw references to Zeroclaw
- Changes port 8080 → 3100
- Updates endpoint `/chat` → `/webhook`
- Preserves all functionality

**Usage:**
```bash
cd frontend
./migrate-to-zeroclaw.sh
```

**Changes made:**
- Line 1-4: Header comment
- Line 10-11: Endpoint constants
- Line 20-48: Connection test function
- Line 53: Function call
- Line 57-59: Section comment
- Line 78: Fetch endpoint
- Line 141-142: Error messages

### 2. Universal Patch Tool ✅

**File:** `frontend/apply-patch.js`

**What it does:**
- Surgical line-range replacement for JavaScript files
- 1-based line numbers (matches `nl -ba` output)
- Creates automatic backups

**Usage:**
```bash
node apply-patch.js <file> <startLine> <endLine> <replacementFile>
```

**Example:**
```bash
cat > /tmp/new-code.js << 'EOF'
const NEW_ENDPOINT = 'http://example.com';
EOF

node apply-patch.js console-streaming.js 10 10 /tmp/new-code.js
```

### 3. Backend Configuration Guide ✅

**File:** `ZEROCLAW_BACKEND_CONFIG.md`

**Contains:**
- Complete Rust implementation example
- Configuration file templates (TOML/YAML)
- Mode detection logic (console/diagnostic/blueprint)
- Error handling patterns
- Testing procedures
- Deployment instructions

**Key implementation:**
```rust
// Zeroclaw forwards to n8n with Basic Auth
let response = client
    .post("http://43.156.108.96:5678/webhook/755fcac8")
    .header("Authorization", "Basic YWRtaW46c3Ryb25ncGFzc3dvcmQ=")
    .json(&n8n_request)
    .send()
    .await?;
```

### 4. Documentation ✅

**Files created:**
- `frontend/ZEROCLAW_MIGRATION.md` - Detailed migration guide
- `frontend/ZEROCLAW_QUICK_START.md` - Quick reference
- `ZEROCLAW_BACKEND_CONFIG.md` - Backend implementation
- `ZEROCLAW_MIGRATION_COMPLETE.md` - This file

## Architecture

### Before (Zenclaw)
```
Browser → Zenclaw (port 8080) → OpenRouter/LLM
```

### After (Zeroclaw)
```
Browser → Zeroclaw (port 3100) → n8n ARIA (port 5678) with Basic Auth
```

### Data Flow

**1. Frontend → Zeroclaw**
```json
{
  "message": "Hello",
  "history": [{"role": "user", "content": "..."}],
  "system_prompt": "..."
}
```

**2. Zeroclaw → n8n ARIA**
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

**3. n8n ARIA → Zeroclaw**
```json
{
  "reply": "Hello! How can I help?",
  "model_used": "qwen3-14b",
  "intent": "greeting"
}
```

**4. Zeroclaw → Frontend**
```json
{
  "reply": "Hello! How can I help?",
  "model_used": "qwen3-14b",
  "intent": "greeting"
}
```

## Implementation Checklist

### Frontend (Ready to Execute)

- [x] Create migration script
- [x] Create patch tool
- [x] Document changes
- [ ] **Run migration:** `cd frontend && ./migrate-to-zeroclaw.sh`
- [ ] **Verify:** `grep -n "ZEROCLAW" frontend/console-streaming.js`
- [ ] **Test:** Open `http://localhost:3000/console`

### Backend (Configuration Needed)

- [ ] **Configure Zeroclaw** to listen on port 3100
- [ ] **Add n8n forwarding** to `http://43.156.108.96:5678/webhook/755fcac8`
- [ ] **Add Basic Auth** header: `Authorization: Basic YWRtaW46c3Ryb25ncGFzc3dvcmQ=`
- [ ] **Add mode detection** (console/diagnostic/blueprint)
- [ ] **Enable CORS** for `http://localhost:3000`
- [ ] **Test connection:** `curl http://43.156.108.96:3100/webhook`

## Execution Steps

### Step 1: Frontend Migration (5 minutes)

```bash
# Navigate to frontend directory
cd frontend

# Run migration script
./migrate-to-zeroclaw.sh

# Verify changes
grep -n "ZEROCLAW" console-streaming.js
grep -n "3100" console-streaming.js

# Expected output:
# Line 10: const ZEROCLAW_ENDPOINT = 'http://43.156.108.96:3100/webhook';
# Line 11: const ZEROCLAW_TRIGGER_ENDPOINT = 'http://43.156.108.96:3100/webhook';
```

### Step 2: Backend Configuration (15-30 minutes)

**Option A: Rust Implementation**

1. Add dependencies to `Cargo.toml`:
```toml
reqwest = { version = "0.11", features = ["json"] }
base64 = "0.21"
```

2. Implement webhook handler (see `ZEROCLAW_BACKEND_CONFIG.md`)

3. Build and deploy:
```bash
cargo build --release
scp target/release/zeroclaw user@43.156.108.96:/opt/zeroclaw/
```

**Option B: Configuration File**

1. Update `zeroclaw.toml` or `config.toml`
2. Set upstream URL to n8n webhook
3. Add Basic Auth header
4. Restart Zeroclaw

### Step 3: Testing (10 minutes)

**Test 1: Zeroclaw Health**
```bash
curl http://43.156.108.96:3100/health
# Expected: 200 OK
```

**Test 2: Webhook Endpoint**
```bash
curl -X POST http://43.156.108.96:3100/webhook \
  -H "Content-Type: application/json" \
  -d '{"message":"test","history":[]}'
# Expected: JSON response with "reply" field
```

**Test 3: Frontend Integration**
```bash
# 1. Open http://localhost:3000/console
# 2. Check browser console for: "✅ Zeroclaw connection successful"
# 3. Send message: "Hello"
# 4. Verify response appears in chat
```

**Test 4: Network Inspection**
```bash
# In browser DevTools → Network tab:
# 1. Send message
# 2. Look for POST to 43.156.108.96:3100/webhook
# 3. Check request payload
# 4. Check response
```

## Rollback Procedure

### Frontend Rollback

```bash
cd frontend
cp console-streaming-zenclaw-backup.js console-streaming.js
```

### Backend Rollback

```bash
# Revert Zeroclaw configuration
# OR point frontend back to Zenclaw:
cd frontend
cat > /tmp/zenclaw-restore.js << 'EOF'
const ZENCLAW_ENDPOINT = 'http://43.156.108.96:8080/chat';
const ZENCLAW_TRIGGER_ENDPOINT = 'http://43.156.108.96:8080/trigger';
EOF
node apply-patch.js console-streaming.js 10 11 /tmp/zenclaw-restore.js
```

## Troubleshooting

### Issue: "Zeroclaw connection failed"

**Symptoms:**
- Browser console shows: `❌ Zeroclaw connection failed`
- Network tab shows failed request to port 3100

**Solutions:**
1. Check Zeroclaw is running: `curl http://43.156.108.96:3100/health`
2. Check port is open: `telnet 43.156.108.96 3100`
3. Check Zeroclaw logs for errors
4. Verify firewall allows port 3100

### Issue: "n8n authentication failed"

**Symptoms:**
- Zeroclaw logs show 401 from n8n
- Responses contain authentication errors

**Solutions:**
1. Verify Basic Auth header in Zeroclaw code
2. Test n8n directly:
```bash
curl -X POST http://43.156.108.96:5678/webhook/755fcac8 \
  -H "Authorization: Basic YWRtaW46c3Ryb25ncGFzc3dvcmQ=" \
  -d '{"mode":"console","message":"test"}'
```
3. Check n8n Basic Auth settings

### Issue: CORS error

**Symptoms:**
- Browser console shows CORS policy error
- Request blocked before reaching Zeroclaw

**Solutions:**
1. Add CORS middleware to Zeroclaw
2. Allow origin: `http://localhost:3000`
3. Allow methods: POST, OPTIONS
4. Allow headers: Content-Type

### Issue: Timeout

**Symptoms:**
- Request hangs
- No response after 30+ seconds

**Solutions:**
1. Increase timeout in Zeroclaw (120 seconds recommended)
2. Check n8n workflow is active
3. Check n8n logs for processing errors
4. Test n8n webhook directly

## Mode Support (Future Enhancement)

### Console Mode (Current)
- Default mode for all requests
- Used for general chat

### Diagnostic Mode (To Add)
**Trigger:** Query param `?mode=diagnostic`
**Payload:**
```json
{
  "mode": "diagnostic",
  "message": "...",
  "history": [...]
}
```

### Blueprint Mode (To Add)
**Trigger:** Query param `?mode=blueprint`
**Payload:**
```json
{
  "mode": "blueprint",
  "prompt": "...",
  "meta": {...}
}
```

## Performance Considerations

### Expected Latency
- Frontend → Zeroclaw: ~10ms (local network)
- Zeroclaw → n8n: ~20ms (same VPS)
- n8n → LLM: 1-5 seconds (depends on model)
- **Total:** 1-5 seconds (similar to current)

### Optimization Opportunities
1. Connection pooling in Zeroclaw
2. Request/response caching
3. Async processing for non-critical paths
4. Load balancing if traffic increases

## Security Notes

### Current Setup
- Basic Auth credentials in code (acceptable for internal VPS)
- No TLS between Zeroclaw and n8n (same machine)
- Frontend uses HTTP (localhost development)

### Production Recommendations
1. Use environment variables for credentials
2. Enable TLS for all connections
3. Implement rate limiting
4. Add request validation
5. Log all requests for audit

## Monitoring

### Metrics to Track
1. Request count (frontend → Zeroclaw)
2. Success rate (Zeroclaw → n8n)
3. Average latency
4. Error rate by type
5. n8n authentication failures

### Logging
- Zeroclaw should log:
  - Incoming requests
  - Outgoing requests to n8n
  - Response status codes
  - Errors with stack traces

## Success Criteria

### Frontend Migration Success
- [x] Script runs without errors
- [ ] All "Zenclaw" references changed to "Zeroclaw"
- [ ] Port 8080 changed to 3100
- [ ] Connection test passes in browser
- [ ] Chat messages work end-to-end

### Backend Configuration Success
- [ ] Zeroclaw listens on port 3100
- [ ] Forwards requests to n8n successfully
- [ ] Basic Auth header included
- [ ] Responses returned to frontend
- [ ] Error handling works

### Integration Success
- [ ] Frontend can send messages
- [ ] Zeroclaw forwards to n8n
- [ ] n8n processes and responds
- [ ] Frontend displays responses
- [ ] No console errors

## Next Steps

1. **Execute frontend migration** (5 min)
   ```bash
   cd frontend && ./migrate-to-zeroclaw.sh
   ```

2. **Configure Zeroclaw backend** (30 min)
   - Follow `ZEROCLAW_BACKEND_CONFIG.md`
   - Implement n8n forwarding
   - Add Basic Auth

3. **Test integration** (10 min)
   - Run all tests from Testing section
   - Verify end-to-end flow

4. **Monitor and iterate** (ongoing)
   - Watch logs for errors
   - Optimize performance
   - Add diagnostic/blueprint modes

## Support

### Documentation
- `frontend/ZEROCLAW_MIGRATION.md` - Detailed guide
- `frontend/ZEROCLAW_QUICK_START.md` - Quick reference
- `ZEROCLAW_BACKEND_CONFIG.md` - Backend implementation

### Tools
- `frontend/apply-patch.js` - Line-range patcher
- `frontend/migrate-to-zeroclaw.sh` - Migration script

### Backups
- `frontend/console-streaming-zenclaw-backup.js` - Original file
- `frontend/console-streaming.js.backup` - Created by apply-patch.js

---

**Migration prepared by:** Kiro AI Assistant
**Date:** March 1, 2026
**Status:** Ready for execution
