# Zeroclaw Migration - Quick Start

## TL;DR

**What changed:**
- Zenclaw (port 8080) → Zeroclaw (port 3100)
- Direct LLM calls → Gateway to n8n ARIA

**Architecture:**
```
Browser → Zeroclaw (3100) → n8n ARIA (5678) with Basic Auth
```

## Frontend Migration (5 minutes)

### Step 1: Run Migration Script

```bash
cd frontend
chmod +x migrate-to-zeroclaw.sh
./migrate-to-zeroclaw.sh
```

### Step 2: Verify Changes

```bash
# Check endpoints updated
grep -n "ZEROCLAW" console-streaming.js
grep -n "3100" console-streaming.js

# Should see:
# Line 10: const ZEROCLAW_ENDPOINT = 'http://43.156.108.96:3100/webhook';
# Line 11: const ZEROCLAW_TRIGGER_ENDPOINT = 'http://43.156.108.96:3100/webhook';
```

### Step 3: Test in Browser

1. Open `http://localhost:3000/console`
2. Check browser console for: `✅ Zeroclaw connection successful`
3. Send a test message
4. Verify response appears

## Backend Configuration (Zeroclaw)

### Minimal Configuration

**Zeroclaw must:**
1. Listen on `0.0.0.0:3100`
2. Accept POST at `/webhook`
3. Forward to `http://43.156.108.96:5678/webhook/755fcac8`
4. Add header: `Authorization: Basic YWRtaW46c3Ryb25ncGFzc3dvcmQ=`

### Quick Test

```bash
# Test Zeroclaw is running
curl http://43.156.108.96:3100/health

# Test webhook endpoint
curl -X POST http://43.156.108.96:3100/webhook \
  -H "Content-Type: application/json" \
  -d '{"message":"test","history":[]}'
```

## Rollback

```bash
cd frontend
cp console-streaming-zenclaw-backup.js console-streaming.js
```

## Files Changed

### Frontend
- `console-streaming.js` - All Zenclaw references → Zeroclaw

### Backend (Zeroclaw)
- Add n8n forwarding logic
- Add Basic Auth header
- Add mode detection (console/diagnostic/blueprint)

## Common Issues

### Issue: "Zeroclaw connection failed"

**Check:**
1. Is Zeroclaw running? `curl http://43.156.108.96:3100/health`
2. Is port 3100 open? `telnet 43.156.108.96 3100`
3. Check Zeroclaw logs

### Issue: "n8n authentication failed"

**Fix:** Verify Basic Auth header in Zeroclaw:
```
Authorization: Basic YWRtaW46c3Ryb25ncGFzc3dvcmQ=
```

### Issue: CORS error

**Fix:** Add CORS headers in Zeroclaw for `http://localhost:3000`

## Next Steps

1. ✅ Migrate frontend (run script)
2. ⏳ Configure Zeroclaw backend
3. ⏳ Test console chat
4. ⏳ Add diagnostic mode
5. ⏳ Add blueprint mode

## Documentation

- Full guide: `ZEROCLAW_MIGRATION.md`
- Backend config: `../ZEROCLAW_BACKEND_CONFIG.md`
- Apply-patch tool: `apply-patch.js`
