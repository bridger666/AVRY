# Implementation Plan: Progressive SaaS Dashboard System

## Overview

This implementation plan converts the Progressive SaaS Dashboard design into discrete coding tasks. The dashboard is a unified, single-codebase system that progressively unlocks features across 4 tiers (Free, Snapshot, Blueprint, Operator). Each task builds incrementally, with testing integrated throughout.

## Tasks

- [ ] 1. Set up dashboard foundation and core architecture
  - Create `frontend/dashboard-v2.html` with semantic HTML structure
  - Create `frontend/dashboard-v2.css` with design system variables (colors, spacing, typography)
  - Create `frontend/dashboard-v2.js` with DashboardController skeleton
  - Set up component base class and registry pattern
  - _Requirements: 1.1, 1.2, 1.3, 15.1, 15.2_

- [ ] 2. Implement tier detection and state management
  - [ ] 2.1 Implement tier detection from URL parameters
    - Parse `?tier=X` from URL
    - Validate tier value (1-4)
    - Default to tier 1 for invalid values
    - _Requirements: 2.1, 2.3_
  
  - [ ]* 2.2 Write property test for tier detection
    - **Property 1: Tier Detection from URL**
    - **Validates: Requirements 2.1, 2.4**
  
  - [ ] 2.3 Implement sessionStorage integration
    - Store detected tier in sessionStorage
    - Restore tier from sessionStorage on load
    - Implement fallback chain: URL → sessionStorage → default
    - _Requirements: 2.2, 2.4, 16.1, 16.3_
  
  - [ ]* 2.4 Write property test for data persistence
    - **Property 15: Data Persistence Round Trip**
    - **Validates: Requirements 9.5, 16.1, 16.2, 16.3**

- [ ] 3. Build component rendering system
  - [ ] 3.1 Implement component registry with tier mappings
    - Define component sets for each tier (1-4)
    - Implement progressive unlocking logic
    - Create component visibility management
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 3.2 Write property test for progressive component unlocking
    - **Property 2: Progressive Component Unlocking**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
  
  - [ ] 3.3 Implement tier transition without page reload
    - Create updateTier() method
    - Implement component show/hide logic
    - Prevent page reload during transitions
    - _Requirements: 1.4_
  
  - [ ]* 3.4 Write property test for tier transitions
    - **Property 3: Tier Transition Without Reload**
    - **Validates: Requirements 1.4**

- [ ] 4. Checkpoint - Ensure core architecture works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Tier 1 (Free) components
  - [ ] 5.1 Create MetricCards component for Tier 1
    - Implement 4 metric cards: AI Readiness Lite, Workflow Health, Automation Exposure, Org Readiness
    - Bind to Free diagnostic data structure
    - _Requirements: 4.1_
  
  - [ ] 5.2 Create StrengthSignalCard component
    - Display top organizational strengths
    - Style with brand colors
    - _Requirements: 4.2_
  
  - [ ] 5.3 Create BottleneckSignalCard component
    - Display primary workflow bottlenecks
    - Style with brand colors
    - _Requirements: 4.3_
  
  - [ ] 5.4 Create QuickRecommendationsCard component
    - Display 2-3 actionable items
    - Style as list with mint green accents
    - _Requirements: 4.4_
  
  - [ ] 5.5 Create UpgradeCTA component for Tier 1
    - Link to Snapshot diagnostic
    - Style with button purple (#3c229f)
    - _Requirements: 4.5, 11.1_
  
  - [ ] 5.6 Create DownloadLiteBadgeButton component
    - Trigger SVG badge download
    - _Requirements: 4.6, 12.1_
  
  - [ ]* 5.7 Write unit test for Tier 1 component presence
    - Test all Tier 1 components render correctly
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 6. Implement Tier 2 (Snapshot) components
  - [ ] 6.1 Create MetricCards component for Tier 2
    - Implement 4 metric cards: Readiness Score, Strength Index, Bottleneck Index, Priority Score
    - Bind to Snapshot diagnostic data structure
    - _Requirements: 5.1_
  
  - [ ] 6.2 Create CategoryBreakdownPanel component
    - Display Workflow, Data, Automation, Organization scores
    - Implement progress bars for each category
    - _Requirements: 5.2_
  
  - [ ] 6.3 Create TopRecommendationsPanel component
    - Display top 3 AI system recommendations
    - Show priority indicators
    - _Requirements: 5.3_
  
  - [ ] 6.4 Create DeploymentPhaseSuggestion component
    - Display suggested phase (Pilot/Rollout/Scale)
    - _Requirements: 5.4_
  
  - [ ] 6.5 Create download buttons for Tier 2
    - Download Report button
    - Enhanced Badge button
    - _Requirements: 5.5, 12.2_
  
  - [ ] 6.6 Update UpgradeCTA for Tier 2
    - Link to Blueprint diagnostic
    - _Requirements: 5.6, 11.2_
  
  - [ ]* 6.7 Write unit test for Tier 2 component presence
    - Test all Tier 2 components render correctly
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 7. Implement Tier 3 (Blueprint) components
  - [ ] 7.1 Create MetricCards component for Tier 3
    - Implement 4 metric cards: Selected AI System, Automation %, Time Saved, ROI
    - Bind to Blueprint diagnostic data structure
    - _Requirements: 6.1_
  
  - [ ] 7.2 Create SystemArchitecturePanel component
    - Display system overview and description
    - Show core objective and operating model
    - _Requirements: 6.2_
  
  - [ ] 7.3 Create WorkflowArchitectureViz component
    - Visual representation of workflow blocks
    - Display trigger logic, core steps, decision conditions, escalation paths
    - _Requirements: 6.3_
  
  - [ ] 7.4 Create AgentStructureCards component
    - Grid of AI agent role cards
    - Display agent name, role, responsibilities
    - _Requirements: 6.4_
  
  - [ ] 7.5 Create DeploymentPhasesTimeline component
    - Timeline visualization of deployment phases
    - _Requirements: 6.5_
  
  - [ ] 7.6 Create ConfidenceLevelIndicator component
    - Visual confidence meter (High/Medium/Low)
    - _Requirements: 6.6_
  
  - [ ] 7.7 Create ActivateCTA component for Tier 3
    - Link to Operator activation flow
    - _Requirements: 6.7, 11.3_
  
  - [ ]* 7.8 Write unit test for Tier 3 component presence
    - Test all Tier 3 components render correctly
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 8. Checkpoint - Ensure Tiers 1-3 work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement Tier 4 (Operator) components
  - [ ] 9.1 Create MetricCards component for Tier 4
    - Implement 5 metric cards: Active Systems, Monthly Runs, Time Saved, Intelligence Credits, Priority Alerts
    - Bind to Operator mock data structure
    - _Requirements: 7.1_
  
  - [ ] 9.2 Create AISystemsTable component
    - Table with columns: Name, Type, Status, Health, Last Run, Actions
    - Implement row rendering and action buttons
    - _Requirements: 7.2_
  
  - [ ] 9.3 Create ExecutionLogsPanel component
    - Display recent system execution logs
    - Format timestamps and status indicators
    - _Requirements: 7.3_
  
  - [ ] 9.4 Create AILogicInsightPanel component
    - Mini workflow diagram visualization
    - _Requirements: 7.4_
  
  - [ ] 9.5 Create IntelligenceInsightsPanel component
    - Display Bottleneck Detection, Anomaly Signals, Optimization Suggestions
    - _Requirements: 7.5_
  
  - [ ] 9.6 Create mock data provider for Tier 4
    - Generate realistic Operator data
    - Include system status, execution logs, health metrics
    - _Requirements: 9.3_
  
  - [ ]* 9.7 Write unit test for Tier 4 component presence
    - Test all Tier 4 components render correctly
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 9.8 Write property test for mock data generation
    - **Property 3: Operator Mock Data**
    - **Validates: Requirements 9.3**

- [ ] 10. Implement sidebar navigation system
  - [ ] 10.1 Create SidebarNavigation component
    - Implement navigation item rendering
    - Map tier to navigation items
    - _Requirements: 4.7, 5.7, 6.8, 7.6_
  
  - [ ]* 10.2 Write property test for navigation expansion
    - **Property 4: Navigation Expansion by Tier**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**
  
  - [ ] 10.3 Implement active navigation highlighting
    - Track active view
    - Apply active CSS class to current item
    - _Requirements: 10.5_
  
  - [ ]* 10.4 Write property test for active highlighting
    - **Property 5: Active Navigation Highlighting**
    - **Validates: Requirements 10.5**
  
  - [ ] 10.5 Implement navigation click routing
    - Handle navigation item clicks
    - Navigate to corresponding view without reload
    - _Requirements: 10.6_
  
  - [ ]* 10.6 Write property test for navigation routing
    - **Property 6: Navigation Click Routing**
    - **Validates: Requirements 10.6**
  
  - [ ]* 10.7 Write unit tests for specific tier navigation
    - Test Tier 1 navigation items
    - Test Tier 2 navigation items
    - Test Tier 3 navigation items
    - Test Tier 4 navigation items
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 11. Implement design system compliance
  - [ ] 11.1 Apply brand colors throughout CSS
    - Primary purple: #4020a5
    - Mint green: #07d197
    - Button purple: #3c229f
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ]* 11.2 Write property test for brand color compliance
    - **Property 7: Brand Color Compliance**
    - **Validates: Requirements 8.1, 8.2, 8.3**
  
  - [ ] 11.3 Apply typography system
    - Font-family: 'Inter Tight'
    - Default font-weight: 300
    - _Requirements: 8.4_
  
  - [ ]* 11.4 Write property test for typography consistency
    - **Property 8: Typography Consistency**
    - **Validates: Requirements 8.4**
  
  - [ ] 11.5 Apply button styling
    - Border-radius: 9999px for all buttons
    - _Requirements: 8.5_
  
  - [ ]* 11.6 Write property test for button border radius
    - **Property 9: Button Border Radius**
    - **Validates: Requirements 8.5**
  
  - [ ] 11.7 Ensure no gradients (except allowed cases)
    - Audit CSS for gradient usage
    - Remove unauthorized gradients
    - _Requirements: 8.6_
  
  - [ ]* 11.8 Write property test for gradient usage
    - **Property 10: No Gradient Usage**
    - **Validates: Requirements 8.6**
  
  - [ ] 11.9 Apply 8px spacing scale
    - Audit all margin and padding values
    - Ensure multiples of 8px
    - _Requirements: 8.7_
  
  - [ ]* 11.10 Write property test for spacing scale
    - **Property 11: 8px Spacing Scale**
    - **Validates: Requirements 8.7**

- [ ] 12. Checkpoint - Ensure design system compliance
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement API integration and data management
  - [ ] 13.1 Create APIClient class
    - Implement fetch wrapper
    - Handle GET and POST requests
    - Implement error handling
    - _Requirements: 17.2_
  
  - [ ] 13.2 Create DataManager class
    - Implement data fetching for each tier
    - Implement sessionStorage caching
    - Implement cache retrieval and invalidation
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
  
  - [ ] 13.3 Implement Snapshot API response parsing
    - Parse readiness_score, strength_index, bottleneck_index, etc.
    - Handle missing fields with fallbacks
    - _Requirements: 9.1_
  
  - [ ]* 13.4 Write property test for Snapshot parsing
    - **Property 12: Snapshot API Response Parsing**
    - **Validates: Requirements 9.1**
  
  - [ ] 13.5 Implement Blueprint API response parsing
    - Parse system_architecture, workflow_architecture, agent_structure, etc.
    - Handle missing fields with fallbacks
    - _Requirements: 9.2_
  
  - [ ]* 13.6 Write property test for Blueprint parsing
    - **Property 13: Blueprint API Response Parsing**
    - **Validates: Requirements 9.2**
  
  - [ ] 13.7 Implement graceful error handling
    - Handle network failures
    - Handle malformed JSON
    - Display error states
    - _Requirements: 9.4_
  
  - [ ]* 13.8 Write property test for error handling
    - **Property 14: Graceful Error Handling**
    - **Validates: Requirements 9.4**
  
  - [ ]* 13.9 Write property test for API cache hit avoidance
    - **Property 21: API Cache Hit Avoidance**
    - **Validates: Requirements 14.5**

- [ ] 14. Implement download functionality
  - [ ] 14.1 Implement download button components
    - Create download buttons for each tier
    - Wire to download handlers
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [ ]* 14.2 Write property test for download button availability
    - **Property 16: Download Button Availability**
    - **Validates: Requirements 12.1, 12.2, 12.3**
  
  - [ ] 14.3 Implement file generation and download
    - Generate PDF/SVG files
    - Trigger browser download
    - _Requirements: 12.4_
  
  - [ ]* 14.4 Write property test for download file generation
    - **Property 17: Download File Generation**
    - **Validates: Requirements 12.4**
  
  - [ ] 14.5 Implement tier-appropriate data filtering
    - Ensure downloaded files contain only tier-appropriate data
    - _Requirements: 12.5_
  
  - [ ]* 14.6 Write property test for download data filtering
    - **Property 18: Tier-Appropriate Download Data**
    - **Validates: Requirements 12.5**

- [ ] 15. Implement responsive design
  - [ ] 15.1 Add desktop viewport styles (1280px+)
    - Optimize layout for desktop
    - _Requirements: 13.1_
  
  - [ ] 15.2 Add tablet viewport styles (768px-1279px)
    - Adapt layout for tablet
    - Collapse sidebar to icon menu
    - _Requirements: 13.2, 13.4_
  
  - [ ] 15.3 Ensure design system consistency across breakpoints
    - Maintain brand colors, typography, spacing
    - _Requirements: 13.5_
  
  - [ ]* 15.4 Write property test for responsive design consistency
    - **Property 22: Responsive Design Consistency**
    - **Validates: Requirements 13.5**
  
  - [ ]* 15.5 Write unit tests for responsive breakpoints
    - Test desktop layout
    - Test tablet layout
    - _Requirements: 13.1, 13.2_

- [ ] 16. Implement performance optimizations
  - [ ] 16.1 Add performance monitoring
    - Measure initial load time
    - Measure tier transition time
    - Use Performance API
    - _Requirements: 14.1, 14.2_
  
  - [ ]* 16.2 Write property test for initial load performance
    - **Property 19: Initial Load Performance**
    - **Validates: Requirements 14.1**
  
  - [ ]* 16.3 Write property test for tier rendering performance
    - **Property 20: Tier Rendering Performance**
    - **Validates: Requirements 14.2**
  
  - [ ] 16.4 Implement lazy loading for non-critical components
    - Identify non-critical components
    - Implement lazy loading strategy
    - _Requirements: 14.4_

- [ ] 17. Implement sessionStorage management
  - [ ] 17.1 Implement sessionStorage clearing on reset
    - Create reset/logout handler
    - Clear all dashboard-related keys
    - _Requirements: 16.5_
  
  - [ ]* 17.2 Write property test for sessionStorage clearing
    - **Property 23: SessionStorage Clearing on Reset**
    - **Validates: Requirements 16.5**

- [ ] 18. Implement content quality checks
  - [ ] 18.1 Audit all text content for placeholder text
    - Remove "lorem ipsum" and placeholder text
    - Use realistic AI system names
    - _Requirements: 18.1_
  
  - [ ]* 18.2 Write property test for no lorem ipsum
    - **Property 25: No Lorem Ipsum Content**
    - **Validates: Requirements 18.1**

- [ ] 19. Integration and wiring
  - [ ] 19.1 Wire dashboard to existing diagnostic flow
    - Integrate with app.js
    - Handle redirects from diagnostic completion
    - _Requirements: 17.1_
  
  - [ ] 19.2 Test API endpoint compatibility
    - Test with existing backend endpoints
    - Verify request/response formats
    - _Requirements: 17.2, 17.5_
  
  - [ ]* 19.3 Write property test for API compatibility
    - **Property 24: API Endpoint Compatibility**
    - **Validates: Requirements 17.2, 17.5**
  
  - [ ] 19.4 Test XAMPP deployment
    - Deploy to XAMPP environment
    - Verify all features work
    - _Requirements: 17.3_
  
  - [ ]* 19.5 Write integration tests for end-to-end flows
    - Test Free diagnostic → Dashboard flow
    - Test Snapshot upgrade → Dashboard transition
    - Test navigation between views
    - Test download functionality

- [ ] 20. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The dashboard is a single codebase with progressive enhancement, not separate dashboards per tier
