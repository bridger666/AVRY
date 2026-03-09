# Implementation Plan: Diagnostics v1 and Blueprint Viewer v1

## Overview

This implementation plan breaks down the development of Diagnostics v1 and Blueprint Viewer v1 into discrete, incremental coding tasks. The implementation uses Next.js 14 App Router with TypeScript and pure CSS, maintaining consistency with the existing dashboard and console design system.

The plan follows a logical progression: data models → shared components → diagnostics feature → blueprint feature → integration → testing. Each task builds on previous work and includes references to specific requirements.

## Tasks

- [x] 1. Create TypeScript interfaces and sample data generators
  - [x] 1.1 Create diagnostic data types and interfaces
    - Create `types/diagnostic.ts` with all interfaces: DiagnosticField, DiagnosticPhaseConfig, BusinessContext, OperationalPainPoints, DataReadiness, StrategicGoals, DiagnosticData, DiagnosticResult
    - Implement `getSampleDiagnosticResult()` function with realistic sample data
    - Implement `DIAGNOSTIC_PHASES` constant array with all four phase configurations (A, B, C, D) including fields, labels, types, and options
    - _Requirements: 3.2, 3.3, 1.3, 1.4, 1.5, 1.6_
  
  - [x] 1.2 Create blueprint data types and interfaces
    - Create `types/blueprint.ts` with all interfaces: ArchitectureLayer, WorkflowModule, DiagnosticSummary, RiskAssessment, DeploymentPlan, SystemArchitecture, BlueprintData
    - Implement `getSampleBlueprint()` function with comprehensive sample data including all architecture layers, 3+ workflow modules, risk assessment, and deployment plan
    - _Requirements: 9.1, 9.2_

- [x] 2. Implement diagnostics page components
  - [x] 2.1 Create DiagnosticPhase component
    - Create `components/diagnostics/DiagnosticPhase.tsx` with props interface
    - Implement rendering logic for all field types: text, textarea, select, multiselect
    - Add onChange handler to update parent state
    - Create `components/diagnostics/DiagnosticPhase.module.css` with card styling matching design system (20px border radius, elevated background, soft borders)
    - _Requirements: 1.2, 1.7, 1.8_
  
  - [ ]* 2.2 Write property test for DiagnosticPhase component
    - **Property 1: Diagnostic Phase Structure Consistency**
    - **Validates: Requirements 1.2, 1.7, 1.8**
  
  - [x] 2.3 Create DiagnosticSummary component
    - Create `components/diagnostics/DiagnosticSummary.tsx` with props for score, maturityLevel, and onGenerateBlueprint callback
    - Implement display of AI readiness score (large number with label)
    - Implement maturity level pill badge
    - Add "Generate AI System Blueprint" CTA button with click handler
    - Create `components/diagnostics/DiagnosticSummary.module.css` with prominent card styling
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 2.4 Create diagnostics page
    - Create `app/diagnostics/page.tsx` as client component with state management
    - Implement DiagnosticData state using useState hook
    - Render header section with title "AI Readiness Diagnostic" and description
    - Map over DIAGNOSTIC_PHASES to render four DiagnosticPhase components
    - Render DiagnosticSummary component at bottom with hardcoded score (75) and maturity level ("Developing")
    - Implement handleGenerateBlueprint function to navigate to `/blueprint?sample=true`
    - Create `app/diagnostics/diagnostics.module.css` with page layout (max-width 900px, centered, responsive)
    - _Requirements: 1.1, 1.2, 2.5, 3.1, 3.3_
  
  - [ ]* 2.5 Write property test for form state synchronization
    - **Property 2: Form State Synchronization**
    - **Validates: Requirements 3.1**
  
  - [ ]* 2.6 Write property test for diagnostic data structure
    - **Property 3: Diagnostic Data Structure Integrity**
    - **Validates: Requirements 3.2**

- [ ] 3. Checkpoint - Ensure diagnostics page renders correctly
  - Manually test /diagnostics route
  - Verify all four phases display with correct fields
  - Verify form inputs update state
  - Verify summary card shows score and CTA button
  - Ask the user if questions arise

- [x] 4. Implement blueprint viewer components
  - [x] 4.1 Create BlueprintHeader component
    - Create `components/blueprint/BlueprintHeader.tsx` with props for blueprintId, version, status, maturityLevel, estimatedROI, showSampleBanner
    - Implement title "AI System Blueprint" with subtitle showing metadata
    - Implement pills for maturity level and estimated ROI
    - Conditionally render sample data banner when showSampleBanner is true
    - Create `components/blueprint/BlueprintHeader.module.css` with header styling (32px title, 14px subtitle, pill badges)
    - _Requirements: 5.1, 5.2, 5.3, 5.5_
  
  - [x] 4.2 Create ExecutiveSummary component
    - Create `components/blueprint/ExecutiveSummary.tsx` with props for primaryGoal, readinessScore, maturityLevel, constraints
    - Implement card layout with primary goal as headline
    - Display readiness score with visual indicator
    - List top 2-3 constraints as bullet points
    - Create `components/blueprint/ExecutiveSummary.module.css` with card styling
    - _Requirements: 5.4_
  
  - [x] 4.3 Create ArchitectureLayer component
    - Create `components/blueprint/ArchitectureLayer.tsx` with props for title, items, description
    - Implement card with left border accent
    - Render items as chips or vertical list
    - Display description in secondary text color
    - Create `components/blueprint/ArchitectureLayer.module.css` with layer card styling
    - _Requirements: 6.3_
  
  - [ ]* 4.4 Write property test for architecture layer structure
    - **Property 5: Architecture Layer Completeness**
    - **Validates: Requirements 6.2, 6.3**
  
  - [x] 4.5 Create WorkflowCard component
    - Create `components/blueprint/WorkflowCard.tsx` with props for name, trigger, steps, integrations, onEdit, onSimulate, onDeploy
    - Implement card with workflow name as title
    - Display trigger condition
    - List steps (collapse if more than 5)
    - Show integration chips
    - Render action buttons: Edit (disabled), Simulate (disabled), Deploy (active, links to /workflows)
    - Create `components/blueprint/WorkflowCard.module.css` with card styling and button row
    - _Requirements: 7.2, 7.3, 7.4_
  
  - [ ]* 4.6 Write property test for workflow card structure
    - **Property 6: Workflow Module Card Structure**
    - **Validates: Requirements 7.2**
  
  - [x] 4.7 Create RiskCard and DeploymentCard components
    - Create `components/blueprint/RiskCard.tsx` with props for dataRisks, fallbackStrategy
    - Create `components/blueprint/DeploymentCard.tsx` with props for phase, estimatedImpact, estimatedROIMonths
    - Implement structured information display with labels
    - Create `components/blueprint/RiskCard.module.css` and `DeploymentCard.module.css` with card styling
    - _Requirements: 8.3, 8.4_

- [x] 5. Implement blueprint viewer page
  - [x] 5.1 Create blueprint page with data loading
    - Create `app/blueprint/page.tsx` as client component
    - Implement useEffect to load sample blueprint data using getSampleBlueprint()
    - Check URL params for `?sample=true` flag to determine if showSampleBanner should be true
    - Implement error state handling for missing or invalid blueprint data
    - _Requirements: 5.1, 5.5, 9.2, 9.4_
  
  - [ ]* 5.2 Write property test for blueprint data validation
    - **Property 7: Blueprint Data Structure Validation**
    - **Validates: Requirements 9.1**
  
  - [ ]* 5.3 Write property test for error state handling
    - **Property 8: Error State for Invalid Blueprint**
    - **Validates: Requirements 9.4**
  
  - [x] 5.4 Render blueprint page sections
    - Render BlueprintHeader component with blueprint metadata
    - Render ExecutiveSummary component with diagnostic summary data
    - Render "System Architecture" section with title
    - Map over all 5 architecture layers (data_sources, processing_layers, decision_engine, memory_layer, execution_layer) and render ArchitectureLayer components
    - Render "Workflow Modules" section with title
    - Map over workflow_modules array and render WorkflowCard components
    - Render "Risk & Deployment" section with RiskCard and DeploymentCard side-by-side
    - Create `app/blueprint/blueprint.module.css` with page layout (scrollable, sections, responsive)
    - _Requirements: 5.4, 6.1, 6.2, 7.1, 7.5, 8.1, 8.2_

- [ ] 6. Checkpoint - Ensure blueprint page renders correctly
  - Manually test /blueprint route
  - Verify header displays with metadata and pills
  - Verify executive summary shows all information
  - Verify all 5 architecture layers render
  - Verify workflow cards display correctly
  - Verify risk and deployment cards render side-by-side on desktop
  - Ask the user if questions arise

- [ ] 7. Implement responsive design and styling
  - [ ] 7.1 Add responsive breakpoints to diagnostics page
    - Update `app/diagnostics/diagnostics.module.css` with mobile breakpoints (@media max-width: 768px)
    - Ensure single-column layout on mobile
    - Adjust padding and spacing for mobile
    - Test form fields are usable on mobile devices
    - _Requirements: 4.4_
  
  - [ ] 7.2 Add responsive breakpoints to blueprint page
    - Update `app/blueprint/blueprint.module.css` with mobile breakpoints
    - Ensure risk and deployment cards stack vertically on mobile
    - Adjust workflow card layout for mobile
    - Test all sections are readable on mobile devices
    - _Requirements: 10.4_
  
  - [ ]* 7.3 Write property test for responsive layout behavior
    - **Property 4: Responsive Layout Adaptation**
    - **Validates: Requirements 4.4, 10.4, 12.5**

- [x] 8. Integrate with navigation and routing
  - [x] 8.1 Update sidebar navigation
    - Update `components/shared/Sidebar.tsx` to include /diagnostics and /blueprint routes if not already present
    - Ensure active state highlighting works for new routes
    - _Requirements: 11.5_
  
  - [x] 8.2 Update dashboard links
    - Verify dashboard OverviewCard and LifecycleCard components link to /diagnostics and /blueprint
    - Ensure navigation flow works: Dashboard → Diagnostics → Blueprint → Workflows
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ]* 8.3 Write integration tests for navigation flow
    - Test navigation from dashboard to diagnostics
    - Test navigation from diagnostics to blueprint with sample flag
    - Test navigation from blueprint to workflows
    - Test sidebar navigation to all routes

- [x] 9. Add visual design consistency
  - [x] 9.1 Verify color palette consistency
    - Audit all CSS modules to ensure they use design tokens from globals.css
    - Verify background colors use var(--bg-main), var(--bg-elevated), var(--bg-soft)
    - Verify text colors use var(--text-primary), var(--text-secondary), var(--text-tertiary)
    - Verify borders use var(--border-soft)
    - _Requirements: 4.1, 10.1_
  
  - [x] 9.2 Verify typography consistency
    - Ensure all components use Inter Tight font family
    - Verify font weights are 300, 400, 500, or 600
    - Check font sizes are consistent with design system (13px-32px range)
    - Verify line-height is 1.6 for body text
    - _Requirements: 4.2, 10.2_
  
  - [ ]* 9.3 Write unit tests for styling consistency
    - Test computed styles match design tokens
    - Test font-family is Inter Tight
    - Test color values match CSS variables

- [x] 10. Final checkpoint and polish
  - [x] 10.1 Manual testing of complete flow
    - Test full user journey: Dashboard → Diagnostics → Blueprint → Workflows
    - Test all form inputs work correctly
    - Test all buttons and links navigate correctly
    - Test responsive behavior on mobile and desktop
    - Verify no "test" labels or placeholder text remains
    - _Requirements: 4.5, 10.5_
  
  - [x] 10.2 Code quality review
    - Verify all files use TypeScript with proper type annotations
    - Verify no Tailwind classes or UI library imports
    - Verify all CSS uses CSS modules
    - Verify components are structured for future backend integration
    - _Requirements: 12.2, 12.3, 12.6_
  
  - [ ]* 10.3 Run all tests
    - Run unit tests for all components
    - Run property-based tests (minimum 100 iterations each)
    - Run integration tests for navigation
    - Ensure all tests pass
  
  - [x] 10.4 Final polish and cleanup
    - Remove any console.log statements
    - Add JSDoc comments to exported functions
    - Verify all imports are used
    - Format code consistently
    - Update README if needed

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and provide opportunities to ask questions
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- The implementation is structured for easy backend integration in v2
- All styling uses pure CSS with CSS modules (no Tailwind or UI libraries)
- TypeScript strict mode is enabled for all components
