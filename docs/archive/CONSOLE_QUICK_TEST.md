# Console Quick Test Guide

## ✅ Server Status: ONLINE

The Zenclaw AI server is confirmed working at `http://43.156.108.96:8080`

---

## Quick Test (30 seconds)

### 1. Start Frontend
```bash
cd frontend && python3 -m http.server 8080
```

### 2. Open Console
```
http://localhost:8080/console.html
```

### 3. Check Browser Console (F12)
Look for: `✅ Zenclaw connection successful`

### 4. Send Message
Type: "Hello" → Press Send

**Expected**: AI response within 3-5 seconds

---

## If It Doesn't Work

### Hard Refresh First! 🔄
- **Mac**: Cmd + Shift + R
- **Windows/Linux**: Ctrl + Shift + R

### Check Browser Console
- ✅ Green checkmark = Working
- ❌ Red X = Check error message
- ⚠️ Yellow warning = Server issue

### Test from Terminal
```bash
curl -X POST http://43.156.108.96:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","history":[],"system_prompt":"Reply briefly"}'
```

If curl works but browser doesn't → CORS or browser cache issue

---

## Files Updated

- `console-streaming.js` (v1772019600)
- `console.html` (cache-busting updated)

---

## Need Help?

See: `ZENCLAW_CONNECTION_DIAGNOSTICS.md` for detailed troubleshooting
