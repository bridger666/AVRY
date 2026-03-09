# Design Document: Production Dashboard Redesign

## Overview

This design transforms the Aivory Dashboard from a test/experimental interface into a production-ready AI Operating System Designer control panel. The dashboard will be implemented as a Next.js 14 App Router route using TypeScript, sharing the same application and design system as the existing /console route.

The dashboard serves as the central command center for users to:
1. Understand their current position in the AI OS journey
2. View their active AI System Blueprint
3. Monitor running workflows and executions
4. Navigate to key system features

The design emphasizes clarity, premium aesthetics, and seamless integration with the console's visual language.

## Architecture

### Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Pure CSS (globals.css + CSS modules)
- **State Management**: React hooks (useState, useEffect)
- **Routing**: Next.js Link components with usePathname for active state
- **API Integration**: Fetch API with Next.js API routes as proxy

### Application Structure

```
nextjs-console/
├── app/
│   ├── dashboard/
│   │   └── page.tsx              # Main dashboard route
│   ├── console/
│   │   └── page.tsx              # Existing console route
│   └── layout.tsx                # Shared layout with navigation
├── components/
│   ├── dashboard/
│   │   ├── OverviewCard.tsx      # AI OS status overview
│   │   ├── LifecycleCard.tsx     # Diagnostic/Blueprint/Workflow cards
│   │   ├── RecentActivity.tsx    # Activity feed
│   │   └── StatusBadge.tsx       # Status indicators
│   ├── shared/
│   │   ├── Sidebar.tsx           # Unified navigation sidebar
│   │   └── Button.tsx            # Reusable button component
│   └── [existing console components]
├── styles/
│   ├── globals.css               # Shared design tokens
│   └── dashboard.module.css      # Dashboard-specific styles
└── types/
    └── dashboard.ts              # TypeScript interfaces
```

### Route Structure

- `/` - Landing/home page
- `/console` - AI chat interface (existing)
- `/dashboard` - Main dashboard overview (new)
- `/diagnostics` - Diagnostic assessment (future)
- `/blueprint` - Blueprint viewer (future)
- `/workflows` - Workflow management (future)
- `/logs` - Execution logs (future)
- `/settings` - User settings (future)

## Components and Interfaces

### 1. Dashboard Page Component

**File**: `app/dashboard/page.tsx`

```typescript
"use client"

import { useState, useEffect } from "react"
import OverviewCard from "@/components/dashboard/OverviewCard"
import LifecycleCard from "@/components/dashboard/LifecycleCard"
import RecentActivity from "@/components/dashboard/RecentActivity"
import styles from "@/styles/dashboard.module.css"

interface DashboardData {
  diagnostic: DiagnosticStatus
  blueprint: BlueprintStatus
  workflows: WorkflowStatus
  recentActivity: ActivityEvent[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    // Fetch dashboard data from API
    // For now, use placeholder data
    setData(getPlaceholderData())
    setLoading(false)
  }

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.mainContent}>
        <OverviewCard data={data} />
        
        <div className={styles.lifecycleGrid}>
          <LifecycleCard
            title="Diagnostics"
            description="Run AI Readiness Diagnostic to understand your business and automation potential."
            status={data.diagnostic.status}
            cta={data.diagnostic.status === 'not_started' ? 'Start Diagnostic' : 'Continue Diagnostic'}
            href="/diagnostics"
          />
          <LifecycleCard
            title="Blueprint"
            description="Design your AI System Blueprint: architecture, workflows, and deployment plan."
            status={data.blueprint.status}
            cta={data.blueprint.status === 'none' ? 'Generate Blueprint' : 'View Blueprint'}
            href="/blueprint"
          />
          <LifecycleCard
            title="Workflows"
            description="Deploy and manage automation workflows generated from your blueprints."
            status={data.workflows.status}
            cta="View Workflows"
            href="/workflows"
          />
        </div>
      </div>

      <aside className={styles.activitySidebar}>
        <RecentActivity events={data.recentActivity} />
      </aside>
    </div>
  )
}
```

### 2. Shared Sidebar Component

**File**: `components/shared/Sidebar.tsx`

```typescript
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import styles from "./Sidebar.module.css"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

export default function Sidebar() {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { label: "Console", href: "/console", icon: <ConsoleIcon /> },
    { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon /> },
    { label: "Diagnostics", href: "/diagnostics", icon: <DiagnosticsIcon /> },
    { label: "Blueprint", href: "/blueprint", icon: <BlueprintIcon /> },
    { label: "Workflows", href: "/workflows", icon: <WorkflowsIcon /> },
    { label: "Execution Logs", href: "/logs", icon: <LogsIcon /> },
    { label: "Integrations", href: "/integrations", icon: <IntegrationsIcon /> },
    { label: "Settings", href: "/settings", icon: <SettingsIcon /> },
  ]

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <Link href="/" className={styles.logo}>
          <img src="/logo.svg" alt="Aivory" />
          <span>Aivory</span>
        </Link>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
```

### 3. Overview Card Component

**File**: `components/dashboard/OverviewCard.tsx`

```typescript
import Link from "next/link"
import StatusBadge from "./StatusBadge"
import styles from "./OverviewCard.module.css"

interface OverviewCardProps {
  data: {
    diagnostic: DiagnosticStatus
    blueprint: BlueprintStatus
    workflows: WorkflowStatus
  }
}

export default function OverviewCard({ data }: OverviewCardProps) {
  return (
    <div className={styles.overviewCard}>
      <h2 className={styles.title}>AI Operating System Overview</h2>
      
      <div className={styles.statusGrid}>
        <div className={styles.statusItem}>
          <span className={styles.label}>Last Diagnostic</span>
          <StatusBadge status={data.diagnostic.status} />
          {data.diagnostic.score && (
            <span className={styles.detail}>
              Score: {data.diagnostic.score} • {data.diagnostic.date}
            </span>
          )}
        </div>

        <div className={styles.statusItem}>
          <span className={styles.label}>Blueprint</span>
          {data.blueprint.name ? (
            <>
              <span className={styles.value}>{data.blueprint.name}</span>
              <span className={styles.detail}>v{data.blueprint.version}</span>
            </>
          ) : (
            <span className={styles.placeholder}>No blueprint yet</span>
          )}
        </div>

        <div className={styles.statusItem}>
          <span className={styles.label}>Workflows</span>
          <span className={styles.value}>{data.workflows.active} active</span>
        </div>
      </div>

      <div className={styles.ctaRow}>
        <Link href="/console" className={styles.primaryCta}>
          Open Console
        </Link>
        <Link href="/diagnostics" className={styles.secondaryCta}>
          Open Diagnostics
        </Link>
        <Link href="/blueprint" className={styles.secondaryCta}>
          View Blueprint
        </Link>
        <Link href="/workflows" className={styles.secondaryCta}>
          View Workflows
        </Link>
      </div>
    </div>
  )
}
```

### 4. Lifecycle Card Component

**File**: `components/dashboard/LifecycleCard.tsx`

```typescript
import Link from "next/link"
import styles from "./LifecycleCard.module.css"

interface LifecycleCardProps {
  title: string
  description: string
  status: string
  cta: string
  href: string
}

export default function LifecycleCard({
  title,
  description,
  status,
  cta,
  href
}: LifecycleCardProps) {
  return (
    <div className={styles.lifecycleCard}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      
      <div className={styles.status}>
        <StatusIndicator status={status} />
      </div>

      <Link href={href} className={styles.cta}>
        {cta}
      </Link>
    </div>
  )
}
```

### 5. Recent Activity Component

**File**: `components/dashboard/RecentActivity.tsx`

```typescript
import styles from "./RecentActivity.module.css"

interface ActivityEvent {
  id: string
  type: string
  message: string
  timestamp: string
}

interface RecentActivityProps {
  events: ActivityEvent[]
}

export default function RecentActivity({ events }: RecentActivityProps) {
  return (
    <div className={styles.activityContainer}>
      <h3 className={styles.title}>Recent Activity</h3>
      
      <div className={styles.eventList}>
        {events.length === 0 ? (
          <p className={styles.empty}>No recent activity</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className={styles.event}>
              <div className={styles.eventIcon}>
                <EventIcon type={event.type} />
              </div>
              <div className={styles.eventContent}>
                <p className={styles.eventMessage}>{event.message}</p>
                <span className={styles.eventTime}>{event.timestamp}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <Link href="/logs" className={styles.viewAll}>
        View All Activity
      </Link>
    </div>
  )
}
```

## Data Models

### TypeScript Interfaces

**File**: `types/dashboard.ts`

```typescript
export interface DiagnosticStatus {
  status: 'not_started' | 'in_progress' | 'completed'
  score?: number
  date?: string
  category?: string
}

export interface BlueprintStatus {
  status: 'none' | 'active'
  name?: string
  version?: string
  createdAt?: string
}

export interface WorkflowStatus {
  active: number
  total: number
  lastExecution?: string
}

export interface ActivityEvent {
  id: string
  type: 'diagnostic' | 'blueprint' | 'workflow' | 'execution'
  message: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface DashboardData {
  diagnostic: DiagnosticStatus
  blueprint: BlueprintStatus
  workflows: WorkflowStatus
  recentActivity: ActivityEvent[]
}

export interface User {
  id: string
  email: string
  tier: 'free' | 'builder' | 'operator' | 'enterprise'
  credits: number
}
```

### Placeholder Data Function

```typescript
export function getPlaceholderData(): DashboardData {
  return {
    diagnostic: {
      status: 'not_started'
    },
    blueprint: {
      status: 'none'
    },
    workflows: {
      active: 0,
      total: 0
    },
    recentActivity: [
      {
        id: '1',
        type: 'diagnostic',
        message: 'Welcome to Aivory! Start by running a diagnostic.',
        timestamp: '2 minutes ago'
      }
    ]
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Navigation Consistency

*For any* navigation item in the sidebar, clicking it should navigate to the correct route and update the active state indicator to highlight only that item.

**Validates: Requirements 2.1, 2.6**

### Property 2: Overview Card Data Display

*For any* dashboard data state, the Overview Card should display diagnostic status, blueprint status, and workflow count accurately reflecting the current data.

**Validates: Requirements 3.2, 3.3, 3.4**

### Property 3: Lifecycle Card Status Reflection

*For any* lifecycle phase (Diagnostics, Blueprint, Workflows), the card should display the correct status indicator and appropriate CTA button text based on the current phase state.

**Validates: Requirements 3.7, 3.8, 3.9**

### Property 4: Responsive Layout Adaptation

*For any* viewport width, the dashboard layout should adapt appropriately: desktop shows two-column layout (main + sidebar), tablet/mobile shows single-column stack.

**Validates: Requirements 4.2, 4.3**

### Property 5: Design Token Consistency

*For any* styled component in the dashboard, it should use design tokens from globals.css that match the console's color palette and typography.

**Validates: Requirements 4.1, 4.2, 4.10**

### Property 6: Recent Activity Chronological Order

*For any* list of activity events, they should be displayed in reverse chronological order (most recent first).

**Validates: Requirements 15.5**

### Property 7: CTA Button Navigation

*For any* CTA button in the Overview Card or Lifecycle Cards, clicking it should navigate to the correct route using Next.js Link component.

**Validates: Requirements 3.5, 14.1, 14.2**

### Property 8: Loading State Display

*For any* data fetching operation, while loading is true, the dashboard should display a loading state instead of attempting to render data.

**Validates: Requirements 11.5**

### Property 9: Empty State Handling

*For any* data collection (workflows, activity events), when the collection is empty, the UI should display an appropriate empty state message.

**Validates: Requirements 11.7, 15.3**

### Property 10: TypeScript Type Safety

*For all* component props and data structures, TypeScript should enforce type safety at compile time, preventing type mismatches.

**Validates: Requirements 1.2**

## Error Handling

### Client-Side Error Handling

1. **Data Fetching Errors**
   - Catch fetch errors and display user-friendly error messages
   - Provide retry mechanism for failed requests
   - Log errors to console for debugging

2. **Navigation Errors**
   - Handle invalid routes gracefully
   - Redirect to dashboard home if route doesn't exist
   - Maintain user session across navigation

3. **Component Rendering Errors**
   - Use React Error Boundaries for component-level errors
   - Display fallback UI when components fail to render
   - Log component errors for debugging

### Error States UI

```typescript
function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className={styles.errorState}>
      <div className={styles.errorIcon}>⚠️</div>
      <h3>Something went wrong</h3>
      <p>{message}</p>
      <button onClick={onRetry} className={styles.retryButton}>
        Try Again
      </button>
    </div>
  )
}
```

### Loading States UI

```typescript
function LoadingState() {
  return (
    <div className={styles.loadingState}>
      <div className={styles.spinner} />
      <p>Loading your dashboard...</p>
    </div>
  )
}
```

## Testing Strategy

### Unit Testing

Use Jest and React Testing Library for component testing:

1. **Component Rendering Tests**
   - Test that components render with correct props
   - Test conditional rendering based on data states
   - Test empty states and error states

2. **User Interaction Tests**
   - Test button clicks trigger correct navigation
   - Test sidebar navigation updates active state
   - Test CTA buttons navigate to correct routes

3. **Data Display Tests**
   - Test Overview Card displays correct status information
   - Test Lifecycle Cards show appropriate CTAs based on status
   - Test Recent Activity displays events in correct order

Example test:

```typescript
describe('OverviewCard', () => {
  it('displays diagnostic status correctly', () => {
    const data = {
      diagnostic: { status: 'completed', score: 85, date: '2024-01-15' },
      blueprint: { status: 'none' },
      workflows: { active: 0, total: 0 }
    }
    
    render(<OverviewCard data={data} />)
    
    expect(screen.getByText('Score: 85')).toBeInTheDocument()
    expect(screen.getByText('2024-01-15')).toBeInTheDocument()
  })
})
```

### Property-Based Testing

Use fast-check for property-based testing (minimum 100 iterations per test):

1. **Property Test: Navigation Consistency**
   ```typescript
   // Feature: production-dashboard-redesign, Property 1: Navigation Consistency
   it('should highlight only the active navigation item', () => {
     fc.assert(
       fc.property(
         fc.constantFrom('/console', '/dashboard', '/diagnostics', '/blueprint', '/workflows'),
         (pathname) => {
           const { container } = render(<Sidebar />, { pathname })
           const activeItems = container.querySelectorAll('.active')
           expect(activeItems).toHaveLength(1)
           expect(activeItems[0]).toHaveAttribute('href', pathname)
         }
       ),
       { numRuns: 100 }
     )
   })
   ```

2. **Property Test: Responsive Layout**
   ```typescript
   // Feature: production-dashboard-redesign, Property 4: Responsive Layout Adaptation
   it('should adapt layout based on viewport width', () => {
     fc.assert(
       fc.property(
         fc.integer({ min: 320, max: 2560 }),
         (width) => {
           global.innerWidth = width
           const { container } = render(<DashboardPage />)
           
           if (width >= 1024) {
             // Desktop: two-column layout
             expect(container.querySelector('.activitySidebar')).toBeVisible()
           } else {
             // Mobile/Tablet: single column
             expect(container.querySelector('.activitySidebar')).toHaveStyle({ display: 'block' })
           }
         }
       ),
       { numRuns: 100 }
     )
   })
   ```

3. **Property Test: Activity Event Ordering**
   ```typescript
   // Feature: production-dashboard-redesign, Property 6: Recent Activity Chronological Order
   it('should display events in reverse chronological order', () => {
     fc.assert(
       fc.property(
         fc.array(fc.record({
           id: fc.string(),
           type: fc.constantFrom('diagnostic', 'blueprint', 'workflow'),
           message: fc.string(),
           timestamp: fc.date()
         })),
         (events) => {
           const sortedEvents = [...events].sort((a, b) => 
             b.timestamp.getTime() - a.timestamp.getTime()
           )
           
           const { container } = render(<RecentActivity events={sortedEvents} />)
           const displayedEvents = container.querySelectorAll('.event')
           
           displayedEvents.forEach((el, idx) => {
             expect(el).toHaveTextContent(sortedEvents[idx].message)
           })
         }
       ),
       { numRuns: 100 }
     )
   })
   ```

### Integration Testing

Test integration between components and API:

1. **Dashboard Data Fetching**
   - Test that dashboard fetches data on mount
   - Test that loading state displays during fetch
   - Test that data populates components correctly

2. **Navigation Flow**
   - Test navigation between dashboard and console
   - Test that active state persists across navigation
   - Test that user session is maintained

### Visual Regression Testing

Use Playwright or Cypress for visual regression:

1. **Screenshot Comparison**
   - Capture screenshots of dashboard in different states
   - Compare against baseline images
   - Flag visual differences for review

2. **Responsive Testing**
   - Test dashboard at multiple viewport sizes
   - Verify layout adapts correctly
   - Check for overflow or layout breaks

## Implementation Notes

### CSS Architecture

1. **Global Styles** (`styles/globals.css`)
   - Design tokens (colors, spacing, typography)
   - Reset and base styles
   - Shared utility classes

2. **Module Styles** (`styles/dashboard.module.css`)
   - Component-specific styles
   - Scoped to avoid conflicts
   - Use design tokens from globals

3. **Design Token Usage**
   ```css
   /* globals.css */
   :root {
     --bg-main: #1e1d1a;
     --bg-elevated: #262521;
     --bg-soft: #2f2e2a;
     --border-soft: rgba(255,255,255,0.06);
     --text-primary: #e8e6e3;
     --text-secondary: #a8a6a2;
     --text-tertiary: #6e6d6a;
     --spacing-xs: 0.5rem;
     --spacing-sm: 0.75rem;
     --spacing-md: 1rem;
     --spacing-lg: 1.5rem;
     --spacing-xl: 2rem;
   }
   ```

### Accessibility Considerations

1. **Keyboard Navigation**
   - All interactive elements accessible via keyboard
   - Visible focus indicators
   - Logical tab order

2. **Screen Reader Support**
   - Semantic HTML elements
   - ARIA labels where needed
   - Descriptive link text

3. **Color Contrast**
   - Maintain WCAG AA contrast ratios
   - Test with color blindness simulators
   - Don't rely solely on color for information

### Performance Optimization

1. **Code Splitting**
   - Use Next.js automatic code splitting
   - Lazy load components not needed on initial render
   - Dynamic imports for heavy components

2. **Image Optimization**
   - Use Next.js Image component
   - Provide appropriate sizes and formats
   - Lazy load images below the fold

3. **Data Fetching**
   - Implement caching strategy
   - Use SWR or React Query for data management
   - Prefetch data for likely navigation targets

### Migration Strategy

Since this is a new Next.js implementation alongside the existing frontend:

1. **Phase 1**: Build new dashboard in Next.js
2. **Phase 2**: Test with users, gather feedback
3. **Phase 3**: Gradually migrate other pages to Next.js
4. **Phase 4**: Deprecate old frontend once all features migrated

The old frontend (`frontend/dashboard.html`) will remain functional during migration.
