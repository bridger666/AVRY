# Dashboard UX Improvements - Design

## Architecture Overview

This design improves the Aivory Dashboard UX through component enhancements, better information architecture, and shared utilities. All changes maintain the existing dark theme aesthetic while improving usability.

### Component Hierarchy

```
Dashboard Pages
├── Execution Logs (logs.html)
│   ├── Stats Row (shared component)
│   ├── Time Range Selector (new component)
│   ├── Status Filter Tabs (new component)
│   ├── Executions Table (enhanced)
│   └── Common Queries (enhanced)
├── Workflows (workflows.html)
│   ├── Stats Row (shared component)
│   ├── Collapsible Banner (enhanced)
│   ├── Status Filter Tabs (new component)
│   └── Workflow List (enhanced)
└── Global Components
    ├── Floating AI Console Button (new)
    └── Shared Utilities (new)
```

## Shared Components

### 1. Stats Row Component

**Purpose**: Display 4 metric cards in a horizontal row
**Used By**: logs.html, workflows.html
**Location**: Inline in each page (not extracted to separate file)

**Structure**:
```html
<div class="stats-row">
  <div class="stat-card">
    <div class="stat-label">Label</div>
    <div class="stat-value">Value</div>
    <div class="stat-subtitle">Subtitle</div>
  </div>
  <!-- Repeat for 4 cards -->
</div>
```

**Styling** (dashboard.css):
```css
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}
```


### 2. Filter Tabs Component

**Purpose**: Status filtering tabs (All/Success/Failed or All/Active/Paused/Failed)
**Used By**: logs.html, workflows.html
**Location**: Inline in each page

**Structure**:
```html
<div class="filter-tabs">
  <button class="filter-tab active" data-filter="all">
    All <span class="tab-count">(127)</span>
  </button>
  <button class="filter-tab" data-filter="success">
    Success <span class="tab-count">(120)</span>
  </button>
  <button class="filter-tab" data-filter="failed">
    Failed <span class="tab-count">(7)</span>
  </button>
</div>
```

**Styling** (dashboard.css):
```css
.filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 0.5rem;
}

.filter-tab {
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  transition: all 0.2s;
}

.filter-tab.active {
  background: rgba(7, 209, 151, 0.1);
  color: #07d197;
  border-bottom: 2px solid #07d197;
}
```

### 3. Floating AI Console Button

**Purpose**: Global access to AI Console without taking page space
**Used By**: All dashboard pages
**Location**: New file `frontend/floating-console-button.js` + inline HTML

**Structure**:
```html
<button id="floatingConsoleBtn" class="floating-console-btn" 
        onclick="window.location.href='console.html'" 
        title="Open AI Console">
  <svg><!-- AI icon --></svg>
</button>
```

**Styling** (dashboard.css):
```css
.floating-console-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #07d197 0%, #06b380 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(7, 209, 151, 0.3);
  cursor: pointer;
  z-index: 1000;
  transition: transform 0.2s, box-shadow 0.2s;
}

.floating-console-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(7, 209, 151, 0.4);
}
```


## Page-Specific Designs

### Execution Logs Page (logs.html)

#### 1. Stats Row Enhancement

**Current**: 3 cards in grid, missing Avg Duration
**New**: 4 cards in single row

**Mock Data**:
```javascript
const executionStats = {
  total: 127,
  successRate: 94.5,
  failed: 7,
  avgDuration: '2.1s'
};
```

#### 2. Time Range Selector

**Location**: Above stats row, right-aligned
**Structure**:
```html
<div class="time-range-selector">
  <button class="time-range-btn active" data-range="today">Today</button>
  <button class="time-range-btn" data-range="7days">7 Days</button>
  <button class="time-range-btn" data-range="30days">30 Days</button>
  <button class="time-range-btn" data-range="custom">Custom</button>
</div>
```

**Behavior**:
- Clicking updates stats and table
- Custom opens date picker modal
- Selection stored in sessionStorage

#### 3. Executions Table Enhancement

**Changes**:
- Show 10 rows initially (up from 3)
- Varied workflow names
- Exact timestamps with relative time tooltip
- Inline error reasons for failed rows
- Load More button at bottom

**Mock Data Structure**:
```javascript
const mockExecutions = [
  {
    id: 'exec-001',
    status: 'success',
    workflow: 'Invoice Processing',
    timestamp: '2026-02-26T14:30:45Z',
    duration: '2.3s'
  },
  {
    id: 'exec-002',
    status: 'failed',
    workflow: 'Customer Onboarding',
    timestamp: '2026-02-26T12:15:30Z',
    duration: '0.5s',
    error: 'Connection timeout to CRM API'
  },
  // ... 125 more entries
];
```

**Table Row HTML** (Failed):
```html
<tr>
  <td>
    <div class="status-with-error">
      <span class="status-dot failed"></span>
      <div>
        <div class="status-text">Failed</div>
        <div class="error-reason">Connection timeout</div>
      </div>
    </div>
  </td>
  <td>Customer Onboarding</td>
  <td title="2 hours ago">Feb 26, 2026 12:15:30</td>
  <td>0.5s</td>
  <td><button>Analyze</button></td>
</tr>
```


#### 4. Common Queries Enhancement

**Current**: Buttons with onclick handlers
**New**: Clickable items that pre-fill console

**Implementation**:
```javascript
function askConsole(query) {
  // Store query in sessionStorage
  sessionStorage.setItem('console_prefill', query);
  // Navigate to console
  window.location.href = 'console.html';
}
```

**Console Integration** (console.js):
```javascript
// On page load, check for pre-filled query
document.addEventListener('DOMContentLoaded', () => {
  const prefill = sessionStorage.getItem('console_prefill');
  if (prefill) {
    document.getElementById('messageInput').value = prefill;
    sessionStorage.removeItem('console_prefill');
    // Optional: auto-focus input
    document.getElementById('messageInput').focus();
  }
});
```

### Workflows Page (workflows.html)

#### 1. Stats Row Addition

**New Section**: Above collapsible banner

**Mock Data**:
```javascript
const workflowStats = {
  total: 4,
  active: 2,
  paused: 1,
  failed: 1
};
```

#### 2. Collapsible Banner

**Current**: Always expanded, takes 150px height
**New**: Collapsible with toggle

**Structure**:
```html
<div class="collapsible-banner" data-collapsed="false">
  <div class="banner-header" onclick="toggleBanner()">
    <h3>Create Workflow with AI</h3>
    <button class="banner-toggle">
      <svg class="chevron-icon"><!-- chevron --></svg>
    </button>
  </div>
  <div class="banner-content">
    <p>Use the AI Console to generate workflows...</p>
    <button>Open AI Console</button>
  </div>
</div>
```

**Behavior**:
```javascript
function toggleBanner() {
  const banner = document.querySelector('.collapsible-banner');
  const isCollapsed = banner.dataset.collapsed === 'true';
  banner.dataset.collapsed = !isCollapsed;
  localStorage.setItem('workflow_banner_collapsed', !isCollapsed);
}

// On load, restore state
document.addEventListener('DOMContentLoaded', () => {
  const collapsed = localStorage.getItem('workflow_banner_collapsed') === 'true';
  if (collapsed) {
    document.querySelector('.collapsible-banner').dataset.collapsed = 'true';
  }
});
```


#### 3. Workflow List Enhancements

**Action Button Tooltips**:
```html
<button class="workflow-action-btn" 
        onclick="executeWorkflow('wf-123')" 
        title="Run workflow">
  <svg><!-- play icon --></svg>
</button>
```

**Failed Workflow Styling**:
```css
.workflow-list-item.failed {
  background: rgba(255, 68, 68, 0.05);
  border-color: rgba(255, 68, 68, 0.3);
}

.workflow-list-item.failed .status-indicator {
  width: 12px;
  height: 12px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

**Paused Workflow Resume Button**:
```html
<div class="workflow-list-actions">
  <button class="workflow-action-btn resume-btn" 
          onclick="resumeWorkflow('wf-125')" 
          title="Resume workflow">
    <svg><!-- play icon --></svg>
  </button>
  <!-- other action buttons -->
</div>
```

**Status Pills** (replacing dots):
```html
<div class="workflow-status-pill status-active">
  <span class="status-icon">●</span>
  <span class="status-label">Active</span>
</div>
```

```css
.workflow-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.workflow-status-pill.status-active {
  background: rgba(7, 209, 151, 0.15);
  color: #07d197;
}

.workflow-status-pill.status-paused {
  background: rgba(255, 176, 32, 0.15);
  color: #ffb020;
}

.workflow-status-pill.status-failed {
  background: rgba(255, 68, 68, 0.15);
  color: #ff4444;
}
```

## Data Layer

### Mock Data Generation

**File**: `frontend/dashboard-mock-data.js` (new)

```javascript
// Generate realistic mock execution data
function generateMockExecutions(count = 127) {
  const workflows = [
    'Invoice Processing',
    'Customer Onboarding',
    'Data Sync Pipeline',
    'Weekly Report Generator',
    'Email Automation'
  ];
  
  const errors = [
    'Connection timeout',
    'API rate limit exceeded',
    'Invalid data format',
    'Authentication failed',
    'Resource not found'
  ];
  
  const executions = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const hoursAgo = Math.floor(Math.random() * 720); // 30 days
    const timestamp = new Date(now - hoursAgo * 3600000);
    const isFailed = Math.random() < 0.055; // 5.5% failure rate
    
    executions.push({
      id: `exec-${String(i + 1).padStart(3, '0')}`,
      status: isFailed ? 'failed' : 'success',
      workflow: workflows[Math.floor(Math.random() * workflows.length)],
      timestamp: timestamp.toISOString(),
      duration: isFailed ? 
        `${(Math.random() * 2).toFixed(1)}s` : 
        `${(Math.random() * 5 + 1).toFixed(1)}s`,
      error: isFailed ? errors[Math.floor(Math.random() * errors.length)] : null
    });
  }
  
  return executions.sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
}
```


## Utility Functions

### Time Formatting

**File**: `frontend/dashboard-utils.js` (new)

```javascript
// Format timestamp for display
function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  return date.toLocaleString('en-US', options);
}

// Get relative time for tooltip
function getRelativeTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// Truncate error message
function truncateError(error, maxLength = 60) {
  if (!error) return '';
  if (error.length <= maxLength) return error;
  return error.substring(0, maxLength - 3) + '...';
}
```

### Filter and Sort

```javascript
// Filter executions by status
function filterExecutions(executions, status) {
  if (status === 'all') return executions;
  return executions.filter(e => e.status === status);
}

// Filter executions by time range
function filterByTimeRange(executions, range) {
  const now = new Date();
  let cutoff;
  
  switch(range) {
    case 'today':
      cutoff = new Date(now.setHours(0, 0, 0, 0));
      break;
    case '7days':
      cutoff = new Date(now - 7 * 86400000);
      break;
    case '30days':
      cutoff = new Date(now - 30 * 86400000);
      break;
    default:
      return executions;
  }
  
  return executions.filter(e => new Date(e.timestamp) >= cutoff);
}

// Calculate stats from executions
function calculateStats(executions) {
  const total = executions.length;
  const failed = executions.filter(e => e.status === 'failed').length;
  const success = total - failed;
  const successRate = total > 0 ? ((success / total) * 100).toFixed(1) : 0;
  
  const durations = executions
    .map(e => parseFloat(e.duration))
    .filter(d => !isNaN(d));
  const avgDuration = durations.length > 0 ?
    (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1) :
    0;
  
  return {
    total,
    successRate,
    failed,
    avgDuration: `${avgDuration}s`
  };
}
```


## CSS Architecture

### Spacing System

**Standardized Spacing** (dashboard.css):
```css
/* Section spacing */
.dashboard-main > * + * {
  margin-top: 2rem; /* 32px between sections */
}

/* Card padding */
.dashboard-card {
  padding: 1.5rem; /* 24px */
}

/* Grid gaps */
.dashboard-grid {
  gap: 1rem; /* 16px */
}

.stats-row {
  gap: 1rem; /* 16px */
}

/* Responsive spacing */
@media (max-width: 768px) {
  .dashboard-main > * + * {
    margin-top: 1.5rem;
  }
  
  .dashboard-card {
    padding: 1rem;
  }
}
```

### Component-Specific Styles

**Execution Table**:
```css
.execution-table {
  width: 100%;
  border-collapse: collapse;
}

.execution-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.execution-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.execution-table tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.status-with-error {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.error-reason {
  font-size: 0.75rem;
  color: rgba(255, 136, 136, 0.8);
  margin-top: 0.25rem;
}
```

**Load More Button**:
```css
.load-more-btn {
  width: 100%;
  padding: 0.75rem;
  margin-top: 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s;
}

.load-more-btn:hover:not(:disabled) {
  background: rgba(7, 209, 151, 0.1);
  border-color: rgba(7, 209, 151, 0.3);
  color: #07d197;
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## Accessibility Considerations

### Keyboard Navigation
- All interactive elements focusable
- Tab order follows visual flow
- Focus indicators visible (2px outline)
- Escape key closes modals/dropdowns

### Screen Readers
- Semantic HTML (table, button, nav)
- ARIA labels for icon-only buttons
- ARIA live regions for dynamic updates
- Alt text for all images/icons

### Color Contrast
- Text: 4.5:1 minimum (WCAG AA)
- Interactive elements: 3:1 minimum
- Status indicators: Not relying on color alone
- High contrast mode support

### Touch Targets
- Minimum 44x44px for all buttons
- Adequate spacing between targets
- No hover-only interactions


## Testing Strategy

### Unit Tests
- Utility functions (formatTimestamp, calculateStats, etc.)
- Filter/sort logic
- Mock data generation

### Integration Tests
- Filter tabs update table correctly
- Time range selector updates stats
- Load more pagination works
- Console pre-fill integration

### Visual Regression Tests
- Stats row layout
- Table with varied data
- Failed workflow styling
- Responsive breakpoints

### Accessibility Tests
- Keyboard navigation flow
- Screen reader announcements
- Color contrast ratios
- Focus management

## Performance Considerations

### Rendering Optimization
- Virtual scrolling for large tables (if > 100 rows)
- Debounce search/filter inputs (300ms)
- CSS transitions use transform/opacity only
- Lazy load workflow preview component

### Data Management
- Generate mock data once on page load
- Cache filtered results
- Pagination reduces DOM nodes
- SessionStorage for temporary state

### Bundle Size
- No new dependencies
- Reuse existing utilities
- Inline small components
- Minify production CSS/JS

## Migration Path

### Phase 1: Shared Components
1. Add floating console button to all pages
2. Standardize spacing in dashboard.css
3. Create utility functions file

### Phase 2: Execution Logs
1. Add stats row with 4 cards
2. Implement time range selector
3. Enhance table with varied data
4. Add status filter tabs
5. Implement load more pagination
6. Make common queries clickable

### Phase 3: Workflows
1. Add stats row
2. Make banner collapsible
3. Add action button tooltips
4. Enhance failed workflow styling
5. Add resume button for paused
6. Implement status filter tabs
7. Replace dots with status pills

### Phase 4: Polish
1. Test all interactions
2. Verify accessibility
3. Test responsive layouts
4. Performance audit
5. Cross-browser testing

## Rollback Plan

If issues arise:
1. Revert to previous HTML files (git)
2. Remove new CSS classes
3. Remove new JS files
4. Clear localStorage/sessionStorage
5. Hard refresh browsers

## Future Enhancements

### Not in Current Scope
- Real-time updates via WebSocket
- Advanced filtering (multi-select, date ranges)
- Export to CSV/PDF
- Workflow creation wizard
- Execution detail modal
- Bulk actions (pause/resume multiple)
- Custom dashboard layouts
- User preferences API

