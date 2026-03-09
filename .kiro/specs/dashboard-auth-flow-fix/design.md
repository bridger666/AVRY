# Design Document: Dashboard Authentication Flow Fix

## Overview

This design addresses critical authentication and dashboard flow issues in the Aivory frontend application. The root causes are:

1. **Token Key Mismatch**: Auth-manager.js uses `aivory_access_token` but the superadmin login page stores `aivory_session_token`
2. **Race Condition**: UserStateManager initializes before AuthManager is ready, causing 401 errors
3. **Missing Error Handling**: No detailed logging for debugging authentication failures
4. **Backend Availability**: Workflows endpoint returns 404 because backend needs restart

The fix ensures proper token storage/retrieval, correct initialization order, comprehensive error handling, and a test page for debugging.

## Architecture

### Component Interaction Flow

```
User Login (superadmin-login.html)
    ↓
Store token as "aivory_session_token"
    ↓
Dashboard.html loads
    ↓
1. Load auth-manager.js → Initialize AuthManager
    ↓
2. Load user-state-manager.js → Wait for AuthManager
    ↓
3. Load dashboard.js → Check authentication
    ↓
4. If authenticated → Fetch user state from /api/v1/auth/me
    ↓
5. Render dashboard with user data
```

### Key Changes

1. **Unified Token Key**: Change auth-manager.js to use `aivory_session_token` (matching superadmin login)
2. **Initialization Order**: Ensure AuthManager initializes before UserStateManager
3. **Error Handling**: Add detailed logging at each step
4. **Test Page**: Create simple page to verify auth flow independently

## Components and Interfaces

### 1. Auth-Manager.js (Modified)

**Purpose**: Manage authentication tokens and provide authenticated fetch wrapper

**Key Changes**:
```javascript
// OLD: Multiple token keys
const AUTH_KEYS = {
    ACCESS_TOKEN: 'aivory_access_token',
    REFRESH_TOKEN: 'aivory_refresh_token',
    USER: 'aivory_user'
};

// NEW: Use session token key that matches superadmin login
const AUTH_KEYS = {
    SESSION_TOKEN: 'aivory_session_token',  // ← Changed
    USER: 'aivory_user'
};
```

**New Methods**:
```javascript
// Get session token (replaces getAccessToken)
function getSessionToken() {
    const token = localStorage.getItem(AUTH_KEYS.SESSION_TOKEN);
    if (!token) {
        console.warn('⚠️ No session token found in localStorage');
    } else {
        console.log('✓ Session token retrieved');
    }
    return token;
}

// Store session token
function storeSessionToken(token) {
    if (!token || typeof token !== 'string' || token.trim() === '') {
        console.error('❌ Invalid token provided to storeSessionToken');
        return false;
    }
    localStorage.setItem(AUTH_KEYS.SESSION_TOKEN, token);
    console.log('✓ Session token stored');
    return true;
}

// Clear all auth data
function clearAuthData() {
    localStorage.removeItem(AUTH_KEYS.SESSION_TOKEN);
    localStorage.removeItem(AUTH_KEYS.USER);
    currentUser = null;
    console.log('✓ Auth data cleared');
}

// Make authenticated API request
async function authenticatedFetch(url, options = {}) {
    const token = getSessionToken();
    
    if (!token) {
        console.error('❌ Cannot make authenticated request: No token');
        throw new Error('Not authenticated');
    }
    
    // Add authorization header
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };
    
    console.log(`→ Making authenticated request to ${url}`);
    
    try {
        const response = await fetch(url, options);
        
        if (response.status === 401) {
            console.error('❌ 401 Unauthorized - Token invalid or expired');
            clearAuthData();
            throw new Error('Authentication failed');
        }
        
        if (!response.ok) {
            console.error(`❌ Request failed with status ${response.status}`);
        } else {
            console.log(`✓ Request successful (${response.status})`);
        }
        
        return response;
    } catch (error) {
        console.error('❌ Request error:', error);
        throw error;
    }
}
```

**Initialization**:
```javascript
// Initialize auth state from localStorage
function initAuthState() {
    console.log('AuthManager: Initializing...');
    
    const token = getSessionToken();
    const userStr = localStorage.getItem(AUTH_KEYS.USER);
    
    if (token && userStr) {
        try {
            currentUser = JSON.parse(userStr);
            console.log('✓ Auth state restored:', currentUser.email);
        } catch (e) {
            console.error('❌ Failed to parse user data:', e);
            clearAuthData();
        }
    } else {
        console.log('ℹ️ No stored auth state found');
    }
    
    // Mark as initialized
    window.AuthManagerReady = true;
    console.log('✓ AuthManager ready');
}
```

### 2. User-State-Manager.js (Modified)

**Purpose**: Fetch and manage user state from backend

**Key Changes**:
```javascript
/**
 * Initialize and fetch user state
 * WAIT for AuthManager to be ready before proceeding
 */
async function init() {
    console.log('UserStateManager: Initializing...');
    
    // Wait for AuthManager to be ready
    if (!window.AuthManagerReady) {
        console.log('UserStateManager: Waiting for AuthManager...');
        await waitForAuthManager();
    }
    
    // Ensure API_BASE_URL is set
    if (!window.API_BASE_URL) {
        const isDev = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
        window.API_BASE_URL = isDev ? 'http://localhost:8081' : window.location.origin;
        console.log('UserStateManager: Set API_BASE_URL to', window.API_BASE_URL);
    }
    
    // Check if user is authenticated
    if (typeof AuthManager === 'undefined') {
        console.error('❌ AuthManager not available');
        this.state.isLoaded = true;
        this.notifyListeners();
        return;
    }
    
    if (!AuthManager.isAuthenticated()) {
        console.log('ℹ️ User not authenticated');
        this.state.isLoaded = true;
        this.notifyListeners();
        return;
    }

    // Fetch user state from backend
    try {
        console.log('→ Fetching user state from /api/v1/auth/me');
        
        const response = await AuthManager.authenticatedFetch(
            `${window.API_BASE_URL}/api/v1/auth/me`
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Failed to fetch user state:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const userData = await response.json();
        console.log('✓ User state fetched successfully');
        
        // Map API fields to state properties
        this.state.user = userData;
        this.state.userId = userData.user_id;
        this.state.email = userData.email;
        this.state.tier = userData.tier || 'free';
        this.state.credits = userData.credits || 0;
        this.state.creditsMax = userData.credits_max || 0;
        this.state.isSuperAdmin = userData.account_type === 'superadmin';
        
        this.state.isLoaded = true;

        console.log('USER STATE LOADED:', {
            userId: this.state.userId,
            email: this.state.email,
            tier: this.state.tier,
            isSuperAdmin: this.state.isSuperAdmin,
            credits: `${this.state.credits} / ${this.state.creditsMax}`
        });
        
        this.notifyListeners();

    } catch (error) {
        console.error('❌ UserStateManager: Failed to load state', error);
        this.state.isLoaded = true;
        this.notifyListeners();
    }
}

/**
 * Wait for AuthManager to be ready
 */
function waitForAuthManager() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (window.AuthManagerReady) {
                clearInterval(checkInterval);
                console.log('✓ AuthManager is ready');
                resolve();
            }
        }, 50); // Check every 50ms
        
        // Timeout after 5 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            console.warn('⚠️ AuthManager ready timeout');
            resolve();
        }, 5000);
    });
}
```

### 3. Dashboard.js (Modified)

**Purpose**: Main dashboard initialization and rendering

**Key Changes**:
```javascript
/**
 * Initialize dashboard
 * WAIT for authentication before rendering
 */
async function initDashboard() {
    console.log('Dashboard: Initializing...');
    
    // Show loading indicator
    showLoadingIndicator();
    
    // Wait for AuthManager to be ready
    if (!window.AuthManagerReady) {
        console.log('Dashboard: Waiting for AuthManager...');
        await waitForAuthManager();
    }
    
    // Check authentication
    if (typeof AuthManager === 'undefined') {
        console.error('❌ AuthManager not available');
        alert('Authentication system not loaded. Please refresh the page.');
        return;
    }
    
    if (!AuthManager.isAuthenticated()) {
        console.log('❌ User not authenticated, redirecting to login');
        alert('Please log in to access the dashboard');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('✓ User authenticated');
    
    // Wait for UserStateManager to load
    if (!UserStateManager.isLoaded()) {
        console.log('Dashboard: Waiting for user state...');
        await waitForUserState();
    }
    
    const userState = UserStateManager.getUserState();
    console.log('✓ User state loaded:', userState.email);
    
    // Hide loading indicator
    hideLoadingIndicator();
    
    // Update UI based on user state
    updateDemoBanner(userState);
    updateTierDisplay(userState);
    updateCreditsDisplay(userState);
    
    // Continue with normal dashboard initialization
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || 'free';
    DashboardState.mode = mode;
    
    // Render dashboard
    renderDashboard();
}

/**
 * Wait for AuthManager to be ready
 */
function waitForAuthManager() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (window.AuthManagerReady) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 50);
        
        setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
        }, 5000);
    });
}

/**
 * Wait for user state to load
 */
function waitForUserState() {
    return new Promise((resolve) => {
        if (UserStateManager.isLoaded()) {
            resolve();
            return;
        }
        
        UserStateManager.subscribe(() => {
            if (UserStateManager.isLoaded()) {
                resolve();
            }
        });
        
        // Timeout after 10 seconds
        setTimeout(() => {
            console.warn('⚠️ User state load timeout');
            resolve();
        }, 10000);
    });
}

/**
 * Update demo banner visibility
 */
function updateDemoBanner(userState) {
    const demoBanner = document.getElementById('demoBanner');
    if (!demoBanner) return;
    
    // Hide banner if user is superadmin or has diagnostic data
    if (userState.isSuperAdmin || userState.hasDiagnostic) {
        demoBanner.style.display = 'none';
        console.log('✓ Demo banner hidden');
    } else {
        demoBanner.style.display = 'block';
        console.log('ℹ️ Demo banner shown');
    }
}

/**
 * Update tier display
 */
function updateTierDisplay(userState) {
    const tierElements = document.querySelectorAll('[data-display="tier"]');
    tierElements.forEach(el => {
        el.textContent = userState.isSuperAdmin ? 'Enterprise' : userState.tier;
    });
    console.log('✓ Tier display updated:', userState.tier);
}

/**
 * Update credits display
 */
function updateCreditsDisplay(userState) {
    const creditsElements = document.querySelectorAll('[data-display="credits"]');
    creditsElements.forEach(el => {
        el.textContent = `${userState.credits} / ${userState.creditsMax}`;
    });
    console.log('✓ Credits display updated:', userState.credits, '/', userState.creditsMax);
}

/**
 * Show loading indicator
 */
function showLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'authLoadingIndicator';
    indicator.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        color: #07d197;
        font-size: 1.5rem;
    `;
    indicator.textContent = 'Loading dashboard...';
    document.body.appendChild(indicator);
}

/**
 * Hide loading indicator
 */
function hideLoadingIndicator() {
    const indicator = document.getElementById('authLoadingIndicator');
    if (indicator) {
        indicator.remove();
    }
}
```

### 4. Test-Auth-Flow.html (New)

**Purpose**: Simple test page to verify authentication flow

**Structure**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auth Flow Test - Aivory</title>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background: #0a0a0a;
            color: #fff;
            padding: 2rem;
            max-width: 800px;
            margin: 0 auto;
        }
        .test-section {
            background: rgba(255, 255, 255, 0.05);
            padding: 1.5rem;
            border-radius: 8px;
            margin-bottom: 1rem;
        }
        .test-result {
            background: rgba(0, 0, 0, 0.3);
            padding: 1rem;
            border-radius: 4px;
            margin-top: 1rem;
            font-family: monospace;
            white-space: pre-wrap;
            word-break: break-all;
        }
        button {
            background: #07d197;
            color: #000;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            margin-right: 0.5rem;
        }
        button:hover {
            background: #06b880;
        }
        .error { color: #ff4444; }
        .success { color: #07d197; }
        .warning { color: #ffaa00; }
    </style>
</head>
<body>
    <h1>🔐 Authentication Flow Test</h1>
    
    <div class="test-section">
        <h2>1. Token Status</h2>
        <div id="tokenStatus"></div>
    </div>
    
    <div class="test-section">
        <h2>2. Test API Connection</h2>
        <button onclick="testApiConnection()">Test /api/v1/auth/me</button>
        <div id="apiResult" class="test-result"></div>
    </div>
    
    <div class="test-section">
        <h2>3. Test Workflows Endpoint</h2>
        <button onclick="testWorkflowsEndpoint()">Test /api/v1/workflows</button>
        <div id="workflowsResult" class="test-result"></div>
    </div>
    
    <div class="test-section">
        <h2>4. Actions</h2>
        <button onclick="clearToken()">Clear Token</button>
        <button onclick="location.reload()">Refresh Page</button>
        <button onclick="window.location.href='superadmin-login.html'">Go to Login</button>
    </div>
    
    <script src="app.js"></script>
    <script src="auth-manager.js"></script>
    <script>
        // Display token status
        function displayTokenStatus() {
            const token = localStorage.getItem('aivory_session_token');
            const statusDiv = document.getElementById('tokenStatus');
            
            if (token) {
                statusDiv.innerHTML = `
                    <p class="success">✓ Token found</p>
                    <div class="test-result">${token.substring(0, 50)}...</div>
                `;
            } else {
                statusDiv.innerHTML = `<p class="error">✗ No token found</p>`;
            }
        }
        
        // Test API connection
        async function testApiConnection() {
            const resultDiv = document.getElementById('apiResult');
            resultDiv.textContent = 'Testing...';
            
            try {
                const token = localStorage.getItem('aivory_session_token');
                if (!token) {
                    resultDiv.innerHTML = '<span class="error">Error: No token found</span>';
                    return;
                }
                
                const response = await fetch('http://localhost:8081/api/v1/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    resultDiv.innerHTML = `<span class="success">✓ Success (${response.status})</span>\n\n${JSON.stringify(data, null, 2)}`;
                } else {
                    resultDiv.innerHTML = `<span class="error">✗ Failed (${response.status})</span>\n\n${JSON.stringify(data, null, 2)}`;
                }
            } catch (error) {
                resultDiv.innerHTML = `<span class="error">✗ Error: ${error.message}</span>`;
            }
        }
        
        // Test workflows endpoint
        async function testWorkflowsEndpoint() {
            const resultDiv = document.getElementById('workflowsResult');
            resultDiv.textContent = 'Testing...';
            
            try {
                const token = localStorage.getItem('aivory_session_token');
                if (!token) {
                    resultDiv.innerHTML = '<span class="error">Error: No token found</span>';
                    return;
                }
                
                const response = await fetch('http://localhost:8081/api/v1/workflows', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    resultDiv.innerHTML = `<span class="success">✓ Success (${response.status})</span>\n\n${JSON.stringify(data, null, 2)}`;
                } else {
                    const text = await response.text();
                    resultDiv.innerHTML = `<span class="error">✗ Failed (${response.status})</span>\n\n${text}`;
                }
            } catch (error) {
                resultDiv.innerHTML = `<span class="error">✗ Error: ${error.message}</span>`;
            }
        }
        
        // Clear token
        function clearToken() {
            localStorage.removeItem('aivory_session_token');
            localStorage.removeItem('aivory_user');
            alert('Token cleared');
            displayTokenStatus();
        }
        
        // Initialize
        displayTokenStatus();
    </script>
</body>
</html>
```

## Data Models

### Authentication State

```typescript
interface AuthState {
    sessionToken: string | null;
    user: User | null;
    isReady: boolean;
}

interface User {
    user_id: string;
    email: string;
    account_type: 'free' | 'paid' | 'superadmin';
    tier: string;
    credits: number;
    credits_max: number;
}
```

### User State

```typescript
interface UserState {
    user: User | null;
    userId: string | null;
    email: string | null;
    tier: string;
    credits: number;
    creditsMax: number;
    isSuperAdmin: boolean;
    isLoaded: boolean;
}
```

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Token Validation Rejects Invalid Inputs

*For any* input value that is not a non-empty string (including null, undefined, empty string, numbers, objects, arrays), the storeSessionToken function should reject the input and return false without storing anything in localStorage.

**Validates: Requirements 1.5**

## Error Handling

### Token Errors

1. **Missing Token**: Log warning and prevent API requests
2. **Invalid Token (401)**: Clear auth data and redirect to login
3. **Expired Token**: Clear auth data and redirect to login

### API Errors

1. **Network Errors**: Log detailed error with URL and message
2. **4xx Errors**: Log status code and response body
3. **5xx Errors**: Log status code and display user-friendly message

### Initialization Errors

1. **AuthManager Not Ready**: Wait up to 5 seconds, then proceed with fallback
2. **UserStateManager Timeout**: Log warning and proceed with default state
3. **Backend Unreachable**: Display connection error message

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Auth-Manager Tests**:
   - Token storage with valid token
   - Token storage with invalid inputs (null, undefined, empty, number, object)
   - Token retrieval when present
   - Token retrieval when absent
   - Clear auth data removes all keys
   - Authenticated fetch includes Authorization header
   - Authenticated fetch handles 401 response

2. **User-State-Manager Tests**:
   - Initialization waits for AuthManager
   - Fetch user state calls correct endpoint
   - Successful response parses user data correctly
   - 401 response clears tokens
   - Network error logs detailed information
   - State change notifies listeners

3. **Dashboard Tests**:
   - Initialization waits for authentication
   - Unauthenticated user redirects to login
   - Loading indicator shows during initialization
   - Demo banner hidden for superadmin
   - Demo banner shown for unauthenticated users
   - Tier display shows "Enterprise" for superadmin
   - Credits display shows correct format

4. **Test Page Tests**:
   - Token status displays correctly
   - Test API button makes correct request
   - Clear token button removes token from localStorage

### Property-Based Tests

Property-based tests will verify universal properties:

1. **Token Validation Property** (Property 1):
   - Generate random invalid inputs
   - Verify all are rejected by storeSessionToken
   - Verify localStorage remains unchanged

### Integration Tests

Integration tests will verify end-to-end flows:

1. **Login Flow**:
   - Login via superadmin-login.html
   - Verify token stored in localStorage
   - Navigate to dashboard
   - Verify user state loaded
   - Verify UI updated correctly

2. **API Connection**:
   - Verify /api/v1/auth/me returns 200 with valid token
   - Verify /api/v1/workflows returns 200 (not 404)
   - Verify CORS headers allow requests

3. **Error Handling**:
   - Simulate 401 error, verify redirect to login
   - Simulate network error, verify error message displayed
   - Simulate backend down, verify connection error shown

### Manual Testing Checklist

1. **Backend Setup**:
   - [ ] Backend running on port 8081
   - [ ] /api/v1/workflows endpoint available (not 404)
   - [ ] /api/v1/auth/me endpoint available

2. **Login Flow**:
   - [ ] Open superadmin-login.html
   - [ ] Login with grandmaster@aivory.ai / GrandMaster2026!
   - [ ] Verify token stored in localStorage as "aivory_session_token"
   - [ ] Navigate to dashboard.html
   - [ ] Verify no 401 errors in console
   - [ ] Verify no 404 errors in console

3. **Dashboard Display**:
   - [ ] Demo banner is hidden
   - [ ] Tier shows "Enterprise"
   - [ ] Credits show "2000 / 2000"
   - [ ] User email displayed in topbar
   - [ ] Logout button present

4. **Test Page**:
   - [ ] Open test-auth-flow.html
   - [ ] Verify token status shows token present
   - [ ] Click "Test /api/v1/auth/me" - should return 200
   - [ ] Click "Test /api/v1/workflows" - should return 200
   - [ ] Click "Clear Token" - should remove token
   - [ ] Refresh page - should show no token

### Test Configuration

- **Unit Tests**: Run with Jest or similar framework
- **Property Tests**: Minimum 100 iterations per property
- **Integration Tests**: Run against local backend on port 8081
- **Manual Tests**: Follow checklist before deployment

### Test Tags

Each test should be tagged with:
- **Feature**: dashboard-auth-flow-fix
- **Property Number**: (for property tests only)
- **Requirement**: X.Y (reference to requirements document)

Example:
```javascript
// Feature: dashboard-auth-flow-fix, Property 1: Token Validation Rejects Invalid Inputs
// Validates: Requirements 1.5
test('storeSessionToken rejects invalid inputs', () => {
  // Generate 100 random invalid inputs
  for (let i = 0; i < 100; i++) {
    const invalidInput = generateInvalidInput();
    const result = AuthManager.storeSessionToken(invalidInput);
    expect(result).toBe(false);
    expect(localStorage.getItem('aivory_session_token')).toBeNull();
  }
});
```

## Implementation Notes

### File Modification Order

1. **auth-manager.js**: Update token key and add logging
2. **user-state-manager.js**: Add AuthManager wait logic and error handling
3. **dashboard.js**: Add initialization order and loading indicator
4. **test-auth-flow.html**: Create new test page

### Backward Compatibility

- Old token key `aivory_access_token` will be ignored
- Users will need to log in again after deployment
- No data migration needed

### Deployment Steps

1. Deploy updated frontend files
2. Restart backend service (to load workflows endpoint)
3. Clear browser cache
4. Test with superadmin login
5. Verify all acceptance criteria met

### Troubleshooting Guide

Add to DEV_QUICK_START.md:

```markdown
## Authentication Troubleshooting

### 401 Errors on /api/v1/auth/me

1. Check localStorage for "aivory_session_token"
2. Verify token is not expired
3. Check backend is running on port 8081
4. Verify CORS headers in backend

### 404 Errors on /api/v1/workflows

1. Restart backend service
2. Verify backend has latest code
3. Check backend logs for endpoint registration

### Demo Banner Still Showing

1. Check user state in console: `UserStateManager.getUserState()`
2. Verify isSuperAdmin flag is true
3. Check demo banner element visibility in DevTools

### Dashboard Not Loading

1. Open browser console
2. Look for initialization logs
3. Verify AuthManager and UserStateManager loaded
4. Check for JavaScript errors
5. Use test-auth-flow.html to isolate issue
```

## Dependencies

- **Frontend**: Vanilla JavaScript (no framework dependencies)
- **Backend**: FastAPI running on port 8081
- **Browser**: Modern browser with localStorage support
- **Development**: Local development server on port 9000

## Security Considerations

1. **Token Storage**: Tokens stored in localStorage (acceptable for development, consider httpOnly cookies for production)
2. **Token Transmission**: Always use HTTPS in production
3. **Token Validation**: Backend validates all tokens
4. **CORS**: Restrict CORS origins in production
5. **Logging**: Avoid logging sensitive data (tokens, passwords)

## Performance Considerations

1. **Initialization**: Wait logic adds max 5 seconds delay (acceptable for auth flow)
2. **API Calls**: Single /api/v1/auth/me call on dashboard load
3. **localStorage**: Fast synchronous access
4. **Event Listeners**: Minimal overhead from state change notifications

## Future Enhancements

1. **Token Refresh**: Implement automatic token refresh before expiration
2. **Offline Support**: Cache user state for offline access
3. **Multi-Tab Sync**: Sync auth state across browser tabs
4. **Session Timeout**: Automatic logout after inactivity
5. **Remember Me**: Optional persistent login
