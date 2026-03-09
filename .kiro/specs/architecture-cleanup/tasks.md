# Implementation Plan: Architecture Cleanup

## Overview

This implementation plan refactors Aivory's frontend-backend architecture to eliminate port conflicts, standardize API communication, and implement reliable user state management. The approach is incremental, with checkpoints to ensure stability at each stage.

## Tasks

- [ ] 1. Backend Server Configuration
  - [ ] 1.1 Update app/config.py to use port 8000
    - Change `port: int = 8081` to `port: int = 8000`
    - Update CORS origins to `["http://localhost:9000", "http://127.0.0.1:9000"]`
    - _Requirements: 1.1, 1.5, 14.1_
  
  - [ ] 1.2 Add port availability check to app/main.py
    - Implement `check_port_available()` function
    - Implement `get_process_on_port()` function for diagnostics
    - Add startup check before uvicorn binds
    - Display clear error message if port occupied
    - _Requirements: 1.2, 1.3, 12.1, 12.3, 12.4_
  
  - [ ] 1.3 Update health endpoint to return port information
    - Add `port` field to health check response
    - Add `api_base` field showing full API URL
    - _Requirements: 1.1_
  
  - [ ]* 1.4 Write unit tests for backend configuration
    - Test port is set to 8000
    - Test CORS origins include localhost:9000
    - Test health endpoint returns port info
    - _Requirements: 1.1, 14.1_

- [ ] 2. Retire simple_server.py
  - [ ] 2.1 Archive simple_server.py
    - Move `simple_server.py` to `archive/simple_server.py.bak`
    - Add comment explaining why it was retired
    - _Requirements: 3.1, 3.4_
  
  - [ ] 2.2 Update package.json scripts
    - Remove references to simple_server.py
    - Update `dev` script to use python -m http.server
    - Update `start` script to use python -m http.server
    - _Requirements: 2.2_

- [ ] 3. Standardize Frontend API Configuration
  - [ ] 3.1 Update frontend/app.js API_BASE_URL logic
    - Change development URL from `http://localhost:8081` to `http://localhost:8000`
    - Ensure production uses `window.location.origin`
    - Add console log showing configured API_BASE_URL
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ] 3.2 Implement backend connection verification
    - Create `verifyBackendConnection()` function with retry logic
    - Implement 3 retries with 2-second delays
    - Create `showBackendError()` function for user-friendly error display
    - Call verification on DOMContentLoaded
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [ ] 3.3 Create standardized apiRequest() wrapper
    - Implement centralized fetch wrapper with error handling
    - Check content-type before parsing responses
    - Provide descriptive errors for HTML responses
    - Include URL, method, and status in error messages
    - _Requirements: 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 3.4 Write unit tests for API configuration
    - Test API_BASE_URL is set on window object
    - Test development mode uses port 8000
    - Test production mode uses window.location.origin
    - _Requirements: 4.2, 4.3, 4.4_

- [ ] 4. Checkpoint - Verify Backend Communication
  - Ensure backend starts on port 8000 without conflicts
  - Ensure frontend can reach backend health endpoint
  - Ensure error messages are clear and helpful
  - Ask the user if questions arise

- [ ] 5. Refactor All Fetch Calls
  - [ ] 5.1 Audit all JavaScript files for fetch calls
    - Search for `fetch(` in all .js files
    - Document all fetch calls and their current patterns
    - _Requirements: 5.1_
  
  - [ ] 5.2 Refactor fetch calls in frontend/app.js
    - Replace all relative paths with `${window.API_BASE_URL}/api/...`
    - Replace all hardcoded URLs with `window.API_BASE_URL`
    - Wrap all fetch calls with apiRequest() wrapper
    - _Requirements: 5.2, 5.3, 5.4_
  
  - [ ] 5.3 Refactor fetch calls in frontend/auth-manager.js
    - Replace all `${window.API_BASE_URL}` direct usage with apiRequest() wrapper
    - Ensure all error handling uses standardized approach
    - _Requirements: 5.2, 5.3, 5.4_
  
  - [ ] 5.4 Refactor fetch calls in frontend/dashboard.js
    - Replace all fetch calls with apiRequest() wrapper
    - Update error handling to use standardized approach
    - _Requirements: 5.2, 5.3, 5.4_
  
  - [ ] 5.5 Refactor fetch calls in frontend/user-state-manager.js
    - Replace fetch calls with apiRequest() wrapper
    - Remove fallback API_BASE_URL setting (rely on app.js)
    - _Requirements: 5.2, 5.3, 5.4_
  
  - [ ] 5.6 Refactor fetch calls in frontend/workflow-alert.js
    - Replace fetch calls with apiRequest() wrapper
    - Remove fallback API_BASE_URL setting
    - _Requirements: 5.2, 5.3, 5.4_
  
  - [ ]* 5.7 Write integration tests for API calls
    - Test all major API endpoints are reachable
    - Test error handling for non-JSON responses
    - Test error messages include context
    - _Requirements: 5.4, 5.5, 6.1, 6.5_

- [ ] 6. Enhance UserStateManager
  - [ ] 6.1 Refactor UserStateManager to use single localStorage schema
    - Store user data in `aivory_user` key as JSON
    - Store token in `aivory_token` key
    - Remove any usage of deprecated keys
    - _Requirements: 7.1, 7.2, 9.2, 9.3_
  
  - [ ] 6.2 Implement UserStateManager.init() method
    - Load user from backend on page load
    - Store user data in localStorage
    - Handle authentication errors gracefully
    - _Requirements: 7.1, 7.2_
  
  - [ ] 6.3 Implement UserStateManager public API
    - Implement `isLoaded()` method
    - Implement `getCurrentUser()` method
    - Implement `getTier()` method
    - Implement `onUserLoaded(callback)` method
    - Implement `updateUser(user)` method
    - Implement `clearUser()` method
    - _Requirements: 7.3, 7.4, 7.5_
  
  - [ ] 6.4 Add auto-initialization on page load
    - Call `UserStateManager.init()` on DOMContentLoaded
    - Export UserStateManager to window object
    - _Requirements: 7.5_
  
  - [ ]* 6.5 Write unit tests for UserStateManager
    - Test getTier() returns 'free' when no user
    - Test getTier() returns user tier when user exists
    - Test onUserLoaded() calls callback immediately if loaded
    - Test localStorage is updated correctly
    - _Requirements: 7.3, 7.4, 7.5_

- [ ] 7. Refactor tier-sync.js
  - [ ] 7.1 Remove direct localStorage access
    - Remove all `localStorage.getItem('aivory_tier')` calls
    - Remove top-level tier computation
    - _Requirements: 8.1, 8.2_
  
  - [ ] 7.2 Implement UserStateManager integration
    - Register callback with `UserStateManager.onUserLoaded()`
    - Call `UserStateManager.getTier()` to get tier
    - Update UI only after user data loads
    - _Requirements: 8.3, 8.4_
  
  - [ ] 7.3 Implement fallback behavior
    - Default to 'free' only when no user is authenticated
    - Check `UserStateManager.isLoaded()` before accessing tier
    - _Requirements: 8.5_
  
  - [ ] 7.4 Update tier display logic
    - Refactor `updateTierDisplays()` to accept user parameter
    - Update all tier badge elements
    - Update credits display if available
    - _Requirements: 8.3_
  
  - [ ]* 7.5 Write integration tests for tier synchronization
    - Test tier displays correctly after login
    - Test tier persists across page refreshes
    - Test tier defaults to 'free' when not authenticated
    - _Requirements: 8.3, 8.4, 8.5_

- [ ] 8. Checkpoint - Verify User State Management
  - Ensure UserStateManager loads user data correctly
  - Ensure tier-sync.js displays correct tier after login
  - Ensure tier persists across page refreshes
  - Ensure logout clears user data correctly
  - Ask the user if questions arise

- [ ] 9. Clean Up Deprecated localStorage Keys
  - [ ] 9.1 Identify all deprecated localStorage keys
    - Search codebase for localStorage usage
    - Document keys that should be removed
    - _Requirements: 9.5_
  
  - [ ] 9.2 Remove deprecated key usage
    - Remove `aivory_tier` usage (except in UserStateManager if needed)
    - Remove `aivory_session_token` usage (replaced by aivory_token)
    - Remove `aivory_username` usage (redundant with aivory_user.email)
    - Remove `aivory_role` usage (redundant with aivory_user.account_type)
    - _Requirements: 9.2, 9.3, 9.5_
  
  - [ ] 9.3 Add migration logic for existing users
    - Check for old keys on page load
    - Migrate data to new schema if found
    - Clear old keys after migration
    - _Requirements: 9.3_

- [ ] 10. Update Documentation
  - [ ] 10.1 Update README.md with new server configuration
    - Document backend runs on port 8000
    - Document frontend runs on port 9000
    - Provide exact commands for starting servers
    - Include troubleshooting section for port conflicts
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 12.5_
  
  - [ ] 10.2 Document user state management
    - Explain UserStateManager role
    - Document localStorage schema
    - Explain tier synchronization flow
    - Provide code examples
    - Document common pitfalls
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ] 10.3 Update DEV_SERVER_SETUP.md
    - Update port numbers (8000 for backend, 9000 for frontend)
    - Remove references to simple_server.py
    - Update troubleshooting section
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ] 10.4 Create ARCHITECTURE.md
    - Document server architecture
    - Document API communication flow
    - Document user state management flow
    - Include diagrams from design document
    - _Requirements: 11.1, 11.2, 11.3_

- [ ] 11. Final Integration Testing
  - [ ]* 11.1 Run end-to-end server startup test
    - Test backend starts on port 8000
    - Test frontend serves on port 9000
    - Test CORS allows cross-origin requests
    - _Requirements: 1.1, 2.1, 14.1_
  
  - [ ]* 11.2 Run user authentication flow test
    - Test login stores user data correctly
    - Test tier displays correctly after login
    - Test tier persists across page refreshes
    - Test logout clears user data
    - _Requirements: 7.1, 7.2, 8.3, 8.4_
  
  - [ ]* 11.3 Run API error handling test
    - Test non-JSON responses show descriptive errors
    - Test backend unavailable shows user-friendly message
    - Test port conflicts show clear error messages
    - _Requirements: 6.1, 6.2, 13.3, 12.1_

- [ ] 12. Final Checkpoint - Production Readiness
  - Ensure all servers start without conflicts
  - Ensure all API calls use standardized patterns
  - Ensure user state synchronizes correctly
  - Ensure error messages are clear and helpful
  - Ensure documentation is complete and accurate
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Testing tasks validate both unit-level and integration-level correctness
- Documentation tasks ensure maintainability and onboarding
