# Requirements Document: AIVORY Subscription Dashboard UI System

## Introduction

The AIVORY Subscription Dashboard UI System is a tier-gated frontend interface that provides workflow management, execution monitoring, AI decision insights, and intelligence credit tracking for three subscription tiers: Builder ($199/month), Operator ($499/month), and Enterprise ($1,200+/month). The system reuses the existing "AI Operating Partner" card design language and implements progressive feature unlocking based on subscription tier. This is a frontend-only implementation that displays data from existing backend services.

## Glossary

- **Dashboard**: Main interface for managing workflows and monitoring executions
- **Tier**: Subscription level (Builder, Operator, Enterprise) with specific feature access
- **Workflow**: Automated business process (Automation or Agentic type)
- **Intelligence_Credit**: Unit consumed when AI reasoning is executed
- **Execution**: Single run of a workflow
- **AI_Decision_Node**: Workflow step that requires AI reasoning
- **CMR**: Custom Mechanism Routing (Enterprise feature for multi-model orchestration)
- **Orchestration**: Coordination of multiple AI models and workflow steps
- **SLA**: Service Level Agreement status indicator (Enterprise only)
- **Workspace**: Multi-team environment selector (Enterprise only)

## Requirements

### Requirement 1: Design System Consistency

**User Story:** As a user, I want the dashboard UI to match the existing AI Operating Partner card design language, so that I have a consistent visual experience.

#### Acceptance Criteria

1. THE Dashboard SHALL use identical card proportions as AI Operating Partner cards
2. THE Dashboard SHALL use border-radius: 12px for all cards
3. THE Dashboard SHALL use background: rgba(255, 255, 255, 0.04) for cards
4. THE Dashboard SHALL use border: 1px solid rgba(255, 255, 255, 0.08) for cards
5. THE Dashboard SHALL use padding: 2.5rem for card interiors
6. THE Dashboard SHALL use Inter Tight font family with weight 300
7. THE Dashboard SHALL use transition: all 0.25s ease for hover effects
8. THE Dashboard SHALL maintain 8px spacing scale throughout

### Requirement 2: Hover Interaction System

**User Story:** As a user, I want smooth hover effects on all interactive cards, so that the interface feels responsive and polished.

#### Acceptance Criteria

1. WHEN user hovers over any card, THE card SHALL smoothly fill background to rgba(255, 255, 255, 0.07)
2. WHEN user hovers over any card, THE card SHALL elevate with transform: translateY(-2px)
3. WHEN user hovers over any card, THE border SHALL brighten to rgba(255, 255, 255, 0.18)
4. WHEN user hovers over any card, THE transition SHALL be smooth at 0.25s ease
5. THE hover effect SHALL NOT use harsh color shifts
6. THE hover effect SHALL include subtle shadow increase

### Requirement 3: Top Bar Layout

**User Story:** As a user, I want a consistent top bar across all tiers, so that I can quickly see my plan status and resource usage.

#### Acceptance Criteria

1. THE Top Bar SHALL display current plan name (Builder | Operator | Enterprise)
2. THE Top Bar SHALL display Intelligence Credits remaining with animated counter
3. THE Top Bar SHALL display Executions used / limit
4. THE Top Bar SHALL display SLA Status indicator (Enterprise only)
5. THE Top Bar SHALL span full width above main grid
6. THE Top Bar SHALL use card design language for stat displays

### Requirement 4: 2x2 Grid Layout

**User Story:** As a user, I want a clear 2x2 grid layout, so that I can easily navigate between workflow management and insights.

#### Acceptance Criteria

1. THE Dashboard SHALL use 2x2 grid layout for main content
2. Row 1 Left SHALL contain Workflow List Card
3. Row 1 Right SHALL contain Workflow Logic/Preview Card
4. Row 2 Left SHALL contain Execution Logs Card
5. Row 2 Right SHALL contain AI Decision Insight Panel
6. THE grid SHALL use consistent gap spacing
7. THE grid SHALL be responsive on mobile devices

### Requirement 5: Builder Tier Dashboard

**User Story:** As a Builder tier user, I want a simplified dashboard with linear workflow preview, so that I can manage my 3 workflows without complexity.

#### Acceptance Criteria

1. THE Builder Dashboard SHALL limit workflow list to maximum 3 workflows
2. THE Builder Dashboard SHALL display linear workflow visualization only (Trigger → Action → Action)
3. THE Builder Dashboard SHALL NOT display branching tree visualization
4. THE Builder Dashboard SHALL NOT display model routing breakdown
5. THE Builder Dashboard SHALL NOT display SLA panel
6. THE Builder Dashboard SHALL display basic execution logs (timestamp, status, execution ID)
7. THE Builder Dashboard SHALL display diagnostic summary card with AI Readiness Score, Strength Index, Bottleneck Index, Top Recommendations, Credits Used
8. THE Builder Dashboard SHALL show workflow limit indicator (X / 3)
9. THE Builder Dashboard SHALL show execution limit indicator (X / 2,500)
10. THE Builder Dashboard SHALL show intelligence credit usage (X / 50)

### Requirement 6: Operator Tier Dashboard

**User Story:** As an Operator tier user, I want advanced workflow visualization and AI decision insights, so that I can understand how my agentic workflows make decisions.

#### Acceptance Criteria

1. THE Operator Dashboard SHALL limit workflow list to maximum 10 workflows
2. THE Operator Dashboard SHALL display branching workflow tree visualization
3. THE Operator Dashboard SHALL show workflow type badges (Automation | Agentic)
4. THE Operator Dashboard SHALL display AI Decision Node in workflow tree
5. THE Operator Dashboard SHALL show retry loop indicators in workflow visualization
6. THE Operator Dashboard SHALL display AI Decision Insight Panel with: Decision ID, Reasoning explanation, Model used, Token usage, Intelligence credit cost, Confidence score
7. THE Operator Dashboard SHALL display error highlighting in workflow list
8. THE Operator Dashboard SHALL provide filterable execution logs (All | Errors | Agentic tabs)
9. THE Operator Dashboard SHALL show workflow limit indicator (X / 10)
10. THE Operator Dashboard SHALL show execution limit indicator (X / 10,000)
11. THE Operator Dashboard SHALL show intelligence credit usage (X / 300)

### Requirement 7: Enterprise Tier Dashboard

**User Story:** As an Enterprise tier user, I want unlimited workflows, multi-workspace support, and advanced orchestration insights, so that I can manage AI at scale.

#### Acceptance Criteria

1. THE Enterprise Dashboard SHALL support unlimited workflows
2. THE Enterprise Dashboard SHALL display workspace selector (Sales | Ops | AI Engineering)
3. THE Enterprise Dashboard SHALL display live agentic orchestration view with CMR routing
4. THE Enterprise Dashboard SHALL show multi-model routing breakdown (LLM-A, LLM-B, Rules Engine)
5. THE Enterprise Dashboard SHALL display credit cost per node
6. THE Enterprise Dashboard SHALL display SLA status indicator
7. THE Enterprise Dashboard SHALL display risk flags
8. THE Enterprise Dashboard SHALL display routing explanation
9. THE Enterprise Dashboard SHALL provide advanced log filtering (Team | Model | Risk | Status)
10. THE Enterprise Dashboard SHALL show execution limit indicator (X / 50,000)
11. THE Enterprise Dashboard SHALL show intelligence credit usage (X / 2,000)
12. THE Enterprise Dashboard SHALL display audit trail controls

### Requirement 8: Workflow List Card

**User Story:** As a user, I want to see all my workflows in a list, so that I can quickly access and manage them.

#### Acceptance Criteria

1. THE Workflow List Card SHALL display workflow name
2. THE Workflow List Card SHALL display status badge (Active | Paused | Draft)
3. THE Workflow List Card SHALL display last run timestamp
4. THE Workflow List Card SHALL provide Run button
5. THE Workflow List Card SHALL provide Edit button
6. THE Workflow List Card SHALL provide Retry button
7. THE Workflow List Card SHALL show workflow type badge (Operator+ only)
8. THE Workflow List Card SHALL highlight errors (Operator+ only)
9. THE Workflow List Card SHALL enforce tier limits visually

### Requirement 9: Workflow Visualization

**User Story:** As a user, I want to see how my workflows are structured, so that I can understand the logic flow.

#### Acceptance Criteria

1. THE Builder Tier SHALL display linear visualization: Trigger → Action → Action
2. THE Operator Tier SHALL display branching tree with AI Decision Nodes
3. THE Operator Tier SHALL show decision paths (Low Risk → Slack Notify, High Risk → Escalate)
4. THE Operator Tier SHALL display retry loop indicators
5. THE Enterprise Tier SHALL display CMR orchestration view
6. THE Enterprise Tier SHALL show multi-model routing (LLM-A, LLM-B, Rules Engine)
7. THE Enterprise Tier SHALL display audit log + risk score nodes
8. THE visualization SHALL use consistent node styling
9. THE visualization SHALL use arrows to show flow direction

### Requirement 10: Execution Logs Card

**User Story:** As a user, I want to see execution history, so that I can monitor workflow performance and troubleshoot issues.

#### Acceptance Criteria

1. THE Execution Logs Card SHALL display timestamp for each execution
2. THE Execution Logs Card SHALL display status indicator (✓ Success | ✗ Error)
3. THE Execution Logs Card SHALL display execution ID
4. THE Execution Logs Card SHALL display workflow name
5. THE Operator Tier SHALL provide filter tabs (All | Errors | Agentic)
6. THE Enterprise Tier SHALL provide advanced filters (Team | Model | Risk | Status)
7. THE logs SHALL be sorted by most recent first
8. THE logs SHALL be scrollable within card

### Requirement 11: AI Decision Insight Panel

**User Story:** As a user, I want to understand how AI makes decisions in my workflows, so that I can validate reasoning and optimize performance.

#### Acceptance Criteria

1. THE Builder Tier SHALL display diagnostic summary: AI Readiness Score, Strength Index, Bottleneck Index, Top Recommendations, Credits Used
2. THE Operator Tier SHALL display: Decision ID, Model Used, Token Usage, Intelligence Cost, Confidence Score, Reasoning Trace
3. THE Operator Tier SHALL show reasoning explanation (e.g., "Score 72 > Threshold 60", "Medium risk escalation")
4. THE Enterprise Tier SHALL display multi-model routing breakdown
5. THE Enterprise Tier SHALL show token usage per model (LLM-A: 812, LLM-B: 472)
6. THE Enterprise Tier SHALL display risk score
7. THE Enterprise Tier SHALL display SLA status
8. THE Enterprise Tier SHALL show audit trail status

### Requirement 12: Intelligence Credit Display

**User Story:** As a user, I want to see my intelligence credit balance and usage, so that I can manage my AI reasoning capacity.

#### Acceptance Criteria

1. THE Top Bar SHALL display current credit balance
2. THE Top Bar SHALL display tier credit limit
3. THE credit counter SHALL animate on deduction
4. THE credit display SHALL show warning indicator when balance is low (< 20% remaining)
5. THE credit display SHALL update in real-time (simulated)
6. THE credit display SHALL use mint green (#07d197) for healthy balance
7. THE credit display SHALL use warning color when low

### Requirement 13: Tier Limit Enforcement

**User Story:** As a user, I want clear visual indicators of my tier limits, so that I know when I'm approaching capacity.

#### Acceptance Criteria

1. THE Dashboard SHALL display workflow count vs limit (e.g., "3 / 3 workflows")
2. THE Dashboard SHALL display execution count vs limit (e.g., "1,247 / 2,500 executions")
3. THE Dashboard SHALL display credit usage vs limit (e.g., "22 / 50 credits")
4. THE Dashboard SHALL show warning indicator when approaching limit (> 80%)
5. THE Dashboard SHALL disable "Add Workflow" button when at limit
6. THE Dashboard SHALL show upgrade CTA when at limit

### Requirement 14: Responsive Design

**User Story:** As a user, I want the dashboard to work on mobile devices, so that I can monitor workflows on the go.

#### Acceptance Criteria

1. THE Dashboard SHALL stack grid to single column on mobile (< 768px)
2. THE Top Bar SHALL stack stats vertically on mobile
3. THE cards SHALL maintain readability on small screens
4. THE workflow visualization SHALL scale appropriately
5. THE touch targets SHALL be minimum 44px for mobile

### Requirement 15: Loading States

**User Story:** As a user, I want to see loading indicators, so that I know the system is processing my requests.

#### Acceptance Criteria

1. THE Dashboard SHALL display loading spinner when fetching data
2. THE Dashboard SHALL show skeleton screens for cards during load
3. THE Dashboard SHALL display "Executing workflow..." message during execution
4. THE Dashboard SHALL show progress indicator for long operations
5. THE loading states SHALL use consistent styling

### Requirement 16: Error Handling

**User Story:** As a user, I want clear error messages, so that I can understand and resolve issues.

#### Acceptance Criteria

1. THE Dashboard SHALL display error messages in red with clear text
2. THE Dashboard SHALL show retry button for failed operations
3. THE Dashboard SHALL highlight failed workflows in list
4. THE Dashboard SHALL show error details in execution logs
5. THE Dashboard SHALL provide actionable error messages

### Requirement 17: Workspace Selector (Enterprise Only)

**User Story:** As an Enterprise user, I want to switch between workspaces, so that I can manage multiple teams.

#### Acceptance Criteria

1. THE Enterprise Dashboard SHALL display workspace selector in top left
2. THE workspace selector SHALL show available workspaces (Sales | Ops | AI Engineering)
3. THE workspace selector SHALL filter workflows by selected workspace
4. THE workspace selector SHALL filter logs by selected workspace
5. THE workspace selector SHALL persist selection in session

### Requirement 18: Mock Data System

**User Story:** As a developer, I want mock data for all tiers, so that I can demonstrate the UI without backend integration.

#### Acceptance Criteria

1. THE Dashboard SHALL include mock workflow data for all tiers
2. THE Dashboard SHALL include mock execution log data
3. THE Dashboard SHALL include mock AI decision data
4. THE Dashboard SHALL simulate credit deduction on workflow execution
5. THE Dashboard SHALL simulate execution count increment
6. THE mock data SHALL be realistic and representative

### Requirement 19: Tier Switching

**User Story:** As a developer, I want to switch between tiers for testing, so that I can validate all tier-specific features.

#### Acceptance Criteria

1. THE Dashboard SHALL support tier parameter in URL (?tier=builder|operator|enterprise)
2. THE Dashboard SHALL render appropriate features for selected tier
3. THE Dashboard SHALL enforce tier limits correctly
4. THE Dashboard SHALL show/hide tier-specific components
5. THE tier switching SHALL be instant without page reload

### Requirement 20: No Backend Integration

**User Story:** As a developer, I want the dashboard to work without backend calls, so that I can develop and test the UI independently.

#### Acceptance Criteria

1. THE Dashboard SHALL NOT make API calls to backend
2. THE Dashboard SHALL use local state for all data
3. THE Dashboard SHALL simulate all operations (execute, retry, edit)
4. THE Dashboard SHALL use mock data exclusively
5. THE Dashboard SHALL clearly indicate prototype status
