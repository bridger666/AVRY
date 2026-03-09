# Aivory Authentication System

## Overview

The Aivory platform now includes a complete authentication system for secure dashboard access. The system uses session-based authentication with JWT-like tokens stored in localStorage.

## Super Admin Credentials

```
Username: GrandMasterRCH
Password: Lemonandsalt66633
Tier: enterprise
Role: super_admin
```

## Architecture

### Backend Components

1. **AuthService** (`app/services/auth_service.py`)
   - File-based user storage (JSON)
   - Password hashing (SHA-256)
   - Session management with 7-day expiration
   - Auto-initializes Super Admin account

2. **Auth Routes** (`app/api/routes/auth.py`)
   - `POST /api/auth/login` - User authentication
   - `GET /api/auth/session` - Session validation
   - `POST /api/auth/logout` - Session termination
   - `GET /api/auth/validate-tier` - Tier validation (legacy)
   - `GET /api/auth/validate-credits` - Credit validation (legacy)

### Frontend Components

1. **Auth Guard** (`frontend/auth-guard.js`)
   - Session token management (localStorage)
   - Login/logout functions
   - Session validation
   - Dashboard access guard
   - Login modal display

2. **Dashboard Integration** (`frontend/dashboard.html`, `frontend/dashboard.js`)
   - Automatic session validation on load
   - Login modal for unauthenticated users
   - Logout button in dashboard
   - Legacy tier parameter support

## Usage

### Testing Authentication

1. **Test Page**: Open `http://localhost:8080/auth-test.html`
   - Pre-filled with Super Admin credentials
   - Test login, session validation, and logout
   - Verify dashboard access

2. **Direct Dashboard Access**: Open `http://localhost:8080/dashboard.html`
   - Will show login modal if not authenticated
   - Enter Super Admin credentials
   - Dashboard loads after successful login

3. **Legacy Mode**: `http://localhost:8080/dashboard.html?tier=enterprise`
   - Bypasses authentication (for backward compatibility)
   - Uses URL parameter for tier access

### API Testing

```bash
# Login
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "GrandMasterRCH", "password": "Lemonandsalt66633"}'

# Response:
# {
#   "success": true,
#   "session_token": "...",
#   "username": "GrandMasterRCH",
#   "tier": "enterprise",
#   "role": "super_admin",
#   "message": "Login successful"
# }

# Validate Session
curl -X GET http://localhost:8081/api/auth/session \
  -H "Authorization: Bearer <session_token>"

# Response:
# {
#   "valid": true,
#   "username": "GrandMasterRCH",
#   "tier": "enterprise",
#   "role": "super_admin",
#   "message": "Session valid"
# }

# Logout
curl -X POST http://localhost:8081/api/auth/logout \
  -H "Authorization: Bearer <session_token>"

# Response:
# {
#   "success": true,
#   "message": "Logout successful"
# }
```

## Data Storage

### User Data (`data/users.json`)

```json
{
  "GrandMasterRCH": {
    "username": "GrandMasterRCH",
    "password_hash": "9e7e532f6cce496905a4fd2e0dc4a06f203fa6b748479be080b9aee3d72326b0",
    "tier": "enterprise",
    "role": "super_admin",
    "created_at": "2026-02-24T22:16:55.761251"
  }
}
```

### Session Data (`data/sessions.json`)

```json
{
  "<session_token>": {
    "username": "GrandMasterRCH",
    "tier": "enterprise",
    "role": "super_admin",
    "created_at": "2026-02-24T22:20:00.000000",
    "expires_at": "2026-03-03T22:20:00.000000"
  }
}
```

## Security Features

1. **Password Hashing**: SHA-256 hashing for password storage
2. **Session Expiration**: 7-day automatic expiration
3. **Token-based Auth**: Secure session tokens (32-byte URL-safe)
4. **Authorization Headers**: Bearer token format
5. **CORS Protection**: Configured in FastAPI middleware

## Frontend Flow

### Dashboard Access Flow

```
User opens dashboard.html
    ↓
auth-guard.js checks for session token
    ↓
    ├─ Token exists → Validate with backend
    │   ↓
    │   ├─ Valid → Load dashboard
    │   └─ Invalid → Show login modal
    │
    └─ No token → Show login modal
        ↓
        User enters credentials
        ↓
        POST /api/auth/login
        ↓
        ├─ Success → Store token → Reload page
        └─ Failure → Show error message
```

### Logout Flow

```
User clicks logout button
    ↓
POST /api/auth/logout (with token)
    ↓
Clear localStorage
    ↓
Redirect to homepage
```

## Adding New Users

Currently, users are managed via the AuthService. To add a new user programmatically:

```python
from app.services.auth_service import AuthService

auth_service = AuthService()
auth_service.register_user(
    username="newuser",
    password="securepassword",
    tier="builder"  # or "operator", "enterprise"
)
```

## Future Enhancements

1. **Database Integration**: Replace file-based storage with PostgreSQL/MongoDB
2. **Password Reset**: Email-based password reset flow
3. **2FA**: Two-factor authentication support
4. **OAuth**: Social login (Google, GitHub, etc.)
5. **User Registration**: Public registration form
6. **Role-based Access Control**: Granular permissions per role
7. **Session Management UI**: Admin panel to view/revoke sessions
8. **Password Strength**: Enforce password complexity requirements
9. **Rate Limiting**: Prevent brute force attacks
10. **Audit Logging**: Track authentication events

## Troubleshooting

### "Invalid username or password"

- Verify credentials are correct
- Check `data/users.json` exists and contains user
- Ensure backend is running on port 8081

### "Invalid or expired session"

- Session may have expired (7 days)
- Token may be corrupted in localStorage
- Clear localStorage and login again

### Login modal not appearing

- Check browser console for JavaScript errors
- Verify `auth-guard.js` is loaded before `dashboard.js`
- Ensure CORS is configured correctly

### Backend not responding

- Verify backend is running: `curl http://localhost:8081/health`
- Check backend logs for errors
- Restart backend: `python3 -m uvicorn app.main:app --reload --port 8081`

## Files Modified/Created

### Created
- `app/services/auth_service.py` - Authentication service
- `frontend/auth-guard.js` - Frontend authentication guard
- `frontend/auth-test.html` - Authentication test page
- `data/users.json` - User storage (auto-created)
- `data/sessions.json` - Session storage (auto-created)
- `AUTHENTICATION_SYSTEM.md` - This documentation

### Modified
- `app/api/routes/auth.py` - Added login/session/logout endpoints
- `frontend/dashboard.html` - Added auth-guard.js script
- `frontend/dashboard.js` - Added logout button integration
- `frontend/dashboard.css` - Added modal styles

## Testing Checklist

- [x] Super Admin account auto-created
- [x] Login endpoint works
- [x] Session validation works
- [x] Logout endpoint works
- [x] Dashboard shows login modal when not authenticated
- [x] Dashboard loads after successful login
- [x] Logout button appears in dashboard
- [x] Legacy tier parameter still works
- [ ] Test with multiple users
- [ ] Test session expiration
- [ ] Test concurrent sessions
- [ ] Test invalid credentials
- [ ] Test XSS protection
- [ ] Test CSRF protection

## Next Steps

1. Test the authentication flow in browser
2. Add user registration endpoint
3. Implement password reset flow
4. Add role-based access control
5. Integrate with payment system for tier management
6. Add session management UI for admins
7. Implement audit logging
8. Add rate limiting for login attempts
9. Set up email notifications
10. Deploy to production with HTTPS
