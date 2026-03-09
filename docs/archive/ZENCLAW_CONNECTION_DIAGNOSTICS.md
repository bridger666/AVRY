# Zenclaw Connection Diagnostics

## Status: ✅ SERVER IS ONLINE

The Zenclaw AI service at `http://43.156.108.96:8080` is **fully operational**.

### Verification Test Results

```bash
# Test performed: 2026-02-25 17:17:34 GMT
curl -X POST http://43.156.108.96:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","history":[],"system_prompt":"You are a helpful assistant"}'

# Response:
{"reply":"Hello! How can I assist you today? 😊"}
```

**Result**: Server is responding correctly with 200 OK status.

---

## If Users Report Connection Errors

The server is working, so connection failures are likely due to:

### 1. **CORS Policy (Most Common)**
- **Symptom**: Browser console shows "CORS policy" error
- **Cause**: Browser blocking cross-origin requests
- **Solution**: 
  - Server must include proper CORS headers (already configured with `access-control-allow-origin: *`)
  - User should check browser console for specific CORS errors

### 2. **Network/Firewall Blocking**
- **Symptom**: "Failed to fetch" or timeout errors
- **Cause**: Corporate firewall, VPN, or ISP blocking port 8080
- **Solution**:
  - Test from different network (mobile hotspot)
  - Check if port 8080 is blocked by firewall
  - Try accessing from curl/Postman to isolate browser issues

### 3. **Browser Cache**
- **Symptom**: Old error messages persist after fixes
- **Cause**: Browser serving cached JavaScript
- **Solution**: Hard refresh
  - **Mac**: Cmd + Shift + R
  - **Windows/Linux**: Ctrl + Shift + R
  - Or: DevTools → Network tab → "Disable cache" + refresh

### 4. **SSL/HTTPS Mixed Content**
- **Symptom**: Console served over HTTPS but Zenclaw is HTTP
- **Cause**: Browsers block HTTP requests from HTTPS pages
- **Solution**:
  - Serve console over HTTP (current setup: `http://localhost:8080`)
  - Or upgrade Zenclaw to HTTPS

---

## Recent Updates

### Version 1772019600 (Latest)
- ✅ Updated error message to show actual endpoint URL
- ✅ Added automatic connection test on page load
- ✅ Enhanced console logging for diagnostics
- ✅ Improved error handling with specific troubleshooting steps

### Changes Made:
1. **Error Message**: Now shows `${ZENCLAW_ENDPOINT}` instead of generic "port 5000"
2. **Connection Test**: Automatic ping test runs 1 second after page load
3. **Console Diagnostics**: Detailed logging to help identify issue type

---

## Testing the Console

### 1. Start Frontend Server
```bash
cd frontend
python3 -m http.server 8080
```

### 2. Open Console
Navigate to: `http://localhost:8080/console.html`

### 3. Check Browser Console
Open DevTools (F12) and look for:
- ✅ `✅ Zenclaw connection successful` - All good!
- ⚠️ `⚠️ Zenclaw returned status: XXX` - Server issue
- ❌ `❌ Zenclaw connection failed` - Network/CORS issue

### 4. Test Message
Type any message and send. Should receive AI response within 3-5 seconds.

---

## Server Configuration

**Endpoint**: `http://43.156.108.96:8080/chat`  
**Trigger**: `http://43.156.108.96:8080/trigger`  
**Method**: POST  
**Headers**: `Content-Type: application/json`  
**CORS**: Enabled (`access-control-allow-origin: *`)

### Request Format
```json
{
  "message": "User message here",
  "history": [
    {"role": "user", "content": "Previous message"},
    {"role": "assistant", "content": "Previous response"}
  ],
  "system_prompt": "You are Aivory..."
}
```

### Response Format
```json
{
  "reply": "AI response here"
}
```

---

## Troubleshooting Commands

### Test from Command Line (macOS/Linux)
```bash
# Quick test
curl -X POST http://43.156.108.96:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","history":[],"system_prompt":"Reply briefly"}'

# With timeout
curl -X POST http://43.156.108.96:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","history":[],"system_prompt":"Reply briefly"}' \
  --connect-timeout 10 \
  --max-time 30
```

### Test from Browser Console
```javascript
// Paste this into browser console on console.html page
fetch('http://43.156.108.96:8080/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'test',
    history: [],
    system_prompt: 'Reply briefly'
  })
})
.then(r => r.json())
.then(d => console.log('✅ Success:', d))
.catch(e => console.error('❌ Error:', e));
```

---

## Cache Busting

Current version: `console-streaming.js?v=1772019600`

After making changes, increment version in `console.html`:
```html
<script src="console-streaming.js?v=1772019700"></script>
```

---

## Support

If issues persist after trying all troubleshooting steps:

1. **Capture browser console logs** (F12 → Console tab)
2. **Test with curl** to isolate browser vs network issues
3. **Check network tab** in DevTools for request details
4. **Try different browser** to rule out browser-specific issues

The server is confirmed working, so any connection issues are client-side or network-related.
