# Authentication System - Requirements

## Overview

Implement a complete JWT-based authentication system for Aivory that protects paid features while keeping the free diagnostic open. The system must support normal users and a super admin account with special privileges.

---

## User Stories

### US-1: Anonymous User Access
**As an** anonymous visitor  
**I want to** access the homepage and complete the free diagnostic without signing up  
**So that** I can evaluate the platform before committing

**Acceptance Criteria:**
- Homepage is fully accessible without authentication
- Free diagnostic (12 questions) is fully accessible without authentication
- Diagnostic results page displays without requiring login
- User can view their score, insights, and recommendations without authentication

---

### US-2: Soft Authentication Prompt
**As an** anonymous user who completed the free diagnostic  
**I want to** see a non-blocking prompt to save my results  
**So that** I can decide whether to create an account

**Acceptance Criteria:**
- After diagnostic results load, show soft prompt: "Save your results & unlock AI Snapshot"
- Prompt includes Sign Up and Log In CTAs
- Prompt is NOT a hard block - user can still see and interact with results
- Prompt is visually distinct but not intrusive

---

### US-3: User Registration
**As a** new user  
**I want to** create an account with email and password  
**So that** I can save my progress and access paid features

**Acceptance Criteria:**
- Sign up modal appears when clicking "Sign Up" CTA
- Required fields: email, password, company name
- Password must be hashed before storage (bcrypt)
- Email must be unique (validation error if duplicate)
- Upon successful registration, user receives JWT tokens
- User is automatically logged in after registration
- All localStorage IDs are migrated to user account in database

---

### US-4: User Login
**As a** registered user  
**I want to** log in with my email and password  
**So that** I can access my saved data and paid features

**Acceptance Criteria:**
- Login modal appears when clicking "Log In" CTA
- Required fields: email, password
- Invalid credentials show clear error message
- Upon successful login, user receives JWT tokens
- Tokens are stored in localStorage
- User is redirected to appropriate page based on context
- All localStorage IDs are migrated to user account in database

---

### US-5: Hard Authentication Gates
**As a** platform owner  
**I want to** require authentication before paid purchases  
**So that** I can track purchases and provide access to paid features

**Acceptance Criteria:**
- Before Snapshot purchase ($15): hard gate requiring login
- Before Blueprint purchase ($79): hard gate requiring login
- If user attempts to access without login, show login modal
- After login, user proceeds to purchase flow
- Dashboard is fully protected - redirect to login if no valid token

---

### US-6: ID Chain Migration
**As a** user who completes diagnostics before signing up  
**I want to** have my localStorage IDs automatically linked to my account  
**So that** I don't lose my progress when I create an account

**Acceptance Criteria:**
- After login or signup, immediately migrate all localStorage IDs to user account
- IDs to migrate: `aivory_diagnostic_id`, `aivory_snapshot_id`, `aivory_blueprint_id`
- Link all existing diagnostic/snapshot/blueprint records to `user_id` in database
- After migration, localStorage IDs remain as fallback
- Database becomes source of truth for authenticated users
- Migration is idempotent (safe to run multiple times)

---

### US-7: Session Management
**As a** logged-in user  
**I want to** stay logged in across page refreshes  
**So that** I don't have to re-authenticate constantly

**Acceptance Criteria:**
- Access token stored in localStorage
- Refresh token stored in localStorage
- Sessions persisted server-side in database
- Access token expires after 1 hour
- Refresh token expires after 7 days
- Automatic token refresh when access token expires
- Logout invalidates both tokens and clears localStorage

---

### US-8: User Profile Display
**As a** logged-in user  
**I want to** see my email and logout button in the navbar  
**So that** I know I'm logged in and can log out when needed

**Acceptance Criteria:**
- Navbar shows user email when logged in
- Navbar shows "Sign In" button when logged out
- Logout button is clearly visible
- Clicking logout clears tokens and redirects to homepage
- User state updates immediately across all components

---

### US-9: Super Admin Account
**As a** super admin (grandmaster@aivory.ai)  
**I want to** bypass all payment and authentication gates  
**So that** I can test and access all features without restrictions

**Acceptance Criteria:**
- Super admin account: email `grandmaster@aivory.ai`
- Password stored in `.env` as `SUPERADMIN_PASSWORD`
- Account type: `superadmin` in database
- Bypass ALL payment gates (Snapshot, Blueprint, Step 3 subscription)
- Bypass ALL auth hard gates - can access dashboard without purchases
- Can access any user's records (any diagnostic_id, snapshot_id, blueprint_id)
- Dashboard shows red badge: "SUPER ADMIN MODE" when logged in as super admin
- URL param `?superadmin=grandmaster` still works for quick frontend testing

---

### US-10: Protected API Endpoints
**As a** platform owner  
**I want to** protect paid API endpoints with authentication  
**So that** only authorized users can access paid features

**Acceptance Criteria:**
- All paid endpoints require valid JWT token in Authorization header
- Snapshot endpoint requires authentication
- Blueprint endpoint requires authentication
- Dashboard data endpoints require authentication
- Invalid or expired tokens return 401 Unauthorized
- Super admin can access all endpoints regardless of payment status

---

## Technical Requirements

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    account_type VARCHAR(20) NOT NULL DEFAULT 'free',
    company_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- account_type values: 'free', 'paid', 'superadmin'
```

#### Sessions Table
```sql
CREATE TABLE sessions (
    session_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    refresh_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

#### Update Existing Tables
```sql
-- Add user_id to diagnostics table
ALTER TABLE diagnostics ADD COLUMN user_id VARCHAR(50);
ALTER TABLE diagnostics ADD FOREIGN KEY (user_id) REFERENCES users(user_id);

-- Add user_id to snapshots table
ALTER TABLE snapshots ADD COLUMN user_id VARCHAR(50);
ALTER TABLE snapshots ADD FOREIGN KEY (user_id) REFERENCES users(user_id);

-- Add user_id to blueprints table (if not already present)
ALTER TABLE blueprints ADD COLUMN user_id VARCHAR(50);
ALTER TABLE blueprints ADD FOREIGN KEY (user_id) REFERENCES users(user_id);
```

### JWT Token Structure

#### Access Token (1 hour expiry)
```json
{
  "user_id": "user_abc123",
  "email": "user@example.com",
  "account_type": "free",
  "exp": 1234567890,
  "iat": 1234567890
}
```

#### Refresh Token (7 days expiry)
```json
{
  "user_id": "user_abc123",
  "session_id": "session_xyz789",
  "exp": 1234567890,
  "iat": 1234567890
}
```

### API Endpoints

#### Authentication Endpoints
- `POST /api/v1/auth/register` - Create new account
- `POST /api/v1/auth/login` - Login with credentials
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Invalidate session
- `GET /api/v1/auth/me` - Get current user info

#### Protected Endpoints (require authentication)
- `POST /api/v1/diagnostic/snapshot` - Requires valid token
- `POST /api/v1/blueprint/generate` - Requires valid token
- `GET /api/v1/dashboard/*` - Requires valid token

### Frontend Components

#### AuthManager.js
- Handles token storage and retrieval
- Manages token refresh logic
- Provides authentication state
- Integrates with IDChainManager for ID migration
- Exposes methods: `login()`, `logout()`, `register()`, `isAuthenticated()`, `getUser()`

#### Login Modal
- Email and password fields
- "Forgot password?" link (future)
- "Don't have an account? Sign up" link
- Error message display
- Loading state during authentication

#### Sign Up Modal
- Email, password, and company name fields
- Password strength indicator
- Terms of service checkbox
- "Already have an account? Log in" link
- Error message display
- Loading state during registration

#### Auth Guard Component
- Checks authentication before rendering protected content
- Redirects to login if not authenticated
- Shows loading state while checking auth
- Passes user data to child components

---

## Non-Functional Requirements

### Security
- Passwords must be hashed with bcrypt (cost factor 12)
- JWT secret must be stored in environment variable
- Tokens must be validated on every protected endpoint
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitize user inputs)
- CORS properly configured

### Performance
- Token validation should take < 10ms
- Login/registration should complete in < 500ms
- Token refresh should be transparent to user
- Database queries should use indexes on user_id and email

### Usability
- Login modal should appear within 200ms of clicking CTA
- Error messages should be clear and actionable
- Soft prompt should not block user interaction
- Super admin badge should be immediately visible

---

## Success Criteria

1. Anonymous users can complete free diagnostic without authentication
2. Soft prompt appears after diagnostic results without blocking
3. Users can register and login successfully
4. All localStorage IDs are migrated to user account on login/signup
5. Paid features require authentication (hard gate)
6. Dashboard is fully protected
7. Super admin can bypass all gates and access all features
8. Tokens refresh automatically before expiration
9. User email and logout button appear in navbar when logged in
10. All tests pass for both normal user and super admin flows

---

## Out of Scope

- Password reset functionality (future enhancement)
- Email verification (future enhancement)
- Social login (Google, GitHub, etc.)
- Two-factor authentication
- Account deletion
- Profile editing (beyond initial registration)

---

## Dependencies

- Existing ID chain management system (IDChainManager.js)
- Existing database service (app/database/db_service.py)
- JWT library (PyJWT for backend, jose for frontend if needed)
- Password hashing library (bcrypt)
- Existing diagnostic/snapshot/blueprint services

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Token theft via XSS | High | Sanitize all user inputs, use httpOnly cookies for refresh tokens (future) |
| Database migration breaks existing data | High | Test migration thoroughly, create backup before migration |
| Super admin credentials leaked | Critical | Store password in .env, never commit to git, rotate regularly |
| Token refresh fails silently | Medium | Add error logging, show user-friendly message, allow manual re-login |
| ID migration duplicates records | Medium | Make migration idempotent, check for existing links before creating |

---

**Status:** Ready for Design  
**Priority:** High  
**Estimated Effort:** 3-4 days  
**Dependencies:** ID Chain Management System (Complete)
