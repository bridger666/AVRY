# Design Document: Progressive SaaS Dashboard System

## Overview

The Progressive SaaS Dashboard System is a unified, single-codebase dashboard that dynamically renders tier-specific components based on user subscription level. The system uses a component registry pattern with progressive enhancement, where each tier (Free, Snapshot, Blueprint, Operator) unlocks additional UI panels, metrics, and navigation items without requiring separate dashboard implementations.

The architecture emphasizes:
- Single source of truth for all tier configurations
- Component-based rendering with lazy loading
- Efficient DOM manipulation and state management
- Seamless tier transitions without page reloads
- Backend API compatibility with existing diagnostic flows

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Dashboard Entry Point                    │
│                    (dashboard.html + CSS)                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Dashboard Controller                       │
│  - Tier Detection (URL/sessionStorage)                      │
│  - State Management (DashboardState)                        │
│  - Component Registry                                        │
│  - Event Bus                                                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┬──────────────┐
        ▼               ▼               ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Tier 1      │ │  Tier 2      │ │  Tier 3      │ │  Tier 4      │
│  Components  │ │  Components  │ │  Components  │ │  Components  │
│  (Free)      │ │  (Snapshot)  │ │  (Blueprint) │ │  (Operator)  │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │                │
       └────────────────┴────────────────┴────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  - API Client (fetch wrapper)                               │
│  - SessionStorage Manager                                    │
│  - Mock Data Provider (Tier 4)                              │
└─────────────────────────────────────────────────────────────┘
```

### Component Registry Pattern

The dashboard uses a component registry that maps tier levels to component sets:

```javascript
ComponentRegistry = {
  tier1: [MetricCards, StrengthSignal, BottleneckSignal, QuickRecs, UpgradeCTA],
  tier2: [MetricCards, CategoryBreakdown, TopRecommendations, PhasesSuggestion, UpgradeCTA],
  tier3: [MetricCards, SystemArchitecture, WorkflowViz, AgentCards, DeploymentTimeline, ActivateCTA],
  tier4: [MetricCards, SystemsTable, ExecutionLogs, LogicInsight, IntelligencePanel]
}
```

Each component is self-contained with:
- Render method
- Data binding
- Event handlers
- Cleanup method

## Components and Interfaces

### 1. Dashboard Controller

**Responsibility**: Orchestrate tier detection, component lifecycle, and state management

**Interface**:
```javascript
class DashboardController {
  constructor()
  detectTier(): number
  initializeState(): void
  renderDashboard(): void
  updateTier(newTier: number): void
  cleanup(): void
}
```

**Key Methods**:
- `detectTier()`: Checks URL parameter `?tier=X`, falls back to sessionStorage, defaults to 1
- `initializeState()`: Loads data from sessionStorage or API
- `renderDashboard()`: Orchestrates component rendering based on tier
- `updateTier()`: Handles tier transitions (e.g., after upgrade)

### 2. Component Base Class

**Responsibility**: Provide common interface for all dashboard components

**Interface**:
```javascript
class DashboardComponent {
  constructor(containerId: string, data: any)
  render(): void
  update(newData: any): void
  cleanup(): void
  isVisible(tier: number): boolean
}
```

### 3. Sidebar Navigation Component

**Responsibility**: Render tier-appropriate navigation menu

**Interface**:
```javascript
class SidebarNavigation extends DashboardComponent {
  constructor(tier: number)
  getNavigationItems(): NavigationItem[]
  setActiveItem(itemId: string): void
  render(): void
}
```

**Navigation Items by Tier**:
```javascript
const navigationMap = {
  1: ['dashboard', 'upgrade'],
  2: ['dashboard', 'reports', 'upgrade'],
  3: ['dashboard', 'reports', 'architecture', 'upgrade'],
  4: ['dashboard', 'systems', 'reports', 'logs', 'intelligence', 'help']
}
```

### 4. Metric Cards Component

**Responsibility**: Display top-level metrics appropriate to tier

**Interface**:
```javascript
class MetricCards extends DashboardComponent {
  constructor(tier: number, data: any)
  getMetricsForTier(tier: number): Metric[]
  renderCard(metric: Metric): HTMLElement
  render(): void
}
```

**Metrics by Tier**:
- Tier 1: AI Readiness Lite, Workflow Health, Automation Exposure, Org Readiness
- Tier 2: Readiness Score (0-100), Strength Index, Bottleneck Index, Priority Score
- Tier 3: Selected AI System, Automation %, Time Saved, ROI
- Tier 4: Active Systems, Monthly Runs, Time Saved, Intelligence Credits, Priority Alerts

### 5. Data Manager

**Responsibility**: Handle data fetching, caching, and persistence

**Interface**:
```javascript
class DataManager {
  fetchDiagnosticData(tier: number): Promise<any>
  getCachedData(tier: number): any | null
  setCachedData(tier: number, data: any): void
  clearCache(): void
}
```

**Storage Keys**:
- `dashboard_tier`: Current tier level
- `dashboard_tier1_data`: Free diagnostic data
- `dashboard_tier2_data`: Snapshot diagnostic data
- `dashboard_tier3_data`: Blueprint diagnostic data
- `dashboard_tier4_data`: Operator mock data

### 6. API Client

**Responsibility**: Wrapper for backend API calls

**Interface**:
```javascript
class APIClient {
  constructor(baseURL: string)
  get(endpoint: string): Promise<any>
  post(endpoint: string, data: any): Promise<any>
  handleError(error: Error): void
}
```

**Endpoints**:
- `/api/v1/diagnostic/run` - Free diagnostic (12Q)
- `/api/v1/diagnostic/snapshot` - Snapshot diagnostic (30Q)
- `/api/v1/diagnostic/deep` - Blueprint diagnostic
- Mock data for Operator tier (no endpoint yet)

### 7. Tier-Specific Components

#### Tier 1 Components
- **StrengthSignalCard**: Display top organizational strengths
- **BottleneckSignalCard**: Display primary workflow bottlenecks
- **QuickRecommendationsCard**: Show 2-3 actionable items
- **DownloadLiteBadgeButton**: Trigger SVG badge download

#### Tier 2 Components
- **CategoryBreakdownPanel**: Visualize Workflow, Data, Automation, Organization scores
- **TopRecommendationsPanel**: Display top 3 AI system recommendations with priority
- **DeploymentPhaseSuggestion**: Show suggested phase (Pilot/Rollout/Scale)

#### Tier 3 Components
- **SystemArchitecturePanel**: Display system overview and description
- **WorkflowArchitectureViz**: Visual representation of workflow blocks
- **AgentStructureCards**: Grid of AI agent role cards
- **DeploymentPhasesTimeline**: Timeline visualization of deployment phases
- **ConfidenceLevelIndicator**: Visual confidence meter

#### Tier 4 Components
- **AISystemsTable**: Table with Name, Type, Status, Health, Last Run, Actions columns
- **ExecutionLogsPanel**: Recent system execution logs
- **AILogicInsightPanel**: Mini workflow diagram visualization
- **IntelligenceInsightsPanel**: Bottleneck detection, anomaly signals, optimization suggestions

## Data Models

### DashboardState

```javascript
{
  tier: number,              // 1-4
  language: string,          // 'en' | 'id'
  data: {
    tier1?: FreeDiagnosticResult,
    tier2?: SnapshotResult,
    tier3?: BlueprintResult,
    tier4?: OperatorData
  },
  activeView: string,        // 'dashboard' | 'reports' | 'architecture' | etc.
  isLoading: boolean
}
```

### FreeDiagnosticResult (Tier 1)

```javascript
{
  score: number,                    // 0-100
  category: string,                 // e.g., "Emerging"
  category_explanation: string,
  insights: string[],
  recommendation: string,
  badge_svg: string
}
```

### SnapshotResult (Tier 2)

```javascript
{
  readiness_score: number,          // 0-100
  readiness_level: string,          // "Low" | "Medium" | "High"
  strength_index: number,           // 0-100
  strength_category: string,
  bottleneck_index: number,         // 0-100
  bottleneck_category: string,
  priority_score: number,           // 0-100
  primary_objective: string,
  deployment_phase_suggestion: string,  // "pilot" | "rollout" | "scale"
  category_scores: {
    workflow: number,
    data: number,
    automation: number,
    organization: number
  },
  top_recommendations: string[]     // Array of system names
}
```

### BlueprintResult (Tier 3)

```javascript
{
  executive_summary: string,
  system_architecture: {
    system_name: string,
    core_objective: string,
    operating_model: string,
    confidence_level: string        // "High" | "Medium" | "Low"
  },
  workflow_architecture: {
    trigger_logic: string,
    core_steps: string[],
    decision_conditions: string[],
    escalation_paths: string[]
  },
  agent_structure: Array<{
    agent_name: string,
    role: string,
    responsibilities: string[]
  }>,
  impact_projection: {
    automation_potential_percent: number,
    time_saved_estimate: string,
    roi_projection: string
  },
  deployment_phases: string[],
  recommended_subscription_tier: string
}
```

### OperatorData (Tier 4)

```javascript
{
  tier_info: {
    name: string,                   // "Builder" | "Operator" | "Enterprise"
    price: number,
    workflows: number | string,     // number or "∞"
    executions: number,
    credits: number
  },
  active_systems: Array<{
    id: string,
    name: string,
    type: string,
    status: string,                 // "Active" | "Idle" | "Error"
    health: number,                 // 0-100
    last_run: string,               // ISO timestamp
    executions_count: number
  }>,
  execution_logs: Array<{
    timestamp: string,
    system_name: string,
    status: string,
    duration_ms: number,
    message: string
  }>,
  intelligence_insights: {
    bottleneck_detection: string[],
    anomaly_signals: string[],
    optimization_suggestions: string[]
  },
  usage_metrics: {
    executions_used: number,
    executions_limit: number,
    credits_used: number,
    credits_limit: number
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified the following patterns:

**Redundancy Analysis**:
1. Requirements 4.1-4.7, 5.1-5.7, 6.1-6.8, 7.1-7.6 all test component presence for specific tiers - these can be consolidated into a single property about tier-component mapping
2. Requirements 10.1-10.4 test navigation items for specific tiers - these are examples that validate a general navigation property
3. Requirements 11.1-11.4 test upgrade CTA links for specific tiers - these are examples of a general upgrade flow property
4. Requirements 12.1-12.3 test download buttons for specific tiers - these are examples of a general download availability property
5. Requirements 8.1-8.3 test specific brand colors - these can be combined into a single brand color compliance property
6. Requirements 16.1-16.2 both test sessionStorage persistence - these can be combined

**Properties to Combine**:
- Tier-specific component rendering (3.1-3.4, 4.1-7.6) → Single property about progressive component unlocking
- Navigation items per tier (10.1-10.4) → Single property about navigation expansion
- Design system colors (8.1-8.3) → Single property about brand color compliance
- SessionStorage persistence (16.1-16.2, 9.5) → Single property about data persistence

**Unique Properties to Keep**:
- Tier detection from URL (2.1)
- Tier change without reload (1.4)
- API response parsing (9.1-9.2)
- Error handling (9.4)
- Performance requirements (14.1-14.2)
- Responsive design (13.5)

### Correctness Properties

Property 1: Tier Detection from URL
*For any* valid tier value (1-4) in the URL parameter `?tier=X`, the dashboard should detect and apply that tier, storing it in sessionStorage
**Validates: Requirements 2.1, 2.4**

Property 2: Progressive Component Unlocking
*For any* tier level T, the dashboard should display all components from tiers 1 through T, and hide all components from tiers greater than T
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

Property 3: Tier Transition Without Reload
*For any* tier change from tier A to tier B, the dashboard should update the displayed components without triggering a page reload
**Validates: Requirements 1.4**

Property 4: Navigation Expansion by Tier
*For any* tier level, the sidebar navigation should display exactly the navigation items defined for that tier and all lower tiers
**Validates: Requirements 10.1, 10.2, 10.3, 10.4**

Property 5: Active Navigation Highlighting
*For any* active view, the corresponding navigation item should have the active CSS class applied
**Validates: Requirements 10.5**

Property 6: Navigation Click Routing
*For any* navigation item click, the dashboard should navigate to the corresponding view without page reload
**Validates: Requirements 10.6**

Property 7: Brand Color Compliance
*For all* rendered elements, the CSS should use only the defined brand colors (#4020a5, #07d197, #3c229f) for purple and green elements
**Validates: Requirements 8.1, 8.2, 8.3**

Property 8: Typography Consistency
*For all* text elements, the font-family should be 'Inter Tight' and default font-weight should be 300
**Validates: Requirements 8.4**

Property 9: Button Border Radius
*For all* button elements, the border-radius should be 9999px
**Validates: Requirements 8.5**

Property 10: No Gradient Usage
*For all* CSS styles, background gradients should not be used (except in explicitly allowed cases like score cards)
**Validates: Requirements 8.6**

Property 11: 8px Spacing Scale
*For all* margin and padding values in CSS, the values should be multiples of 8px
**Validates: Requirements 8.7**

Property 12: Snapshot API Response Parsing
*For any* valid Snapshot API response, the dashboard should successfully extract readiness_score, strength_index, bottleneck_index, top_recommendations, priority_score, deployment_phase_suggestion, and category_scores
**Validates: Requirements 9.1**

Property 13: Blueprint API Response Parsing
*For any* valid Blueprint API response, the dashboard should successfully extract system_architecture, workflow_architecture, agent_structure, impact_projection, and deployment_phases
**Validates: Requirements 9.2**

Property 14: Graceful Error Handling
*For any* malformed or missing API data, the dashboard should not crash and should display fallback values
**Validates: Requirements 9.4**

Property 15: Data Persistence Round Trip
*For any* API response data stored in sessionStorage, retrieving and parsing it should produce equivalent data structures
**Validates: Requirements 9.5, 16.1, 16.2, 16.3**

Property 16: Download Button Availability
*For any* tier level, the dashboard should display only the download buttons appropriate for that tier
**Validates: Requirements 12.1, 12.2, 12.3**

Property 17: Download File Generation
*For any* download button click, a file should be generated and the browser download should be triggered
**Validates: Requirements 12.4**

Property 18: Tier-Appropriate Download Data
*For any* tier level, the downloaded file should contain only data available at that tier level
**Validates: Requirements 12.5**

Property 19: Initial Load Performance
*For any* dashboard load, the initial render should complete within 2 seconds on standard broadband (measured via Performance API)
**Validates: Requirements 14.1**

Property 20: Tier Rendering Performance
*For any* tier detection completion, tier-specific components should render within 500ms
**Validates: Requirements 14.2**

Property 21: API Cache Hit Avoidance
*For any* data request where sessionStorage contains valid cached data, no API request should be made
**Validates: Requirements 14.5**

Property 22: Responsive Design Consistency
*For any* viewport size, the dashboard should maintain brand color, typography, and spacing scale compliance
**Validates: Requirements 13.5**

Property 23: SessionStorage Clearing on Reset
*For any* logout or reset action, all dashboard-related sessionStorage keys should be cleared
**Validates: Requirements 16.5**

Property 24: API Endpoint Compatibility
*For any* existing API endpoint, the dashboard should send requests in the expected format and handle responses correctly
**Validates: Requirements 17.2, 17.5**

Property 25: No Lorem Ipsum Content
*For all* rendered text content, the strings should not contain "lorem ipsum" or common placeholder text patterns
**Validates: Requirements 18.1**

## Error Handling

### Error Categories

1. **Tier Detection Errors**
   - Invalid tier parameter (e.g., `?tier=5` or `?tier=abc`)
   - Corrupted sessionStorage data
   - **Handling**: Default to Tier 1, log warning

2. **API Errors**
   - Network failure
   - 4xx/5xx HTTP errors
   - Malformed JSON response
   - **Handling**: Display error state, offer retry, use cached data if available

3. **Data Parsing Errors**
   - Missing required fields in API response
   - Type mismatches (e.g., string instead of number)
   - **Handling**: Use fallback values, log error, display partial data

4. **Component Rendering Errors**
   - DOM element not found
   - Invalid data passed to component
   - **Handling**: Skip component, log error, continue rendering other components

5. **SessionStorage Errors**
   - Storage quota exceeded
   - Storage access denied (privacy mode)
   - **Handling**: Fallback to in-memory state, disable caching

### Error Recovery Strategies

**Graceful Degradation**:
- If a component fails to render, show placeholder or skip it
- If API data is incomplete, show available data with "partial data" indicator
- If sessionStorage is unavailable, operate in memory-only mode

**User Feedback**:
- Display error messages in user-friendly language
- Provide actionable next steps (e.g., "Retry", "Contact Support")
- Use toast notifications for non-critical errors
- Use error state screens for critical failures

**Logging**:
- Log all errors to console with context
- Include tier, component name, and error details
- Prepare for future integration with error tracking service (e.g., Sentry)

## Testing Strategy

### Dual Testing Approach

The dashboard requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Test each tier's component set (Tier 1, 2, 3, 4 examples)
- Test specific navigation items per tier
- Test specific upgrade CTA links per tier
- Test error handling for specific error types
- Test responsive breakpoints (desktop, tablet)

**Property-Based Tests**: Focus on universal properties across all inputs
- Test tier detection for all valid tier values (1-4)
- Test progressive component unlocking for all tier transitions
- Test API response parsing for randomly generated valid responses
- Test brand color compliance across all CSS rules
- Test spacing scale compliance across all CSS values
- Test data persistence round-trip for all data types

### Property-Based Testing Configuration

**Library**: Use `fast-check` for JavaScript property-based testing

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: **Feature: progressive-dashboard, Property {N}: {property_text}**

**Example Property Test Structure**:
```javascript
// Feature: progressive-dashboard, Property 2: Progressive Component Unlocking
test('Progressive Component Unlocking', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 4 }), // Generate tier 1-4
      (tier) => {
        const dashboard = new DashboardController();
        dashboard.updateTier(tier);
        
        // All components for tiers 1..tier should be visible
        for (let t = 1; t <= tier; t++) {
          const components = getComponentsForTier(t);
          components.forEach(comp => {
            expect(comp.isVisible()).toBe(true);
          });
        }
        
        // All components for tiers > tier should be hidden
        for (let t = tier + 1; t <= 4; t++) {
          const components = getComponentsForTier(t);
          components.forEach(comp => {
            expect(comp.isVisible()).toBe(false);
          });
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Examples

**Tier 1 Component Presence**:
```javascript
test('Tier 1 displays Free diagnostic components', () => {
  const dashboard = new DashboardController();
  dashboard.updateTier(1);
  
  expect(document.querySelector('.metric-cards')).toBeInTheDocument();
  expect(document.querySelector('.strength-signal')).toBeInTheDocument();
  expect(document.querySelector('.bottleneck-signal')).toBeInTheDocument();
  expect(document.querySelector('.quick-recommendations')).toBeInTheDocument();
  expect(document.querySelector('.upgrade-cta')).toBeInTheDocument();
  expect(document.querySelector('.download-badge-btn')).toBeInTheDocument();
});
```

**Navigation Items for Tier 2**:
```javascript
test('Tier 2 navigation shows Dashboard, Reports, Upgrade', () => {
  const nav = new SidebarNavigation(2);
  nav.render();
  
  const items = nav.getNavigationItems();
  expect(items).toEqual(['dashboard', 'reports', 'upgrade']);
});
```

**Error Handling for Malformed API Data**:
```javascript
test('Dashboard handles missing API fields gracefully', () => {
  const malformedData = { readiness_score: 75 }; // Missing other fields
  const dashboard = new DashboardController();
  
  expect(() => {
    dashboard.loadData(malformedData);
  }).not.toThrow();
  
  expect(dashboard.state.data.strength_index).toBe(0); // Fallback value
});
```

### Integration Testing

**End-to-End Flow Tests**:
1. User completes Free diagnostic → Dashboard loads with Tier 1 components
2. User upgrades to Snapshot → Dashboard transitions to Tier 2 without reload
3. User navigates between views → Active navigation item updates correctly
4. User downloads report → File is generated with tier-appropriate data

**API Integration Tests**:
1. Test with real backend endpoints (when available)
2. Test with mock API responses
3. Test error scenarios (network failure, 500 errors)

### Performance Testing

**Metrics to Track**:
- Initial load time (target: < 2 seconds)
- Tier transition time (target: < 500ms)
- Component render time
- API response time
- SessionStorage read/write time

**Tools**:
- Chrome DevTools Performance tab
- Lighthouse CI for automated performance testing
- Custom Performance API measurements

### Visual Regression Testing

**Approach**:
- Capture screenshots of each tier's dashboard
- Compare against baseline images
- Flag any visual differences for review

**Tools**:
- Percy or Chromatic for visual regression
- Manual QA for subjective design quality

## Deployment Considerations

### Build Process

1. **Minification**: Minify JavaScript and CSS for production
2. **Bundling**: Bundle all JavaScript modules into single file
3. **Asset Optimization**: Optimize images and SVGs
4. **Cache Busting**: Add version hashes to filenames

### XAMPP Deployment

**Requirements**:
- PHP 7.4+ (for backend API)
- Apache web server
- No database required (using sessionStorage)

**Deployment Steps**:
1. Copy `frontend/` directory to XAMPP `htdocs/`
2. Ensure `dashboard.html`, `dashboard.js`, `dashboard.css` are in same directory
3. Configure API_BASE_URL in JavaScript to point to backend
4. Test all tiers in browser

### Environment Configuration

**Development**:
```javascript
const API_BASE_URL = 'http://localhost:8081';
const DEBUG_MODE = true;
```

**Production**:
```javascript
const API_BASE_URL = 'https://api.aivory.com';
const DEBUG_MODE = false;
```

### Browser Compatibility

**Target Browsers**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Polyfills Required**:
- None (using modern JavaScript features supported in target browsers)

**Fallbacks**:
- SessionStorage: Fallback to in-memory state if unavailable
- Fetch API: Already supported in all target browsers

## Future Enhancements

### Phase 2 Features

1. **Real-time Updates**: WebSocket connection for live system status in Tier 4
2. **Customizable Dashboards**: Allow users to rearrange components
3. **Dark Mode**: Add dark theme option
4. **Multi-language Support**: Expand beyond English and Indonesian
5. **Export Formats**: Add CSV, Excel export options
6. **Collaborative Features**: Share dashboards with team members

### Technical Debt

1. **Component Library**: Extract components into reusable library
2. **State Management**: Consider Redux or similar for complex state
3. **TypeScript Migration**: Add type safety to JavaScript codebase
4. **Automated Testing**: Increase test coverage to 80%+
5. **Performance Monitoring**: Integrate with APM tool (e.g., New Relic)

### Scalability Considerations

1. **Code Splitting**: Lazy load tier-specific components
2. **CDN Integration**: Serve static assets from CDN
3. **API Caching**: Implement Redis cache for API responses
4. **Database Migration**: Move from sessionStorage to backend database for persistence
