# Requirements Document: Aivory Unified Shell

## Introduction

The Aivory application currently suffers from UX inconsistency between the AI Console and Dashboard pages. Each page has its own sidebar structure, visual styling, and navigation patterns, creating a fragmented user experience. This specification defines requirements for unifying the application shell with a single consistent layout, sidebar, and premium styling across all pages.

## Glossary

- **App_Shell**: The unified layout framework that wraps all pages, including sidebar, top bar, and main content area
- **Console**: The AI chat interface page where users interact with ARIA
- **Dashboard**: The overview page showing metrics, status, and insights
- **Sidebar**: The persistent left navigation panel visible across all pages
- **Operational_Views**: Read-only analytical pages (Overview, Diagnostics, Snapshots, Blueprints, Logs)
- **Configuration_Views**: Settings and credential management pages (Settings, API Credentials, Integrations)
- **Premium_Styling**: The dark theme design system from console_premium.css (#272728 background, #1b1b1c cards)
- **Main_Content_Area**: The central region that changes when navigating between pages while sidebar remains fixed

## Requirements

### Requirement 1: Unified Sidebar Structure

**User Story:** As a user, I want a consistent navigation sidebar across all pages, so that I can easily navigate the application without confusion.

#### Acceptance Criteria

1. THE App_Shell SHALL display a single sidebar structure on all pages
2. WHEN a user navigates between Console, Dashboard, Workflows, Logs, Diagnostics, and Settings, THE Sidebar SHALL remain visually consistent
3. THE Sidebar SHALL include navigation items for: Console, Overview, Workflows, Logs, Diagnostics
4. THE Sidebar SHALL include a "SETTINGS" section separator
5. THE Sidebar SHALL include Settings and Home navigation items under the SETTINGS section
6. WHEN a user clicks a navigation item, THE active state SHALL be indicated with visual highlighting
7. THE Sidebar SHALL use identical HTML structure, CSS classes, and icon SVGs across all pages

### Requirement 2: Premium Styling as Base

**User Story:** As a user, I want a consistent premium visual design across the entire application, so that the experience feels cohesive and professional.

#### Acceptance Criteria

1. THE App_Shell SHALL apply the premium dark theme (#272728 background, #1b1b1c sidebar) to all pages
2. THE App_Shell SHALL extract styling from console_premium.css into a shared app-shell.css file
3. WHEN a page loads, THE App_Shell SHALL apply consistent typography (Inter Tight font, 15px base size, 1.7 line-height)
4. THE App_Shell SHALL use consistent color tokens: #272728 (main background), #1b1b1c (sidebar/cards), #333338 (borders), #e0e0e0 (text), #a0a0a8 (secondary text)
5. THE App_Shell SHALL apply consistent spacing and border-radius values (8px buttons, 12px cards, 16px input fields)
6. WHEN a user hovers over interactive elements, THE App_Shell SHALL apply consistent hover states (rgba(255, 255, 255, 0.05) background)

### Requirement 3: Separation of Operational and Configuration Views

**User Story:** As a user, I want clear separation between operational views and configuration views, so that I can quickly find what I need.

#### Acceptance Criteria

1. THE Sidebar SHALL group Operational_Views (Console, Overview, Workflows, Logs, Diagnostics) in the main navigation section
2. THE Sidebar SHALL display a "SETTINGS" section separator before Configuration_Views
3. THE Sidebar SHALL group Configuration_Views (Settings, Home) under the SETTINGS section
4. WHEN a user views the sidebar, THE visual separation SHALL be clear through spacing and the section title
5. THE Sidebar SHALL NOT mix operational and configuration items in the same section

### Requirement 4: API Credentials and Settings Management

**User Story:** As a user, I want dedicated panels for API credentials and settings, so that I can manage my configuration securely and easily.

#### Acceptance Criteria

1. WHEN a user navigates to Settings, THE App_Shell SHALL display a Settings panel
2. THE Settings_Panel SHALL include workspace name, description, tier information, usage limits, and AI behavior options
3. THE Settings_Panel SHALL include an API Credentials section
4. WHEN displaying API credentials, THE App_Shell SHALL mask the key by default
5. THE API_Credentials_Section SHALL provide a copy button and regenerate button
6. WHEN a user clicks the copy button, THE App_Shell SHALL copy the API key to clipboard
7. THE API_Credentials_Section SHALL explain the scope and usage of the API key
8. THE Settings_Panel SHALL include an Integrations section showing connected services
9. WHEN displaying integrations, THE App_Shell SHALL show connection status indicators
10. THE Integrations_Section SHALL provide connect/disconnect actions for each service

### Requirement 5: Single Page Application Architecture

**User Story:** As a developer, I want a single page application architecture, so that navigation is seamless without full page reloads.

#### Acceptance Criteria

1. THE App_Shell SHALL use one main HTML file as the canonical shell
2. WHEN a user navigates between pages, THE Sidebar SHALL remain fixed and visible
3. WHEN a user navigates between pages, THE Main_Content_Area SHALL update without full page reload
4. THE App_Shell SHALL implement client-side routing for view transitions
5. WHEN a user clicks a navigation link, THE App_Shell SHALL update the URL without triggering a full page reload
6. THE App_Shell SHALL load page-specific content dynamically into the Main_Content_Area
7. WHEN navigation occurs, THE App_Shell SHALL update the active state in the Sidebar

### Requirement 6: File Structure and Cleanup

**User Story:** As a developer, I want a clean file structure with clear ownership, so that I can maintain the codebase effectively.

#### Acceptance Criteria

1. THE App_Shell SHALL use app-shell.css as the canonical base stylesheet
2. THE App_Shell SHALL use app-shell.html or unified dashboard.html as the canonical shell HTML
3. THE App_Shell SHALL organize page-specific content in a views/ directory
4. WHEN the unified shell is implemented, THE legacy files (dashboard-v2, old console versions) SHALL be marked as deprecated
5. THE codebase SHALL include documentation identifying which files are active and which are deprecated
6. THE App_Shell SHALL remove duplicate layout implementations

### Requirement 7: Console Integration

**User Story:** As a user, I want the Console to use the unified shell, so that it feels like part of the same application as Dashboard.

#### Acceptance Criteria

1. WHEN a user navigates to Console, THE App_Shell SHALL display the Console view within the unified shell
2. THE Console_View SHALL use the unified ARIA agent from console-aria-unification spec
3. THE Console_View SHALL maintain the same sidebar and top bar as other pages
4. WHEN a user switches from Console to Dashboard, THE transition SHALL be seamless with no visual "jump"
5. THE Console_View SHALL apply the same premium styling as other pages

### Requirement 8: Responsive Behavior

**User Story:** As a mobile user, I want the unified shell to work on small screens, so that I can access the application on any device.

#### Acceptance Criteria

1. WHEN the viewport width is less than 768px, THE Sidebar SHALL collapse off-screen
2. WHEN the sidebar is collapsed, THE App_Shell SHALL provide a toggle button to show/hide the sidebar
3. WHEN a user clicks the sidebar toggle on mobile, THE Sidebar SHALL slide in from the left
4. WHEN the sidebar is open on mobile, THE App_Shell SHALL display an overlay to close the sidebar
5. THE Main_Content_Area SHALL adjust its left margin based on sidebar visibility
6. THE App_Shell SHALL maintain touch-friendly tap targets (minimum 44px) on mobile

### Requirement 9: Top Bar Consistency

**User Story:** As a user, I want a consistent top bar across all pages, so that I always know where to find my tier and credits information.

#### Acceptance Criteria

1. THE App_Shell SHALL display a top bar on all pages
2. THE Top_Bar SHALL include the Aivory logo on the left
3. THE Top_Bar SHALL display the current tier badge
4. THE Top_Bar SHALL display the current credits count
5. THE Top_Bar SHALL include language toggle buttons (EN/ID)
6. WHEN a user clicks the logo, THE App_Shell SHALL navigate to the home page
7. THE Top_Bar SHALL use consistent styling (#1b1b1c background, 60px height, #333338 border)

### Requirement 10: Loading and Error States

**User Story:** As a user, I want consistent loading and error states, so that I understand what's happening when content is loading or fails.

#### Acceptance Criteria

1. WHEN content is loading, THE App_Shell SHALL display a loading spinner in the Main_Content_Area
2. THE Loading_State SHALL include descriptive text explaining what is loading
3. WHEN an error occurs, THE App_Shell SHALL display an error card in the Main_Content_Area
4. THE Error_Card SHALL include an error icon, error message, and retry button
5. THE Loading_State and Error_Card SHALL use consistent styling across all pages
6. WHEN a user clicks the retry button, THE App_Shell SHALL attempt to reload the content
