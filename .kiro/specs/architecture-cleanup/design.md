# Design Document: Architecture Cleanup

## Overview

This design addresses the architectural inconsistencies in Aivory's frontend-backend communication that prevent production deployment. The solution establishes a single, deterministic server architecture, standardizes API communication patterns, and implements reliable user state management.

### Current Problems

1. **Port Conflicts**: Multiple servers (FastAPI on 8081, simple_server.py on 9000, python -m http.server) compete for ports and endpoints, causing `OSError: [Errno 48] Address already in use`

2. **API Routing Confusion**: Frontend has inconsistent API_BASE_URL configuration (hardcoded 8081 in app.js, but config.py shows 8081, README shows 8000), leading to "Unexpected token '<', "<!DOCTYPE "..." errors when fetch calls hit wrong endpoints

3. **User Tier Synchronization**: tier-sync.js reads localStorage before UserStateManager loads backend data, causing all users to display as "free" tier regardless of actual subscription status

### Solution Approach

The solution implements three core architectural changes:

1. **Single Backend Server**: FastAPI on port 8000 as the sole API server, with simple_server.py retired or repurposed for non-overlapping use cases

2. **Standardized API Communication**: Single API_BASE_URL constant in app.js, all fetch calls refactored to use it, comprehensive error handling for non-JSON responses

3. **Unified User State Management**: UserStateManager as single source of truth, tier-sync.js refactored to wait for user data load, normalized localStorage schema

## Architecture

### Server Architecture

```
Development Environment:
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  Terminal 1: Backend API Server                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ FastAPI + Uvicorn                                    │    │
│  │ Port: 8000                                           │    │
│  │ Endpoints: /api/*, /health                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  Terminal 2: Frontend Static Server                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ python -m http.server 9000                           │    │
│  │ Directory: ./frontend/                               │    │
│  │ Serves: HTML, CSS, JS files                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  Browser: http://localhost:9000                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ JavaScript: window.API_BASE_URL = 'http://localhost:8000' │
│  │ All fetch calls: ${window.API_BASE_URL}/api/...     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘

Production Environment:
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  Nginx Reverse Proxy (Port 80/443)                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Location /api/ → FastAPI (localhost:8000)            │    │
│  │ Location /     → Static files (/var/www/frontend)    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  Browser: https://aivory.com                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ JavaScript: window.API_BASE_URL = window.location.origin │
│  │ All fetch calls: ${window.API_BASE_URL}/api/...     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### API Communication Flow

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser    │         │   app.js     │         │  Backend API │
│              │         │              │         │  (Port 8000) │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │ Page Load              │                        │
       ├───────────────────────>│                        │
       │                        │                        │
       │                        │ Set API_BASE_URL       │
       │                        │ (http://localhost:8000)│
       │                        │                        │
       │                        │ Health Check           │
       │                        ├───────────────────────>│
       │                        │                        │
       │                        │ 200 OK (JSON)          │
       │                        │<───────────────────────┤
       │                        │                        │
       │ User Action            │                        │
       ├───────────────────────>│                        │
       │                        │                        │
       │                        │ fetch(API_BASE_URL +   │
       │                        │       '/api/endpoint') │
       │                        ├───────────────────────>│
       │                        │                        │
       │                        │ Response (JSON)        │
       │                        │<───────────────────────┤
       │                        │                        │
       │ Update UI              │                        │
       │<───────────────────────┤                        │
       │                        │                        │
```

### User State Management Flow

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐    ┌──────────────┐
│   Browser    │    │  UserStateManager│    │ tier-sync.js │    │  Backend API │
└──────┬───────┘    └────────┬─────────┘    └──────┬───────┘    └──────┬───────┘
       │                     │                       │                   │
       │ Page Load           │                       │                   │
       ├────────────────────>│                       │                   │
       │                     │                       │                   │
       │                     │ Check localStorage    │                   │
       │                     │ (aivory_token)        │                   │
       │                     │                       │                   │
       │                     │ If token exists:      │                   │
       │                     │ GET /api/v1/auth/me   │                   │
       │                     ├──────────────────────────────────────────>│
       │                     │                       │                   │
       │                     │ User data (tier, etc) │                   │
       │                     │<──────────────────────────────────────────┤
       │                     │                       │                   │
       │                     │ Store in localStorage │                   │
       │                     │ (aivory_user)         │                   │
       │                     │                       │                   │
       │                     │ Notify listeners      │                   │
       │                     ├──────────────────────>│                   │
       │                     │                       │                   │
       │                     │                       │ getTier()         │
       │                     │                       │<──────────────────┤
       │                     │                       │                   │
       │                     │                       │ Update UI         │
       │                     │                       │ (tier badges)     │
       │                     │                       │                   │
       │ Display correct tier│                       │                   │
       │<────────────────────┴───────────────────────┘                   │
       │                                                                  │
```

## Components and Interfaces

### 1. Backend Server Configuration (app/config.py)

**Purpose**: Centralize server configuration with correct port settings

**Changes**:
```python
class Settings(BaseSettings):
    # Server configuration
    app_name: str = "Aivory AI Readiness Platform"
    app_version: str = "1.0.0"
    host: str = "0.0.0.0"
    port: int = 8000  # Changed from 8081 to 8000
    
    # CORS configuration
    cors_origins: list[str] = [
        "http://localhost:9000",  # Development frontend
        "http://127.0.0.1:9000",  # Alternative localhost
    ]
```

**Interface**:
- Input: Environment variables from .env.local
- Output: Settings object with validated configuration
- Error Handling: Raises ValidationError if required variables missing

### 2. Backend Main Application (app/main.py)

**Purpose**: Initialize FastAPI with correct CORS and port binding

**Changes**:
```python
from app.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
)

# CORS middleware with specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check with port verification
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "port": settings.port,
        "api_base": f"http://{settings.host}:{settings.port}",
        "timestamp": datetime.utcnow().isoformat()
    }
```

**Interface**:
- Startup: Binds to port 8000, fails with clear error if port occupied
- Health endpoint: Returns server status and configuration
- All API routes: Mounted under /api/ prefix

### 3. Frontend API Configuration (frontend/app.js)

**Purpose**: Single source of truth for API_BASE_URL

**Changes**:
```javascript
// API Configuration - Set global API_BASE_URL for all scripts
if (!window.API_BASE_URL) {
    const isDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
        // Development: Backend on port 8000
        window.API_BASE_URL = 'http://localhost:8000';
    } else {
        // Production: Same origin (Nginx proxies /api/ to backend)
        window.API_BASE_URL = window.location.origin;
    }
}

// Make available as constant for backward compatibility
const API_BASE_URL = window.API_BASE_URL;

console.log('✅ app.js loaded - API_BASE_URL:', API_BASE_URL);

// Health check on startup
async function verifyBackendConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`Health check failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Backend connected:', data);
        return true;
        
    } catch (error) {
        console.error('❌ Backend connection failed:', error);
        showBackendError();
        return false;
    }
}

function showBackendError() {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: #ff4444; color: white; padding: 15px 30px;
        border-radius: 8px; z-index: 10000; font-family: sans-serif;
    `;
    errorDiv.innerHTML = `
        <strong>Backend Unavailable</strong><br>
        Please ensure the API server is running:<br>
        <code>uvicorn app.main:app --port 8000 --reload</code>
    `;
    document.body.appendChild(errorDiv);
}

// Run health check on page load
document.addEventListener('DOMContentLoaded', verifyBackendConnection);
```

**Interface**:
- Exports: window.API_BASE_URL (global constant)
- Health Check: Runs on page load, displays error if backend unavailable
- Error Display: User-friendly message with instructions

### 4. Standardized Fetch Wrapper (frontend/app.js)

**Purpose**: Centralize API calls with consistent error handling

**Implementation**:
```javascript
/**
 * Make API request with standardized error handling
 * @param {string} endpoint - API endpoint (e.g., '/api/v1/diagnostic/run')
 * @param {object} options - Fetch options (method, headers, body)
 * @returns {Promise<object>} - Parsed JSON response
 * @throws {Error} - Descriptive error with context
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${window.API_BASE_URL}${endpoint}`;
    
    // Default options
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    // Merge options
    const fetchOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };
    
    try {
        console.log(`API Request: ${fetchOptions.method} ${url}`);
        
        const response = await fetch(url, fetchOptions);
        
        // Check content type before parsing
        const contentType = response.headers.get('content-type');
        
        if (!response.ok) {
            // Handle non-OK responses
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                throw new Error(
                    `API Error (${response.status}): ${errorData.detail || errorData.message || 'Unknown error'}`
                );
            } else {
                // Received HTML or other non-JSON response
                const text = await response.text();
                throw new Error(
                    `API Error (${response.status}): Received ${contentType || 'non-JSON'} response. ` +
                    `Check that backend is running on ${window.API_BASE_URL} and endpoint ${endpoint} exists.`
                );
            }
        }
        
        // Parse successful response
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            throw new Error(
                `Expected JSON response but received ${contentType}. ` +
                `This usually means the API endpoint returned HTML instead of JSON.`
            );
        }
        
    } catch (error) {
        // Log detailed error for debugging
        console.error('API Request Failed:', {
            url,
            method: fetchOptions.method,
            error: error.message,
        });
        
        // Re-throw with context
        throw new Error(`Failed to ${fetchOptions.method} ${endpoint}: ${error.message}`);
    }
}
```

**Interface**:
- Input: endpoint (string), options (object)
- Output: Promise<JSON object>
- Error Handling: Throws descriptive errors with context
- Logging: Logs all requests and errors to console

### 5. UserStateManager Enhancement (frontend/user-state-manager.js)

**Purpose**: Single source of truth for user state and tier

**Changes**:
```javascript
const UserStateManager = {
    // Private state
    _user: null,
    _loaded: false,
    _listeners: [],
    
    /**
     * Initialize user state from backend
     */
    async init() {
        console.log('UserStateManager: Initializing...');
        
        const token = localStorage.getItem('aivory_token');
        if (!token) {
            console.log('UserStateManager: No token found');
            this._loaded = true;
            this._notifyListeners();
            return;
        }
        
        try {
            const response = await fetch(`${window.API_BASE_URL}/api/v1/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }
            
            this._user = await response.json();
            
            // Store in localStorage
            localStorage.setItem('aivory_user', JSON.stringify(this._user));
            
            console.log('UserStateManager: User loaded:', this._user.email, 'Tier:', this._user.tier);
            
        } catch (error) {
            console.error('UserStateManager: Failed to load user:', error);
            // Clear invalid token
            localStorage.removeItem('aivory_token');
            localStorage.removeItem('aivory_user');
        }
        
        this._loaded = true;
        this._notifyListeners();
    },
    
    /**
     * Check if user data has been loaded
     */
    isLoaded() {
        return this._loaded;
    },
    
    /**
     * Get current user object
     */
    getCurrentUser() {
        return this._user;
    },
    
    /**
     * Get user tier
     */
    getTier() {
        return this._user ? this._user.tier : 'free';
    },
    
    /**
     * Subscribe to user state changes
     */
    onUserLoaded(callback) {
        if (this._loaded) {
            // Already loaded, call immediately
            callback(this._user);
        } else {
            // Add to listeners
            this._listeners.push(callback);
        }
    },
    
    /**
     * Notify all listeners
     */
    _notifyListeners() {
        this._listeners.forEach(callback => callback(this._user));
        this._listeners = []; // Clear listeners after notification
    },
    
    /**
     * Update user data (after login, tier change, etc.)
     */
    updateUser(user) {
        this._user = user;
        localStorage.setItem('aivory_user', JSON.stringify(user));
        this._notifyListeners();
    },
    
    /**
     * Clear user data (on logout)
     */
    clearUser() {
        this._user = null;
        this._loaded = false;
        localStorage.removeItem('aivory_token');
        localStorage.removeItem('aivory_user');
        this._notifyListeners();
    }
};

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    UserStateManager.init();
});

// Export globally
window.UserStateManager = UserStateManager;
```

**Interface**:
- init(): Loads user from backend, stores in localStorage
- isLoaded(): Returns boolean indicating if user data loaded
- getCurrentUser(): Returns user object or null
- getTier(): Returns tier string or 'free'
- onUserLoaded(callback): Registers callback for when user loads
- updateUser(user): Updates user data and notifies listeners
- clearUser(): Clears user data on logout

### 6. Refactored tier-sync.js

**Purpose**: Update UI tier displays after user data loads

**Changes**:
```javascript
/**
 * Tier Synchronization Script
 * Waits for UserStateManager to load user data before updating UI
 */

// Tier display mapping
const TIER_DISPLAY_MAP = {
    'free': 'Free',
    'snapshot': 'Snapshot',
    'blueprint': 'Blueprint',
    'foundation': 'Foundation',
    'builder': 'Builder',
    'operator': 'Operator',
    'pro': 'Pro',
    'enterprise': 'Enterprise',
    'super_admin': 'Enterprise'
};

/**
 * Update all tier displays on the page
 */
function updateTierDisplays(user) {
    const tier = user ? user.tier : 'free';
    const tierDisplay = TIER_DISPLAY_MAP[tier] || 'Free';
    
    console.log(`Updating tier displays: ${tierDisplay} (${tier})`);
    
    // Update all tier badge elements
    const tierBadges = document.querySelectorAll(
        '#tierBadgeTop, #contextTier, .tier-badge'
    );
    
    tierBadges.forEach(badge => {
        if (badge) {
            badge.textContent = tierDisplay;
            // Add tier-specific class for styling
            badge.className = badge.className.replace(/tier-\w+/g, '');
            badge.classList.add(`tier-${tier}`);
        }
    });
    
    // Update credits display if user has tier data
    if (user && user.credits !== undefined) {
        const creditsDisplays = document.querySelectorAll(
            '#creditsDisplay, #contextCredits'
        );
        
        creditsDisplays.forEach(display => {
            if (display) {
                display.textContent = user.credits.toString();
            }
        });
    }
}

/**
 * Initialize tier synchronization
 * Waits for UserStateManager to load before updating UI
 */
function initTierSync() {
    if (typeof UserStateManager === 'undefined') {
        console.warn('UserStateManager not available, tier sync disabled');
        return;
    }
    
    // Register callback for when user loads
    UserStateManager.onUserLoaded((user) => {
        updateTierDisplays(user);
    });
    
    // If already loaded, update immediately
    if (UserStateManager.isLoaded()) {
        const user = UserStateManager.getCurrentUser();
        updateTierDisplays(user);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initTierSync);

// Update when page becomes visible (user might have logged in on another tab)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && UserStateManager.isLoaded()) {
        const user = UserStateManager.getCurrentUser();
        updateTierDisplays(user);
    }
});
```

**Interface**:
- initTierSync(): Registers with UserStateManager
- updateTierDisplays(user): Updates all tier UI elements
- Listens to: UserStateManager.onUserLoaded()
- Updates: All elements with tier-related IDs/classes

### 7. simple_server.py Retirement

**Purpose**: Remove conflicting server to eliminate port conflicts

**Action**: Archive simple_server.py to `archive/simple_server.py.bak`

**Rationale**: 
- FastAPI handles all API endpoints
- python -m http.server handles static files
- simple_server.py creates confusion and port conflicts
- No unique functionality that can't be handled by the other two

**Alternative**: If simple_server.py must be retained, assign it to port 9001 and document its specific purpose (e.g., "Legacy compatibility server - do not use for new development")

## Data Models

### LocalStorage Schema

```typescript
// Authentication token
aivory_token: string  // JWT token for API authentication

// User data (complete user object from backend)
aivory_user: {
    user_id: string,
    email: string,
    tier: 'free' | 'snapshot' | 'blueprint' | 'foundation' | 'builder' | 'operator' | 'pro' | 'enterprise' | 'super_admin',
    account_type: 'free' | 'paid' | 'superadmin',
    credits: number,
    created_at: string,
    updated_at: string
}

// Deprecated keys (to be removed):
// - aivory_tier (redundant with aivory_user.tier)
// - aivory_session_token (replaced by aivory_token)
// - aivory_username (redundant with aivory_user.email)
// - aivory_role (redundant with aivory_user.account_type)
```

### API Response Models

```typescript
// Health check response
interface HealthResponse {
    status: 'healthy' | 'unhealthy',
    port: number,
    api_base: string,
    llm_available: boolean,
    timestamp: string
}

// User data response
interface UserResponse {
    user_id: string,
    email: string,
    tier: string,
    account_type: string,
    credits: number,
    created_at: string,
    updated_at: string
}

// Error response
interface ErrorResponse {
    detail: string,
    status_code: number,
    timestamp: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I identified the following patterns:

**Redundancies Eliminated:**
- Requirements 5.2, 5.3 can be combined into a single property about fetch call patterns
- Requirements 6.2, 6.3 can be combined into a single property about content-type handling
- Requirements 14.1-14.5 can be combined into a single property about CORS configuration
- Requirements 4.2, 4.3 can be combined into a single property about API_BASE_URL configuration

**Properties vs Examples:**
- Most testable criteria are examples (specific test cases) rather than properties (universal rules)
- Only a few criteria represent universal properties that apply across all inputs
- This is appropriate for an architecture cleanup spec focused on configuration and integration

**Key Properties Identified:**
1. API route prefix consistency (all routes under /api/)
2. Error handling for non-JSON responses (applies to all fetch calls)
3. CORS configuration completeness (applies to all origins/methods/headers)

### Correctness Properties

Property 1: API Route Prefix Consistency
*For all* registered API routes in the FastAPI application, the route path should start with `/api/`
**Validates: Requirements 1.5**

Property 2: Fetch Error Handling Completeness
*For all* fetch calls in the codebase, when the response status is not OK (200-299), the system should check the content-type header before attempting to parse the response
**Validates: Requirements 6.1**

Property 3: CORS Configuration Completeness
*For all* CORS middleware configurations, the settings should include allow_credentials=True, allow all standard HTTP methods (GET, POST, PUT, DELETE, OPTIONS), and allow all standard headers including Authorization and Content-Type
**Validates: Requirements 14.3, 14.4, 14.5**

## Error Handling

### Port Conflict Errors

**Scenario**: Backend fails to start because port 8000 is already in use

**Detection**:
```python
# In app/main.py or startup script
import socket

def check_port_available(port: int) -> bool:
    """Check if port is available"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('0.0.0.0', port))
            return True
    except OSError:
        return False

def get_process_on_port(port: int) -> str:
    """Get process using port (Unix/Mac only)"""
    import subprocess
    try:
        result = subprocess.run(
            ['lsof', '-ti', f':{port}'],
            capture_output=True,
            text=True
        )
        if result.stdout:
            pid = result.stdout.strip()
            return f"PID {pid}"
        return "Unknown process"
    except Exception:
        return "Unable to determine"

# Check before starting
if not check_port_available(settings.port):
    process = get_process_on_port(settings.port)
    print(f"""
❌ ERROR: Port {settings.port} is already in use by {process}

To fix this issue:

1. Find the process using the port:
   lsof -i :{settings.port}

2. Kill the process:
   kill -9 <PID>

3. Or use a different port:
   uvicorn app.main:app --port 8001

Then try starting the server again.
    """)
    sys.exit(1)
```

**Error Message Format**:
```
❌ ERROR: Port 8000 is already in use by PID 12345

To fix this issue:

1. Find the process using the port:
   lsof -i :8000

2. Kill the process:
   kill -9 12345

3. Or use a different port:
   uvicorn app.main:app --port 8001

Then try starting the server again.
```

### Backend Connection Errors

**Scenario**: Frontend loads but backend is not running

**Detection**:
```javascript
// In frontend/app.js
async function verifyBackendConnection(retries = 3, delay = 2000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`Health check attempt ${attempt}/${retries}...`);
            
            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                throw new Error(`Health check failed: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Backend connected:', data);
            return true;
            
        } catch (error) {
            console.error(`❌ Health check attempt ${attempt} failed:`, error);
            
            if (attempt < retries) {
                console.log(`Retrying in ${delay/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    // All retries failed
    showBackendError();
    return false;
}

function showBackendError() {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'backend-error';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #ff4444;
        color: white;
        padding: 20px 30px;
        border-radius: 8px;
        z-index: 10000;
        font-family: 'Segoe UI', sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 500px;
    `;
    errorDiv.innerHTML = `
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
            ⚠️ Backend Server Unavailable
        </div>
        <div style="font-size: 14px; line-height: 1.6;">
            The API server is not responding. Please start it with:
        </div>
        <div style="background: rgba(0,0,0,0.2); padding: 10px; margin: 10px 0; border-radius: 4px; font-family: monospace; font-size: 13px;">
            uvicorn app.main:app --port 8000 --reload
        </div>
        <div style="font-size: 12px; opacity: 0.9;">
            Expected backend at: ${API_BASE_URL}
        </div>
    `;
    document.body.appendChild(errorDiv);
}
```

**Error Display**: Fixed banner at top of page with clear instructions

### Non-JSON Response Errors

**Scenario**: Fetch call receives HTML instead of JSON (wrong endpoint or server error)

**Detection**:
```javascript
// In apiRequest wrapper
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(url, fetchOptions);
        const contentType = response.headers.get('content-type');
        
        if (!response.ok) {
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                throw new Error(
                    `API Error (${response.status}): ${errorData.detail || 'Unknown error'}`
                );
            } else {
                // Received HTML or other non-JSON response
                throw new Error(
                    `API Error (${response.status}): Received ${contentType || 'non-JSON'} response. ` +
                    `Check that backend is running on ${window.API_BASE_URL} and endpoint ${endpoint} exists. ` +
                    `This usually means you're hitting a 404 page or the wrong server.`
                );
            }
        }
        
        // Check successful response is JSON
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(
                `Expected JSON response but received ${contentType}. ` +
                `Endpoint ${endpoint} returned non-JSON content. ` +
                `This usually means the API endpoint is not configured correctly.`
            );
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('API Request Failed:', {
            url,
            method: fetchOptions.method,
            error: error.message,
        });
        throw error;
    }
}
```

**Error Message Examples**:
```
❌ API Error (404): Received text/html response. Check that backend is running on http://localhost:8000 and endpoint /api/v1/wrong exists. This usually means you're hitting a 404 page or the wrong server.

❌ Expected JSON response but received text/html. Endpoint /api/v1/diagnostic/run returned non-JSON content. This usually means the API endpoint is not configured correctly.
```

### User State Loading Errors

**Scenario**: UserStateManager fails to load user data from backend

**Detection**:
```javascript
// In UserStateManager
async init() {
    const token = localStorage.getItem('aivory_token');
    if (!token) {
        console.log('UserStateManager: No token found, user not authenticated');
        this._loaded = true;
        this._notifyListeners();
        return;
    }
    
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/v1/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                console.warn('UserStateManager: Token expired or invalid');
            } else {
                console.error('UserStateManager: Failed to fetch user data:', response.status);
            }
            throw new Error('Failed to fetch user data');
        }
        
        this._user = await response.json();
        localStorage.setItem('aivory_user', JSON.stringify(this._user));
        
        console.log('✅ UserStateManager: User loaded:', this._user.email, 'Tier:', this._user.tier);
        
    } catch (error) {
        console.error('❌ UserStateManager: Error loading user:', error);
        // Clear invalid token
        localStorage.removeItem('aivory_token');
        localStorage.removeItem('aivory_user');
        this._user = null;
    }
    
    this._loaded = true;
    this._notifyListeners();
}
```

**Fallback Behavior**: 
- Clear invalid tokens
- Set user to null
- Notify listeners (tier-sync will default to 'free')
- Log clear error messages

## Testing Strategy

### Unit Tests

**Backend Tests** (Python + pytest):

```python
# tests/test_config.py
def test_port_configuration():
    """Verify backend is configured for port 8000"""
    from app.config import settings
    assert settings.port == 8000

def test_cors_origins_development():
    """Verify CORS allows localhost:9000 in development"""
    from app.config import settings
    assert "http://localhost:9000" in settings.cors_origins

# tests/test_health_endpoint.py
def test_health_check_returns_port():
    """Verify health endpoint returns port information"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "port" in data
    assert data["port"] == 8000

# tests/test_api_routes.py
def test_all_routes_have_api_prefix():
    """Verify all API routes start with /api/"""
    from app.main import app
    for route in app.routes:
        if hasattr(route, 'path') and route.path != '/health':
            assert route.path.startswith('/api/'), f"Route {route.path} missing /api/ prefix"
```

**Frontend Tests** (JavaScript + Jest or manual):

```javascript
// tests/test_api_config.js
describe('API Configuration', () => {
    test('API_BASE_URL is set on window object', () => {
        expect(window.API_BASE_URL).toBeDefined();
    });
    
    test('API_BASE_URL points to port 8000 in development', () => {
        // Mock development environment
        Object.defineProperty(window, 'location', {
            value: { hostname: 'localhost' },
            writable: true
        });
        
        // Re-run API_BASE_URL logic
        const isDevelopment = window.location.hostname === 'localhost';
        const apiUrl = isDevelopment ? 'http://localhost:8000' : window.location.origin;
        
        expect(apiUrl).toBe('http://localhost:8000');
    });
    
    test('No local API_BASE_URL constants in other files', () => {
        // This would be a static analysis test
        // Check that no JS files declare their own API_BASE_URL
    });
});

// tests/test_user_state_manager.js
describe('UserStateManager', () => {
    test('getTier returns "free" when no user', () => {
        UserStateManager._user = null;
        expect(UserStateManager.getTier()).toBe('free');
    });
    
    test('getTier returns user tier when user exists', () => {
        UserStateManager._user = { tier: 'pro' };
        expect(UserStateManager.getTier()).toBe('pro');
    });
    
    test('onUserLoaded calls callback immediately if already loaded', () => {
        UserStateManager._loaded = true;
        UserStateManager._user = { tier: 'pro' };
        
        const callback = jest.fn();
        UserStateManager.onUserLoaded(callback);
        
        expect(callback).toHaveBeenCalledWith({ tier: 'pro' });
    });
});

// tests/test_error_handling.js
describe('API Error Handling', () => {
    test('apiRequest throws descriptive error for HTML response', async () => {
        // Mock fetch to return HTML
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                status: 404,
                headers: new Map([['content-type', 'text/html']]),
            })
        );
        
        await expect(apiRequest('/api/test')).rejects.toThrow(
            /Received text\/html response/
        );
    });
    
    test('apiRequest includes URL and method in error', async () => {
        global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
        
        await expect(apiRequest('/api/test', { method: 'POST' })).rejects.toThrow(
            /Failed to POST \/api\/test/
        );
    });
});
```

### Integration Tests

**End-to-End Flow Tests**:

```bash
#!/bin/bash
# tests/integration/test_server_startup.sh

echo "Testing server startup and connectivity..."

# Test 1: Backend starts on port 8000
echo "1. Starting backend on port 8000..."
uvicorn app.main:app --port 8000 &
BACKEND_PID=$!
sleep 3

# Check backend is running
curl -f http://localhost:8000/health || {
    echo "❌ Backend health check failed"
    kill $BACKEND_PID
    exit 1
}
echo "✅ Backend running on port 8000"

# Test 2: Frontend serves on port 9000
echo "2. Starting frontend on port 9000..."
cd frontend && python3 -m http.server 9000 &
FRONTEND_PID=$!
sleep 2

# Check frontend is serving
curl -f http://localhost:9000/index.html || {
    echo "❌ Frontend not serving"
    kill $BACKEND_PID $FRONTEND_PID
    exit 1
}
echo "✅ Frontend serving on port 9000"

# Test 3: CORS allows frontend to call backend
echo "3. Testing CORS..."
curl -H "Origin: http://localhost:9000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:8000/api/v1/diagnostic/run || {
    echo "❌ CORS preflight failed"
    kill $BACKEND_PID $FRONTEND_PID
    exit 1
}
echo "✅ CORS configured correctly"

# Cleanup
kill $BACKEND_PID $FRONTEND_PID
echo "✅ All integration tests passed"
```

**User State Synchronization Test**:

```javascript
// tests/integration/test_tier_sync.js
describe('Tier Synchronization Integration', () => {
    test('Tier displays correctly after login', async () => {
        // 1. Mock backend /api/v1/auth/me endpoint
        global.fetch = jest.fn((url) => {
            if (url.includes('/api/v1/auth/me')) {
                return Promise.resolve({
                    ok: true,
                    headers: new Map([['content-type', 'application/json']]),
                    json: () => Promise.resolve({
                        user_id: 'test123',
                        email: 'test@example.com',
                        tier: 'pro',
                        account_type: 'paid'
                    })
                });
            }
        });
        
        // 2. Set token in localStorage
        localStorage.setItem('aivory_token', 'test-token');
        
        // 3. Initialize UserStateManager
        await UserStateManager.init();
        
        // 4. Verify user loaded
        expect(UserStateManager.isLoaded()).toBe(true);
        expect(UserStateManager.getTier()).toBe('pro');
        
        // 5. Initialize tier-sync
        initTierSync();
        
        // 6. Verify tier badge updated
        const tierBadge = document.getElementById('tierBadgeTop');
        expect(tierBadge.textContent).toBe('Pro');
    });
});
```

### Manual Testing Checklist

**Server Startup**:
- [ ] Backend starts successfully on port 8000
- [ ] Frontend serves successfully on port 9000
- [ ] No port conflict errors
- [ ] Health check returns correct port information

**API Communication**:
- [ ] All fetch calls use window.API_BASE_URL
- [ ] No hardcoded URLs in fetch calls
- [ ] No relative paths like /api/... in fetch calls
- [ ] Error messages are descriptive for non-JSON responses

**User State**:
- [ ] Login stores user data in aivory_user
- [ ] Tier displays correctly after login
- [ ] Tier persists across page refreshes
- [ ] Logout clears user data correctly

**Error Handling**:
- [ ] Port conflict shows clear error message
- [ ] Backend unavailable shows user-friendly banner
- [ ] Non-JSON responses show descriptive errors
- [ ] All errors include context (URL, method, status)

### Property-Based Testing

**Property Test Configuration**:
- Use pytest with hypothesis for Python
- Use fast-check for JavaScript
- Minimum 100 iterations per property test

**Property Test 1: API Route Prefix Consistency**
```python
# tests/property/test_api_routes.py
from hypothesis import given, strategies as st
from app.main import app

def test_all_api_routes_have_prefix():
    """
    Property: All API routes start with /api/
    Feature: architecture-cleanup, Property 1
    """
    for route in app.routes:
        if hasattr(route, 'path') and route.path != '/health':
            assert route.path.startswith('/api/'), \
                f"Route {route.path} missing /api/ prefix"
```

**Property Test 2: Fetch Error Handling**
```javascript
// tests/property/test_error_handling.js
const fc = require('fast-check');

test('apiRequest checks content-type for non-OK responses', () => {
    /**
     * Property: For all non-OK responses, check content-type before parsing
     * Feature: architecture-cleanup, Property 2
     */
    fc.assert(
        fc.property(
            fc.integer({ min: 400, max: 599 }), // HTTP error codes
            fc.oneof(
                fc.constant('text/html'),
                fc.constant('application/json'),
                fc.constant('text/plain')
            ), // Content types
            async (statusCode, contentType) => {
                // Mock fetch
                global.fetch = jest.fn(() =>
                    Promise.resolve({
                        ok: false,
                        status: statusCode,
                        headers: new Map([['content-type', contentType]]),
                        json: () => Promise.resolve({ detail: 'Error' }),
                        text: () => Promise.resolve('<html>Error</html>')
                    })
                );
                
                try {
                    await apiRequest('/api/test');
                } catch (error) {
                    // Should mention content-type in error
                    expect(error.message).toMatch(
                        new RegExp(contentType.replace('/', '\\/'))
                    );
                }
            }
        ),
        { numRuns: 100 }
    );
});
```

**Property Test 3: CORS Configuration**
```python
# tests/property/test_cors.py
from hypothesis import given, strategies as st
from app.main import app

def test_cors_configuration_complete():
    """
    Property: CORS middleware includes all required settings
    Feature: architecture-cleanup, Property 3
    """
    # Find CORS middleware
    cors_middleware = None
    for middleware in app.user_middleware:
        if 'CORSMiddleware' in str(middleware):
            cors_middleware = middleware
            break
    
    assert cors_middleware is not None, "CORS middleware not found"
    
    # Check configuration
    # Note: This is more of an example test than a property test
    # since CORS config is static
    assert hasattr(cors_middleware, 'options')
    options = cors_middleware.options
    
    assert options.get('allow_credentials') == True
    assert '*' in options.get('allow_methods', []) or \
           all(m in options.get('allow_methods', []) 
               for m in ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    assert '*' in options.get('allow_headers', []) or \
           all(h in options.get('allow_headers', []) 
               for h in ['Authorization', 'Content-Type'])
```

## Deployment Considerations

### Development Environment Setup

**Prerequisites**:
- Python 3.11+
- Node.js (optional, for npm scripts)
- Git

**Setup Steps**:

1. **Clone Repository**:
```bash
git clone <repository-url>
cd aivory
```

2. **Install Backend Dependencies**:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Configure Environment**:
```bash
cp .env.example .env.local
# Edit .env.local with your settings
```

4. **Start Backend** (Terminal 1):
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

5. **Start Frontend** (Terminal 2):
```bash
cd frontend
python3 -m http.server 9000
```

6. **Open Browser**:
```
http://localhost:9000
```

### Production Deployment

**Architecture**:
```
Internet → Nginx (Port 80/443)
            ├─ / → Static Files (/var/www/aivory/frontend)
            └─ /api/ → FastAPI (localhost:8000)
```

**Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name aivory.com www.aivory.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name aivory.com www.aivory.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/aivory.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aivory.com/privkey.pem;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Frontend Static Files
    location / {
        root /var/www/aivory/frontend;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers (if not handled by FastAPI)
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Credentials true always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        
        # Handle preflight
        if ($request_method = OPTIONS) {
            return 204;
        }
    }
    
    # Health Check
    location /health {
        proxy_pass http://localhost:8000;
        access_log off;
    }
}
```

**Backend Service** (systemd):
```ini
# /etc/systemd/system/aivory-backend.service
[Unit]
Description=Aivory Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/aivory
Environment="PATH=/var/www/aivory/venv/bin"
ExecStart=/var/www/aivory/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Deployment Checklist**:
- [ ] Update app/config.py with production settings
- [ ] Set production CORS origins (remove *)
- [ ] Configure SSL certificates
- [ ] Set up systemd service for backend
- [ ] Configure Nginx reverse proxy
- [ ] Set up monitoring (Sentry, Datadog)
- [ ] Configure logging
- [ ] Set up database backups
- [ ] Test health check endpoint
- [ ] Test CORS from production domain
- [ ] Verify API_BASE_URL uses window.location.origin

### Monitoring and Logging

**Backend Logging**:
```python
# app/main.py
import logging
from logging.handlers import RotatingFileHandler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler(
            'logs/aivory.log',
            maxBytes=10485760,  # 10MB
            backupCount=10
        ),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"{request.method} {request.url.path} - {response.status_code}")
    return response
```

**Frontend Error Tracking**:
```javascript
// frontend/app.js
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Send to error tracking service (e.g., Sentry)
    if (window.Sentry) {
        Sentry.captureException(event.error);
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (window.Sentry) {
        Sentry.captureException(event.reason);
    }
});
```

**Health Monitoring**:
```bash
#!/bin/bash
# scripts/health_check.sh

# Check backend health
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)

if [ "$BACKEND_STATUS" != "200" ]; then
    echo "❌ Backend unhealthy (status: $BACKEND_STATUS)"
    # Send alert (email, Slack, PagerDuty, etc.)
    exit 1
fi

echo "✅ Backend healthy"
exit 0
```

Run health check every minute:
```cron
* * * * * /var/www/aivory/scripts/health_check.sh
```
