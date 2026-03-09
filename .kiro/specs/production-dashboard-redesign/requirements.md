# Requirements Document

## Introduction

Transform the Aivory Dashboard from a test/experimental interface into a production-ready AI Operating System Designer control panel. The dashboard must clearly communicate Aivory's core value proposition through a clean, premium interface that guides users through the AI OS lifecycle: Diagnose → Design Blueprint → Deploy Workflows → Monitor Execution.

## Glossary

- **Dashboard**: The main control panel interface for the Aivory AI Operating System Designer (Next.js 14 App Router route)
- **Console**: The AI chat interface for interactive system design (Next.js route at /console)
- **Next_App**: The Next.js 14 application using App Router at localhost:3001
- **Diagnostic**: The AI readiness assessment that analyzes business needs and automation potential
- **Blueprint**: The comprehensive AI system architecture document with workflows, agents, and deployment plans
- **Workflow**: An automated business process composed of AI agents and integrations
- **Lifecycle Card**: A UI component representing one phase of the AI OS journey (Diagnostics, Blueprint, or Workflows)
- **AI_OS**: Aivory's AI Operating System Designer platform
- **Premium_Aesthetic**: The calm, minimal visual style matching GPT/Manus/Perplexity interfaces
- **Design_Tokens**: CSS custom properties defined in globals.css for consistent theming

## Requirements

### Requirement 1: Next.js Implementation Architecture

**User Story:** As a developer, I want the dashboard implemented in Next.js 14 with TypeScript using the same application as the console, so that we have a unified, type-safe codebase.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented as a Next.js 14 App Router route
2. THE Dashboard SHALL use TypeScript for all components and logic
3. THE Dashboard SHALL be part of the same Next.js application as the /console route
4. THE Dashboard SHALL reuse the console's globals.css design tokens
5. THE Dashboard SHALL NOT use Tailwind CSS
6. THE Dashboard SHALL NOT use external UI component libraries
7. THE Dashboard SHALL NOT use animation libraries
8. THE Dashboard SHALL use pure CSS (globals.css or CSS modules) for all styling

### Requirement 2: Navigation Structure Redesign

**User Story:** As a user, I want clear navigation that reflects the AI Operating System lifecycle, so that I understand where I am in the journey and can access all system features.

#### Acceptance Criteria

1. THE Sidebar SHALL display navigation items in this order: Console, Diagnostics, Blueprint, Workflows, Execution Logs, Integrations, Settings
2. WHEN a user clicks "Console", THE System SHALL navigate to /console using Next.js Link component
3. WHEN a user clicks "Dashboard", THE System SHALL navigate to the dashboard route using Next.js Link component
4. WHEN a user clicks any other navigation item, THE System SHALL navigate to the corresponding route within the Next.js application
5. THE Sidebar SHALL maintain consistent styling with the console (dark warm background #1e1d1a, Inter Tight font)
6. THE Sidebar SHALL highlight the currently active route with visual feedback using Next.js usePathname hook

### Requirement 3: Dashboard Home Overview

**User Story:** As a user, I want the dashboard home to immediately answer where I am in my journey, what my current blueprint is, and what's running, so that I can quickly understand my system status.

#### Acceptance Criteria

1. THE Dashboard_Home SHALL display an AI Operating System Overview Card at the top of the page
2. THE Overview_Card SHALL show Last Diagnostic status (Not started OR Score + date)
3. THE Overview_Card SHALL show Blueprint status (Active blueprint name + version OR "No blueprint yet")
4. THE Overview_Card SHALL show Workflows count (Number of active workflows)
5. THE Overview_Card SHALL provide primary CTAs: "Open Console", "Open Diagnostics", "View Blueprint", "View Workflows"
6. THE Dashboard_Home SHALL display three Lifecycle Cards in a responsive row below the Overview Card
7. THE Diagnostics_Card SHALL show description, status, and appropriate CTA ("Start Diagnostic" OR "Continue Diagnostic")
8. THE Blueprint_Card SHALL show description, status, and appropriate CTA ("Generate Blueprint" OR "View Blueprint")
9. THE Workflows_Card SHALL show description, status, and appropriate CTA ("View Workflows")
10. THE Dashboard_Home SHALL display a Recent Activity section showing recent events
11. WHEN viewport is desktop, THE Recent_Activity SHALL display in the right column
12. WHEN viewport is mobile or tablet, THE Recent_Activity SHALL display below the Lifecycle Cards

### Requirement 4: Visual Design System

**User Story:** As a user, I want the dashboard to have a premium, calm aesthetic that matches the console, so that the experience feels cohesive and professional.

#### Acceptance Criteria

1. THE Dashboard SHALL use dark warm background color #1e1d1a (matching console)
2. THE Dashboard SHALL use Inter Tight font throughout all text elements
3. THE Dashboard SHALL use rounded cards with soft borders for all card components
4. THE Dashboard SHALL use subtle shadows only (no heavy drop shadows)
5. THE Dashboard SHALL NOT use neon colors, glow effects, or flashy gradients
6. THE Dashboard SHALL NOT use Tailwind CSS classes
7. THE Dashboard SHALL NOT use external UI component libraries
8. THE Dashboard SHALL NOT use animation libraries
9. THE Dashboard SHALL implement all styles using custom CSS only
10. THE Dashboard SHALL match the console's color palette: --bg-main: #1e1d1a, --bg-elevated: #262521, --bg-soft: #2f2e2a, --border-soft: rgba(255,255,255,0.06), --text-primary: #e8e6e3, --text-secondary: #a8a6a2, --text-tertiary: #6e6d6a

### Requirement 4: Layout and Responsiveness

**User Story:** As a user, I want the dashboard to work seamlessly across all device sizes, so that I can access my AI system from any device.

#### Acceptance Criteria

1. THE Dashboard SHALL use a centered max-width container of 1120-1200px
2. WHEN viewport is desktop, THE Dashboard SHALL display Overview and Lifecycle cards on the left, Activity on the right
3. WHEN viewport is tablet or mobile, THE Dashboard SHALL display all cards in a single column stack
4. THE Dashboard SHALL provide plenty of breathing room between elements
5. THE Dashboard SHALL maintain clear visual hierarchy: Section title → Supporting text → Primary action
6. THE Dashboard SHALL avoid dense tables or cramped layouts
7. THE Dashboard SHALL use mobile-first responsive approach
8. THE Dashboard SHALL maintain consistent spacing across all breakpoints

### Requirement 5: Pure CSS Implementation

**User Story:** As a developer, I want the dashboard to use pure CSS without frameworks, so that it remains lightweight and matches the console's implementation approach.

#### Acceptance Criteria

1. THE Dashboard SHALL reuse console CSS tokens for colors, border radius, and typography
2. THE Dashboard SHALL NOT use Tailwind CSS
3. THE Dashboard SHALL NOT use UI frameworks (Bootstrap, Material-UI, etc.)
4. THE Dashboard SHALL implement all styling using custom CSS only
5. THE Dashboard SHALL define CSS custom properties for consistent theming
6. THE Dashboard SHALL use CSS Grid and Flexbox for layouts

### Requirement 6: Routing and Navigation

**User Story:** As a user, I want all navigation links to work correctly, so that I can access different parts of the system without errors.

#### Acceptance Criteria

1. WHEN a user clicks "Console", THE System SHALL navigate to http://localhost:3001/console
2. WHEN a user clicks "Diagnostics", THE System SHALL navigate to the diagnostics page
3. WHEN a user clicks "Blueprint", THE System SHALL navigate to the blueprint tab or page
4. WHEN a user clicks "Workflows", THE System SHALL navigate to workflows.html
5. WHEN a user clicks "Execution Logs", THE System SHALL navigate to logs.html
6. WHEN a user clicks "Integrations", THE System SHALL navigate to the integrations page
7. WHEN a user clicks "Settings", THE System SHALL navigate to settings.html

### Requirement 7: Data Integration Structure

**User Story:** As a developer, I want the dashboard components to be structured for easy data integration, so that we can connect real API data in the future.

#### Acceptance Criteria

1. THE Dashboard SHALL structure components to accept diagnostic status and scores as props
2. THE Dashboard SHALL structure components to accept active blueprint information as props
3. THE Dashboard SHALL structure components to accept workflow counts and status as props
4. THE Dashboard SHALL structure components to accept recent activity events as props
5. THE Dashboard SHALL use placeholder/dummy data for initial implementation
6. THE Dashboard SHALL document the expected data structure for each component
7. THE Dashboard SHALL use consistent data interfaces across all components

### Requirement 8: Typography and Spacing

**User Story:** As a user, I want consistent typography and spacing throughout the dashboard, so that the interface feels polished and professional.

#### Acceptance Criteria

1. THE Dashboard SHALL use Inter Tight font family for all text
2. THE Dashboard SHALL define a clear type scale for headings and body text
3. THE Dashboard SHALL use consistent line heights for readability
4. THE Dashboard SHALL use a spacing scale based on rem units
5. THE Dashboard SHALL maintain consistent padding within cards
6. THE Dashboard SHALL maintain consistent margins between sections
7. THE Dashboard SHALL use appropriate font weights: 300 (light), 400 (normal), 500 (medium), 600 (semibold)

### Requirement 9: Card Component Design

**User Story:** As a user, I want all cards to have a consistent, premium appearance, so that the dashboard feels cohesive.

#### Acceptance Criteria

1. THE Card_Component SHALL use background color #262521 (--bg-elevated)
2. THE Card_Component SHALL use border: 1px solid rgba(255,255,255,0.06)
3. THE Card_Component SHALL use border-radius of 12-20px
4. THE Card_Component SHALL use padding of 1.5-2rem
5. THE Card_Component SHALL have subtle hover states with smooth transitions
6. THE Card_Component SHALL NOT use heavy shadows or glow effects
7. THE Overview_Card SHALL be visually distinct as the primary status indicator

### Requirement 10: Call-to-Action Buttons

**User Story:** As a user, I want clear, accessible buttons that guide me to take action, so that I know what to do next.

#### Acceptance Criteria

1. THE CTA_Button SHALL use clear, action-oriented labels
2. THE CTA_Button SHALL have sufficient padding for touch targets (minimum 44x44px)
3. THE CTA_Button SHALL use rounded corners consistent with card design
4. THE CTA_Button SHALL have hover and active states with smooth transitions
5. THE CTA_Button SHALL use appropriate colors: primary actions use accent color, secondary actions use subtle backgrounds
6. THE CTA_Button SHALL be keyboard accessible
7. THE CTA_Button SHALL provide visual feedback on interaction

### Requirement 11: Production-Ready Polish

**User Story:** As a stakeholder, I want the dashboard to look production-ready with no test or experimental elements, so that it represents our brand professionally.

#### Acceptance Criteria

1. THE Dashboard SHALL NOT display any "test" or "experimental" labels
2. THE Dashboard SHALL NOT include debug information in the UI
3. THE Dashboard SHALL NOT use placeholder text like "Lorem ipsum"
4. THE Dashboard SHALL use real, meaningful copy for all text content
5. THE Dashboard SHALL handle loading states gracefully
6. THE Dashboard SHALL handle error states gracefully
7. THE Dashboard SHALL provide appropriate empty states when no data exists

### Requirement 12: Lifecycle Journey Clarity

**User Story:** As a user, I want to clearly understand the Diagnostic → Blueprint → Workflow journey, so that I know what steps to take to build my AI system.

#### Acceptance Criteria

1. THE Dashboard SHALL visually represent the three-phase journey: Diagnostics, Blueprint, Workflows
2. THE Dashboard SHALL show progress indicators for each phase
3. THE Dashboard SHALL disable or gray out phases that are not yet accessible
4. THE Dashboard SHALL provide clear next steps based on current progress
5. THE Dashboard SHALL use visual cues (icons, colors, status badges) to indicate phase completion
6. THE Dashboard SHALL explain what each phase accomplishes in clear, concise language

### Requirement 13: File Modifications

**User Story:** As a developer, I want to know exactly which files need to be created or modified, so that I can implement the redesign efficiently.

#### Acceptance Criteria

1. THE Implementation SHALL create a new Next.js App Router route for the dashboard (e.g., nextjs-console/app/dashboard/page.tsx)
2. THE Implementation SHALL create TypeScript component files for dashboard UI elements
3. THE Implementation SHALL extend or create CSS modules for dashboard-specific styles
4. THE Implementation SHALL reuse nextjs-console/styles/globals.css design tokens
5. THE Implementation SHALL create or update a shared navigation component for sidebar
6. THE Implementation SHALL preserve existing authentication patterns from the console
7. THE Implementation SHALL maintain API integration patterns compatible with the existing backend

### Requirement 14: Console Link Integration

**User Story:** As a user, I want seamless navigation between the dashboard and console, so that I can easily switch between overview and interactive design modes.

#### Acceptance Criteria

1. WHEN a user clicks "Open Console" from the Overview Card, THE System SHALL navigate to /console using Next.js Link component
2. WHEN a user clicks "Console" in the sidebar, THE System SHALL navigate to /console using Next.js Link component
3. THE Console_Link SHALL use Next.js client-side navigation for instant transitions
4. THE Console_Link SHALL maintain consistent styling with other navigation items
5. THE System SHALL preserve user session state across route transitions

### Requirement 15: Recent Activity Display

**User Story:** As a user, I want to see recent activity in my AI system, so that I can track what's been happening.

#### Acceptance Criteria

1. THE Recent_Activity SHALL display a list of recent events
2. THE Recent_Activity SHALL show event type, timestamp, and brief description
3. THE Recent_Activity SHALL use placeholder/dummy data initially
4. THE Recent_Activity SHALL be structured to accept real event data from API
5. THE Recent_Activity SHALL display most recent events first (reverse chronological)
6. THE Recent_Activity SHALL limit display to 5-10 most recent events
7. THE Recent_Activity SHALL provide a "View All" link to see complete activity log
