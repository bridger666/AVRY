# Requirements Document

## Introduction

This specification addresses critical authentication and dashboard flow issues preventing proper user authentication and state management. The system currently experiences 401 errors on authentication endpoints, race conditions between authentication components, and improper token handling that prevents the dashboard from loading user state correctly.

## Glossary

- **Auth_Manager**: Frontend module responsible for storing and retrieving authentication tokens
- **User_State_Manager**: Frontend module responsible for fetching and managing user state from the backend
- **Auth_Guard**: Frontend module that protects routes and ensures authentication before access
- **Dashboard**: Main application interface that displays user information and features
- **Session_Token**: JWT token stored in localStorage used for authenticating API requests
- **Backend_Service**: FastAPI server running on port 8081 that handles authentication and API requests
- **Frontend_Application**: Static web application running on port 9000

## Requirements

### Requirement 1: Token Storage and Retrieval

**User Story:** As a user, I want my authentication token to be properly stored after login, so that subsequent API requests are authenticated.

#### Acceptance Criteria

1. WHEN a user successfully logs in via superadmin-login.html, THE Auth_Manager SHALL store the session token in localStorage with key "aivory_session_token"
2. WHEN the Auth_Manager retrieves a token, THE Auth_Manager SHALL return the token value or null if not present
3. WHEN an API request is made, THE Auth_Manager SHALL include the token in the Authorization header as "Bearer {token}"
4. THE Auth_Manager SHALL provide a method to clear tokens on logout
5. WHEN a token is stored, THE Auth_Manager SHALL validate it is a non-empty string before storage

### Requirement 2: User State Fetching

**User Story:** As a user, I want the dashboard to load my user information from the backend, so that I can see my tier, credits, and account details.

#### Acceptance Criteria

1. WHEN the User_State_Manager fetches user state, THE User_State_Manager SHALL call GET /api/v1/auth/me with the authentication token
2. WHEN the API returns 200 OK, THE User_State_Manager SHALL parse and store the user data including email, tier, credits, and isSuperAdmin flag
3. IF the API returns 401 Unauthorized, THEN THE User_State_Manager SHALL clear stored tokens and redirect to login
4. IF the API returns a network error, THEN THE User_State_Manager SHALL log the error with detailed information for debugging
5. WHEN user state is successfully loaded, THE User_State_Manager SHALL emit an event that other components can listen to

### Requirement 3: Dashboard Initialization Order

**User Story:** As a developer, I want the dashboard to initialize components in the correct order, so that authentication is verified before rendering user-specific content.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE Dashboard SHALL first check for authentication tokens before rendering
2. WHEN authentication is verified, THE Dashboard SHALL fetch user state before initializing UI components
3. WHEN user state is loaded, THE Dashboard SHALL render the appropriate UI based on user tier and permissions
4. IF authentication fails, THEN THE Dashboard SHALL redirect to the login page without rendering protected content
5. WHILE waiting for authentication, THE Dashboard SHALL display a loading indicator

### Requirement 4: Demo Banner Visibility Control

**User Story:** As a logged-in superadmin, I want the demo banner to be hidden, so that I see the full application interface.

#### Acceptance Criteria

1. WHEN a user is authenticated as superadmin, THE Dashboard SHALL hide the demo banner element
2. WHEN a user is not authenticated, THE Dashboard SHALL show the demo banner
3. WHEN user state indicates isSuperAdmin is true, THE Dashboard SHALL set tier display to "Enterprise"
4. WHEN user state is loaded, THE Dashboard SHALL display credits as "{used} / {total}" format
5. THE Dashboard SHALL update the demo banner visibility immediately after user state is loaded

### Requirement 5: Error Handling and Logging

**User Story:** As a developer, I want detailed error logging throughout the authentication flow, so that I can quickly diagnose issues.

#### Acceptance Criteria

1. WHEN an API request fails, THE system SHALL log the HTTP status code, error message, and request URL
2. WHEN a token is missing, THE system SHALL log a warning message indicating authentication is required
3. WHEN user state fetch fails, THE system SHALL log the full error response for debugging
4. WHEN authentication succeeds, THE system SHALL log a success message with user email
5. THE system SHALL use console.error for errors, console.warn for warnings, and console.log for informational messages

### Requirement 6: Authentication Test Page

**User Story:** As a developer, I want a simple test page to verify the authentication flow, so that I can debug issues without using the full dashboard.

#### Acceptance Criteria

1. THE test page SHALL display the current authentication token status
2. WHEN the "Test Login" button is clicked, THE test page SHALL attempt to fetch user state from /api/v1/auth/me
3. WHEN the API call succeeds, THE test page SHALL display the returned user data in a readable format
4. WHEN the API call fails, THE test page SHALL display the error message and status code
5. THE test page SHALL include a "Clear Token" button that removes the stored authentication token

### Requirement 7: Backend Service Availability

**User Story:** As a user, I want the backend service to be running with the latest code, so that all API endpoints are available.

#### Acceptance Criteria

1. THE Backend_Service SHALL expose the /api/v1/workflows endpoint
2. WHEN the /api/v1/workflows endpoint is called, THE Backend_Service SHALL return a 200 status code (not 404)
3. THE Backend_Service SHALL expose the /api/v1/auth/me endpoint
4. WHEN the /api/v1/auth/me endpoint is called with a valid token, THE Backend_Service SHALL return user data with 200 status
5. THE Backend_Service SHALL run on port 8081 and accept requests from localhost:9000

### Requirement 8: API Request Configuration

**User Story:** As a developer, I want all API requests to use the correct base URL, so that requests reach the backend service.

#### Acceptance Criteria

1. THE Frontend_Application SHALL use "http://localhost:8081" as the API_BASE_URL
2. WHEN making API requests, THE system SHALL prepend API_BASE_URL to all endpoint paths
3. THE system SHALL include CORS headers in requests to allow cross-origin communication
4. WHEN the backend is not reachable, THE system SHALL display a clear error message indicating connection failure
5. THE system SHALL validate that API_BASE_URL does not have a trailing slash before concatenating paths
