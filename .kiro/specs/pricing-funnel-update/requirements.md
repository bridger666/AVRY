# Requirements Document: Pricing Funnel Update

## Introduction

This document specifies the requirements for updating Aivory's pricing tiers and funnel structure across the homepage, marketing system, and dashboard. The update introduces a new 6-tier pricing model with clear progression paths from free diagnostic through paid thinking products to subscription-based infrastructure services.

## Glossary

- **Free_Diagnostic**: 12-question AI readiness assessment (entry point, no cost)
- **Snapshot**: $15 AI readiness analysis product (30-question diagnostic, thinking/design product)
- **Blueprint**: $79 standalone AI system architecture design (thinking/design product)
- **Foundation_Subscription**: $29/month subscription tier (includes live Blueprint + guided diagnostic + ROI engine)
- **Pro_Subscription**: $149/month subscription tier (enhanced features and limits)
- **Enterprise_Subscription**: $499/month subscription tier (unlimited workflows, advanced features)
- **Thinking_Product**: Design and planning products (Snapshot and Blueprint)
- **Infrastructure_Product**: Deployment and activation products (subscriptions)
- **Dashboard**: Live operational interface for subscribed users
- **Tier_Service**: Backend service managing tier logic and access control
- **Tier_Validator**: Backend service validating feature access by tier
- **Funnel_Progression**: User journey from Free → $15 → $79 → $29 → $149 → $499
- **Conversion_Logic**: Rules governing tier upgrades and feature unlocking
- **ROI_Engine**: Dual-mode (Conservative vs Growth) return-on-investment calculator
- **Multi_Turn_Diagnostic**: Structured, deterministic diagnostic flow with multiple interaction rounds

## Requirements

### Requirement 1: Pricing Tier Structure

**User Story:** As a product manager, I want a clear 6-tier pricing structure, so that users understand the progression from free to enterprise.

#### Acceptance Criteria

1. THE Tier_Service SHALL define six distinct pricing tiers: Free, Snapshot ($15), Blueprint ($79), Foundation ($29/mo), Pro ($149/mo), and Enterprise ($499/mo)
2. WHEN a user views pricing information, THE System SHALL display all six tiers with their respective prices and features
3. THE System SHALL categorize Snapshot and Blueprint as Thinking_Products
4. THE System SHALL categorize Foundation, Pro, and Enterprise as Infrastructure_Products
5. THE System SHALL maintain existing UI styling without introducing new animations or color schemes

### Requirement 2: Funnel Progression Logic

**User Story:** As a user, I want a clear path from free diagnostic to paid products, so that I understand how to progress through Aivory's offerings.

#### Acceptance Criteria

1. THE System SHALL enforce the progression path: Free → Snapshot → Blueprint → Foundation → Pro → Enterprise
2. WHEN a user completes Free_Diagnostic, THE System SHALL present Snapshot as the next upgrade option
3. WHEN a user purchases Snapshot, THE System SHALL present Blueprint as the next upgrade option
4. WHEN a user purchases Blueprint, THE System SHALL present Foundation_Subscription as the next upgrade option
5. THE System SHALL allow users to skip intermediate tiers and purchase any higher tier directly

### Requirement 3: Dashboard Access Control

**User Story:** As a system administrator, I want to restrict dashboard access to subscribed users only, so that free and one-time purchasers cannot access live operational features.

#### Acceptance Criteria

1. WHEN a user attempts to access the dashboard, THE Tier_Validator SHALL verify the user has an active subscription (Foundation, Pro, or Enterprise)
2. IF a user has only Free_Diagnostic or Thinking_Product access, THEN THE System SHALL deny dashboard access and display upgrade prompt
3. WHEN a user has Foundation_Subscription or higher, THE System SHALL grant full dashboard access
4. THE System SHALL allow Blueprint standalone purchasers to view their blueprint without dashboard access
5. WHEN a subscription expires, THE System SHALL immediately revoke dashboard access

### Requirement 4: Blueprint Access Rules

**User Story:** As a user, I want to access my Blueprint whether I'm subscribed or not, so that I can reference my AI system design at any time.

#### Acceptance Criteria

1. THE System SHALL provide Blueprint access to users who purchased Blueprint standalone ($79)
2. THE System SHALL provide Blueprint access to users with Foundation_Subscription or higher
3. WHEN a Foundation subscriber accesses Blueprint, THE System SHALL display it as "live" with deployment capabilities
4. WHEN a standalone Blueprint purchaser accesses Blueprint, THE System SHALL display it as "view-only" without deployment capabilities
5. THE System SHALL persist Blueprint data regardless of subscription status

### Requirement 5: Conversion Priming Logic

**User Story:** As a marketing manager, I want each tier to prime users for the next upgrade, so that we maximize conversion through the funnel.

#### Acceptance Criteria

1. WHEN a user completes Snapshot, THE System SHALL highlight how Blueprint builds upon Snapshot insights
2. WHEN a user completes Blueprint, THE System SHALL emphasize Foundation_Subscription as the deployment path
3. THE System SHALL display conversion messaging that connects Thinking_Products to Infrastructure_Products
4. WHEN displaying upgrade prompts, THE System SHALL show the immediate next tier and its incremental value
5. THE System SHALL track conversion events from each tier to the next for analytics

### Requirement 6: Foundation Subscription Features

**User Story:** As a Foundation subscriber, I want access to live Blueprint activation, guided diagnostic, and ROI engine, so that I can deploy and optimize my AI systems.

#### Acceptance Criteria

1. THE Foundation_Subscription SHALL include live Blueprint with deployment capabilities
2. THE Foundation_Subscription SHALL include Multi_Turn_Diagnostic with structured interaction flow
3. THE Foundation_Subscription SHALL include ROI_Engine with Conservative and Growth modes
4. WHEN a Foundation subscriber accesses Blueprint, THE System SHALL enable deployment actions
5. THE Multi_Turn_Diagnostic SHALL be deterministic and produce consistent results for identical inputs

### Requirement 7: ROI Engine Dual-Mode Operation

**User Story:** As a Foundation subscriber, I want to calculate ROI in Conservative or Growth mode, so that I can model different business scenarios.

#### Acceptance Criteria

1. THE ROI_Engine SHALL provide two calculation modes: Conservative and Growth
2. WHEN Conservative mode is selected, THE ROI_Engine SHALL use pessimistic assumptions for projections
3. WHEN Growth mode is selected, THE ROI_Engine SHALL use optimistic assumptions for projections
4. THE ROI_Engine SHALL output structured, schema-validated results
5. THE System SHALL display both modes side-by-side for comparison

### Requirement 8: Multi-Turn Diagnostic Structure

**User Story:** As a Foundation subscriber, I want a guided multi-turn diagnostic, so that I receive deeper insights through structured interaction.

#### Acceptance Criteria

1. THE Multi_Turn_Diagnostic SHALL follow a deterministic question flow based on previous answers
2. WHEN a user provides an answer, THE System SHALL select the next question based on predefined logic
3. THE Multi_Turn_Diagnostic SHALL maintain state across multiple interaction rounds
4. THE System SHALL validate all diagnostic inputs against defined schemas
5. THE Multi_Turn_Diagnostic SHALL produce structured output compatible with Blueprint generation

### Requirement 9: Tier Service Backend Updates

**User Story:** As a backend developer, I want the Tier_Service to support the new 6-tier structure, so that access control works correctly across the system.

#### Acceptance Criteria

1. THE Tier_Service SHALL define tier levels: FREE, SNAPSHOT, BLUEPRINT, FOUNDATION, PRO, ENTERPRISE
2. THE Tier_Service SHALL store user tier state including current tier and purchase history
3. WHEN a user upgrades tiers, THE Tier_Service SHALL update user state and grant new permissions
4. THE Tier_Service SHALL provide methods to check tier eligibility for specific features
5. THE Tier_Service SHALL maintain backward compatibility with existing tier references (builder, operator, enterprise)

### Requirement 10: Tier Validator Backend Updates

**User Story:** As a backend developer, I want the Tier_Validator to enforce new access rules, so that features are properly gated by tier.

#### Acceptance Criteria

1. THE Tier_Validator SHALL validate dashboard access requires Foundation_Subscription or higher
2. THE Tier_Validator SHALL validate Blueprint deployment requires Foundation_Subscription or higher
3. THE Tier_Validator SHALL validate ROI_Engine access requires Foundation_Subscription or higher
4. THE Tier_Validator SHALL validate Multi_Turn_Diagnostic access requires Foundation_Subscription or higher
5. THE Tier_Validator SHALL return structured error responses when access is denied

### Requirement 11: Frontend Pricing Display Updates

**User Story:** As a user, I want to see the new pricing structure on the homepage, so that I understand all available options.

#### Acceptance Criteria

1. THE Homepage SHALL display the 6-tier pricing structure in the pricing section
2. WHEN displaying tiers, THE System SHALL group Thinking_Products separately from Infrastructure_Products
3. THE Homepage SHALL show Free_Diagnostic as the entry point with prominent CTA
4. THE Homepage SHALL display Snapshot ($15) and Blueprint ($79) as sequential thinking products
5. THE Homepage SHALL display Foundation ($29/mo), Pro ($149/mo), and Enterprise ($499/mo) as subscription tiers

### Requirement 12: Dashboard Subscription Page Updates

**User Story:** As a user viewing the subscription page, I want to see the new tier options, so that I can choose the right subscription for my needs.

#### Acceptance Criteria

1. THE Subscription_Page SHALL display Foundation, Pro, and Enterprise tiers with updated pricing
2. THE Subscription_Page SHALL highlight Foundation as the entry-level subscription at $29/mo
3. WHEN displaying Foundation tier, THE System SHALL list Blueprint activation, Multi_Turn_Diagnostic, and ROI_Engine as included features
4. THE Subscription_Page SHALL maintain existing visual design and styling
5. THE Subscription_Page SHALL provide clear upgrade paths from Foundation to Pro to Enterprise

### Requirement 13: Dashboard Access Logic Updates

**User Story:** As a developer, I want the dashboard.js to enforce new access rules, so that only subscribed users can access live features.

#### Acceptance Criteria

1. THE Dashboard_JS SHALL check user tier on page load
2. IF user tier is FREE, SNAPSHOT, or BLUEPRINT, THEN THE Dashboard_JS SHALL redirect to upgrade page
3. IF user tier is FOUNDATION, PRO, or ENTERPRISE, THEN THE Dashboard_JS SHALL load dashboard interface
4. THE Dashboard_JS SHALL display tier-appropriate features based on subscription level
5. THE Dashboard_JS SHALL handle tier validation errors gracefully with user-friendly messages

### Requirement 14: Tier Feature Mapping

**User Story:** As a product manager, I want clear feature differentiation across tiers, so that users understand the value of upgrading.

#### Acceptance Criteria

1. THE System SHALL map Free_Diagnostic to basic readiness score and insights
2. THE System SHALL map Snapshot to 30-question diagnostic with category breakdown and recommendations
3. THE System SHALL map Blueprint to full system architecture with workflow design and agent structure
4. THE System SHALL map Foundation_Subscription to Blueprint + deployment + Multi_Turn_Diagnostic + ROI_Engine
5. THE System SHALL map Pro and Enterprise to Foundation features plus enhanced limits and capabilities

### Requirement 15: Structured Output Validation

**User Story:** As a system architect, I want all diagnostic and ROI outputs to be schema-validated, so that downstream systems can reliably process the data.

#### Acceptance Criteria

1. THE System SHALL define JSON schemas for Free_Diagnostic output
2. THE System SHALL define JSON schemas for Snapshot output
3. THE System SHALL define JSON schemas for Blueprint output
4. THE System SHALL define JSON schemas for ROI_Engine output (both Conservative and Growth modes)
5. WHEN generating any output, THE System SHALL validate against the appropriate schema before returning results

### Requirement 16: Existing UI Style Preservation

**User Story:** As a designer, I want the UI updates to maintain existing styling, so that the user experience remains consistent.

#### Acceptance Criteria

1. THE System SHALL preserve all existing color schemes, fonts, and spacing
2. THE System SHALL NOT introduce new animations or transitions beyond existing patterns
3. THE System SHALL maintain existing button styles and hover states
4. THE System SHALL preserve existing card layouts and grid structures
5. THE System SHALL ensure new pricing displays match existing design system patterns
