# Implementation Plan: Dashboard Authentication Flow Fix

## Overview

This plan fixes critical authentication and dashboard flow issues by:
1. Unifying token storage keys between login and auth-manager
2. Ensuring proper initialization order (AuthManager → UserStateManager → Dashboard)
3. Adding comprehensive error handling and logging
4. Creating a test page for debugging authentication flows

## Tasks

- [x] 1. Update Auth-Manager.js for unified token handling
  - [x] 1.1 Change token storage key to "aivory_session_token"
    - Replace AUTH_KEYS.ACCESS_TOKEN with AUTH_KEYS.SESSION_TOKEN
    - Update all references to use new key name
    - Remove refresh token logic (not used in current implementation)
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 1.2 Add token validation to storeSessionToken
    - Validate input is non-empty string before storing
    - Return boolean indicating success/failure
    - Log validation failures
    - _Requirements: 1.5_
  
  - [x] 1.3 Add comprehensive logging to auth operations
    - Log token retrieval attempts (success/failure)
    - Log API request initiation and results
    - Log 401 errors with context
    - Use console.error for errors, console.warn for warnings, console.log for info
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 1.4 Add initialization ready flag
    - Set window.AuthManagerReady = true after initialization
    - Log initialization completion
    - _Requirements: 3.1_
  
  - [ ]* 1.5 Write property test for token validation
    - **Property 1: Token Validation Rejects Invalid Inputs**
    - **Validates: Requirements 1.5**

- [x] 2. Update User-State-Manager.js for proper initialization order
  - [x] 2.1 Add waitForAuthManager function
    - Poll for window.AuthManagerReady flag
    - Timeout after 5 seconds with warning
    - Log when AuthManager becomes ready
    - _Requirements: 2.1, 3.2_
  
  - [x] 2.2 Update init() to wait for AuthManager
    - Call waitForAuthManager before checking authentication
    - Log initialization steps
    - Handle AuthManager unavailable case
    - _Requirements: 2.1, 3.2_
  
  - [x] 2.3 Enhance error handling in user state fetch
    - Log detailed error information (status, URL, response)
    - Handle 401 by clearing tokens (use AuthManager.clearAuthData)
    - Handle network errors with detailed logging
    - Set isLoaded = true even on error
    - _Requirements: 2.3, 2.4, 5.1, 5.3_
  
  - [x] 2.4 Add success logging
    - Log successful user state fetch with user email
    - Log user state details (tier, credits, isSuperAdmin)
    - _Requirements: 2.2, 5.4_
  
  - [ ]* 2.5 Write unit tests for UserStateManager
    - Test initialization waits for AuthManager
    - Test 401 response handling
    - Test network error handling
    - Test state change notifications
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Update Dashboard.js for proper initialization flow
  - [x] 3.1 Add waitForAuthManager function
    - Same implementation as UserStateManager
    - Poll for window.AuthManagerReady flag
    - Timeout after 5 seconds
    - _Requirements: 3.1_
  
  - [x] 3.2 Add waitForUserState function
    - Wait for UserStateManager.isLoaded() to be true
    - Subscribe to state changes
    - Timeout after 10 seconds
    - _Requirements: 3.2_
  
  - [x] 3.3 Add loading indicator functions
    - showLoadingIndicator() - full-screen overlay
    - hideLoadingIndicator() - remove overlay
    - _Requirements: 3.5_
  
  - [x] 3.4 Update initDashboard with proper initialization order
    - Show loading indicator
    - Wait for AuthManager
    - Check authentication (redirect if not authenticated)
    - Wait for UserStateManager
    - Hide loading indicator
    - Update UI based on user state
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 3.5 Add UI update functions
    - updateDemoBanner(userState) - hide for superadmin
    - updateTierDisplay(userState) - show "Enterprise" for superadmin
    - updateCreditsDisplay(userState) - show "{used} / {total}" format
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 3.6 Write unit tests for dashboard initialization
    - Test initialization order
    - Test authentication check
    - Test loading indicator display
    - Test UI updates based on user state
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4. Create test-auth-flow.html test page
  - [x] 4.1 Create HTML structure
    - Token status section
    - API test section (/api/v1/auth/me)
    - Workflows test section (/api/v1/workflows)
    - Actions section (clear token, refresh, go to login)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 4.2 Implement displayTokenStatus function
    - Read token from localStorage
    - Display token presence/absence
    - Show first 50 characters of token if present
    - _Requirements: 6.1_
  
  - [x] 4.3 Implement testApiConnection function
    - Fetch /api/v1/auth/me with token
    - Display response status and data
    - Handle errors gracefully
    - _Requirements: 6.2, 6.3, 6.4_
  
  - [x] 4.4 Implement testWorkflowsEndpoint function
    - Fetch /api/v1/workflows with token
    - Display response status and data
    - Handle errors gracefully
    - _Requirements: 6.2, 6.3, 6.4_
  
  - [x] 4.5 Implement clearToken function
    - Remove aivory_session_token from localStorage
    - Remove aivory_user from localStorage
    - Refresh token status display
    - _Requirements: 6.5_

- [x] 5. Update DEV_QUICK_START.md with troubleshooting guide
  - [x] 5.1 Add "Authentication Troubleshooting" section
    - 401 errors troubleshooting steps
    - 404 errors troubleshooting steps
    - Demo banner troubleshooting steps
    - Dashboard not loading troubleshooting steps
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 5.2 Add "Testing Authentication Flow" section
    - How to use test-auth-flow.html
    - Expected results for each test
    - Common issues and solutions
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 6. Checkpoint - Test authentication flow end-to-end
  - Ensure backend is running on port 8081
  - Ensure /api/v1/workflows endpoint is available
  - Test login via superadmin-login.html
  - Verify token stored as "aivory_session_token"
  - Test dashboard.html loads without errors
  - Verify demo banner hidden for superadmin
  - Verify tier shows "Enterprise"
  - Verify credits show "2000 / 2000"
  - Test test-auth-flow.html page
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks
- Each task references specific requirements for traceability
- The checkpoint ensures all components work together correctly
- Backend must be restarted to load workflows endpoint
- Users will need to log in again after deployment (token key changed)
