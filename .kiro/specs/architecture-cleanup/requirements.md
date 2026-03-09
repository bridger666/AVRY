# Requirements Document

## Introduction

This specification addresses critical architectural issues in Aivory's frontend-backend communication that prevent production deployment. The system currently suffers from port conflicts, inconsistent API routing, and unreliable user tier synchronization. These issues manifest as server conflicts, JSON parsing errors, and incorrect tier displays despite correct backend data.

## Glossary

- **Frontend_Server**: HTTP server serving static HTML/CSS/JS files to browsers
- **Backend_API**: FastAPI application handling business logic and data persistence
- **API_BASE_URL**: JavaScript constant defining the base URL for all API requests
- **User_Tier**: Subscription level (free, snapshot, blueprint, foundation, builder, operator, pro, enterprise, super_admin)
- **UserStateManager**: JavaScript module managing authenticated user state and tier information
- **LocalStorage**: Browser persistent storage for user session data
- **Port_Conflict**: Multiple processes attempting to bind to the same network port
- **CORS**: Cross-Origin Resource Sharing - browser security mechanism for HTTP requests

## Requirements

### Requirement 1: Single Backend Server Architecture

**User Story:** As a developer, I want a single, deterministic backend server configuration, so that I can start the application without port conflicts or confusion about which service handles requests.

#### Acceptance Criteria

1. THE Backend_API SHALL run exclusively on FastAPI with Uvicorn on port 8000
2. WHEN the Backend_API starts, THE system SHALL verify port 8000 is available before binding
3. IF port 8000 is occupied, THEN THE Backend_API SHALL report a clear error message with instructions to free the port
4. THE system SHALL NOT use multiple competing servers (simple_server.py, python -m http.server) for API endpoints
5. THE Backend_API SHALL serve all API routes under the `/api/` prefix

### Requirement 2: Single Frontend Server Architecture

**User Story:** As a developer, I want a single, clear method for serving frontend static files, so that I can avoid CORS errors and simplify the development workflow.

#### Acceptance Criteria

1. THE Frontend_Server SHALL serve static files from the `frontend/` directory on port 9000
2. WHEN using python -m http.server, THE Frontend_Server SHALL run from the frontend directory
3. WHERE FastAPI static file mounting is used, THE Backend_API SHALL mount the frontend directory at the root path
4. THE system SHALL document exactly one recommended approach for local development
5. THE system SHALL NOT have multiple active frontend servers on different ports simultaneously

### Requirement 3: Retire or Repurpose simple_server.py

**User Story:** As a developer, I want clear guidance on simple_server.py usage, so that I don't accidentally create port conflicts or routing confusion.

#### Acceptance Criteria

1. THE system SHALL either fully retire simple_server.py OR assign it a specific non-overlapping role
2. IF simple_server.py is retained, THEN THE system SHALL run it on a distinct port (not 8000, 8081, or 9000)
3. THE README SHALL explicitly state whether simple_server.py should be used
4. WHEN simple_server.py is deprecated, THE system SHALL remove or archive the file
5. THE system SHALL NOT have simple_server.py competing with Backend_API for the same endpoints

### Requirement 4: Standardized API Base URL Configuration

**User Story:** As a frontend developer, I want a single, reliable API_BASE_URL constant, so that all API calls reach the correct backend without hardcoded URLs scattered across files.

#### Acceptance Criteria

1. THE system SHALL define API_BASE_URL in exactly one location (app.js)
2. WHEN in development mode, THE API_BASE_URL SHALL point to `http://localhost:8000`
3. WHEN in production mode, THE API_BASE_URL SHALL use `window.location.origin`
4. THE system SHALL expose API_BASE_URL as `window.API_BASE_URL` for all scripts
5. ALL JavaScript files SHALL reference `window.API_BASE_URL` instead of declaring local API_BASE_URL constants

### Requirement 5: Audit and Refactor All API Calls

**User Story:** As a frontend developer, I want all fetch calls to use the standardized API_BASE_URL, so that API requests consistently reach the backend without relative path errors.

#### Acceptance Criteria

1. THE system SHALL identify all JavaScript files containing `fetch()` calls
2. WHEN a fetch call uses a relative path like `/api/...`, THE system SHALL refactor it to use `${window.API_BASE_URL}/api/...`
3. WHEN a fetch call hardcodes a URL like `http://localhost:8081`, THE system SHALL refactor it to use `window.API_BASE_URL`
4. THE system SHALL ensure all fetch calls include proper error handling for non-OK responses
5. WHEN a response is not valid JSON, THE system SHALL log a descriptive error message instead of throwing cryptic parsing errors

### Requirement 6: Comprehensive Error Handling for API Responses

**User Story:** As a developer, I want clear error messages when API calls fail, so that I can quickly diagnose issues instead of seeing cryptic "Unexpected token '<'" errors.

#### Acceptance Criteria

1. WHEN a fetch response status is not OK (200-299), THE system SHALL check the response content-type before parsing
2. IF the response content-type is text/html, THEN THE system SHALL log "Received HTML instead of JSON - check API endpoint and server configuration"
3. IF the response content-type is application/json, THEN THE system SHALL parse and log the error details
4. THE system SHALL wrap all fetch calls in try-catch blocks with descriptive error messages
5. WHEN an API call fails, THE system SHALL include the request URL, method, and status code in the error log

### Requirement 7: Single Source of Truth for User State

**User Story:** As a user, I want my subscription tier to display consistently across all pages, so that I see accurate information about my account status.

#### Acceptance Criteria

1. THE UserStateManager SHALL store user data in a single localStorage key `aivory_user` containing JSON with fields: `{ id, email, tier, account_type, ... }`
2. THE UserStateManager SHALL store the authentication token in `aivory_token`
3. THE UserStateManager SHALL expose a `getCurrentUser()` method returning the complete user object
4. THE UserStateManager SHALL expose a `getTier()` method returning the user's tier as a string
5. THE UserStateManager SHALL expose an `onUserLoaded(handler)` method that fires callbacks after user data is fetched from the backend

### Requirement 8: Refactor tier-sync.js to Use UserStateManager

**User Story:** As a user, I want my tier to display correctly after login, so that I don't see "Free" tier when I have a paid subscription.

#### Acceptance Criteria

1. THE tier-sync.js SHALL NOT read `localStorage.getItem('aivory_tier')` directly
2. THE tier-sync.js SHALL NOT compute tier at script top-level before user data is loaded
3. WHEN UserStateManager loads user data, THEN tier-sync.js SHALL call `UserStateManager.onUserLoaded()` to update the UI
4. THE tier-sync.js SHALL use `UserStateManager.getTier()` to retrieve the current tier
5. WHEN the user tier is unavailable, THE tier-sync.js SHALL default to 'free' only after confirming no user is authenticated

### Requirement 9: Normalize localStorage Schema

**User Story:** As a developer, I want a documented, consistent localStorage schema, so that all scripts read and write user data in a predictable way.

#### Acceptance Criteria

1. THE system SHALL document the localStorage schema with keys: `aivory_user`, `aivory_token`
2. THE system SHALL NOT use a separate `aivory_tier` key unless managed exclusively by UserStateManager
3. WHEN a script needs user data, THE system SHALL read from `aivory_user` and parse the JSON
4. THE system SHALL refactor all existing scripts to adhere to the documented schema
5. THE system SHALL remove any deprecated or redundant localStorage keys

### Requirement 10: Update README with Development Instructions

**User Story:** As a new developer, I want clear, step-by-step instructions for running the application locally, so that I can start development without trial and error.

#### Acceptance Criteria

1. THE README SHALL document the exact commands to start the backend server
2. THE README SHALL document the exact commands to start the frontend server
3. THE README SHALL specify which terminal windows are needed and what to run in each
4. THE README SHALL include the URLs to open in the browser after starting servers
5. THE README SHALL explain how to verify the setup is working correctly

### Requirement 11: Document User State and Tier Management

**User Story:** As a developer, I want documentation explaining how user state and tier synchronization work, so that I can maintain and extend the authentication system.

#### Acceptance Criteria

1. THE README SHALL explain the role of UserStateManager in managing user state
2. THE README SHALL document the localStorage schema for user data
3. THE README SHALL explain the tier synchronization flow from backend to frontend
4. THE README SHALL provide examples of how to access user tier in JavaScript
5. THE README SHALL document common pitfalls (e.g., reading tier before user data loads)

### Requirement 12: Prevent Port Conflicts with Clear Error Messages

**User Story:** As a developer, I want clear error messages when port conflicts occur, so that I can quickly identify and resolve the issue.

#### Acceptance Criteria

1. WHEN the Backend_API fails to start due to port conflict, THE system SHALL display the port number and suggest checking for running processes
2. WHEN the Frontend_Server fails to start due to port conflict, THE system SHALL display the port number and suggest checking for running processes
3. THE system SHALL provide commands to identify processes using the conflicting port (e.g., `lsof -i :8000`)
4. THE system SHALL suggest commands to terminate conflicting processes
5. THE README SHALL include a troubleshooting section for port conflicts

### Requirement 13: Validate API Connectivity on Application Start

**User Story:** As a user, I want the application to verify backend connectivity on startup, so that I receive immediate feedback if the backend is unavailable.

#### Acceptance Criteria

1. WHEN the frontend application loads, THE system SHALL call the `/health` endpoint on the Backend_API
2. IF the health check succeeds, THE system SHALL log "Backend connected" to the console
3. IF the health check fails, THE system SHALL display a user-friendly error message: "Unable to connect to backend. Please ensure the API server is running."
4. THE system SHALL retry the health check up to 3 times with 2-second delays
5. WHEN all retries fail, THE system SHALL provide instructions for starting the backend server

### Requirement 14: Consistent CORS Configuration

**User Story:** As a developer, I want consistent CORS configuration, so that frontend-backend communication works reliably in development and production.

#### Acceptance Criteria

1. THE Backend_API SHALL configure CORS to allow requests from `http://localhost:9000` in development
2. THE Backend_API SHALL configure CORS to allow requests from the production domain in production
3. THE Backend_API SHALL include credentials in CORS configuration (`allow_credentials=True`)
4. THE Backend_API SHALL allow all standard HTTP methods (GET, POST, PUT, DELETE, OPTIONS)
5. THE Backend_API SHALL allow all standard headers including Authorization and Content-Type
