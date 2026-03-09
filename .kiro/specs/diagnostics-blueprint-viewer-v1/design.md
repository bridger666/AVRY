# Design Document: Diagnostics v1 and Blueprint Viewer v1

## Overview

This design specifies the implementation of two core features in the Next.js Aivory application: a form-based Diagnostics assessment tool and an interactive Blueprint Viewer. These features form the critical product flow: Diagnostics → AI System Blueprint → Workflows.

The implementation uses Next.js 14 App Router with TypeScript and pure CSS (no Tailwind or UI libraries), maintaining consistency with the existing dashboard and console design system. Version 1 focuses on UI/UX with static sample data, structured for future backend integration.

### Design Goals

1. **Consistent User Experience**: Match the existing warm gray aesthetic, Inter Tight typography, and card-based layouts
2. **Production-Ready UI**: No "test" labels or placeholder styling - users should feel they're using a complete product
3. **Future-Proof Architecture**: Structure data and components for seamless backend integration in v2
4. **Responsive Design**: Full mobile and desktop support with graceful layout adaptation
5. **Incremental Progress**: Users can complete diagnostics and view blueprints immediately with sample data

## Architecture

### Application Structure

```
nextjs-console/
├── app/
│   ├── diagnostics/
│   │   ├── page.tsx                    # Main diagnostics page
│   │   └── diagnostics.module.css      # Page-specific styles
│   ├── blueprint/
│   │   ├── page.tsx                    # Main blueprint viewer page
│   │   └── blueprint.module.css        # Page-specific styles
│   └── layout.tsx                      # Root layout (existing)
│
├── components/
│   ├── diagnostics/
│   │   ├── DiagnosticPhase.tsx         # Reusable phase card component
│   │   ├── DiagnosticPhase.module.css
│   │   ├── DiagnosticSummary.tsx       # Summary card with score/CTA
│   │   └── DiagnosticSummary.module.css
│   ├── blueprint/
│   │   ├── BlueprintHeader.tsx         # Header with title/pills
│   │   ├── BlueprintHeader.module.css
│   │   ├── ExecutiveSummary.tsx        # Executive summary card
│   │   ├── ExecutiveSummary.module.css
│   │   ├── ArchitectureLayer.tsx       # Single architecture layer card
│   │   ├── ArchitectureLayer.module.css
│   │   ├── WorkflowCard.tsx            # Single workflow module card
│   │   ├── WorkflowCard.module.css
│   │   ├── RiskCard.tsx                # Risk & governance card
│   │   ├── RiskCard.module.css
│   │   ├── DeploymentCard.tsx          # Deployment plan card
│   │   └── DeploymentCard.module.css
│   └── shared/
│       ├── Sidebar.tsx                 # Navigation sidebar (existing)
│       └── Sidebar.module.css
│
├── types/
│   ├── diagnostic.ts                   # Diagnostic data interfaces
│   └── blueprint.ts                    # Blueprint data interfaces
│
└── styles/
    └── globals.css                     # Global styles (existing)
```

### Data Flow (v1)

```
User Input → Client State → Sample Data Generation → UI Rendering
```

For v1, all data is managed client-side:
- Diagnostics form data stored in React state
- Blueprint data loaded from static sample JSON
- Navigation passes flags via URL params (e.g., `?sample=true`)

### Future Backend Integration (v2)

```
User Input → API POST /api/diagnostics → Backend Processing → Database
                                                                    ↓
User Request → API GET /api/blueprint/:id ← Backend Retrieval ← Database
```

The data structures and component props are designed to accept API responses with minimal refactoring.

## Components and Interfaces

### Diagnostics Components

#### DiagnosticPhase Component

**Purpose**: Reusable card component for each diagnostic phase (A, B, C, D)

**Props**:
```typescript
interface DiagnosticPhaseProps {
  phase: 'A' | 'B' | 'C' | 'D'
  title: string
  description: string
  fields: DiagnosticField[]
  values: Record<string, any>
  onChange: (fieldId: string, value: any) => void
}

interface DiagnosticField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'multiselect'
  placeholder?: string
  options?: string[]
  required?: boolean
  helperText?: string
}
```

**Behavior**:
- Renders a card with phase title and description
- Maps over fields array to render appropriate input types
- Calls onChange handler when user modifies any field
- Shows validation state (future enhancement)

**Styling**:
- Card background: `var(--bg-elevated)`
- Border: `1px solid var(--border-soft)`
- Border radius: `20px`
- Padding: `24px`
- Margin bottom: `20px`

#### DiagnosticSummary Component

**Purpose**: Display AI readiness score, maturity level, and CTA button

**Props**:
```typescript
interface DiagnosticSummaryProps {
  score: number
  maturityLevel: string
  onGenerateBlueprint: () => void
}
```

**Behavior**:
- Displays hardcoded score (75) and maturity level ("Developing") for v1
- Renders prominent CTA button
- Navigates to `/blueprint?sample=true` on button click

**Styling**:
- Larger card with prominent visual hierarchy
- Score displayed as large number with label
- Maturity level as pill badge
- CTA button: primary style with hover effects

#### Diagnostics Page Component

**Purpose**: Main page orchestrating the diagnostic flow

**State Management**:
```typescript
interface DiagnosticData {
  business: {
    industry: string
    revenueModel: string
    channels: string[]
    tools: string[]
  }
  operations: {
    timeWaste: string
    manualProcesses: string[]
    delays: string[]
  }
  dataReadiness: {
    hasCRM: boolean
    crmName?: string
    structuredData: boolean
    dataDescription?: string
    hasAPIs: boolean
    integrations: string[]
  }
  objectives: {
    primaryGoal: string
    kpis: string[]
    timeline: string
  }
}
```

**Layout**:
- Single scrollable page
- Header section with title and description
- Four DiagnosticPhase components (A, B, C, D)
- DiagnosticSummary component at bottom
- Responsive: full width on mobile, max-width 900px on desktop

### Blueprint Components

#### BlueprintHeader Component

**Purpose**: Display blueprint title, metadata, and status pills

**Props**:
```typescript
interface BlueprintHeaderProps {
  blueprintId: string
  version: string
  status: string
  maturityLevel: string
  estimatedROI: string
  showSampleBanner?: boolean
}
```

**Behavior**:
- Renders title "AI System Blueprint"
- Shows subtitle with ID, version, status
- Displays pills for maturity and ROI
- Conditionally shows sample data banner

**Styling**:
- Title: 32px, font-weight 600
- Subtitle: 14px, secondary color
- Pills: rounded badges with background colors
- Banner: info-style alert with soft background

#### ExecutiveSummary Component

**Purpose**: Display high-level blueprint summary

**Props**:
```typescript
interface ExecutiveSummaryProps {
  primaryGoal: string
  readinessScore: number
  maturityLevel: string
  constraints: string[]
}
```

**Behavior**:
- Renders card with primary goal as headline
- Shows readiness score and maturity level
- Lists top 2-3 constraints as bullet points

**Styling**:
- Card layout with prominent goal text
- Score displayed with visual indicator
- Constraints as clean list with subtle bullets

#### ArchitectureLayer Component

**Purpose**: Display a single architecture layer (Data Sources, Processing, etc.)

**Props**:
```typescript
interface ArchitectureLayerProps {
  title: string
  items: string[]
  description: string
}
```

**Behavior**:
- Renders card with layer title
- Lists items as bullet points or chips
- Shows description text below items

**Styling**:
- Card with left border accent (different color per layer)
- Items displayed as inline chips or vertical list
- Description in secondary text color

#### WorkflowCard Component

**Purpose**: Display a single workflow module

**Props**:
```typescript
interface WorkflowCardProps {
  name: string
  trigger: string
  steps: string[]
  integrations: string[]
  onEdit?: () => void
  onSimulate?: () => void
  onDeploy?: () => void
}
```

**Behavior**:
- Renders card with workflow name as title
- Shows trigger condition
- Lists steps (collapsed if more than 5)
- Shows required integrations as chips
- Renders action buttons (Edit/Simulate disabled, Deploy active)

**Styling**:
- Card with hover effect
- Steps as numbered list
- Integration chips with icons (future)
- Button row at bottom with proper spacing

#### RiskCard and DeploymentCard Components

**Purpose**: Display risk assessment and deployment plan

**Props**:
```typescript
interface RiskCardProps {
  dataRisks: string[]
  fallbackStrategy: string
}

interface DeploymentCardProps {
  phase: string
  estimatedImpact: string
  estimatedROIMonths: number
}
```

**Behavior**:
- Render side-by-side on desktop (flexbox)
- Stack vertically on mobile
- Display structured information with labels

**Styling**:
- Equal width cards with gap between
- Icon or visual indicator for risk level
- Timeline visualization for deployment (future)

#### Blueprint Page Component

**Purpose**: Main page orchestrating the blueprint viewer

**State Management**:
```typescript
interface BlueprintData {
  blueprint_id: string
  version: string
  organization: string
  diagnostic_summary: {
    readiness_score: number
    maturity_level: string
    constraints: string[]
  }
  strategic_objective: string
  system_architecture: {
    data_sources: ArchitectureLayer
    processing_layers: ArchitectureLayer
    decision_engine: ArchitectureLayer
    memory_layer: ArchitectureLayer
    execution_layer: ArchitectureLayer
  }
  workflow_modules: WorkflowModule[]
  risk_assessment: {
    data_risks: string[]
    fallback_strategy: string
  }
  deployment_plan: {
    phase: string
    estimated_impact: string
    estimated_roi_months: number
  }
}
```

**Layout**:
- Scrollable page with sections
- BlueprintHeader at top
- ExecutiveSummary card
- System Architecture section with vertical layer list
- Workflow Modules section with card grid
- Risk & Deployment section with two-column layout
- Responsive: single column on mobile, multi-column on desktop

## Data Models

### Diagnostic Data Model

```typescript
// types/diagnostic.ts

export interface DiagnosticField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'multiselect'
  placeholder?: string
  options?: string[]
  required?: boolean
  helperText?: string
}

export interface DiagnosticPhaseConfig {
  phase: 'A' | 'B' | 'C' | 'D'
  title: string
  description: string
  fields: DiagnosticField[]
}

export interface BusinessContext {
  industry: string
  revenueModel: string
  channels: string[]
  tools: string[]
}

export interface OperationalPainPoints {
  timeWaste: string
  manualProcesses: string[]
  delays: string[]
}

export interface DataReadiness {
  hasCRM: boolean
  crmName?: string
  structuredData: boolean
  dataDescription?: string
  hasAPIs: boolean
  integrations: string[]
}

export interface StrategicGoals {
  primaryGoal: string
  kpis: string[]
  timeline: string
}

export interface DiagnosticData {
  business: BusinessContext
  operations: OperationalPainPoints
  dataReadiness: DataReadiness
  objectives: StrategicGoals
}

export interface DiagnosticResult {
  data: DiagnosticData
  score: number
  maturityLevel: string
  timestamp: string
}

// Sample data generator for v1
export function getSampleDiagnosticResult(): DiagnosticResult {
  return {
    data: {
      business: {
        industry: 'E-commerce',
        revenueModel: 'Subscription',
        channels: ['Website', 'Mobile App'],
        tools: ['Shopify', 'Stripe', 'Mailchimp']
      },
      operations: {
        timeWaste: 'Manual data entry and report generation',
        manualProcesses: ['Customer onboarding', 'Invoice processing'],
        delays: ['Approval workflows', 'Data synchronization']
      },
      dataReadiness: {
        hasCRM: true,
        crmName: 'Salesforce',
        structuredData: true,
        dataDescription: 'Customer data in CRM, transaction data in database',
        hasAPIs: true,
        integrations: ['Salesforce API', 'Stripe API', 'Shopify API']
      },
      objectives: {
        primaryGoal: 'Automate customer onboarding and reduce manual data entry',
        kpis: ['Onboarding time', 'Data accuracy', 'Customer satisfaction'],
        timeline: '3-6 months'
      }
    },
    score: 75,
    maturityLevel: 'Developing',
    timestamp: new Date().toISOString()
  }
}

// Phase configurations for form rendering
export const DIAGNOSTIC_PHASES: DiagnosticPhaseConfig[] = [
  {
    phase: 'A',
    title: 'Business Context',
    description: 'Tell us about your business model and current tools',
    fields: [
      {
        id: 'industry',
        label: 'Industry',
        type: 'select',
        options: ['E-commerce', 'SaaS', 'Healthcare', 'Finance', 'Manufacturing', 'Other'],
        required: true
      },
      {
        id: 'revenueModel',
        label: 'Revenue Model',
        type: 'select',
        options: ['Subscription', 'Transaction-based', 'Service-based', 'Product sales', 'Mixed'],
        required: true
      },
      {
        id: 'channels',
        label: 'Sales/Service Channels',
        type: 'multiselect',
        options: ['Website', 'Mobile App', 'Physical Store', 'Phone', 'Email', 'Social Media'],
        helperText: 'Select all that apply'
      },
      {
        id: 'tools',
        label: 'Current Tools & Platforms',
        type: 'textarea',
        placeholder: 'List your main tools (CRM, payment processor, etc.)',
        helperText: 'Comma-separated list'
      }
    ]
  },
  {
    phase: 'B',
    title: 'Operational Pain Points',
    description: 'Identify where time and resources are being wasted',
    fields: [
      {
        id: 'timeWaste',
        label: 'Biggest Time Wasters',
        type: 'textarea',
        placeholder: 'Describe manual tasks that consume the most time',
        required: true
      },
      {
        id: 'manualProcesses',
        label: 'Manual Processes',
        type: 'textarea',
        placeholder: 'List processes that require manual intervention',
        helperText: 'One per line'
      },
      {
        id: 'delays',
        label: 'Common Delays',
        type: 'textarea',
        placeholder: 'What causes delays in your operations?',
        helperText: 'One per line'
      }
    ]
  },
  {
    phase: 'C',
    title: 'Data & Automation Readiness',
    description: 'Assess your current data infrastructure and integration capabilities',
    fields: [
      {
        id: 'hasCRM',
        label: 'Do you use a CRM?',
        type: 'select',
        options: ['Yes', 'No'],
        required: true
      },
      {
        id: 'crmName',
        label: 'CRM Name',
        type: 'text',
        placeholder: 'e.g., Salesforce, HubSpot',
        helperText: 'Only if you answered Yes above'
      },
      {
        id: 'structuredData',
        label: 'Is your data structured and accessible?',
        type: 'select',
        options: ['Yes', 'Partially', 'No'],
        required: true
      },
      {
        id: 'dataDescription',
        label: 'Data Description',
        type: 'textarea',
        placeholder: 'Describe where your data lives and how it\'s organized'
      },
      {
        id: 'hasAPIs',
        label: 'Do your tools have APIs?',
        type: 'select',
        options: ['Yes', 'Some', 'No', 'Not sure'],
        required: true
      },
      {
        id: 'integrations',
        label: 'Existing Integrations',
        type: 'textarea',
        placeholder: 'List any existing integrations or APIs you use',
        helperText: 'One per line'
      }
    ]
  },
  {
    phase: 'D',
    title: 'Strategic Goals',
    description: 'Define what you want to achieve with AI automation',
    fields: [
      {
        id: 'primaryGoal',
        label: 'Primary Goal',
        type: 'textarea',
        placeholder: 'What is your main objective for AI automation?',
        required: true
      },
      {
        id: 'kpis',
        label: 'Key Performance Indicators',
        type: 'textarea',
        placeholder: 'How will you measure success?',
        helperText: 'One per line'
      },
      {
        id: 'timeline',
        label: 'Timeline',
        type: 'select',
        options: ['1-3 months', '3-6 months', '6-12 months', '12+ months'],
        required: true
      }
    ]
  }
]
```

### Blueprint Data Model

```typescript
// types/blueprint.ts

export interface ArchitectureLayer {
  title: string
  items: string[]
  description: string
}

export interface WorkflowModule {
  name: string
  trigger: string
  steps: string[]
  integrations: string[]
}

export interface DiagnosticSummary {
  readiness_score: number
  maturity_level: string
  constraints: string[]
}

export interface RiskAssessment {
  data_risks: string[]
  fallback_strategy: string
}

export interface DeploymentPlan {
  phase: string
  estimated_impact: string
  estimated_roi_months: number
}

export interface SystemArchitecture {
  data_sources: ArchitectureLayer
  processing_layers: ArchitectureLayer
  decision_engine: ArchitectureLayer
  memory_layer: ArchitectureLayer
  execution_layer: ArchitectureLayer
}

export interface BlueprintData {
  blueprint_id: string
  version: string
  organization: string
  diagnostic_summary: DiagnosticSummary
  strategic_objective: string
  system_architecture: SystemArchitecture
  workflow_modules: WorkflowModule[]
  risk_assessment: RiskAssessment
  deployment_plan: DeploymentPlan
}

// Sample blueprint data for v1
export function getSampleBlueprint(): BlueprintData {
  return {
    blueprint_id: 'BP-2024-001',
    version: '1.0',
    organization: 'Sample Organization',
    diagnostic_summary: {
      readiness_score: 75,
      maturity_level: 'Developing',
      constraints: [
        'Limited API access to legacy systems',
        'Data quality issues in customer database',
        'Team training required for AI tools'
      ]
    },
    strategic_objective: 'Automate customer onboarding and reduce manual data entry by 70% within 6 months',
    system_architecture: {
      data_sources: {
        title: 'Data Sources',
        items: ['Salesforce CRM', 'Stripe Payments', 'Shopify Store', 'Email System (IMAP)'],
        description: 'Primary data sources for customer information, transactions, and communications'
      },
      processing_layers: {
        title: 'Processing Layers',
        items: ['Data Validation Engine', 'Entity Extraction (NLP)', 'Document Parser', 'Data Enrichment Service'],
        description: 'Transform and validate incoming data from multiple sources'
      },
      decision_engine: {
        title: 'Decision Engine',
        items: ['Rule-based Routing', 'ML Classification Model', 'Priority Scoring', 'Approval Workflow Logic'],
        description: 'Intelligent decision-making for routing, prioritization, and automation triggers'
      },
      memory_layer: {
        title: 'Memory Layer',
        items: ['Customer Context Store', 'Interaction History', 'Workflow State Management', 'Audit Log'],
        description: 'Persistent storage for context, history, and state across workflows'
      },
      execution_layer: {
        title: 'Execution Layer',
        items: ['n8n Workflow Engine', 'API Orchestration', 'Notification Service', 'Error Handling & Retry'],
        description: 'Execute workflows, manage integrations, and handle errors gracefully'
      }
    },
    workflow_modules: [
      {
        name: 'Customer Onboarding Automation',
        trigger: 'New customer signup detected in Shopify',
        steps: [
          'Extract customer data from Shopify webhook',
          'Validate email and contact information',
          'Create customer record in Salesforce CRM',
          'Send welcome email with onboarding checklist',
          'Schedule follow-up task for sales team'
        ],
        integrations: ['Shopify', 'Salesforce', 'SendGrid']
      },
      {
        name: 'Invoice Processing Automation',
        trigger: 'New invoice received via email',
        steps: [
          'Parse invoice PDF using OCR',
          'Extract vendor, amount, and due date',
          'Validate against purchase orders',
          'Route for approval if amount > $1000',
          'Create payment record in Stripe',
          'Send confirmation to vendor'
        ],
        integrations: ['Email (IMAP)', 'Stripe', 'Internal Approval System']
      },
      {
        name: 'Customer Support Ticket Routing',
        trigger: 'New support ticket created',
        steps: [
          'Classify ticket urgency using NLP',
          'Extract customer context from CRM',
          'Route to appropriate team based on category',
          'Send auto-response to customer',
          'Escalate if high priority'
        ],
        integrations: ['Zendesk', 'Salesforce', 'Slack']
      }
    ],
    risk_assessment: {
      data_risks: [
        'Customer PII must be encrypted at rest and in transit',
        'Payment data handling must comply with PCI DSS',
        'GDPR compliance required for EU customers'
      ],
      fallback_strategy: 'All workflows include manual fallback paths. If automation fails, tasks are routed to human operators with full context. Critical workflows have 24/7 monitoring and alerting.'
    },
    deployment_plan: {
      phase: 'Phased rollout over 3 months',
      estimated_impact: '70% reduction in manual data entry, 50% faster onboarding, 30% improvement in customer satisfaction',
      estimated_roi_months: 6
    }
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Diagnostic Phase Structure Consistency

*For any* diagnostic page render, all four phase cards (A, B, C, D) should be displayed, and each phase card should contain a title, description, and form fields of valid types (text, textarea, select, multiselect).

**Validates: Requirements 1.2, 1.7, 1.8**

### Property 2: Form State Synchronization

*For any* form field change in the diagnostic system, the client-side state should be updated to reflect the new value immediately.

**Validates: Requirements 3.1**

### Property 3: Diagnostic Data Structure Integrity

*For any* diagnostic data object created by the system, it should contain exactly four top-level properties: business, operations, data_readiness, and objectives.

**Validates: Requirements 3.2**

### Property 4: Responsive Layout Adaptation

*For any* page in the application (diagnostics, blueprint, dashboard), when the viewport width changes from desktop (>768px) to mobile (≤768px), the layout should adapt appropriately (multi-column to single-column, side-by-side to stacked).

**Validates: Requirements 4.4, 10.4, 12.5**

### Property 5: Architecture Layer Completeness

*For any* blueprint render, exactly five architecture layers should be displayed (Data Sources, Processing Layers, Decision Engine, Memory Layer, Execution Layer), and each layer card should contain a title, items list, and description.

**Validates: Requirements 6.2, 6.3**

### Property 6: Workflow Module Card Structure

*For any* workflow module in the blueprint, the rendered card should display the workflow name, trigger condition, steps list, and required integrations.

**Validates: Requirements 7.2**

### Property 7: Blueprint Data Structure Validation

*For any* blueprint data object, it should contain all required properties: blueprint_id, version, organization, diagnostic_summary, strategic_objective, system_architecture, workflow_modules, risk_assessment, and deployment_plan.

**Validates: Requirements 9.1**

### Property 8: Error State for Invalid Blueprint

*For any* blueprint data that is missing required properties or is null/undefined, the Blueprint Viewer should display an error state instead of attempting to render the blueprint.

**Validates: Requirements 9.4**

## Error Handling

### Diagnostics Page Error Handling

1. **Form Validation**:
   - Required fields should show validation errors when empty
   - Invalid input formats should be caught and displayed
   - Validation occurs on blur and on submit attempt

2. **State Management Errors**:
   - If state update fails, show inline error message
   - Preserve user input even if state update fails
   - Log errors to console for debugging

3. **Navigation Errors**:
   - If navigation to blueprint fails, show error toast
   - Provide retry mechanism
   - Fall back to dashboard if repeated failures

### Blueprint Viewer Error Handling

1. **Missing Blueprint Data**:
   - Display error state component with message
   - Provide "Return to Dashboard" button
   - Suggest running diagnostic first

2. **Malformed Blueprint Data**:
   - Validate data structure on load
   - Display specific error messages for missing fields
   - Provide "Report Issue" option

3. **Rendering Errors**:
   - Use React error boundaries to catch component errors
   - Display fallback UI with error details
   - Log errors for debugging

### Error State Components

Both pages should include error state components with:
- Clear error message
- Suggested action (retry, go back, contact support)
- Visual indicator (icon, color)
- Consistent styling with rest of application

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs
- Both are complementary and necessary for comprehensive coverage

### Unit Testing

Unit tests should focus on:

1. **Specific Examples**:
   - Diagnostics page renders with correct title
   - Each phase (A, B, C, D) displays correct fields
   - Summary card shows hardcoded score (75) and maturity level ("Developing")
   - Blueprint header displays correct metadata
   - Executive summary shows all required information
   - All 5 architecture layers render correctly
   - Risk and deployment cards display correct data
   - Navigation buttons link to correct routes

2. **Edge Cases**:
   - Empty form submission handling
   - Very long text input in textarea fields
   - Blueprint with zero workflow modules
   - Blueprint with many workflow modules (>10)
   - Mobile viewport rendering
   - Desktop viewport rendering

3. **Error Conditions**:
   - Missing blueprint data
   - Malformed blueprint JSON
   - Invalid diagnostic data structure
   - Navigation failures

4. **Integration Points**:
   - Sidebar navigation includes new routes
   - Diagnostic to blueprint navigation with sample flag
   - Blueprint to workflows navigation
   - State management across components

### Property-Based Testing

Property tests should focus on:

1. **Diagnostic Phase Structure** (Property 1):
   - Generate random diagnostic configurations
   - Verify all 4 phases always render
   - Verify each phase has title, description, and valid field types

2. **Form State Synchronization** (Property 2):
   - Generate random form field changes
   - Verify state updates match input changes
   - Verify no data loss during updates

3. **Data Structure Integrity** (Property 3):
   - Generate random diagnostic data
   - Verify structure always has 4 required properties
   - Verify no extra properties are added

4. **Responsive Layout** (Property 4):
   - Generate random viewport sizes
   - Verify layout adapts at breakpoint (768px)
   - Verify no content is hidden or inaccessible

5. **Architecture Layer Completeness** (Property 5):
   - Generate random blueprint data
   - Verify exactly 5 layers always render
   - Verify each layer has required fields

6. **Workflow Card Structure** (Property 6):
   - Generate random workflow modules
   - Verify each card displays all required information
   - Verify no missing fields

7. **Blueprint Data Validation** (Property 7):
   - Generate random blueprint objects
   - Verify all required properties are present
   - Verify structure matches interface

8. **Error State Handling** (Property 8):
   - Generate invalid blueprint data (missing fields, null, undefined)
   - Verify error state always displays
   - Verify no crashes or blank screens

### Property-Based Testing Configuration

- **Library**: Use `@fast-check/jest` for TypeScript/React property-based testing
- **Iterations**: Minimum 100 iterations per property test
- **Tagging**: Each property test must reference its design document property
- **Tag Format**: `// Feature: diagnostics-blueprint-viewer-v1, Property {number}: {property_text}`

### Test Organization

```
nextjs-console/
├── __tests__/
│   ├── diagnostics/
│   │   ├── DiagnosticPage.test.tsx          # Unit tests
│   │   ├── DiagnosticPage.property.test.tsx # Property tests
│   │   ├── DiagnosticPhase.test.tsx
│   │   └── DiagnosticSummary.test.tsx
│   ├── blueprint/
│   │   ├── BlueprintPage.test.tsx           # Unit tests
│   │   ├── BlueprintPage.property.test.tsx  # Property tests
│   │   ├── ArchitectureLayer.test.tsx
│   │   ├── WorkflowCard.test.tsx
│   │   └── ErrorState.test.tsx
│   └── integration/
│       ├── navigation.test.tsx              # Integration tests
│       └── responsive.test.tsx
```

### Testing Tools

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **@fast-check/jest**: Property-based testing library
- **@testing-library/user-event**: User interaction simulation

### Example Property Test

```typescript
// Feature: diagnostics-blueprint-viewer-v1, Property 1: Diagnostic Phase Structure Consistency
import * as fc from 'fast-check'
import { render } from '@testing-library/react'
import DiagnosticsPage from '@/app/diagnostics/page'

describe('Property 1: Diagnostic Phase Structure Consistency', () => {
  it('should always render 4 phases with title, description, and valid fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Generate random diagnostic configurations
          phases: fc.constantFrom(['A', 'B', 'C', 'D'])
        }),
        (config) => {
          const { container } = render(<DiagnosticsPage />)
          
          // Verify 4 phases render
          const phases = container.querySelectorAll('[data-testid^="phase-"]')
          expect(phases).toHaveLength(4)
          
          // Verify each phase has required elements
          phases.forEach((phase) => {
            expect(phase.querySelector('[data-testid$="-title"]')).toBeInTheDocument()
            expect(phase.querySelector('[data-testid$="-description"]')).toBeInTheDocument()
            
            const fields = phase.querySelectorAll('input, textarea, select')
            expect(fields.length).toBeGreaterThan(0)
          })
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

## Implementation Notes

### CSS Module Naming Convention

Follow the existing pattern from dashboard components:
- Component-specific styles in `ComponentName.module.css`
- Use camelCase for class names
- Prefix with component name for clarity

Example:
```css
/* DiagnosticPhase.module.css */
.phaseCard { }
.phaseTitle { }
.phaseDescription { }
.fieldGroup { }
.fieldLabel { }
```

### TypeScript Strict Mode

All components should be written with TypeScript strict mode enabled:
- No implicit any
- Strict null checks
- No unused locals or parameters
- Proper interface definitions for all props

### Accessibility

All components should follow WCAG 2.1 AA standards:
- Proper semantic HTML (form, label, input associations)
- ARIA labels where needed
- Keyboard navigation support
- Focus management
- Color contrast ratios meet standards

### Performance Considerations

1. **Code Splitting**:
   - Diagnostics and Blueprint pages are separate routes (automatic code splitting)
   - Sample data functions are tree-shakeable

2. **Memoization**:
   - Use React.memo for components that receive stable props
   - Use useMemo for expensive computations
   - Use useCallback for event handlers passed to children

3. **Bundle Size**:
   - No external UI libraries keeps bundle small
   - Pure CSS modules are optimized by Next.js
   - Sample data is small (<10KB)

### Future Backend Integration

The implementation is structured for easy backend integration:

1. **API Endpoints** (to be implemented in v2):
   ```
   POST /api/diagnostics          # Submit diagnostic data
   GET  /api/diagnostics/:id      # Retrieve diagnostic result
   POST /api/blueprints/generate  # Generate blueprint from diagnostic
   GET  /api/blueprints/:id       # Retrieve blueprint
   ```

2. **Data Fetching Pattern**:
   ```typescript
   // Replace getSampleBlueprint() with:
   const response = await fetch(`/api/blueprints/${id}`)
   const blueprint = await response.json()
   ```

3. **State Management**:
   - Current client-side state can be replaced with API calls
   - Add loading states for async operations
   - Add error handling for network failures

4. **Authentication**:
   - Add auth token to API requests
   - Handle unauthorized responses
   - Redirect to login if needed

### Migration Path to v2

1. **Phase 1** (Current - v1):
   - Static UI with sample data
   - Client-side state management
   - No backend integration

2. **Phase 2** (v2):
   - Add API endpoints to FastAPI backend
   - Replace sample data functions with API calls
   - Add loading and error states
   - Persist diagnostics and blueprints to database

3. **Phase 3** (v3):
   - Add AI-powered blueprint generation
   - Real-time scoring and analysis
   - Workflow deployment integration
   - Advanced features (edit, simulate, etc.)

## Design Decisions and Rationale

### Why Pure CSS Instead of Tailwind?

The existing codebase uses pure CSS with CSS modules, and this approach:
- Maintains consistency with dashboard and console
- Provides better type safety with TypeScript
- Reduces bundle size (no Tailwind runtime)
- Allows for more precise control over styling
- Easier to maintain design tokens in one place

### Why Client-Side State for v1?

Using client-side state for v1:
- Faster development iteration
- No backend dependencies for initial testing
- Easier to demo and gather feedback
- Simple migration path to backend in v2

### Why Sample Data Instead of Empty States?

Providing sample data:
- Demonstrates the full user experience
- Helps users understand what information is needed
- Makes the product feel complete and polished
- Easier to test and validate UI/UX decisions

### Why Single-Page Form Instead of Multi-Step Wizard?

A single-page form with sections:
- Reduces cognitive load (users see full scope)
- Easier to navigate back and forth
- Better for users who want to skip around
- Simpler implementation and state management
- Matches the "calm, professional" design aesthetic

### Why Vertical Layer List Instead of Architecture Diagram?

For v1, a vertical list:
- Simpler to implement and maintain
- More responsive (works well on mobile)
- Easier to read and understand
- Can be enhanced with diagrams in v2
- Focuses on content over visualization

## Conclusion

This design provides a complete specification for implementing Diagnostics v1 and Blueprint Viewer v1 in the Next.js Aivory application. The implementation focuses on delivering a production-ready user experience with static data, while maintaining a clear path for backend integration in future versions.

The component-based architecture, TypeScript interfaces, and CSS module patterns ensure consistency with the existing codebase. The dual testing approach (unit tests + property-based tests) provides comprehensive coverage and confidence in the implementation.

By following this design, developers can implement the features incrementally, test thoroughly, and deliver a polished product that users can interact with immediately, even before backend integration is complete.
