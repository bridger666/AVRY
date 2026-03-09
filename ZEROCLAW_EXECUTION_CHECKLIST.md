# Zeroclaw Migration - Execution Checklist

## Pre-Migration Checklist

- [ ] Backup current system
- [ ] Verify Zeroclaw binary is ready
- [ ] Confirm n8n is running on port 5678
- [ ] Confirm n8n Basic Auth is enabled
- [ ] Test n8n webhook manually
- [ ] Review all documentation

## Frontend Migration (5 minutes)

### Step 1: Navigate to Frontend Directory
```bash
cd frontend
```
- [ ] Confirmed in frontend directory

### Step 2: Verify Files Exist
```bash
ls -lh apply-patch.js migrate-to-zeroclaw.sh console-streaming.js
```
- [ ] `apply-patch.js` exists
- [ ] `migrate-to-zeroclaw.sh` exists and is executable
- [ ] `console-streaming.js` exists

### Step 3: Run Migration Script
```bash
./migrate-to-zeroclaw.sh
```
- [ ] Script completed without errors
- [ ] Backup created: `console-streaming-zenclaw-backup.js`
- [ ] All 7 steps completed successfully

### Step 4: Verify Changes
```bash
# Should return NO results (all changed)
grep -i "zenclaw" console-streaming.js
grep "8080" console-streaming.js

# Should return results (new references)
grep -i "zeroclaw" console-streaming.js
grep "3100" console-streaming.js
```
- [ ] No "zenclaw" references found
- [ ] No "8080" references found
- [ ] "zeroclaw" references found (5+ matches)
- [ ] "3100" references found (2+ matches)

## Backend Configuration (30 minutes)

### Step 5: Configure Zeroclaw

**If using Rust implementation:**

- [ ] Added dependencies to `Cargo.toml`:
  - `reqwest = { version = "0.11", features = ["json"] }`
  - `base64 = "0.21"`
  - `serde = { version = "1.0", features = ["derive"] }`
  - `serde_json = "1.0"`

- [ ] Implemented webhook handler
  - [ ] Accepts POST at `/webhook`
  - [ ] Forwards to `http://43.156.108.96:5678/webhook/755fcac8`
  - [ ] Adds Basic Auth header
  - [ ] Returns n8n response to frontend

- [ ] Built binary: `cargo build --release`
- [ ] Binary exists at `target/release/zeroclaw`

**If using configuration file:**

- [ ] Updated `zeroclaw.toml` or `config.toml`
- [ ] Set upstream URL to n8n webhook
- [ ] Added Basic Auth header
- [ ] Enabled CORS for localhost:3000

### Step 6: Deploy Zeroclaw

```bash
# Copy to VPS
scp target/release/zeroclaw user@43.156.108.96:/opt/zeroclaw/

# SSH to VPS
ssh user@43.156.108.96

# Run Zeroclaw
cd /opt/zeroclaw
./zeroclaw
```

- [ ] Binary copied to VPS
- [ ] Zeroclaw started successfully
- [ ] Listening on port 3100
- [ ] No startup errors in logs

## Testing (10 minutes)

### Step 7: Test Zeroclaw Health

```bash
curl http://43.156.108.96:3100/health
```
- [ ] Returns 200 OK
- [ ] Response body indicates healthy

### Step 8: Test Webhook Endpoint

```bash
curl -X POST http://43.156.108.96:3100/webhook \
  -H "Content-Type: application/json" \
  -d '{"message":"test","history":[],"system_prompt":"Reply with hello"}'
```
- [ ] Returns 200 OK
- [ ] Response contains `"reply"` field
- [ ] Response is valid JSON

### Step 9: Test n8n Connection (from Zeroclaw)

```bash
# On VPS, check Zeroclaw logs
tail -f /var/log/zeroclaw.log
# OR
journalctl -u zeroclaw -f
```
- [ ] Logs show outgoing request to n8n
- [ ] Logs show successful response from n8n
- [ ] No authentication errors
- [ ] No connection errors

### Step 10: Test Frontend Integration

```bash
# Open browser
open http://localhost:3000/console
```

**In browser console:**
- [ ] See: `✅ Zeroclaw connection successful`
- [ ] No JavaScript errors
- [ ] No CORS errors

**Send test message:**
- [ ] Type "Hello" and send
- [ ] Message appears in chat
- [ ] Typing indicator shows
- [ ] Response appears
- [ ] Response is relevant

**Check Network tab:**
- [ ] Request goes to `43.156.108.96:3100/webhook`
- [ ] Request method is POST
- [ ] Request has Content-Type: application/json
- [ ] Response status is 200
- [ ] Response contains reply

### Step 11: Test Error Handling

**Test 1: Stop Zeroclaw**
```bash
# On VPS
pkill zeroclaw
```
- [ ] Frontend shows connection error
- [ ] Error message mentions Zeroclaw
- [ ] Error message mentions port 3100
- [ ] No JavaScript crash

**Test 2: Restart Zeroclaw**
```bash
# On VPS
./zeroclaw
```
- [ ] Frontend reconnects automatically
- [ ] Messages work again

## Post-Migration Verification

### Step 12: Functional Testing

- [ ] **Console chat works**
  - [ ] Send message
  - [ ] Receive response
  - [ ] Multiple messages in conversation
  - [ ] History is maintained

- [ ] **Credits deducted** (if applicable)
  - [ ] Credit count decreases
  - [ ] UI updates correctly

- [ ] **Conversation saved** (if applicable)
  - [ ] Refresh page
  - [ ] History persists

- [ ] **Error handling works**
  - [ ] Network errors show user-friendly message
  - [ ] Timeout errors handled gracefully
  - [ ] Invalid responses handled

### Step 13: Performance Testing

- [ ] **Response time acceptable**
  - [ ] First message: < 5 seconds
  - [ ] Subsequent messages: < 3 seconds
  - [ ] No significant slowdown vs. Zenclaw

- [ ] **No memory leaks**
  - [ ] Send 10+ messages
  - [ ] Check browser memory usage
  - [ ] No continuous growth

### Step 14: Cross-Browser Testing

- [ ] **Chrome/Chromium**
  - [ ] Console works
  - [ ] No errors

- [ ] **Firefox**
  - [ ] Console works
  - [ ] No errors

- [ ] **Safari** (if on Mac)
  - [ ] Console works
  - [ ] No errors

## Monitoring Setup

### Step 15: Enable Logging

- [ ] **Zeroclaw logs enabled**
  - [ ] Request logging
  - [ ] Response logging
  - [ ] Error logging
  - [ ] Performance metrics

- [ ] **Log rotation configured**
  - [ ] Max file size set
  - [ ] Old logs archived
  - [ ] Disk space monitored

### Step 16: Set Up Alerts

- [ ] **Health check monitoring**
  - [ ] Ping `/health` every 60 seconds
  - [ ] Alert if down for > 2 minutes

- [ ] **Error rate monitoring**
  - [ ] Track 5xx errors
  - [ ] Alert if > 5% error rate

- [ ] **Latency monitoring**
  - [ ] Track p95 latency
  - [ ] Alert if > 10 seconds

## Documentation

### Step 17: Update Documentation

- [ ] **Architecture diagram updated**
  - [ ] Shows Zeroclaw instead of Zenclaw
  - [ ] Shows n8n integration
  - [ ] Shows Basic Auth

- [ ] **API documentation updated**
  - [ ] Endpoint URLs updated
  - [ ] Port numbers updated
  - [ ] Authentication documented

- [ ] **Runbook created**
  - [ ] Startup procedure
  - [ ] Shutdown procedure
  - [ ] Troubleshooting guide
  - [ ] Rollback procedure

## Rollback Plan (If Needed)

### Step 18: Rollback Frontend

```bash
cd frontend
cp console-streaming-zenclaw-backup.js console-streaming.js
```
- [ ] File restored
- [ ] Browser refreshed
- [ ] Console works with Zenclaw

### Step 19: Rollback Backend

```bash
# On VPS
pkill zeroclaw
# Start Zenclaw instead
./zenclaw
```
- [ ] Zeroclaw stopped
- [ ] Zenclaw started
- [ ] Frontend connects to Zenclaw

## Sign-Off

### Migration Completed By

- **Name:** ___________________________
- **Date:** ___________________________
- **Time:** ___________________________

### Verification

- [ ] All checklist items completed
- [ ] All tests passed
- [ ] No critical errors
- [ ] Performance acceptable
- [ ] Documentation updated
- [ ] Team notified

### Rollback Decision

- [ ] **Migration successful** - No rollback needed
- [ ] **Issues found** - Rollback initiated
- [ ] **Partial success** - Investigating

### Notes

```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

## Quick Reference

### Key URLs
- Frontend: `http://localhost:3000/console`
- Zeroclaw: `http://43.156.108.96:3100/webhook`
- n8n ARIA: `http://43.156.108.96:5678/webhook/755fcac8`

### Key Commands
```bash
# Frontend migration
cd frontend && ./migrate-to-zeroclaw.sh

# Verify changes
grep -i "zeroclaw" frontend/console-streaming.js

# Test Zeroclaw
curl http://43.156.108.96:3100/health

# Rollback
cp console-streaming-zenclaw-backup.js console-streaming.js
```

### Key Files
- `frontend/console-streaming.js` - Main file
- `frontend/console-streaming-zenclaw-backup.js` - Backup
- `ZEROCLAW_MIGRATION_COMPLETE.md` - Full guide
- `frontend/BEFORE_AFTER_SUMMARY.md` - Changes reference

---

**Checklist Version:** 1.0
**Last Updated:** March 1, 2026
**Status:** Ready for execution
