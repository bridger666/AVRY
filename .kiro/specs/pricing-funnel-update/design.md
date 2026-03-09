# Design Document: Pricing Funnel Update

## Overview

This design document outlines the technical approach for updating Aivory's pricing tiers and funnel structure. The update introduces a 6-tier pricing model with clear progression from free diagnostic through paid thinking products (Snapshot $15, Blueprint $79) to subscription-based infrastructure services (Foundation $29/mo, Pro $149/mo, Enterprise $499/mo).

The design maintains existing UI styling while implementing new backend tier logic, access control, and conversion tracking. The system enforces a clear funnel progression while allowing users to skip tiers, restricts dashboard access to subscribers only, and provides Blueprint access to both standalone purchasers and subscribers with different capabilities.

### Key Design Principles

1. **Funnel Clarity**: Each tier clearly communicates its value and the next upgrade path
2. **Access Control**: Dashboard and deployment features are subscription-gated
3. **Backward Compatibility**: Existing tier references (builder, operator, enterprise) continue to work
4. **UI Consistency**: All updates maintain existing design system patterns
5. **Structured Data**: All outputs are schema-validated for reliability

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
├─────────────────────────────────────────────────────────────┤
│  index.html          │  Pricing display & funnel CTAs       │
│  dashboard.html      │  Subscription dashboard UI           │
│  dashboard.js        │  Access control & tier display       │
│  dashboard-sub.html  │  Subscription selection page         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  tier_service.py     │  Tier state management               │
│  tier_validator.py   │  Feature access validation           │
│  diagnostic API      │  Multi-turn diagnostic logic         │
│  roi_engine.py       │  Dual-mode ROI calculations          │
└─────────────────────────────────────────────────────────────┘
```

### Tier Hierarchy

```
FREE (Entry)
  ↓
SNAPSHOT ($15 one-time) ─────┐
  ↓                           │ Thinking/Design Products
BLUEPRINT ($79 one-time) ────┘
  ↓
FOUNDATION ($29/mo) ─────┐
  ↓                       │
PRO ($149/mo)            │ Infrastructure/Activation Products
  ↓                       │
ENTERPRISE ($499/mo) ────┘
```



## Components and Interfaces

### 1. Tier Service (Backend)

**File**: `app/services/tier_service.py`

**Purpose**: Manages user tier state, tier transitions, and tier-based limits.

**Updated Tier Enum**:
```python
class TierLevel(str, Enum):
    FREE = "free"
    SNAPSHOT = "snapshot"
    BLUEPRINT = "blueprint"
    FOUNDATION = "foundation"
    PRO = "pro"
    ENTERPRISE = "enterprise"
    
    # Legacy aliases for backward compatibility
    BUILDER = "foundation"  # Maps to Foundation
    OPERATOR = "pro"        # Maps to Pro
    INTELLIGENCE = "enterprise"  # Maps to Enterprise
```

**Key Methods**:
- `get_user_tier(user_id: str) -> TierLevel`: Returns current tier for user
- `set_user_tier(user_id: str, tier: TierLevel) -> UserTierState`: Updates user tier
- `can_access_dashboard(user_id: str) -> bool`: Checks if user has subscription
- `can_deploy_blueprint(user_id: str) -> bool`: Checks if user can deploy (Foundation+)
- `get_tier_features(user_id: str) -> Dict[str, Any]`: Returns available features for tier
- `track_conversion(user_id: str, from_tier: TierLevel, to_tier: TierLevel)`: Logs tier upgrades

**Tier Limits Configuration**:
```python
TIER_LIMITS = {
    TierLevel.FREE: {
        "dashboard_access": False,
        "blueprint_access": False,
        "deployment": False,
        "multi_turn_diagnostic": False,
        "roi_engine": False
    },
    TierLevel.SNAPSHOT: {
        "dashboard_access": False,
        "blueprint_access": False,
        "deployment": False,
        "multi_turn_diagnostic": False,
        "roi_engine": False
    },
    TierLevel.BLUEPRINT: {
        "dashboard_access": False,
        "blueprint_access": True,
        "blueprint_mode": "view_only",
        "deployment": False,
        "multi_turn_diagnostic": False,
        "roi_engine": False
    },
    TierLevel.FOUNDATION: {
        "dashboard_access": True,
        "blueprint_access": True,
        "blueprint_mode": "live",
        "deployment": True,
        "multi_turn_diagnostic": True,
        "roi_engine": True,
        "max_workflows": 3,
        "max_executions": 2500,
        "intelligence_credits": 50
    },
    TierLevel.PRO: {
        "dashboard_access": True,
        "blueprint_access": True,
        "blueprint_mode": "live",
        "deployment": True,
        "multi_turn_diagnostic": True,
        "roi_engine": True,
        "max_workflows": 10,
        "max_executions": 10000,
        "intelligence_credits": 300
    },
    TierLevel.ENTERPRISE: {
        "dashboard_access": True,
        "blueprint_access": True,
        "blueprint_mode": "live",
        "deployment": True,
        "multi_turn_diagnostic": True,
        "roi_engine": True,
        "max_workflows": -1,  # unlimited
        "max_executions": 50000,
        "intelligence_credits": 2000
    }
}
```



### 2. Tier Validator (Backend)

**File**: `app/services/tier_validator.py`

**Purpose**: Validates feature access based on user tier and enforces access control rules.

**Key Methods**:
- `validate_dashboard_access(tier: str) -> bool`: Returns True if tier >= Foundation
- `validate_blueprint_access(tier: str) -> bool`: Returns True if tier >= Blueprint
- `validate_deployment_access(tier: str) -> bool`: Returns True if tier >= Foundation
- `validate_roi_engine_access(tier: str) -> bool`: Returns True if tier >= Foundation
- `validate_multi_turn_diagnostic_access(tier: str) -> bool`: Returns True if tier >= Foundation
- `get_blueprint_mode(tier: str) -> str`: Returns "view_only" or "live" based on tier
- `get_access_denial_message(tier: str, feature: str) -> str`: Returns user-friendly upgrade message

**Access Control Logic**:
```python
def validate_dashboard_access(tier: str) -> bool:
    """Dashboard requires subscription (Foundation or higher)"""
    subscription_tiers = ["foundation", "pro", "enterprise", "builder", "operator", "intelligence"]
    return tier.lower() in subscription_tiers

def validate_blueprint_access(tier: str) -> bool:
    """Blueprint available to standalone purchasers and subscribers"""
    allowed_tiers = ["blueprint", "foundation", "pro", "enterprise", "builder", "operator", "intelligence"]
    return tier.lower() in allowed_tiers

def get_blueprint_mode(tier: str) -> str:
    """Determine if Blueprint is view-only or live with deployment"""
    if tier.lower() == "blueprint":
        return "view_only"
    elif tier.lower() in ["foundation", "pro", "enterprise", "builder", "operator", "intelligence"]:
        return "live"
    else:
        return "none"
```

### 3. Frontend Pricing Display

**File**: `frontend/index.html`

**Updates Required**:

1. **Lifecycle Flow Section** (existing section to update):
   - Update Step 1: Change "$15 one-time" to "AI Readiness Snapshot - $15"
   - Update Step 2: Change "$99 one-time" to "AI System Blueprint - $79"
   - Update Step 3: Add Foundation tier as entry subscription at $29/mo

2. **Subscription Section** (existing section to update):
   - Rename "Builder" to "Foundation" with $29/mo pricing (was $199/mo)
   - Rename "Operator" to "Pro" with $149/mo pricing (was $499/mo)
   - Keep "Enterprise" at $499/mo (was $1200/mo)
   - Update feature lists to reflect new tier capabilities

**New Pricing Structure HTML**:
```html
<!-- Lifecycle Flow Section -->
<div class="lifecycle-flow">
    <!-- Step 1: Snapshot -->
    <div class="lifecycle-card">
        <div class="step-label">STEP 1</div>
        <h3 class="lifecycle-title">AI Readiness Snapshot</h3>
        <div class="lifecycle-price">$15 <span class="price-period">one-time</span></div>
        <p class="lifecycle-description">30-question diagnostic with business objective detection and automation opportunities.</p>
        <ul class="feature-list">
            <li>AI readiness score with category breakdown</li>
            <li>Business objective detection</li>
            <li>Gap analysis and bottleneck identification</li>
            <li>Recommended AI systems</li>
        </ul>
        <button class="pricing-button" onclick="startSnapshot()">Run AI Snapshot — $15</button>
    </div>

    <!-- Step 2: Blueprint -->
    <div class="lifecycle-card featured-lifecycle">
        <div class="popular-badge">MOST POPULAR</div>
        <div class="step-label">STEP 2</div>
        <h3 class="lifecycle-title">AI System Blueprint</h3>
        <div class="lifecycle-price">$79 <span class="price-period">one-time</span></div>
        <p class="lifecycle-description">Complete AI system architecture with workflow design and deployment plan.</p>
        <ul class="feature-list">
            <li>Full system architecture blueprint</li>
            <li>Workflow and agent structure design</li>
            <li>Deployment phases and complexity analysis</li>
            <li>ROI projections and impact estimates</li>
        </ul>
        <button class="pricing-button" onclick="startBlueprint()">Generate Blueprint — $79</button>
    </div>

    <!-- Step 3: Foundation -->
    <div class="lifecycle-card">
        <div class="step-label">STEP 3</div>
        <h3 class="lifecycle-title">Deploy with Foundation</h3>
        <div class="lifecycle-price">$29 <span class="price-period">/month</span></div>
        <p class="lifecycle-description">Activate your Blueprint and deploy AI systems to production.</p>
        <ul class="feature-list">
            <li>Live Blueprint activation</li>
            <li>Multi-turn guided diagnostic</li>
            <li>Dual-mode ROI engine</li>
            <li>3 active workflows, 2,500 executions/mo</li>
        </ul>
        <button class="pricing-button" onclick="selectPlan('foundation')">Start Foundation — $29/mo</button>
    </div>
</div>

<!-- Subscription Tiers -->
<div class="pricing-cards">
    <!-- Foundation Tier -->
    <div class="pricing-card pricing-card-foundation">
        <h3>Foundation</h3>
        <div class="price-tag">$29<span class="period">/month</span></div>
        <p class="card-subtitle">Deploy your first AI systems with Blueprint activation.</p>
        
        <ul class="feature-list">
            <li>✓ Live Blueprint activation</li>
            <li>✓ Multi-turn guided diagnostic</li>
            <li>✓ Dual-mode ROI engine (Conservative & Growth)</li>
            <li>✓ 3 Active Workflows</li>
            <li>✓ 2,500 Executions / month</li>
            <li>✓ 50 Intelligence Credits</li>
            <li>✓ Standard integrations</li>
            <li>✓ Email support</li>
        </ul>
        <button class="pricing-button" onclick="selectPlan('foundation')">Choose Foundation</button>
    </div>

    <!-- Pro Tier -->
    <div class="pricing-card featured-card pricing-card-pro">
        <div class="popular-badge">MOST POPULAR</div>
        <h3>Pro</h3>
        <div class="price-tag">$149<span class="period">/month</span></div>
        <p class="card-subtitle">Scale AI operations with enhanced limits and features.</p>
        
        <ul class="feature-list">
            <li>✓ All Foundation features</li>
            <li>✓ 10 Active Workflows</li>
            <li>✓ 10,000 Executions / month</li>
            <li>✓ 300 Intelligence Credits</li>
            <li>✓ Advanced integrations</li>
            <li>✓ Conditional logic & branching</li>
            <li>✓ Priority support</li>
        </ul>
        <button class="pricing-button primary" onclick="selectPlan('pro')">Choose Pro</button>
    </div>

    <!-- Enterprise Tier -->
    <div class="pricing-card pricing-card-enterprise">
        <h3>Enterprise</h3>
        <div class="price-tag">$499<span class="period">/month</span></div>
        <p class="card-subtitle">Deploy AI at scale with unlimited workflows and dedicated support.</p>
        
        <ul class="feature-list">
            <li>✓ All Pro features</li>
            <li>✓ Unlimited Workflows</li>
            <li>✓ 50,000 Executions / month</li>
            <li>✓ 2,000 Intelligence Credits</li>
            <li>✓ Advanced orchestration controls</li>
            <li>✓ Custom mechanism routing</li>
            <li>✓ SLA guarantee</li>
            <li>✓ Multi-team workspaces</li>
            <li>✓ Dedicated account manager</li>
        </ul>
        <button class="pricing-button" onclick="selectPlan('enterprise')">Choose Enterprise</button>
    </div>
</div>
```



### 4. Dashboard Access Control

**File**: `frontend/dashboard.js`

**Purpose**: Enforce tier-based access control on the frontend and display appropriate tier information.

**Access Control Flow**:
```javascript
function initDashboard() {
    const urlParams = new URLSearchParams(window.location.search);
    const tier = urlParams.get('tier') || sessionStorage.getItem('user_tier') || 'free';
    
    // Validate dashboard access
    if (!canAccessDashboard(tier)) {
        showUpgradePrompt(tier);
        return;
    }
    
    // Load dashboard for subscribed users
    DashboardState.selectedTier = tier;
    sessionStorage.setItem('user_tier', tier);
    renderDashboard();
}

function canAccessDashboard(tier) {
    const subscriptionTiers = ['foundation', 'pro', 'enterprise', 'builder', 'operator', 'intelligence'];
    return subscriptionTiers.includes(tier.toLowerCase());
}

function showUpgradePrompt(currentTier) {
    const upgradeMessages = {
        'free': 'Complete a diagnostic to unlock insights and upgrade options.',
        'snapshot': 'Upgrade to Blueprint ($79) for full system architecture, or Foundation ($29/mo) to deploy.',
        'blueprint': 'Upgrade to Foundation ($29/mo) to activate your Blueprint and deploy AI systems.'
    };
    
    const message = upgradeMessages[currentTier.toLowerCase()] || 'Upgrade to access the dashboard.';
    
    // Display upgrade modal
    showUpgradeModal({
        title: 'Dashboard Access Requires Subscription',
        message: message,
        primaryAction: 'View Subscription Plans',
        primaryCallback: () => window.location.href = 'index.html#pricing-section'
    });
}
```

**Tier Display Updates**:
```javascript
function updateTierIndicator(tier) {
    const tierBadge = document.querySelector('.tier-badge');
    const tierBadgeTop = document.getElementById('tierBadgeTop');
    
    const tierMap = {
        'free': 'Free',
        'snapshot': 'Snapshot',
        'blueprint': 'Blueprint',
        'foundation': 'Foundation',
        'pro': 'Pro',
        'enterprise': 'Enterprise',
        // Legacy mappings
        'builder': 'Foundation',
        'operator': 'Pro',
        'intelligence': 'Enterprise'
    };
    
    const tierName = tierMap[tier.toLowerCase()] || 'Free';
    
    if (tierBadge) {
        tierBadge.textContent = tierName;
        tierBadge.className = `tier-badge tier-${tier.toLowerCase()}`;
    }
    
    if (tierBadgeTop) {
        tierBadgeTop.textContent = tierName;
        tierBadgeTop.className = `topbar-stat-value tier-${tier.toLowerCase()}`;
    }
}
```

### 5. Subscription Page Updates

**File**: `frontend/dashboard-subscription.html`

**Updates Required**:
- Update tier names: Builder → Foundation, Operator → Pro
- Update pricing: Foundation $29/mo, Pro $149/mo, Enterprise $499/mo
- Update feature lists to include new Foundation features (Blueprint activation, Multi-turn diagnostic, ROI engine)
- Update stat displays to show new tier names

**Updated Top Bar**:
```html
<div class="top-bar">
    <div class="stat-card">
        <div class="stat-label">Plan</div>
        <div class="stat-value" id="plan-name">Foundation</div>
    </div>
    <div class="stat-card">
        <div class="stat-label">Intelligence Credits</div>
        <div class="stat-value">
            <span id="credits-balance">50</span> / <span id="credits-limit">50</span>
        </div>
    </div>
    <div class="stat-card">
        <div class="stat-label">Executions</div>
        <div class="stat-value">
            <span id="executions-used">0</span> / <span id="executions-limit">2,500</span>
        </div>
    </div>
</div>
```



## Data Models

### UserTierState

```python
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class UserTierState(BaseModel):
    user_id: str
    tier: TierLevel
    purchase_history: List[TierPurchase] = []
    subscription_status: Optional[str] = None  # "active", "expired", "cancelled"
    subscription_start_date: Optional[datetime] = None
    subscription_end_date: Optional[datetime] = None
    active_workflows: int = 0
    monthly_execution_count: int = 0
    intelligence_credits_balance: int = 0
    execution_reset_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class TierPurchase(BaseModel):
    tier: TierLevel
    purchase_type: str  # "one_time" or "subscription"
    amount: float
    currency: str = "USD"
    purchase_date: datetime
    transaction_id: Optional[str] = None
```

### TierFeatures

```python
class TierFeatures(BaseModel):
    tier: TierLevel
    dashboard_access: bool
    blueprint_access: bool
    blueprint_mode: str  # "none", "view_only", "live"
    deployment: bool
    multi_turn_diagnostic: bool
    roi_engine: bool
    max_workflows: int  # -1 for unlimited
    max_executions: int
    intelligence_credits: int
```

### ConversionEvent

```python
class ConversionEvent(BaseModel):
    user_id: str
    from_tier: TierLevel
    to_tier: TierLevel
    conversion_date: datetime
    conversion_path: str  # e.g., "free->snapshot", "blueprint->foundation"
    revenue: float
    currency: str = "USD"
```

### ROICalculation

```python
class ROICalculation(BaseModel):
    mode: str  # "conservative" or "growth"
    time_saved_hours_per_month: float
    cost_per_hour: float
    automation_percentage: float
    monthly_savings: float
    annual_savings: float
    implementation_cost: float
    payback_period_months: float
    three_year_roi_percentage: float
    assumptions: Dict[str, Any]
    calculated_at: datetime

class ROIEngineOutput(BaseModel):
    conservative: ROICalculation
    growth: ROICalculation
    recommended_mode: str
    confidence_level: str  # "high", "medium", "low"
```

### MultiTurnDiagnosticState

```python
class MultiTurnDiagnosticState(BaseModel):
    session_id: str
    user_id: str
    current_round: int
    total_rounds: int
    questions_answered: List[QuestionAnswer]
    next_question_id: Optional[str] = None
    diagnostic_complete: bool = False
    results: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

class QuestionAnswer(BaseModel):
    question_id: str
    question_text: str
    answer: Any
    answer_type: str  # "single_choice", "multiple_choice", "text", "numeric"
    round_number: int
    answered_at: datetime
```



## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Tier Categorization Consistency

*For any* tier in the system, it should be categorized as either a Thinking_Product (Snapshot, Blueprint) or Infrastructure_Product (Foundation, Pro, Enterprise), and the categorization should be consistent across all system components.

**Validates: Requirements 1.3, 1.4**

### Property 2: Funnel Progression Order

*For any* current tier and target tier, if the target tier is higher in the progression (Free → Snapshot → Blueprint → Foundation → Pro → Enterprise), the system should allow the upgrade regardless of whether intermediate tiers were purchased.

**Validates: Requirements 2.1, 2.5**

### Property 3: Subscription-Based Dashboard Access

*For any* user tier, dashboard access should be granted if and only if the tier is a subscription tier (Foundation, Pro, Enterprise, or legacy builder, operator, intelligence), and denied for all non-subscription tiers (Free, Snapshot, Blueprint).

**Validates: Requirements 3.1, 3.2, 3.3, 10.1**

### Property 4: Subscription Expiration Access Revocation

*For any* user with an expired subscription, all subscription-gated features (dashboard, deployment, ROI engine, multi-turn diagnostic) should be immediately inaccessible.

**Validates: Requirements 3.5**

### Property 5: Blueprint Access Independence

*For any* user with Blueprint tier or higher, Blueprint access should be granted, but the Blueprint mode (view-only vs live) should depend on whether the user has a subscription tier.

**Validates: Requirements 4.1, 4.2**

### Property 6: Conversion Tracking Completeness

*For any* tier upgrade transaction, a conversion event should be created with from_tier, to_tier, revenue, and timestamp, ensuring complete funnel analytics.

**Validates: Requirements 5.5**

### Property 7: Multi-Turn Diagnostic Determinism

*For any* set of diagnostic inputs, running the multi-turn diagnostic multiple times should produce identical question flows and identical final results, ensuring deterministic behavior.

**Validates: Requirements 6.5, 8.1**

### Property 8: ROI Engine Mode Consistency

*For any* set of input parameters, the Conservative mode ROI calculation should always produce lower or equal projections compared to the Growth mode calculation for the same inputs, reflecting pessimistic vs optimistic assumptions.

**Validates: Requirements 7.2, 7.3**

### Property 9: Schema Validation Universality

*For any* system output (Free diagnostic, Snapshot, Blueprint, ROI calculation), the output should validate against its defined JSON schema before being returned to the user.

**Validates: Requirements 7.4, 8.4, 15.5**

### Property 10: Diagnostic State Persistence

*For any* multi-turn diagnostic session, after answering N questions, the diagnostic state should contain exactly N question-answer pairs with correct round numbers and timestamps.

**Validates: Requirements 8.3**

### Property 11: Diagnostic-Blueprint Compatibility

*For any* completed multi-turn diagnostic output, the output structure should validate against the Blueprint generation input schema, ensuring seamless data flow.

**Validates: Requirements 8.5**

### Property 12: Tier Upgrade Permission Propagation

*For any* tier upgrade, all features available in the new tier should become immediately accessible, and the user's feature access checks should reflect the new permissions.

**Validates: Requirements 9.3, 9.4**

### Property 13: Legacy Tier Mapping Consistency

*For any* legacy tier name (builder, operator, intelligence), the system should map it to the corresponding new tier (Foundation, Pro, Enterprise) consistently across all components.

**Validates: Requirements 9.5**

### Property 14: Feature Access Control Consistency

*For any* subscription-gated feature (Blueprint deployment, ROI engine, multi-turn diagnostic), access should be granted if and only if the user has Foundation tier or higher.

**Validates: Requirements 10.2, 10.3, 10.4**

### Property 15: Access Denial Error Structure

*For any* denied feature access, the error response should validate against the error response schema and include a user-friendly upgrade message.

**Validates: Requirements 10.5**

### Property 16: Dashboard Tier-Based Redirect

*For any* non-subscription tier (Free, Snapshot, Blueprint), attempting to load the dashboard should result in a redirect to the upgrade page with an appropriate message.

**Validates: Requirements 13.2**

### Property 17: Dashboard Tier-Based Loading

*For any* subscription tier (Foundation, Pro, Enterprise), loading the dashboard should successfully render the dashboard interface with tier-appropriate features visible.

**Validates: Requirements 13.3, 13.4**

### Property 18: Tier Feature Inheritance

*For any* higher tier (Pro, Enterprise), all features available in lower subscription tiers (Foundation) should also be available, plus additional tier-specific features.

**Validates: Requirements 14.5**



## Error Handling

### Tier Validation Errors

**Scenario**: User attempts to access a feature not available in their tier

**Handling**:
```python
class TierAccessDeniedError(Exception):
    def __init__(self, user_tier: str, required_tier: str, feature: str):
        self.user_tier = user_tier
        self.required_tier = required_tier
        self.feature = feature
        self.message = self.get_user_friendly_message()
        super().__init__(self.message)
    
    def get_user_friendly_message(self) -> str:
        messages = {
            "dashboard": f"Dashboard access requires {self.required_tier} subscription or higher. Upgrade from {self.user_tier} to unlock.",
            "deployment": f"Blueprint deployment requires {self.required_tier} subscription. Upgrade to activate your Blueprint.",
            "roi_engine": f"ROI Engine requires {self.required_tier} subscription. Upgrade to access dual-mode ROI calculations.",
            "multi_turn_diagnostic": f"Multi-turn diagnostic requires {self.required_tier} subscription. Upgrade for guided diagnostic flow."
        }
        return messages.get(self.feature, f"This feature requires {self.required_tier} or higher.")
```

**Response Format**:
```json
{
    "error": "access_denied",
    "user_tier": "blueprint",
    "required_tier": "foundation",
    "feature": "dashboard",
    "message": "Dashboard access requires foundation subscription or higher. Upgrade from blueprint to unlock.",
    "upgrade_url": "/pricing#foundation",
    "upgrade_cta": "Upgrade to Foundation - $29/mo"
}
```

### Subscription Expiration

**Scenario**: User's subscription expires while using the system

**Handling**:
- Middleware checks subscription status on every request
- If expired, immediately return 403 with upgrade prompt
- Frontend polls subscription status every 5 minutes
- On expiration detection, show modal with renewal options

**Response Format**:
```json
{
    "error": "subscription_expired",
    "expired_tier": "foundation",
    "expiration_date": "2025-01-15T00:00:00Z",
    "message": "Your Foundation subscription expired on Jan 15, 2025. Renew to restore access.",
    "renewal_url": "/billing/renew",
    "renewal_cta": "Renew Foundation - $29/mo"
}
```

### Invalid Tier Transitions

**Scenario**: System attempts to set an invalid tier (e.g., downgrade from Pro to Snapshot)

**Handling**:
- Validate tier transitions before applying
- Allow downgrades only between subscription tiers (Pro → Foundation)
- Prevent downgrades from subscription to one-time purchase tiers
- Log all tier transition attempts for audit

**Validation Logic**:
```python
def validate_tier_transition(current_tier: TierLevel, new_tier: TierLevel) -> bool:
    # Allow all upgrades
    if get_tier_rank(new_tier) > get_tier_rank(current_tier):
        return True
    
    # Allow subscription downgrades
    subscription_tiers = [TierLevel.FOUNDATION, TierLevel.PRO, TierLevel.ENTERPRISE]
    if current_tier in subscription_tiers and new_tier in subscription_tiers:
        return True
    
    # Deny all other downgrades
    return False
```

### Schema Validation Failures

**Scenario**: Generated output fails schema validation

**Handling**:
- Catch validation errors before returning to user
- Log validation failures with full context
- Return generic error to user, specific error to logs
- Trigger alert for engineering team

**Response Format**:
```json
{
    "error": "output_generation_failed",
    "message": "We encountered an issue generating your results. Our team has been notified. Please try again in a few minutes.",
    "support_ticket_id": "ERR-2025-001234",
    "retry_after_seconds": 300
}
```

### ROI Engine Calculation Errors

**Scenario**: ROI engine receives invalid input parameters

**Handling**:
- Validate all inputs before calculation
- Provide specific error messages for each validation failure
- Suggest valid ranges for numeric inputs
- Allow partial calculations if some inputs are valid

**Validation Rules**:
```python
def validate_roi_inputs(inputs: Dict[str, Any]) -> List[str]:
    errors = []
    
    if inputs.get("time_saved_hours") is not None:
        if inputs["time_saved_hours"] < 0:
            errors.append("time_saved_hours must be non-negative")
        if inputs["time_saved_hours"] > 720:  # 30 days * 24 hours
            errors.append("time_saved_hours cannot exceed 720 hours per month")
    
    if inputs.get("cost_per_hour") is not None:
        if inputs["cost_per_hour"] < 0:
            errors.append("cost_per_hour must be non-negative")
        if inputs["cost_per_hour"] > 500:
            errors.append("cost_per_hour seems unusually high (>$500/hr)")
    
    if inputs.get("automation_percentage") is not None:
        if not 0 <= inputs["automation_percentage"] <= 100:
            errors.append("automation_percentage must be between 0 and 100")
    
    return errors
```



## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific tier configurations, UI rendering, and edge cases
- **Property tests**: Verify universal properties across all tier combinations and user states

### Unit Testing Focus

Unit tests should cover:

1. **Tier Configuration Examples**:
   - Test that Free tier has correct feature flags (all false except basic diagnostic)
   - Test that Foundation tier has correct pricing ($29/mo) and features
   - Test that Enterprise tier has unlimited workflows (-1)

2. **Specific UI Rendering**:
   - Test that homepage displays exactly 6 pricing tiers
   - Test that Foundation tier card shows "Blueprint activation" feature
   - Test that subscription page displays updated tier names

3. **Edge Cases**:
   - Test dashboard access with expired subscription
   - Test Blueprint access with standalone purchase vs subscription
   - Test tier upgrade from Blueprint to Foundation
   - Test legacy tier name mapping (builder → foundation)

4. **Error Conditions**:
   - Test access denial error message format
   - Test invalid tier transition rejection
   - Test ROI engine with negative input values
   - Test schema validation failure handling

5. **Integration Points**:
   - Test tier service and tier validator interaction
   - Test frontend tier check calling backend validation
   - Test conversion event creation on tier upgrade

### Property-Based Testing Focus

Property tests should verify universal correctness properties across all inputs. Each property test must:
- Run minimum 100 iterations
- Reference the design document property number
- Use the tag format: `Feature: pricing-funnel-update, Property {N}: {property_text}`

**Property Test Configuration** (using Python's Hypothesis library):

```python
from hypothesis import given, strategies as st
import hypothesis

# Configure for minimum 100 iterations
hypothesis.settings.register_profile("pricing_funnel", max_examples=100)
hypothesis.settings.load_profile("pricing_funnel")

# Define tier strategy
tier_strategy = st.sampled_from([
    "free", "snapshot", "blueprint", "foundation", "pro", "enterprise",
    "builder", "operator", "intelligence"  # Include legacy names
])

# Define subscription status strategy
subscription_status_strategy = st.sampled_from(["active", "expired", "cancelled", None])
```

**Property Test Examples**:

```python
@given(tier=tier_strategy)
def test_property_1_tier_categorization_consistency(tier):
    """
    Feature: pricing-funnel-update, Property 1: Tier Categorization Consistency
    For any tier, it should be categorized as either Thinking or Infrastructure product.
    """
    category = get_tier_category(tier)
    assert category in ["thinking", "infrastructure"]
    
    # Verify consistency
    if tier in ["snapshot", "blueprint"]:
        assert category == "thinking"
    elif tier in ["foundation", "pro", "enterprise", "builder", "operator", "intelligence"]:
        assert category == "infrastructure"

@given(current_tier=tier_strategy, target_tier=tier_strategy)
def test_property_2_funnel_progression_order(current_tier, target_tier):
    """
    Feature: pricing-funnel-update, Property 2: Funnel Progression Order
    For any current and target tier, if target is higher, upgrade should be allowed.
    """
    current_rank = get_tier_rank(current_tier)
    target_rank = get_tier_rank(target_tier)
    
    can_upgrade = validate_tier_upgrade(current_tier, target_tier)
    
    if target_rank > current_rank:
        assert can_upgrade == True
    # Note: downgrades have specific rules tested separately

@given(tier=tier_strategy)
def test_property_3_subscription_based_dashboard_access(tier):
    """
    Feature: pricing-funnel-update, Property 3: Subscription-Based Dashboard Access
    For any tier, dashboard access should be granted iff tier is subscription tier.
    """
    has_access = validate_dashboard_access(tier)
    is_subscription = tier in ["foundation", "pro", "enterprise", "builder", "operator", "intelligence"]
    
    assert has_access == is_subscription

@given(tier=tier_strategy, subscription_status=subscription_status_strategy)
def test_property_4_subscription_expiration_access_revocation(tier, subscription_status):
    """
    Feature: pricing-funnel-update, Property 4: Subscription Expiration Access Revocation
    For any user with expired subscription, all subscription features should be inaccessible.
    """
    if subscription_status == "expired":
        assert validate_dashboard_access(tier) == False
        assert validate_deployment_access(tier) == False
        assert validate_roi_engine_access(tier) == False
        assert validate_multi_turn_diagnostic_access(tier) == False

@given(
    inputs=st.fixed_dictionaries({
        "time_saved_hours": st.floats(min_value=0, max_value=720),
        "cost_per_hour": st.floats(min_value=0, max_value=500),
        "automation_percentage": st.floats(min_value=0, max_value=100)
    })
)
def test_property_8_roi_engine_mode_consistency(inputs):
    """
    Feature: pricing-funnel-update, Property 8: ROI Engine Mode Consistency
    For any inputs, Conservative mode should produce lower/equal projections than Growth mode.
    """
    conservative_result = calculate_roi(inputs, mode="conservative")
    growth_result = calculate_roi(inputs, mode="growth")
    
    assert conservative_result.monthly_savings <= growth_result.monthly_savings
    assert conservative_result.annual_savings <= growth_result.annual_savings
    assert conservative_result.three_year_roi_percentage <= growth_result.three_year_roi_percentage

@given(
    diagnostic_answers=st.lists(
        st.fixed_dictionaries({
            "question_id": st.text(min_size=1, max_size=50),
            "answer": st.one_of(st.text(), st.integers(), st.booleans())
        }),
        min_size=1,
        max_size=30
    )
)
def test_property_7_multi_turn_diagnostic_determinism(diagnostic_answers):
    """
    Feature: pricing-funnel-update, Property 7: Multi-Turn Diagnostic Determinism
    For any set of inputs, running diagnostic multiple times should produce identical results.
    """
    result1 = run_multi_turn_diagnostic(diagnostic_answers)
    result2 = run_multi_turn_diagnostic(diagnostic_answers)
    
    assert result1 == result2  # Exact equality for determinism

@given(
    output_type=st.sampled_from(["free_diagnostic", "snapshot", "blueprint", "roi_conservative", "roi_growth"]),
    output_data=st.dictionaries(st.text(), st.one_of(st.text(), st.integers(), st.floats(), st.booleans()))
)
def test_property_9_schema_validation_universality(output_type, output_data):
    """
    Feature: pricing-funnel-update, Property 9: Schema Validation Universality
    For any system output, it should validate against its defined schema.
    """
    schema = get_schema_for_output_type(output_type)
    
    # If output is generated by the system, it must validate
    if is_valid_output_structure(output_data):
        validation_result = validate_against_schema(output_data, schema)
        assert validation_result.is_valid == True

@given(legacy_tier=st.sampled_from(["builder", "operator", "intelligence"]))
def test_property_13_legacy_tier_mapping_consistency(legacy_tier):
    """
    Feature: pricing-funnel-update, Property 13: Legacy Tier Mapping Consistency
    For any legacy tier name, it should map consistently to new tier across all components.
    """
    expected_mapping = {
        "builder": "foundation",
        "operator": "pro",
        "intelligence": "enterprise"
    }
    
    # Test mapping in tier service
    mapped_tier_service = tier_service.normalize_tier_name(legacy_tier)
    assert mapped_tier_service == expected_mapping[legacy_tier]
    
    # Test mapping in tier validator
    mapped_tier_validator = tier_validator.normalize_tier_name(legacy_tier)
    assert mapped_tier_validator == expected_mapping[legacy_tier]
    
    # Consistency check
    assert mapped_tier_service == mapped_tier_validator

@given(higher_tier=st.sampled_from(["pro", "enterprise"]))
def test_property_18_tier_feature_inheritance(higher_tier):
    """
    Feature: pricing-funnel-update, Property 18: Tier Feature Inheritance
    For any higher tier, all Foundation features should be available plus additional features.
    """
    foundation_features = get_tier_features("foundation")
    higher_tier_features = get_tier_features(higher_tier)
    
    # All Foundation features should be in higher tier
    for feature, enabled in foundation_features.items():
        if enabled:
            assert higher_tier_features[feature] == True
    
    # Higher tier should have at least as many features
    foundation_feature_count = sum(1 for v in foundation_features.values() if v)
    higher_tier_feature_count = sum(1 for v in higher_tier_features.values() if v)
    assert higher_tier_feature_count >= foundation_feature_count
```

### Test Coverage Goals

- **Unit Test Coverage**: 90%+ for tier service, tier validator, and access control logic
- **Property Test Coverage**: All 18 correctness properties must have corresponding property tests
- **Integration Test Coverage**: All tier upgrade paths and conversion tracking
- **UI Test Coverage**: All 6 pricing tiers displayed correctly on homepage and subscription page

### Testing Tools

- **Backend**: pytest, Hypothesis (property-based testing)
- **Frontend**: Jest, React Testing Library (if applicable)
- **Integration**: pytest with API client
- **Schema Validation**: jsonschema library

