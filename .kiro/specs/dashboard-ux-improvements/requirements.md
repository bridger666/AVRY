# Dashboard UX Improvements - Requirements

## Overview
Improve the information architecture, component states, and UX clarity of the Aivory Dashboard's Execution Logs and Workflows pages while maintaining the existing dark theme and aesthetic.

## User Stories

### US-1: As a user, I want to see key execution metrics at a glance
**Description**: View all critical execution statistics (Total, Success Rate, Failed, Avg Duration) in a single row without scrolling.

**Acceptance Criteria**:
- AC-1.1: Four stat cards displayed in a single horizontal row above the fold
- AC-1.2: Cards show: Total Executions, Success Rate, Failed Executions, Avg Duration
- AC-1.3: All cards visible without scrolling on desktop (1920x1080)
- AC-1.4: Cards are responsive and stack on mobile

### US-2: As a user, I want to filter execution logs by time range
**Description**: Apply time-based filters to all stats and execution data.

**Acceptance Criteria**:
- AC-2.1: Time range selector with options: Today, 7 days, 30 days, Custom
- AC-2.2: Selector applies to both stat cards and executions table
- AC-2.3: Custom option opens date picker for start/end dates
- AC-2.4: Selected range persists during session
- AC-2.5: Stats update immediately when range changes

### US-3: As a user, I want to see varied workflow names in execution logs
**Description**: Display different workflow names across execution rows for realistic mock data.

**Acceptance Criteria**:
- AC-3.1: At least 5 different workflow names in mock data
- AC-3.2: Names reflect realistic use cases (Invoice Processing, Customer Onboarding, Data Sync, Report Generation, Email Automation)
- AC-3.3: Distribution of workflows appears natural (not all same workflow)

### US-4: As a user, I want to see exact timestamps instead of relative time
**Description**: Show precise datetime for executions with relative time in tooltip.

**Acceptance Criteria**:
- AC-4.1: Default display shows format: "Feb 26, 2026 14:30:45"
- AC-4.2: Hovering shows tooltip with relative time: "2 hours ago"
- AC-4.3: Timestamp format is consistent across all execution rows
- AC-4.4: Timezone is displayed or implied (user's local time)

### US-5: As a user, I want to see why executions failed without opening details
**Description**: Display inline error reasons for failed executions.

**Acceptance Criteria**:
- AC-5.1: Failed status shows error reason as subtitle below status dot
- AC-5.2: Format: "Failed · [Error reason]" (e.g., "Failed · Connection timeout")
- AC-5.3: Error text is truncated if too long (max 60 characters)
- AC-5.4: Full error available in tooltip on hover
- AC-5.5: Error text color is muted red (#ff8888)

### US-6: As a user, I want to see more than 3 execution rows
**Description**: View more execution history with pagination or load more functionality.

**Acceptance Criteria**:
- AC-6.1: Initial load shows 10 execution rows
- AC-6.2: "Load More" button at bottom loads next 10 rows
- AC-6.3: Button shows count: "Load More (117 remaining)"
- AC-6.4: Button disabled when all rows loaded
- AC-6.5: Alternative: Pagination with page numbers (1, 2, 3... Last)

### US-7: As a user, I want to filter executions by status
**Description**: Filter execution table by success/failure status.

**Acceptance Criteria**:
- AC-7.1: Filter tabs above table: All, Success, Failed
- AC-7.2: Active tab highlighted with accent color
- AC-7.3: Table updates immediately on tab click
- AC-7.4: Count shown in each tab: "Success (120)", "Failed (7)"
- AC-7.5: Filter persists during session

### US-8: As a user, I want to quickly ask AI about common log issues
**Description**: Click common queries to open AI Console with pre-filled question.

**Acceptance Criteria**:
- AC-8.1: Each query item is clickable
- AC-8.2: Clicking opens console.html with query pre-filled in input
- AC-8.3: Query text appears in message input, ready to send
- AC-8.4: User can edit query before sending
- AC-8.5: Console opens in same tab (not new window)

### US-9: As a user, I want to see workflow summary statistics
**Description**: View aggregate workflow metrics at the top of workflows page.

**Acceptance Criteria**:
- AC-9.1: Four stat cards in single row: Total Workflows, Active, Paused, Failed
- AC-9.2: Cards show current counts from mock data
- AC-9.3: Cards use consistent styling with execution logs stats
- AC-9.4: Failed count highlighted in red if > 0

### US-10: As a user, I want clear action button labels
**Description**: Understand what each workflow action button does without guessing.

**Acceptance Criteria**:
- AC-10.1: All action buttons have hover tooltips
- AC-10.2: Tooltips show: "Run", "Trigger", "Edit", "Delete"
- AC-10.3: Tooltips appear within 300ms of hover
- AC-10.4: Tooltip positioning doesn't obscure button

### US-11: As a user, I want to easily identify failed workflows
**Description**: Failed workflows stand out visually for quick identification.

**Acceptance Criteria**:
- AC-11.1: Failed workflow rows have red-tinted background (rgba(255, 68, 68, 0.05))
- AC-11.2: Failed status dot is larger (12px) and pulsing
- AC-11.3: Error message shown inline below workflow name
- AC-11.4: "Retry" button appears in actions for failed workflows
- AC-11.5: Retry button has distinct styling (orange accent)

### US-12: As a user, I want to quickly resume paused workflows
**Description**: Resume paused workflows directly from the list.

**Acceptance Criteria**:
- AC-12.1: Paused workflows show "Resume" button inline
- AC-12.2: Resume button positioned before other action buttons
- AC-12.3: Button styled with green accent
- AC-12.4: Clicking shows confirmation: "Resume [Workflow Name]?"
- AC-12.5: After resume, status updates to Active

### US-13: As a user, I want to filter workflows by status
**Description**: View only workflows in specific states.

**Acceptance Criteria**:
- AC-13.1: Filter tabs above workflow list: All, Active, Paused, Failed
- AC-13.2: Active tab highlighted
- AC-13.3: Count shown in each tab
- AC-13.4: List updates immediately on tab click
- AC-13.5: Search works within filtered results

### US-14: As a user, I want better status indicators
**Description**: Status should be more readable and accessible.

**Acceptance Criteria**:
- AC-14.1: Status shown as pill badges instead of dots
- AC-14.2: Format: "● Active", "● Paused", "⚠ Failed"
- AC-14.3: Pills have colored background matching status
- AC-14.4: Text is high contrast for accessibility (WCAG AA)
- AC-14.5: Pills are larger and easier to scan

### US-15: As a user, I want the AI Console CTA to be less intrusive
**Description**: Access AI Console without losing screen space on every page.

**Acceptance Criteria**:
- AC-15.1: Large promotional banner removed from page content
- AC-15.2: Floating button in bottom-right corner (60x60px)
- AC-15.3: Button shows AI icon with subtle animation
- AC-15.4: Hovering shows tooltip: "Open AI Console"
- AC-15.5: Button appears on all dashboard pages
- AC-15.6: Button has z-index to stay above content
- AC-15.7: Button position: 24px from bottom, 24px from right

### US-16: As a user, I want consistent spacing across pages
**Description**: All pages have uniform section spacing and padding.

**Acceptance Criteria**:
- AC-16.1: Section spacing standardized to 2rem (32px)
- AC-16.2: Card padding consistent at 1.5rem (24px)
- AC-16.3: Grid gaps consistent at 1rem (16px)
- AC-16.4: No sections feel cramped or overly spacious
- AC-16.5: Spacing scales appropriately on mobile

### US-17: As a user, I want the Create Workflow banner to be collapsible
**Description**: Returning users can collapse the large CTA banner.

**Acceptance Criteria**:
- AC-17.1: Banner has collapse/expand toggle button
- AC-17.2: Collapsed state shows only title and expand button
- AC-17.3: Collapsed height: 60px (vs 150px expanded)
- AC-17.4: State persists in localStorage
- AC-17.5: Smooth animation on collapse/expand (300ms)

## Non-Functional Requirements

### NFR-1: Performance
- Page load time < 2 seconds
- Filter/sort operations < 100ms
- Smooth animations (60fps)

### NFR-2: Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader friendly labels
- High contrast mode support

### NFR-3: Responsive Design
- Mobile breakpoint: 768px
- Tablet breakpoint: 1024px
- Desktop: 1920px+
- Touch-friendly targets (44x44px minimum)

### NFR-4: Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Out of Scope
- Backend API integration (mock data only)
- Real-time updates via WebSocket
- Export functionality
- Advanced filtering (date ranges, custom queries)
- Workflow creation/editing UI
- User preferences/settings persistence beyond localStorage

## Dependencies
- Existing design system (design-system.css)
- Dashboard layout (dashboard-layout.css)
- Sidebar toggle functionality (sidebar-toggle.js)
- Tier sync functionality (tier-sync.js)
- Workflow preview component (workflow-preview.js)

## Assumptions
- All data remains mock/static
- No backend changes required
- Existing color palette and theme maintained
- Inter Tight font family continues to be used
- No new external dependencies added
