# Design Document: AIVORY Subscription Dashboard UI System

## Overview

The AIVORY Subscription Dashboard UI System is a tier-gated frontend interface that provides progressive feature unlocking across three subscription tiers. The system reuses the existing "AI Operating Partner" card design language to maintain visual consistency. This is a frontend-only implementation using mock data and local state.

The design emphasizes:
- **Visual Consistency**: Exact replication of AI Operating Partner card design language
- **Progressive Enhancement**: Features unlock based on subscription tier
- **Smooth Interactions**: Hover effects and animations throughout
- **Tier Enforcement**: Clear visual indicators of limits and restrictions
- **No Backend Dependency**: Fully functional with mock data

## Architecture

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Dashboard UI Layer                       │
│  (Vanilla JS, tier-based component rendering)                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Mock Data Layer                           │
│  (Local state, simulated operations)                         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
URL Parameter (?tier=builder) → Tier Detection → Component Registry → Render Tier-Specific UI
                                                                              │
                                                                              ▼
User Interaction → Local State Update → UI Re-render → Simulated Operation
```

## Design System

### Color Palette

```css
/* Card Backgrounds */
--card-bg: rgba(255, 255, 255, 0.04);
--card-bg-hover: rgba(255, 255, 255, 0.07);

/* Borders */
--card-border: rgba(255, 255, 255, 0.08);
--card-border-hover: rgba(255, 255, 255, 0.18);

/* Brand Colors */
--brand-purple: #4020a5;
--mint-green: #07d197;
--button-purple: #3c229f;

/* Text Colors */
--text-primary: rgba(255, 255, 255, 0.95);
--text-secondary: rgba(255, 255, 255, 0.8);
--text-tertiary: rgba(255, 255, 255, 0.6);

/* Status Colors */
--success: #07d197;
--error: #ff4444;
--warning: #ffaa00;
```

### Typography

```css
/* Font Family */
font-family: 'Inter Tight', sans-serif;

/* Font Weights */
--weight-light: 300;
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
```

### Spacing Scale

```css
/* Base unit: 8px */
--space-1: 8px;
--space-2: 16px;
--space-3: 24px;
--space-4: 32px;
--space-5: 40px;
--space-6: 48px;
--space-8: 64px;
```

### Border Radius

```css
--radius-card: 12px;
--radius-button: 9999px; /* Fully rounded */
--radius-input: 8px;
```

### Shadows

```css
--shadow-card: 0 2px 8px rgba(0,0,0,0.1);
--shadow-card-hover: 0 4px 12px rgba(64,32,165,0.2);
```

### Transitions

```css
--transition-standard: all 0.25s ease;
```

## Component Architecture

### 1. Dashboard Container

**Purpose**: Root container that manages tier detection and component rendering

**Interface**:
```javascript
class DashboardContainer {
  constructor(tier) {
    this.tier = tier; // 'builder', 'operator', 'enterprise'
    this.state = {
      workflows: [],
      executions: [],
      credits: 0,
      creditLimit: 0,
      executionCount: 0,
      executionLimit: 0,
      selectedWorkspace: null // Enterprise only
    };
  }
  
  render() {
    // Render tier-specific layout
  }
  
  switchTier(newTier) {
    // Switch to different tier
  }
}
```

### 2. Top Bar Component

**Purpose**: Display plan status and resource usage

**Interface**:
```javascript
class TopBar {
  constructor(tier, state) {
    this.tier = tier;
    this.state = state;
  }
  
  render() {
    // Render plan name, credits, executions, SLA (if Enterprise)
  }
  
  updateCredits(newBalance) {
    // Animate credit counter
  }
}
```

**Layout**:
```
┌────────────────────────────────────────────────────────────┐
│ [Plan: Builder] [Credits: 22/50] [Executions: 1,247/2,500]│
└────────────────────────────────────────────────────────────┘
```

### 3. Workflow List Card

**Purpose**: Display and manage workflows

**Interface**:
```javascript
class WorkflowListCard {
  constructor(tier, workflows) {
    this.tier = tier;
    this.workflows = workflows;
    this.limit = this.getTierLimit();
  }
  
  getTierLimit() {
    return {
      'builder': 3,
      'operator': 10,
      'enterprise': Infinity
    }[this.tier];
  }
  
  render() {
    // Render workflow list with tier-specific features
  }
  
  executeWorkflow(workflowId) {
    // Simulate workflow execution
  }
}
```

**Builder Tier Layout**:
```
┌─────────────────────────────────┐
│ Workflows (3/3)                 │
├─────────────────────────────────┤
│ ▸ Lead Capture                  │
│   Status: Active                │
│   Last run: 2 hours ago         │
│   [Run] [Edit] [Retry]          │
├─────────────────────────────────┤
│ ▸ Slack Alert                   │
│   Status: Active                │
│   Last run: 5 minutes ago       │
│   [Run] [Edit] [Retry]          │
└─────────────────────────────────┘
```

**Operator Tier Layout**:
```
┌─────────────────────────────────┐
│ Workflows (7/10)                │
├─────────────────────────────────┤
│ ▸ Customer Onboarding           │
│   Type: Agentic                 │
│   Status: Active                │
│   [Run] [Edit]                  │
├─────────────────────────────────┤
│ ▸ Lead Scoring                  │
│   Type: Agentic                 │
│   Status: Active ⚠ Error        │
│   [Run] [Edit]                  │
└─────────────────────────────────┘
```

### 4. Workflow Visualization Card

**Purpose**: Display workflow logic and structure

**Interface**:
```javascript
class WorkflowVisualizationCard {
  constructor(tier, workflow) {
    this.tier = tier;
    this.workflow = workflow;
  }
  
  renderLinear() {
    // Builder tier: Trigger → Action → Action
  }
  
  renderBranching() {
    // Operator tier: Tree with AI Decision Nodes
  }
  
  renderOrchestration() {
    // Enterprise tier: CMR routing with multi-model
  }
}
```

**Builder Tier Visualization**:
```
Trigger → Action → Action
```

**Operator Tier Visualization**:
```
        [Trigger]
            ↓
    [AI Decision Node]
       ↙         ↘
  [Low Risk]  [High Risk]
      ↓            ↓
 Slack Notify   Escalate
      ↓            ↓
   Success      Resolve
```

**Enterprise Tier Visualization**:
```
    [Webhook Trigger]
            ↓
   [CMR Routing Engine]
     ↓      ↓      ↓
  LLM-A  LLM-B  Rules Engine
     ↓      ↓
 Decision  NLP Node
            ↓
      Action Nodes
            ↓
      Retry Logic
            ↓
  Audit Log + Risk Score
```

### 5. Execution Logs Card

**Purpose**: Display execution history

**Interface**:
```javascript
class ExecutionLogsCard {
  constructor(tier, executions) {
    this.tier = tier;
    this.executions = executions;
    this.filter = 'all'; // 'all', 'errors', 'agentic'
  }
  
  render() {
    // Render filtered execution logs
  }
  
  setFilter(filter) {
    // Update filter and re-render
  }
}
```

**Layout**:
```
┌─────────────────────────────────┐
│ Execution Logs                  │
│ [All] [Errors] [Agentic]        │
├─────────────────────────────────┤
│ 12:00 ✓ Lead Capture            │
│ 12:05 ✓ Slack Alert             │
│ 12:07 ✗ Tagging                 │
│ 12:10 ✓ Customer Onboarding     │
└─────────────────────────────────┘
```

### 6. AI Decision Insight Panel

**Purpose**: Display AI reasoning and decision details

**Interface**:
```javascript
class AIDecisionInsightPanel {
  constructor(tier, decisionData) {
    this.tier = tier;
    this.decisionData = decisionData;
  }
  
  renderBuilderView() {
    // Diagnostic summary
  }
  
  renderOperatorView() {
    // Decision details with reasoning
  }
  
  renderEnterpriseView() {
    // Multi-model breakdown
  }
}
```

**Builder Tier View**:
```
┌─────────────────────────────────┐
│ Diagnostic Summary              │
├─────────────────────────────────┤
│ AI Readiness Score: 68/100      │
│ Strength Index: 72              │
│ Bottleneck Index: 41            │
│ Top Recommendations: 3          │
│ Credits Used: 22/50             │
└─────────────────────────────────┘
```

**Operator Tier View**:
```
┌─────────────────────────────────┐
│ AI Decision Insight             │
├─────────────────────────────────┤
│ Decision ID: #D-9021            │
│ Model Used: Claude Code         │
│ Token Usage: 1,284              │
│ Intelligence Cost: 3 Credits    │
│ Confidence Score: 87%           │
│                                 │
│ Reasoning Trace:                │
│  - Score 72 > Threshold 60      │
│  - Medium risk escalation       │
└─────────────────────────────────┘
```

**Enterprise Tier View**:
```
┌─────────────────────────────────┐
│ Multi-Model Routing Breakdown   │
├─────────────────────────────────┤
│ NLP → BytePlus                  │
│ Reasoning → Claude Code         │
│                                 │
│ Token Per Model:                │
│  - LLM-A: 812                   │
│  - LLM-B: 472                   │
│                                 │
│ Risk Score: 0.42                │
│ SLA Status: Within Threshold    │
│ Audit Trail: Enabled            │
└─────────────────────────────────┘
```

### 7. Intelligence Credit Display

**Purpose**: Show credit balance with animations

**Interface**:
```javascript
class IntelligenceCreditDisplay {
  constructor(balance, limit) {
    this.balance = balance;
    this.limit = limit;
  }
  
  render() {
    // Render credit counter with warning if low
  }
  
  animateDeduction(amount) {
    // Animate counter decreasing
  }
  
  isLow() {
    return (this.balance / this.limit) < 0.2;
  }
}
```

**Display States**:
```
Healthy: 45/50 Credits (green)
Warning: 8/50 Credits (yellow)
Critical: 2/50 Credits (red)
```

### 8. Workspace Selector (Enterprise Only)

**Purpose**: Switch between team workspaces

**Interface**:
```javascript
class WorkspaceSelector {
  constructor(workspaces, selectedWorkspace) {
    this.workspaces = workspaces;
    this.selectedWorkspace = selectedWorkspace;
  }
  
  render() {
    // Render dropdown selector
  }
  
  selectWorkspace(workspaceId) {
    // Filter data by workspace
  }
}
```

**Layout**:
```
┌─────────────────────────────────┐
│ Workspace: [Sales ▼]            │
│   - Sales                       │
│   - Ops                         │
│   - AI Engineering              │
└─────────────────────────────────┘
```

## Mock Data Structure

### Workflow Data

```javascript
const mockWorkflows = {
  builder: [
    {
      id: 'wf-1',
      name: 'Lead Capture',
      status: 'active',
      lastRun: '2 hours ago',
      type: 'automation'
    },
    {
      id: 'wf-2',
      name: 'Slack Alert',
      status: 'active',
      lastRun: '5 minutes ago',
      type: 'automation'
    },
    {
      id: 'wf-3',
      name: 'Tagging',
      status: 'paused',
      lastRun: '1 day ago',
      type: 'automation'
    }
  ],
  operator: [
    {
      id: 'wf-4',
      name: 'Customer Onboarding',
      status: 'active',
      lastRun: '10 minutes ago',
      type: 'agentic',
      hasError: false
    },
    {
      id: 'wf-5',
      name: 'Lead Scoring',
      status: 'active',
      lastRun: '1 hour ago',
      type: 'agentic',
      hasError: true
    }
  ],
  enterprise: [
    {
      id: 'wf-6',
      name: 'Global Onboarding',
      status: 'active',
      lastRun: '5 minutes ago',
      type: 'agentic',
      workspace: 'sales'
    },
    {
      id: 'wf-7',
      name: 'Fraud Detection',
      status: 'active',
      lastRun: '2 minutes ago',
      type: 'agentic',
      workspace: 'ops'
    }
  ]
};
```

### Execution Log Data

```javascript
const mockExecutions = [
  {
    id: 'exec-1',
    workflowId: 'wf-1',
    workflowName: 'Lead Capture',
    timestamp: '12:00',
    status: 'success'
  },
  {
    id: 'exec-2',
    workflowId: 'wf-2',
    workflowName: 'Slack Alert',
    timestamp: '12:05',
    status: 'success'
  },
  {
    id: 'exec-3',
    workflowId: 'wf-3',
    workflowName: 'Tagging',
    timestamp: '12:07',
    status: 'error'
  }
];
```

### AI Decision Data

```javascript
const mockAIDecision = {
  operator: {
    decisionId: '#D-9021',
    modelUsed: 'Claude Code',
    tokenUsage: 1284,
    intelligenceCost: 3,
    confidenceScore: 87,
    reasoningTrace: [
      'Score 72 > Threshold 60',
      'Medium risk escalation'
    ]
  },
  enterprise: {
    multiModelBreakdown: {
      nlp: 'BytePlus',
      reasoning: 'Claude Code'
    },
    tokenPerModel: {
      'LLM-A': 812,
      'LLM-B': 472
    },
    riskScore: 0.42,
    slaStatus: 'Within Threshold',
    auditTrail: 'Enabled'
  }
};
```

## Tier Configuration

### Builder Tier

```javascript
const builderConfig = {
  name: 'Builder',
  price: 199,
  limits: {
    workflows: 3,
    executions: 2500,
    credits: 50
  },
  features: {
    workflowVisualization: 'linear',
    aiInsights: 'diagnostic',
    logFiltering: false,
    workspaceSelector: false,
    slaIndicator: false,
    errorHighlighting: false,
    retryVisualization: false
  }
};
```

### Operator Tier

```javascript
const operatorConfig = {
  name: 'Operator',
  price: 499,
  limits: {
    workflows: 10,
    executions: 10000,
    credits: 300
  },
  features: {
    workflowVisualization: 'branching',
    aiInsights: 'decision',
    logFiltering: true,
    workspaceSelector: false,
    slaIndicator: false,
    errorHighlighting: true,
    retryVisualization: true
  }
};
```

### Enterprise Tier

```javascript
const enterpriseConfig = {
  name: 'Enterprise',
  price: 1200,
  limits: {
    workflows: Infinity,
    executions: 50000,
    credits: 2000
  },
  features: {
    workflowVisualization: 'orchestration',
    aiInsights: 'multiModel',
    logFiltering: true,
    workspaceSelector: true,
    slaIndicator: true,
    errorHighlighting: true,
    retryVisualization: true
  }
};
```

## Hover Effect Implementation

### Card Hover CSS

```css
.dashboard-card {
  background: rgba(255, 255, 255, 0.04);
  padding: 2.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.25s ease;
  position: relative;
}

.dashboard-card:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.18);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 32, 165, 0.2);
}

.dashboard-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  opacity: 0;
  transition: opacity 0.25s ease;
  border-radius: 12px;
  pointer-events: none;
}

.dashboard-card:hover::before {
  opacity: 1;
}
```

## Responsive Breakpoints

```css
/* Desktop */
@media (min-width: 1024px) {
  .dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 2rem;
  }
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  .dashboard-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

/* Mobile */
@media (max-width: 767px) {
  .dashboard-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .dashboard-card {
    padding: 1.5rem;
  }
  
  .top-bar {
    flex-direction: column;
    gap: 1rem;
  }
}
```

## Animation Specifications

### Credit Deduction Animation

```javascript
function animateCreditDeduction(fromValue, toValue, duration = 500) {
  const startTime = performance.now();
  const difference = fromValue - toValue;
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function (ease-out)
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(fromValue - (difference * eased));
    
    updateCreditDisplay(currentValue);
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}
```

### Workflow Execution Simulation

```javascript
function simulateWorkflowExecution(workflowId) {
  // Show loading state
  showExecutionLoading(workflowId);
  
  // Simulate execution delay (1-3 seconds)
  const delay = Math.random() * 2000 + 1000;
  
  setTimeout(() => {
    // Deduct credits
    const creditCost = Math.floor(Math.random() * 5) + 1;
    animateCreditDeduction(currentCredits, currentCredits - creditCost);
    
    // Add execution log
    addExecutionLog({
      workflowId,
      timestamp: new Date().toLocaleTimeString(),
      status: Math.random() > 0.1 ? 'success' : 'error'
    });
    
    // Increment execution count
    incrementExecutionCount();
    
    // Hide loading state
    hideExecutionLoading(workflowId);
  }, delay);
}
```

## File Structure

```
frontend/
├── dashboard-subscription.html      # Main dashboard HTML
├── dashboard-subscription.css       # Dashboard styles
├── dashboard-subscription.js        # Dashboard logic
└── mock-data/
    ├── workflows.js                 # Mock workflow data
    ├── executions.js                # Mock execution data
    └── ai-decisions.js              # Mock AI decision data
```

## Implementation Notes

### Phase 1: Foundation
1. Create HTML structure with 2x2 grid layout
2. Implement design system CSS (colors, typography, spacing)
3. Create card hover effects
4. Build top bar component

### Phase 2: Builder Tier
1. Implement workflow list card (3 workflow limit)
2. Create linear workflow visualization
3. Build execution logs card
4. Add diagnostic summary panel
5. Implement credit display

### Phase 3: Operator Tier
1. Extend workflow list (10 workflow limit)
2. Create branching workflow visualization
3. Add AI decision insight panel
4. Implement log filtering
5. Add error highlighting

### Phase 4: Enterprise Tier
1. Extend workflow list (unlimited)
2. Create CMR orchestration visualization
3. Add workspace selector
4. Implement multi-model breakdown panel
5. Add SLA indicator
6. Implement advanced log filtering

### Phase 5: Interactions & Polish
1. Add workflow execution simulation
2. Implement credit deduction animation
3. Add loading states
4. Implement error handling
5. Add responsive design
6. Test all tier transitions

## Testing Strategy

### Visual Testing
1. Verify card design matches AI Operating Partner cards exactly
2. Test hover effects on all interactive elements
3. Validate spacing and typography consistency
4. Check responsive behavior on mobile/tablet/desktop

### Functional Testing
1. Test tier switching via URL parameter
2. Verify tier limits are enforced correctly
3. Test workflow execution simulation
4. Verify credit deduction animation
5. Test log filtering (Operator/Enterprise)
6. Test workspace switching (Enterprise)

### Cross-Browser Testing
1. Chrome
2. Firefox
3. Safari
4. Edge

## Accessibility Considerations

1. All interactive elements must have minimum 44px touch targets
2. Color contrast must meet WCAG AA standards
3. Keyboard navigation must work for all controls
4. Screen reader labels for all interactive elements
5. Focus indicators must be visible

## Performance Considerations

1. Use CSS transforms for animations (GPU-accelerated)
2. Debounce filter operations
3. Lazy load workflow visualizations
4. Optimize SVG workflow diagrams
5. Use requestAnimationFrame for smooth animations

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Appendix

### Workflow Visualization Node Styles

```css
.workflow-node {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.95);
  font-family: 'Inter Tight', sans-serif;
  font-weight: 300;
}

.workflow-node.ai-decision {
  border-color: #07d197;
  background: rgba(7, 209, 151, 0.08);
}

.workflow-arrow {
  stroke: rgba(255, 255, 255, 0.3);
  stroke-width: 2;
  fill: none;
}
```

### Status Badge Styles

```css
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  font-family: 'Inter Tight', sans-serif;
}

.status-badge.active {
  background: rgba(7, 209, 151, 0.15);
  color: #07d197;
}

.status-badge.paused {
  background: rgba(255, 170, 0, 0.15);
  color: #ffaa00;
}

.status-badge.error {
  background: rgba(255, 68, 68, 0.15);
  color: #ff4444;
}
```

### Tier Limit Indicator Styles

```css
.limit-indicator {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  font-family: 'Inter Tight', sans-serif;
  font-weight: 300;
}

.limit-indicator.warning {
  color: #ffaa00;
}

.limit-indicator.critical {
  color: #ff4444;
}
```
