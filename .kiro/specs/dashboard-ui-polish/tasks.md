# Implementation Plan: Dashboard UI Polish

## Overview

This implementation plan transforms the Aivory Dashboard UI from a functional prototype into an enterprise-grade product. Phase 1 (collapsible sidebar) is complete. This plan focuses on streaming AI responses, typography refinement, component polish, header consolidation, and accessibility compliance.

## Tasks

- [ ] 1. Set up design system CSS variables
  - Create or update design-system.css with typography scale, spacing system, border radius system, and color palette
  - Implement CSS custom properties for all design tokens
  - _Requirements: 2.1, 2.4, 13.1, 13.2, 13.3, 13.4, 13.5, 14.2, 14.3, 14.4, 14.5, 14.6_

- [ ] 2. Implement streaming text component
  - [ ] 2.1 Create StreamingText class
    - Implement character-by-character text reveal
    - Add configurable streaming rate (20-50 chars/sec)
    - Include typing cursor indicator
    - Handle message queuing
    - _Requirements: 1.1, 1.2, 1.6, 1.5_
  
  - [ ]* 2.2 Write property test for streaming rate
    - **Property 2: Streaming rate is within specified range**
    - **Validates: Requirements 1.2**
  
  - [ ]* 2.3 Write property test for streaming completion
    - **Property 3: Streaming completes with full text visible**
    - **Validates: Requirements 1.3**
  
  - [ ]* 2.4 Write property test for scroll resilience
    - **Property 4: Streaming continues during scroll**
    - **Validates: Requirements 1.4**
  
  - [ ]* 2.5 Write property test for message queuing
    - **Property 5: Messages queue properly**
    - **Validates: Requirements 1.5**

- [ ] 3. Integrate streaming into dashboard
  - [ ] 3.1 Update dashboard.js to use StreamingText for AI responses
    - Replace instant text display with streaming
    - Add reduced motion detection
    - _Requirements: 1.1, 11.5_
  
  - [ ]* 3.2 Write property test for reduced motion
    - **Property 7: Reduced motion disables streaming**
    - **Validates: Requirements 11.5**

- [ ] 4. Checkpoint - Verify streaming works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement typography system
  - [ ] 5.1 Update CSS with typography scale
    - Apply font sizes with 1.250 ratio
    - Set letter-spacing for headings (-0.01em)
    - Set line-heights (1.5 body, 1.25 headings)
    - Define font weights (300, 400, 500, 600, 700)
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  
  - [ ] 5.2 Apply typography classes to dashboard HTML
    - Update dashboard.html, console.html, workflows.html, logs.html
    - Ensure consistent typography hierarchy
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ]* 5.3 Write property test for font scale
    - **Property 8: Font sizes follow mathematical scale**
    - **Validates: Requirements 2.1**
  
  - [ ]* 5.4 Write property test for spacing grid
    - **Property 11: Spacing follows 8px grid**
    - **Validates: Requirements 2.4**

- [ ] 6. Polish message bubble styling
  - [ ] 6.1 Update message bubble CSS
    - Apply 12px border-radius
    - Set padding to 12px horizontal, 16px vertical
    - Set 12px gap between bubbles
    - _Requirements: 3.1, 3.6, 3.7_
  
  - [ ]* 6.2 Write property test for border radius consistency
    - **Property 14: Border radius is consistent by component type**
    - **Validates: Requirements 3.1, 3.2, 3.3, 13.1-13.5**

- [ ] 7. Enhance input bar styling
  - [ ] 7.1 Update input bar CSS
    - Set minimum height to 48px
    - Apply 12px border-radius
    - Set padding to 12px horizontal, 16px vertical
    - Add focus states (2px mint green border, 3px shadow)
    - Set font-size to 1rem
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [ ]* 7.2 Write property test for input focus states
    - **Property 15: Input focus states are consistent**
    - **Validates: Requirements 3.4, 3.5, 5.5, 5.6**

- [ ] 8. Create prominent send button
  - [ ] 8.1 Update send button CSS
    - Set minimum height to 48px
    - Apply mint green background (#0ae8af)
    - Set dark text color (#1a1a24)
    - Use semibold font weight (600)
    - Add hover states (brighter green, translateY, glow)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [ ]* 8.2 Write property test for send button hover
    - **Property 18: Send button hover state is correct**
    - **Validates: Requirements 4.5, 4.6, 4.7**

- [ ] 9. Checkpoint - Verify component polish
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement profile dropdown component
  - [ ] 10.1 Create ProfileDropdown class
    - Implement toggle functionality
    - Display user name, email, tier badge
    - Display credits with progress bar
    - Add warning icon for low credits (<10%)
    - Include logout button
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [ ] 10.2 Create profile dropdown HTML and CSS
    - Design dropdown menu layout
    - Style progress bar with color coding
    - Add animations for open/close
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.5_
  
  - [ ]* 10.3 Write property test for dropdown content
    - **Property 20: Profile dropdown displays required content**
    - **Validates: Requirements 6.3, 6.4, 6.5, 6.7**
  
  - [ ]* 10.4 Write property test for credit warnings
    - **Property 21: Profile dropdown shows warning at low credits**
    - **Validates: Requirements 6.6**
  
  - [ ]* 10.5 Write property test for progress bar colors
    - **Property 23: Credit progress bar color-codes correctly**
    - **Validates: Requirements 7.2, 7.5**

- [ ] 11. Integrate profile dropdown into header
  - [ ] 11.1 Update dashboard header HTML
    - Add profile dropdown trigger button
    - Remove separate tier and credits badges
    - Update all dashboard pages (dashboard.html, console.html, workflows.html, logs.html)
    - _Requirements: 6.1, 6.8_
  
  - [ ] 11.2 Wire up profile dropdown functionality
    - Connect to user data from sessionStorage
    - Implement click handlers
    - Add credit update logic
    - _Requirements: 6.2, 7.1_
  
  - [ ]* 11.3 Write property test for header cleanup
    - **Property 22: Header does not show redundant badges**
    - **Validates: Requirements 6.8**

- [ ] 12. Implement credit notifications
  - [ ] 12.1 Create toast notification component
    - Display when credits < 5%
    - Auto-dismiss after 5 seconds
    - _Requirements: 7.3_
  
  - [ ] 12.2 Create blocking modal for zero credits
    - Display when credits = 0
    - Include upgrade call-to-action
    - Prevent dismissal without action
    - _Requirements: 7.4_

- [ ] 13. Checkpoint - Verify header and notifications
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Implement accessibility - color contrast
  - [ ] 14.1 Update text colors for WCAG AA compliance
    - Set primary text to rgba(255, 255, 255, 0.95)
    - Set secondary text to rgba(255, 255, 255, 0.85)
    - Set tertiary text to rgba(255, 255, 255, 0.65)
    - Verify all text meets 4.5:1 contrast ratio
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [ ]* 14.2 Write property test for text contrast
    - **Property 24: Text contrast meets WCAG AA**
    - **Validates: Requirements 8.1, 8.2**
  
  - [ ]* 14.3 Write property test for text color hierarchy
    - **Property 26: Text colors are consistent by hierarchy**
    - **Validates: Requirements 8.4, 8.5, 8.6**

- [ ] 15. Implement accessibility - keyboard navigation
  - [ ] 15.1 Add focus indicators
    - Apply 2px solid mint green outline
    - Set 2px outline offset
    - Ensure visible on all interactive elements
    - _Requirements: 9.3, 9.4, 9.5_
  
  - [ ] 15.2 Implement skip navigation links
    - Add skip to main content link
    - Add skip to navigation link
    - Hide visually but keep accessible
    - _Requirements: 9.6_
  
  - [ ] 15.3 Implement modal focus trap
    - Trap focus within open modals
    - Return focus on close
    - _Requirements: 9.7_
  
  - [ ]* 15.4 Write property test for keyboard accessibility
    - **Property 27: All interactive elements are keyboard accessible**
    - **Validates: Requirements 9.1**
  
  - [ ]* 15.5 Write property test for focus indicators
    - **Property 28: Focus indicators are visible and consistent**
    - **Validates: Requirements 9.3, 9.4, 9.5**
  
  - [ ]* 15.6 Write property test for modal focus trap
    - **Property 29: Modal focus is trapped**
    - **Validates: Requirements 9.7**

- [ ] 16. Implement accessibility - screen reader support
  - [ ] 16.1 Add ARIA labels to icon buttons
    - Audit all icon-only buttons
    - Add descriptive aria-label attributes
    - _Requirements: 10.2_
  
  - [ ] 16.2 Add alt text to images
    - Audit all img elements
    - Add descriptive alt attributes
    - _Requirements: 10.4_
  
  - [ ] 16.3 Associate form labels with inputs
    - Ensure all inputs have associated labels
    - Use for/id or wrapping
    - _Requirements: 10.5_
  
  - [ ] 16.4 Add ARIA live regions
    - Add to streaming text container
    - Add to notification areas
    - Announce important updates
    - _Requirements: 10.3, 10.6_
  
  - [ ]* 16.5 Write property test for ARIA labels
    - **Property 30: Icon buttons have ARIA labels**
    - **Validates: Requirements 10.2**
  
  - [ ]* 16.6 Write property test for alt text
    - **Property 31: Images have alt text**
    - **Validates: Requirements 10.4**
  
  - [ ]* 16.7 Write property test for form labels
    - **Property 32: Form inputs have associated labels**
    - **Validates: Requirements 10.5**

- [ ] 17. Implement reduced motion support
  - [ ] 17.1 Add prefers-reduced-motion media query
    - Reduce animation durations to 0.01ms
    - Reduce transition durations to 0.01ms
    - Limit animation iterations to 1
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ] 17.2 Update streaming to respect reduced motion
    - Detect prefers-reduced-motion
    - Display text instantly when enabled
    - _Requirements: 11.5_
  
  - [ ]* 17.3 Write property test for reduced motion
    - **Property 34: Reduced motion is respected**
    - **Validates: Requirements 11.1, 11.2, 11.3**

- [ ] 18. Implement responsive touch targets
  - [ ] 18.1 Update interactive element sizes
    - Ensure all buttons are at least 44x44px
    - Verify send button is 48px height
    - Verify input bar is 48px height
    - Verify profile dropdown trigger is 44x44px
    - Verify sidebar items are 44px height when collapsed
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ]* 18.2 Write property test for touch targets
    - **Property 35: Touch targets meet minimum size**
    - **Validates: Requirements 12.1, 12.4, 12.5**

- [ ] 19. Implement consistent hover states
  - [ ] 19.1 Update hover transitions
    - Apply 200ms duration to all hover effects
    - Use cubic-bezier(0.4, 0, 0.2, 1) easing
    - Add translateY(-1px) to buttons
    - Increase border opacity on cards
    - Add shadow effects on cards
    - Change background on navigation items
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_
  
  - [ ]* 19.2 Write property test for hover transitions
    - **Property 36: Hover transitions are consistent**
    - **Validates: Requirements 15.5, 15.6**

- [ ] 20. Final checkpoint - Complete accessibility audit
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Cross-browser testing and polish
  - [ ] 21.1 Test in Chrome, Firefox, Safari, Edge
    - Verify all features work
    - Check for visual inconsistencies
    - Test on mobile browsers
  
  - [ ] 21.2 Performance optimization
    - Minimize CSS and JavaScript
    - Optimize streaming performance
    - Reduce reflows and repaints
  
  - [ ] 21.3 Final visual polish
    - Review all spacing and alignment
    - Verify color consistency
    - Check animation smoothness

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Focus on accessibility compliance throughout implementation
