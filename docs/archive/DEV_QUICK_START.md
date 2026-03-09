# Aivory - Developer Quick Start Guide

## TL;DR - Get Running in 30 Seconds

```bash
# Terminal 1 - Start Backend
python3 -m uvicorn app.main:app --reload --port 8081

# Terminal 2 - Start Frontend  
cd frontend && python3 -m http.server 9000

# Browser
# Open: http://localhost:9000/superadmin-login.html
# Auto-logs in as superadmin and redirects to dashboard
```

---

## Architecture Overview

### Ports
- **Frontend**: `http://localhost:9000` (Python HTTP server)
- **Backend API**: `http://localhost:8081` (FastAPI/Uvicorn)

### Authentication
- **Method**: JWT Bearer tokens in `Authorization` header
- **Storage**: `localStorage.aivory_session_token` (access token)
- **Flow**: Login → Store token → Include in all API calls

### User Tiers
- `free` - Default tier, no payment
- `enterprise` - Superadmin tier (GrandMasterRCH)
- Tier comes from backend `/api/v1/auth/me` endpoint

---

## Step-by-Step Setup

### 1. Install Dependencies

```bash
# Backend
pip install -r requirements.txt

# Frontend (no dependencies - vanilla JS)
```

### 2. Start Backend

```bash
# From project root
python3 -m uvicorn app.main:app --reload --port 8081
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8081
INFO:     Application startup complete.
```

**Verify it's working:**
```bash
curl http://localhost:8081/health
# Should return: {"status":"healthy"}
```

### 3. Start Frontend

```bash
# From project root
cd frontend
python3 -m http.server 9000
```

**Expected output:**
```
Serving HTTP on 0.0.0.0 port 9000 (http://0.0.0.0:9000/) ...
```

### 4. Login

**Option A: Superadmin Quick Login (Recommended for Dev)**
1. Open: `http://localhost:9000/superadmin-login.html`
2. Auto-logs in as superadmin
3. Redirects to dashboard

**Option B: Manual Login**
1. Open: `http://localhost:9000/index.html`
2. Click "Login" button (top right)
3. Enter credentials:
   - Email: `grandmaster@aivory.ai`
   - Password: `GrandMaster2026!`
4. Click "Login"
5. Redirected to dashboard

---

## Test User Credentials

### Superadmin Account
- **Email**: `grandmaster@aivory.ai`
- **Password**: `GrandMaster2026!`
- **User ID**: `GrandMasterRCH`
- **Tier**: `enterprise`
- **Credits**: `2000/2000`
- **Permissions**: Full access, all features unlocked

### Creating New Users
```bash
# Via API
curl -X POST http://localhost:8081/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "company_name": "Test Company"
  }'
```

---

## API Endpoints Reference

### Authentication
- `POST /api/v1/auth/register` - Create new user
- `POST /api/v1/auth/login` - Login (returns tokens)
- `GET /api/v1/auth/me` - Get current user (requires auth)
- `POST /api/v1/auth/logout` - Logout

### Diagnostics
- `POST /api/v1/diagnostic/run` - Run free diagnostic
- `GET /api/v1/diagnostic/{id}` - Get diagnostic results

### Workflows
- `GET /api/v1/workflows/list` - List user workflows
- `POST /api/v1/workflows/create` - Create workflow

### Console
- `POST /api/console/stream` - Stream AI console responses

---

## Troubleshooting

### Issue: 401 Unauthorized on `/api/v1/auth/me`

**Cause**: Not logged in or token expired

**Fix**:
1. Open browser DevTools → Application → Local Storage
2. Check if `aivory_session_token` exists (NOT `aivory_access_token`)
3. If missing, login again via `superadmin-login.html`
4. If present but still getting 401, token may be expired - clear and login again

### Issue: 404 on `/api/v1/workflows/list`

**Cause**: Backend not running with latest code

**Fix**:
1. Restart backend service: `Ctrl+C` then `python3 -m uvicorn app.main:app --reload --port 8081`
2. Verify endpoint exists: `curl http://localhost:8081/api/v1/workflows/list?user_id=test`
3. Should return `[]` (empty array), not 404

### Issue: Demo banner still showing

**Cause**: UserStateManager failed to load user state

**Fix**:
1. Check console for errors
2. Verify you're logged in (check localStorage for `aivory_session_token`)
3. Check console for `USER STATE LOADED:` log - should show tier: "enterprise"
4. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
5. If still showing, use test page: `http://localhost:9000/test-auth-flow.html`

### Issue: "Free" tier showing instead of "Enterprise"

**Cause**: Not logged in or UserStateManager failed

**Fix**:
1. Login via `superadmin-login.html`
2. Check console for `USER STATE LOADED:` log
3. Should show `{tier: "enterprise", ...}`
4. If not, check backend logs for errors

### Issue: Dashboard Not Loading

**Cause**: JavaScript errors or initialization failure

**Fix**:
1. Open browser console (F12)
2. Look for initialization logs:
   - `AuthManager: Initializing...`
   - `✓ AuthManager ready`
   - `UserStateManager: Initializing...`
   - `✓ User state fetched successfully`
   - `Dashboard: Initializing...`
3. If any step fails, check the error message
4. Use test page to isolate issue: `http://localhost:9000/test-auth-flow.html`

### Issue: "Loading dashboard..." stuck on screen

**Cause**: Initialization timeout or error

**Fix**:
1. Check console for timeout warnings
2. Verify backend is running: `curl http://localhost:8081/health`
3. Clear browser cache and try again
4. Check that all scripts are loading (no 404s in Network tab)

---

## Testing Authentication Flow

### Using the Test Page

The test page (`test-auth-flow.html`) helps you debug authentication issues:

1. **Open test page**: `http://localhost:9000/test-auth-flow.html`

2. **Check Token Status**:
   - Should show "✓ Token found" if logged in
   - Shows first 50 characters of token
   - If no token, click "Go to Login"

3. **Test API Connection**:
   - Click "Test /api/v1/auth/me"
   - Should return 200 with user data
   - If 401, token is invalid - clear and login again
   - If 500, check backend logs

4. **Test Workflows Endpoint**:
   - Click "Test /api/v1/workflows/list"
   - Should return 200 with `[]` (empty array)
   - If 404, backend needs restart

5. **Clear Token**:
   - Click "Clear Token" to remove stored token
   - Useful for testing login flow from scratch

### Expected Console Logs (Successful Flow)

When everything works correctly, you should see:

```
✅ app.js loaded - API_BASE_URL: http://localhost:8081
AuthManager: Initializing...
✓ Auth state restored: grandmaster@aivory.ai
✓ AuthManager ready
UserStateManager: Initializing...
✓ AuthManager is ready
→ Fetching user state from /api/v1/auth/me
→ Making authenticated request to http://localhost:8081/api/v1/auth/me
✓ Request successful (200)
✓ User state fetched successfully
USER STATE LOADED: {userId: "GrandMasterRCH", email: "grandmaster@aivory.ai", tier: "enterprise", ...}
Dashboard: Initializing...
✓ AuthManager is ready
✓ User authenticated
✓ User state loaded: grandmaster@aivory.ai
```

### Common Error Patterns

**Pattern 1: Token Key Mismatch**
```
⚠️ No session token found in localStorage
❌ Cannot make authenticated request: No token
```
**Solution**: Login via superadmin-login.html

**Pattern 2: Backend Not Running**
```
❌ Request error: TypeError: Failed to fetch
```
**Solution**: Start backend on port 8081

**Pattern 3: Workflows 404**
```
❌ Request failed with status 404
```
**Solution**: Restart backend with latest code

---

## Development Workflow

### Making Frontend Changes
1. Edit files in `frontend/`
2. Hard refresh browser: `Cmd+Shift+R`
3. Check console for errors

### Making Backend Changes
1. Edit files in `app/`
2. Uvicorn auto-reloads (watch terminal)
3. Test with curl or browser

### Clearing State
```bash
# Clear browser storage
# DevTools → Application → Clear Storage → Clear site data

# Or use incognito/private window
```

---

## File Structure

```
aivory/
├── app/                    # Backend (FastAPI)
│   ├── main.py            # FastAPI app entry
│   ├── api/routes/        # API endpoints
│   ├── services/          # Business logic
│   └── models/            # Data models
├── frontend/              # Frontend (Vanilla JS)
│   ├── index.html         # Landing page
│   ├── dashboard.html     # Main dashboard
│   ├── app.js             # Core app logic
│   ├── auth-manager.js    # Authentication
│   ├── user-state-manager.js  # User state
│   └── superadmin-login.html  # Quick login
└── DEV_QUICK_START.md     # This file
```

---

## Next Steps

1. ✅ Start backend and frontend
2. ✅ Login via superadmin-login.html
3. ✅ Verify dashboard loads without errors
4. ✅ Check tier shows "Enterprise"
5. ✅ No demo banner visible

**If everything works**: You're ready to develop!

**If something breaks**: Check the Troubleshooting section above or ping me.

---

## Production Deployment

**DO NOT use these settings in production:**
- Change superadmin password
- Use environment variables for secrets
- Enable HTTPS
- Use proper database (not SQLite)
- Add rate limiting
- Enable CORS properly

---

**Last Updated**: Context Transfer Session
**Maintained By**: Kiro AI Assistant
