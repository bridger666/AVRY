# Implementation Plan: Production Dashboard Redesign

## Overview

This plan implements a production-ready AI Operating System Designer dashboard in Next.js 14 with TypeScript. The dashboard will be built as a new route in the existing nextjs-console application, reusing the console's design system and providing a clear overview of the user's AI OS journey.

## Tasks

- [x] 1. Set up dashboard route and TypeScript interfaces
  - Create `nextjs-console/app/dashboard/page.tsx` with basic structure
  - Create `nextjs-console/types/dashboard.ts` with all TypeScript interfaces
  - Create placeholder data function for initial development
  - _Requirements: 1.1, 1.2, 7.5, 7.6_

- [x] 2. Create shared navigation sidebar component
  - [x] 2.1 Implement Sidebar component with navigation items
    - Create `nextjs-console/components/shared/Sidebar.tsx`
    - Implement navigation items array with Console, Dashboard, Diagnostics, Blueprint, Workflows, Logs, Integrations, Settings
    - Use Next.js Link component for navigation
    - Use usePathname hook to detect active route
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [ ]* 2.2 Write property test for navigation consistency
    - **Property 1: Navigation Consistency**
    - **Validates: Requirements 2.1, 2.6**
  
  - [x] 2.3 Create Sidebar CSS module
    - Create `nextjs-console/components/shared/Sidebar.module.css`
    - Style sidebar with dark warm background (#1e1d1a)
    - Style navigation items with hover and active states
    - Use design tokens from globals.css
    - _Requirements: 2.5, 4.1, 4.2_

- [x] 3. Update root layout to include sidebar
  - [x] 3.1 Modify `nextjs-console/app/layout.tsx` to include Sidebar
    - Import and render Sidebar component
    - Create layout structure with sidebar and main content area
    - Ensure sidebar is visible on all routes
    - _Requirements: 2.1_
  
  - [x] 3.2 Add layout styles to globals.css
    - Add layout grid/flex styles for sidebar + main content
    - Ensure responsive behavior (sidebar collapses on mobile)
    - _Requirements: 4.2, 4.3, 4.7_

- [x] 4. Implement Overview Card component
  - [x] 4.1 Create OverviewCard component
    - Create `nextjs-console/components/dashboard/OverviewCard.tsx`
    - Accept DashboardData as props
    - Display diagnostic status, blueprint status, workflow count
    - Render four CTA buttons: Open Console, Open Diagnostics, View Blueprint, View Workflows
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 4.2 Write property test for Overview Card data display
    - **Property 2: Overview Card Data Display**
    - **Validates: Requirements 3.2, 3.3, 3.4**
  
  - [x] 4.3 Create OverviewCard CSS module
    - Create `nextjs-console/components/dashboard/OverviewCard.module.css`
    - Style card with elevated background (#262521)
    - Style status grid and CTA buttons
    - Use design tokens for consistency
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 5. Implement Lifecycle Card component
  - [x] 5.1 Create LifecycleCard component
    - Create `nextjs-console/components/dashboard/LifecycleCard.tsx`
    - Accept title, description, status, cta, href as props
    - Render card with status indicator and CTA button
    - _Requirements: 3.6, 3.7, 3.8, 3.9_
  
  - [ ]* 5.2 Write property test for Lifecycle Card status reflection
    - **Property 3: Lifecycle Card Status Reflection**
    - **Validates: Requirements 3.7, 3.8, 3.9**
  
  - [x] 5.3 Create LifecycleCard CSS module
    - Create `nextjs-console/components/dashboard/LifecycleCard.module.css`
    - Style card with elevated background
    - Style status indicators and CTA buttons
    - Ensure cards work in responsive grid
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 6. Implement Recent Activity component
  - [x] 6.1 Create RecentActivity component
    - Create `nextjs-console/components/dashboard/RecentActivity.tsx`
    - Accept array of ActivityEvent as props
    - Display events in reverse chronological order
    - Show empty state when no events
    - Include "View All Activity" link
    - _Requirements: 3.10, 15.1, 15.2, 15.5, 15.6, 15.7_
  
  - [ ]* 6.2 Write property test for activity event ordering
    - **Property 6: Recent Activity Chronological Order**
    - **Validates: Requirements 15.5**
  
  - [x] 6.3 Create RecentActivity CSS module
    - Create `nextjs-console/components/dashboard/RecentActivity.module.css`
    - Style activity feed with event items
    - Style event icons and timestamps
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 7. Implement StatusBadge component
  - [x] 7.1 Create StatusBadge component
    - Create `nextjs-console/components/dashboard/StatusBadge.tsx`
    - Accept status string as prop
    - Render appropriate badge based on status
    - _Requirements: 12.5_
  
  - [x] 7.2 Create StatusBadge CSS module
    - Create `nextjs-console/components/dashboard/StatusBadge.module.css`
    - Style badges with appropriate colors for different statuses
    - _Requirements: 12.5_

- [ ] 8. Implement Button component
  - [ ] 8.1 Create reusable Button component
    - Create `nextjs-console/components/shared/Button.tsx`
    - Support primary and secondary variants
    - Support disabled state
    - Ensure accessibility (keyboard navigation, focus states)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_
  
  - [ ] 8.2 Create Button CSS module
    - Create `nextjs-console/components/shared/Button.module.css`
    - Style primary and secondary button variants
    - Add hover, active, and disabled states
    - Ensure minimum touch target size (44x44px)
    - _Requirements: 10.2, 10.3, 10.4, 10.5_

- [x] 9. Implement dashboard page layout and data fetching
  - [x] 9.1 Complete DashboardPage component
    - Implement data fetching with useState and useEffect
    - Handle loading state
    - Handle error state
    - Render OverviewCard, LifecycleCards, and RecentActivity
    - Implement responsive layout (two-column desktop, single-column mobile)
    - _Requirements: 3.1, 3.6, 3.10, 3.11, 3.12, 4.2, 4.3, 11.5, 11.6_
  
  - [ ]* 9.2 Write property test for responsive layout adaptation
    - **Property 4: Responsive Layout Adaptation**
    - **Validates: Requirements 4.2, 4.3**
  
  - [x] 9.3 Create dashboard page CSS module
    - Create `nextjs-console/styles/dashboard.module.css`
    - Implement responsive grid layout
    - Style main content and activity sidebar
    - Use CSS Grid for lifecycle cards
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 10. Implement loading and error states
  - [x] 10.1 Create LoadingState component
    - Create `nextjs-console/components/dashboard/LoadingState.tsx`
    - Display spinner and loading message
    - _Requirements: 11.5_
  
  - [x] 10.2 Create ErrorState component
    - Create `nextjs-console/components/dashboard/ErrorState.tsx`
    - Display error message and retry button
    - _Requirements: 11.6_
  
  - [ ]* 10.3 Write unit tests for loading and error states
    - Test LoadingState renders correctly
    - Test ErrorState displays message and retry button
    - Test retry button triggers callback
    - _Requirements: 11.5, 11.6_
  
  - [x] 10.4 Create CSS modules for states
    - Create styles for LoadingState and ErrorState
    - Ensure consistent styling with design system
    - _Requirements: 11.5, 11.6_

- [x] 11. Implement empty states
  - [x] 11.1 Add empty state to RecentActivity
    - Display "No recent activity" when events array is empty
    - _Requirements: 11.7, 15.3_
  
  - [x] 11.2 Add empty state handling to OverviewCard
    - Display appropriate placeholders when data is missing
    - _Requirements: 11.7_
  
  - [ ]* 11.3 Write property test for empty state handling
    - **Property 9: Empty State Handling**
    - **Validates: Requirements 11.7, 15.3**

- [x] 12. Extend globals.css with dashboard design tokens
  - [x] 12.1 Add dashboard-specific CSS variables
    - Add spacing scale variables
    - Add typography scale variables
    - Ensure consistency with console design tokens
    - _Requirements: 4.1, 4.2, 4.10, 5.5, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [ ]* 12.2 Write property test for design token consistency
    - **Property 5: Design Token Consistency**
    - **Validates: Requirements 4.1, 4.2, 4.10**

- [x] 13. Implement placeholder data and API structure
  - [x] 13.1 Create getPlaceholderData function
    - Implement function in `types/dashboard.ts`
    - Return mock data matching DashboardData interface
    - Include sample diagnostic, blueprint, workflow, and activity data
    - _Requirements: 7.5_
  
  - [x] 13.2 Document API data structure
    - Add JSDoc comments to TypeScript interfaces
    - Document expected API response format
    - _Requirements: 7.6, 7.7_
  
  - [ ]* 13.3 Write unit tests for data structure validation
    - Test that placeholder data matches TypeScript interfaces
    - Test that all required fields are present
    - _Requirements: 7.5, 7.6, 7.7_

- [ ] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Implement navigation integration
  - [ ] 15.1 Test navigation between dashboard and console
    - Verify Link components navigate correctly
    - Verify active state updates on navigation
    - _Requirements: 14.1, 14.2, 14.3_
  
  - [ ] 15.2 Test CTA button navigation
    - Verify all CTA buttons in OverviewCard navigate correctly
    - Verify Lifecycle Card CTAs navigate correctly
    - _Requirements: 10.7, 14.1, 14.2_
  
  - [ ]* 15.3 Write property test for CTA button navigation
    - **Property 7: CTA Button Navigation**
    - **Validates: Requirements 3.5, 14.1, 14.2**

- [ ] 16. Implement TypeScript type safety validation
  - [ ]* 16.1 Write property test for TypeScript type safety
    - **Property 10: TypeScript Type Safety**
    - **Validates: Requirements 1.2**
  
  - [ ] 16.2 Run TypeScript compiler in strict mode
    - Ensure no type errors
    - Ensure all props are properly typed
    - _Requirements: 1.2_

- [ ] 17. Polish and production-ready cleanup
  - [ ] 17.1 Remove any test or debug elements
    - Remove console.log statements
    - Remove debug UI elements
    - Remove placeholder text like "Lorem ipsum"
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [ ] 17.2 Add meaningful copy for all text content
    - Write clear, concise descriptions for Lifecycle Cards
    - Write helpful empty state messages
    - Write clear error messages
    - _Requirements: 11.4_
  
  - [ ] 17.3 Verify visual consistency with console
    - Compare dashboard styling with console
    - Ensure colors, fonts, spacing match
    - Ensure cards and buttons have consistent styling
    - _Requirements: 4.1, 4.2, 4.10, 9.6_

- [ ] 18. Accessibility audit
  - [ ] 18.1 Test keyboard navigation
    - Verify all interactive elements are keyboard accessible
    - Verify tab order is logical
    - Verify focus indicators are visible
    - _Requirements: 10.6_
  
  - [ ] 18.2 Add ARIA labels where needed
    - Add aria-label to icon buttons
    - Add aria-live regions for dynamic content
    - _Requirements: 10.6_
  
  - [ ]* 18.3 Write unit tests for accessibility
    - Test keyboard navigation
    - Test ARIA attributes
    - Test focus management

- [ ] 19. Responsive design testing
  - [ ] 19.1 Test dashboard at multiple viewport sizes
    - Test at 320px (mobile)
    - Test at 768px (tablet)
    - Test at 1024px (desktop)
    - Test at 1920px (large desktop)
    - _Requirements: 4.2, 4.3, 4.7, 4.8_
  
  - [ ]* 19.2 Write visual regression tests
    - Capture screenshots at different viewport sizes
    - Compare against baseline images
    - _Requirements: 4.2, 4.3_

- [ ] 20. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The dashboard will coexist with the existing frontend during migration
- Focus on production-ready polish: no test labels, meaningful copy, graceful error handling
