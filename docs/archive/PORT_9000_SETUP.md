# Port 9000 Setup - Fixed! ✅

## Problem Identified
- Frontend accessible on port 9000 (Python's `http.server`)
- Backend API running on port 8081 (FastAPI)
- Frontend was trying to call API on wrong port, causing JSON parsing errors

## Solution Applied

### 1. Updated Frontend Configuration
**File: `frontend/app.js`**
- Now detects port 9000 and uses same origin for API calls
- Falls back to port 8081 if on different port
- Auto-detects development vs production

```javascript
// If on port 9000, use same port for API
if (isDevelopment && window.location.port === '9000') {
    window.API_BASE_URL = window.location.origin; // http://localhost:9000
}
```

### 2. Updated Simple Server
**File: `simple_server.py`**
- Changed default port from 8081 to 9000
- Now serves both frontend files AND API endpoints on same port
- No CORS issues (same origin)

### 3. Created Test Page
**File: `frontend/test-api-connection.html`**
- Test API connectivity
- Test authentication
- Verify configuration

---

## How to Use

### Option A: Use simple_server.py (Recommended)

1. **Stop the current Python http.server on port 9000:**
   ```bash
   # Find the process
   lsof -i :9000
   
   # Kill it (replace PID with actual process ID)
   kill 16306
   ```

2. **Start simple_server.py on port 9000:**
   ```bash
   python3 simple_server.py
   ```
   
   This serves:
   - Frontend files from `./frontend/`
   - API endpoints for diagnostics, contact, etc.
   - All on port 9000 (no CORS issues)

3. **Stop FastAPI on port 8081 (optional):**
   ```bash
   # It's running as process 21
   kill 21
   ```

4. **Access the app:**
   - Main app: http://localhost:9000/index.html
   - Dashboard: http://localhost:9000/dashboard.html
   - API test: http://localhost:9000/test-api-connection.html

### Option B: Keep Current Setup (Two Servers)

If you want to keep Python's http.server on port 9000 and FastAPI on port 8081:

1. **Keep both servers running**
2. **The frontend will automatically use port 8081 for API calls**
3. **Access via:** http://localhost:9000

The frontend is now smart enough to detect this setup and route API calls to port 8081.

---

## Testing the Fix

### 1. Test API Connection
Open: http://localhost:9000/test-api-connection.html

This page will:
- Show current configuration
- Test `/health` endpoint
- Test authentication
- Display detailed error messages

### 2. Test Login
1. Go to: http://localhost:9000/index.html
2. Click "Login" or "Dashboard"
3. Enter credentials:
   - Email: `grandmaster@aivory.ai`
   - Password: `GrandMaster2026!`
4. Should login successfully without JSON parsing errors

### 3. Check Browser Console
Open browser console (F12) and look for:
```
✅ app.js loaded - API_BASE_URL: http://localhost:9000
```

---

## What Was Fixed

### Before (Broken):
```
Frontend: http://localhost:9000 (Python http.server)
API calls: http://localhost:9000/api/v1/auth/login
Result: HTML error page (404) parsed as JSON → Error!
```

### After (Fixed):
```
Option A - simple_server.py:
Frontend: http://localhost:9000 (simple_server.py)
API calls: http://localhost:9000/api/v1/auth/login
Result: JSON response ✅

Option B - Two servers:
Frontend: http://localhost:9000 (Python http.server)
API calls: http://localhost:8081/api/v1/auth/login
Result: JSON response ✅
```

---

## Recommended Next Steps

1. **Stop Python's http.server:**
   ```bash
   kill 16306
   ```

2. **Start simple_server.py:**
   ```bash
   python3 simple_server.py
   ```

3. **Test the connection:**
   - Open: http://localhost:9000/test-api-connection.html
   - Click "Test /health Endpoint"
   - Click "Test Login (GrandMaster)"

4. **If all tests pass, try the main app:**
   - Open: http://localhost:9000/index.html
   - Login with GrandMaster credentials
   - Access dashboard

---

## Troubleshooting

### Still getting JSON parsing errors?

1. **Check which server is running:**
   ```bash
   lsof -i :9000
   ```

2. **Check browser console for API_BASE_URL:**
   ```javascript
   console.log(window.API_BASE_URL);
   // Should show: http://localhost:9000 or http://localhost:8081
   ```

3. **Hard refresh browser:**
   - Mac: `Cmd + Shift + R`
   - Windows: `Ctrl + Shift + R`

4. **Check network tab:**
   - Open DevTools → Network tab
   - Try to login
   - Look at the request URL
   - Check if response is HTML or JSON

### Backend not responding?

1. **Check if FastAPI is running:**
   ```bash
   curl http://localhost:8081/health
   ```

2. **Check if simple_server.py is running:**
   ```bash
   curl http://localhost:9000/api/health
   ```

3. **Restart the backend:**
   ```bash
   python3 -m uvicorn app.main:app --reload --port 8081
   ```

---

## Files Modified

- ✅ `frontend/app.js` - Smart port detection
- ✅ `simple_server.py` - Changed to port 9000
- ✅ `frontend/test-api-connection.html` - New test page

All other files automatically use `window.API_BASE_URL`, so no changes needed!
