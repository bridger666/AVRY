# Implementation Plan: Pricing Funnel Update

## Overview

This implementation plan breaks down the pricing funnel update into discrete coding tasks. The approach follows a layered implementation: backend tier logic first, then frontend pricing display, then dashboard access control, and finally integration testing.

## Tasks

- [ ] 1. Update backend tier service with new 6-tier structure
  - Update TierLevel enum to include FREE, SNAPSHOT, BLUEPRINT, FOUNDATION, PRO, ENTERPRISE
  - Add legacy tier name mappings (BUILDER → FOUNDATION, OPERATOR → PRO, INTELLIGENCE → ENTERPRISE)
  - Update TIER_LIMITS configuration with new tier features and pricing
  - Add methods: can_access_dashboard(), can_deploy_blueprint(), get_tier_features()
  - Add track_conversion() method for funnel analytics
  - _Requirements: 1.1, 9.1, 9.3, 9.4, 9.5_

- [ ]* 1.1 Write property test for tier categorization consistency
  - **Property 1: Tier Categorization Consistency**
  - **Validates: Requirements 1.3, 1.4**

- [ ]* 1.2 Write property test for legacy tier mapping
  - **Property 13: Legacy Tier Mapping Consistency**
  - **Validates: Requirements 9.5**

- [ ] 2. Update backend tier validator with new access control rules
  - Update validate_dashboard_access() to require Foundation or higher
  - Add validate_blueprint_access() to allow Blueprint tier and above
  - Add validate_deployment_access() to require Foundation or higher
  - Add validate_roi_engine_access() to require Foundation or higher
  - Add validate_multi_turn_diagnostic_access() to require Foundation or higher
  - Add get_blueprint_mode() to return "view_only" or "live" based on tier
  - Update get_access_denial_message() with user-friendly upgrade prompts
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 2.1 Write property test for subscription-based dashboard access
  - **Property 3: Subscription-Based Dashboard Access**
  - **Validates: Requirements 3.1, 3.2, 3.3, 10.1**

- [ ]* 2.2 Write property test for feature access control consistency
  - **Property 14: Feature Access Control Consistency**
  - **Validates: Requirements 10.2, 10.3, 10.4**

- [ ]* 2.3 Write property test for access denial error structure
  - **Property 15: Access Denial Error Structure**
  - **Validates: Requirements 10.5**

- [ ] 3. Create data models for new tier structure
  - Create UserTierState model with tier, purchase_history, subscription_status
  - Create TierFeatures model with all feature flags
  - Create ConversionEvent model for funnel tracking
  - Create ROICalculation and ROIEngineOutput models
  - Create MultiTurnDiagnosticState and QuestionAnswer models
  - Add JSON schema definitions for all models
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [ ]* 3.1 Write property test for schema validation universality
  - **Property 9: Schema Validation Universality**
  - **Validates: Requirements 7.4, 8.4, 15.5**

- [ ] 4. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Update frontend pricing display on homepage (index.html)
  - Update Lifecycle Flow Section with new pricing: Snapshot $15, Blueprint $79, Foundation $29/mo
  - Update Subscription Section with renamed tiers: Foundation, Pro, Enterprise
  - Update Foundation tier card with new features: Blueprint activation, Multi-turn diagnostic, ROI engine
  - Update Pro tier pricing to $149/mo and feature list
  - Update Enterprise tier pricing to $499/mo
  - Ensure all pricing displays maintain existing CSS styling
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 16.5_

- [ ]* 5.1 Write unit test for homepage pricing display
  - Test that homepage displays all 6 tiers with correct pricing
  - Test that Thinking Products are grouped separately from Infrastructure Products
  - **Validates: Requirements 11.1, 11.2**

- [ ] 6. Update subscription page (dashboard-subscription.html)
  - Update tier names: Builder → Foundation, Operator → Pro
  - Update pricing: Foundation $29/mo, Pro $149/mo, Enterprise $499/mo
  - Update Foundation feature list to include Blueprint activation, Multi-turn diagnostic, ROI engine
  - Update top bar stat displays with new tier names
  - Maintain existing visual design and styling
  - _Requirements: 12.1, 12.2, 12.3, 12.5_

- [ ]* 6.1 Write unit test for subscription page display
  - Test that subscription page displays Foundation, Pro, Enterprise with correct pricing
  - Test that Foundation tier lists all required features
  - **Validates: Requirements 12.1, 12.3**

- [ ] 7. Update dashboard access control logic (dashboard.js)
  - Update initDashboard() to check user tier on page load
  - Update canAccessDashboard() to require subscription tiers (Foundation, Pro, Enterprise)
  - Add showUpgradePrompt() to display tier-specific upgrade messages
  - Update updateTierIndicator() with new tier name mappings
  - Add redirect logic for non-subscription tiers (Free, Snapshot, Blueprint)
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ]* 7.1 Write property test for dashboard tier-based redirect
  - **Property 16: Dashboard Tier-Based Redirect**
  - **Validates: Requirements 13.2**

- [ ]* 7.2 Write property test for dashboard tier-based loading
  - **Property 17: Dashboard Tier-Based Loading**
  - **Validates: Requirements 13.3, 13.4**

- [ ] 8. Implement funnel progression logic
  - Add getNextTier() function to determine upgrade path
  - Add validateTierUpgrade() to allow skipping intermediate tiers
  - Update upgrade prompts to show immediate next tier
  - Add conversion tracking on tier upgrades
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.4, 5.5_

- [ ]* 8.1 Write property test for funnel progression order
  - **Property 2: Funnel Progression Order**
  - **Validates: Requirements 2.1, 2.5**

- [ ]* 8.2 Write property test for conversion tracking completeness
  - **Property 6: Conversion Tracking Completeness**
  - **Validates: Requirements 5.5**

- [ ] 9. Checkpoint - Ensure frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement Blueprint access rules
  - Add Blueprint access check for standalone purchasers and subscribers
  - Implement Blueprint mode determination (view-only vs live)
  - Add deployment capability gating for Foundation+ subscribers
  - Update Blueprint UI to show mode-appropriate actions
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 10.1 Write property test for Blueprint access independence
  - **Property 5: Blueprint Access Independence**
  - **Validates: Requirements 4.1, 4.2**

- [ ]* 10.2 Write unit tests for Blueprint mode determination
  - Test that standalone Blueprint purchasers get "view-only" mode
  - Test that Foundation+ subscribers get "live" mode with deployment
  - **Validates: Requirements 4.3, 4.4**

- [ ] 11. Implement subscription expiration handling
  - Add subscription status checking middleware
  - Implement immediate access revocation on expiration
  - Add frontend subscription status polling (every 5 minutes)
  - Create expiration modal with renewal options
  - _Requirements: 3.5_

- [ ]* 11.1 Write property test for subscription expiration access revocation
  - **Property 4: Subscription Expiration Access Revocation**
  - **Validates: Requirements 3.5**

- [ ] 12. Implement ROI Engine with dual-mode calculation
  - Create ROI engine service with Conservative and Growth modes
  - Implement Conservative mode with pessimistic assumptions
  - Implement Growth mode with optimistic assumptions
  - Add input validation for ROI parameters
  - Add schema validation for ROI output
  - Create side-by-side comparison UI
  - _Requirements: 6.3, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 12.1 Write property test for ROI engine mode consistency
  - **Property 8: ROI Engine Mode Consistency**
  - **Validates: Requirements 7.2, 7.3**

- [ ]* 12.2 Write unit tests for ROI engine input validation
  - Test validation with negative values
  - Test validation with out-of-range percentages
  - Test validation with unusually high cost per hour
  - **Validates: Requirements 7.4**

- [ ] 13. Implement Multi-Turn Diagnostic system
  - Create diagnostic state management with session tracking
  - Implement deterministic question flow logic
  - Add question selection based on previous answers
  - Implement state persistence across rounds
  - Add input validation against schemas
  - Ensure output compatibility with Blueprint generation
  - _Requirements: 6.2, 6.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 13.1 Write property test for multi-turn diagnostic determinism
  - **Property 7: Multi-Turn Diagnostic Determinism**
  - **Validates: Requirements 6.5, 8.1**

- [ ]* 13.2 Write property test for diagnostic state persistence
  - **Property 10: Diagnostic State Persistence**
  - **Validates: Requirements 8.3**

- [ ]* 13.3 Write property test for diagnostic-Blueprint compatibility
  - **Property 11: Diagnostic-Blueprint Compatibility**
  - **Validates: Requirements 8.5**

- [ ] 14. Implement tier upgrade permission propagation
  - Add immediate feature access update on tier upgrade
  - Update user session with new tier permissions
  - Refresh UI to show newly available features
  - Add audit logging for tier changes
  - _Requirements: 9.3, 9.4_

- [ ]* 14.1 Write property test for tier upgrade permission propagation
  - **Property 12: Tier Upgrade Permission Propagation**
  - **Validates: Requirements 9.3, 9.4**

- [ ] 15. Implement tier feature inheritance
  - Ensure higher tiers include all lower tier features
  - Add feature inheritance validation
  - Update tier comparison UI to show feature progression
  - _Requirements: 14.5_

- [ ]* 15.1 Write property test for tier feature inheritance
  - **Property 18: Tier Feature Inheritance**
  - **Validates: Requirements 14.5**

- [ ] 16. Checkpoint - Ensure all property tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Add error handling for tier validation
  - Implement TierAccessDeniedError with user-friendly messages
  - Add subscription expiration error handling
  - Add invalid tier transition validation
  - Add schema validation failure handling
  - Add ROI engine calculation error handling
  - _Requirements: 10.5_

- [ ]* 17.1 Write unit tests for error handling
  - Test access denied error message format
  - Test subscription expiration error response
  - Test invalid tier transition rejection
  - Test schema validation failure handling
  - **Validates: Requirements 10.5**

- [ ] 18. Integration testing and wiring
  - Test complete funnel flow: Free → Snapshot → Blueprint → Foundation
  - Test tier upgrade with permission propagation
  - Test dashboard access control across all tiers
  - Test Blueprint access for standalone vs subscription
  - Test ROI engine with Foundation+ access
  - Test Multi-turn diagnostic with Foundation+ access
  - Test conversion tracking across all tier transitions
  - _Requirements: All_

- [ ]* 18.1 Write integration tests for complete funnel flows
  - Test Free → Snapshot → Blueprint → Foundation progression
  - Test tier skipping (Free → Foundation directly)
  - Test conversion event creation at each step
  - **Validates: Requirements 2.1, 2.5, 5.5**

- [ ] 19. Final checkpoint - Ensure all tests pass and system is ready
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based and unit tests
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- All pricing updates maintain existing UI styling (no new animations or color changes)
