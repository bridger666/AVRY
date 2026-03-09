# Design Document: Deep Diagnostic Flow

## Overview

The Deep Diagnostic Flow is a comprehensive, multi-phase AI readiness assessment that extends beyond the Free Diagnostic's 12-question format. Users progress through four sequential phases (Business Objective & KPI, Data & Process Readiness, Risk & Constraints, AI Opportunity Mapping), with automatic progress persistence and resume capability. The feature provides a more thorough evaluation of organizational AI readiness, culminating in detailed scoring and blueprint generation recommendations.

The system is designed as a stateful, multi-session experience where users can complete phases over time, with all progress automatically saved to localStorage. Upon completion, responses are submitted to VPS Bridge for AI-powered scoring analysis, and users are redirected to a comprehensive results page that reuses components from the Free Diagnostic while adding Deep-specific insights and comparison information.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                         │
│                    (Port 3000)                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  /diagnostics/deep (Main Flow)                             │
│  ├── Phase Navigator Component                             │
│  ├── Progress Tracker Component                            │
│  ├── Phase Content Renderer                                │
│  ├── Storage Manager Service                               │
│  └── Validation Logic                                      │
│                                                             │
│  /diagnostics/deep/summary (Review)                        │
│  ├── Summary View Component                                │
│  ├── Phase Response Display                                │
│  ├── Edit Navigation                                       │
│  └── Submit Control                                        │
│                                                             │
│  /diagnostics/deep/result (Results)                        │
│  ├── Scoring Card (Reused from Free)                       │
│  ├── Deep vs Free Comparison                               │
│  ├── Blueprint Generation CTA                              │
│  └── Recommendations Display                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ HTTP POST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              VPS Bridge Service                             │
│              (Port 3001)                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  POST /api/diagnostics/run                                 │
│  ├── Receives: { organization_id, phases, mode: "deep" }   │
│  ├── Processes: AI scoring with deep analysis              │
│  └── Returns: { diagnostic_id, scores, insights }          │
│                                                             │
│  POST /api/blueprints/generate                             │
│  ├── Receives: { diagnostic_id }                           │
│  ├── Processes: Blueprint generation                       │
│  └── Returns: { blueprint_id, redirect_url }               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ Stores
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Browser localStorage                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Key: "aivory_deep_diagnostic"                             │
│  Value: {                                                   │
│    phases: {                                                │
│      business_objective_kpi: {                              │
│        completed: boolean                                   │
│        responses: Record<string, any>                       │
│      },                                                     │
│      data_process_readiness: { ... },                       │
│      risk_constraints: { ... },                             │
│      ai_opportunity_mapping: { ... }                        │
│    },                                                       │
│    currentPhase: string,                                    │
│    lastUpdated: string                                      │
│  }                                                          │
│                                                             │
│  Key: "aivory_deep_diagnostic_result"                      │
│  Value: {                                                   │
│    diagnostic_id: string                                    │
│    score: number                                            │
│    maturity_level: string                                   │
│    dimensions: Record<string, number>                       │
│    insights: { ... }                                        │
│    timestamp: string                                        │
│  }                                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Routing Structure

```
/diagnostics/deep
  ├── page.tsx (Main phase flow)
  ├── summary/
  │   └── page.tsx (Pre-submission review)
  ├── result/
  │   └── page.tsx (Results display)
  └── deep-diagnostic.module.css
```

### Data Flow

1. **Phase Progression**: User answers questions in phase → Responses saved to localStorage (500ms debounce) → Phase completion enables next phase
2. **Resume Flow**: Page loads → Check localStorage → Restore to last incomplete phase → Populate saved responses
3. **Summary Flow**: All phases complete → Navigate to summary → Display all responses → Allow phase editing
4. **Submission Flow**: User submits from summary → POST to VPS Bridge → Store results → Navigate to results page
5. **Blueprint Flow**: User clicks "Generate Blueprint" → POST to blueprint API → Navigate to blueprint viewer

## Components and Interfaces

### Core Components

#### 1. DeepDiagnosticFlow Component (`/diagnostics/deep/page.tsx`)

**Purpose**: Main orchestrator for the multi-phase diagnostic flow

**State**:
```typescript
{
  currentPhase: PhaseId
  phaseData: Record<PhaseId, PhaseData>
  isLoading: boolean
  validationErrors: Record<string, string>
}
```

**Responsibilities**:
- Render current phase content
- Manage phase navigation
- Coordinate with Storage Manager for persistence
- Validate phase completion
- Handle "Start Fresh" functionality

**Sub-components**:
- `PhaseNavigator`: Tab-like navigation showing all phases
- `ProgressTracker`: Visual progress indicator
- `PhaseContent`: Dynamic renderer for current phase questions
- `PhaseControls`: Navigation buttons and actions

#### 2. PhaseNavigator Component

**Purpose**: Display and manage navigation between phases

**Props**:
```typescript
{
  phases: PhaseConfig[]
  currentPhase: PhaseId
  completedPhases: PhaseId[]
  onNavigate: (phaseId: PhaseId) => void
}
```

**Responsibilities**:
- Display all four phases in order
- Show completion status per phase
- Enable navigation to completed phases
- Disable navigation to incomplete phases
- Highlight current active phase

#### 3. ProgressTracker Component

**Purpose**: Visual representation of overall progress

**Props**:
```typescript
{
  totalPhases: number
  completedPhases: number
  currentPhase: number
}
```

**Responsibilities**:
- Display progress bar (percentage complete)
- Show "Phase X of 4" label
- Show "X/4 phases complete" status

#### 4. PhaseContent Component

**Purpose**: Render questions for the current phase

**Props**:
```typescript
{
  phase: PhaseConfig
  responses: Record<string, any>
  onResponseChange: (questionId: string, value: any) => void
  validationErrors: Record<string, string>
}
```

**Responsibilities**:
- Render all questions for the phase
- Handle different input types (text, textarea, select, multiselect)
- Display validation errors
- Debounce response changes for storage

#### 5. SummaryView Component (`/diagnostics/deep/summary/page.tsx`)

**Purpose**: Pre-submission review of all responses

**State**:
```typescript
{
  phaseData: Record<PhaseId, PhaseData>
  isSubmitting: boolean
  error: string | null
}
```

**Responsibilities**:
- Display all responses organized by phase
- Provide "Edit" button for each phase
- Show "Submit Diagnostic" button
- Handle submission to VPS Bridge
- Display loading state during submission
- Handle submission errors

#### 6. DeepDiagnosticResult Component (`/diagnostics/deep/result/page.tsx`)

**Purpose**: Display comprehensive results and next steps

**State**:
```typescript
{
  result: DeepDiagnosticResult | null
  isGeneratingBlueprint: boolean
  error: string | null
}
```

**Responsibilities**:
- Retrieve results from localStorage
- Display ScoringCard (reused from Free Diagnostic)
- Display Deep vs Free comparison section
- Provide "Generate Blueprint" CTA
- Handle blueprint generation flow
- Display error states

### TypeScript Interfaces

```typescript
// Phase identifiers
export type PhaseId = 
  | 'business_objective_kpi'
  | 'data_process_readiness'
  | 'risk_constraints'
  | 'ai_opportunity_mapping'

// Question types
export type QuestionType = 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'radio'

// Question definition
export interface DeepDiagnosticQuestion {
  id: string
  question: string
  type: QuestionType
  options?: string[]
  placeholder?: string
  helperText?: string
  required: boolean
  validation?: {
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: string
  }
}

// Phase configuration
export interface PhaseConfig {
  id: PhaseId
  title: string
  description: string
  questions: DeepDiagnosticQuestion[]
}

// Phase data storage
export interface PhaseData {
  completed: boolean
  responses: Record<string, any>
}

// localStorage structure
export interface DeepDiagnosticProgress {
  phases: Record<PhaseId, PhaseData>
  currentPhase: PhaseId
  lastUpdated: string
}

// API Request payload
export interface DeepDiagnosticRequest {
  organization_id: string
  mode: 'deep'
  phases: Record<PhaseId, Record<string, any>>
}

// API Response payload
export interface DeepDiagnosticResponse {
  diagnostic_id: string
  score: number
  maturity_level: 'Initial' | 'Developing' | 'Defined' | 'Managed' | 'Optimizing'
  dimensions: {
    business_alignment: number
    data_readiness: number
    process_maturity: number
    risk_management: number
    opportunity_identification: number
  }
  strengths: string[]
  blockers: string[]
  opportunities: string[]
  narrative: string
  recommendations: string[]
  timestamp: string
}

// localStorage result storage
export interface DeepDiagnosticResult extends DeepDiagnosticResponse {
  // Same as response
}

// Blueprint generation request
export interface BlueprintGenerationRequest {
  diagnostic_id: string
}

// Blueprint generation response
export interface BlueprintGenerationResponse {
  blueprint_id: string
  status: 'generating' | 'completed'
  redirect_url: string
}
```

### Service Layer

```typescript
// services/deepDiagnostic.ts

export class DeepDiagnosticService {
  private static readonly STORAGE_KEY = 'aivory_deep_diagnostic'
  private static readonly RESULT_KEY = 'aivory_deep_diagnostic_result'
  private static readonly DEBOUNCE_MS = 500

  /**
   * Save progress to localStorage with debouncing
   */
  static saveProgress(progress: DeepDiagnosticProgress): void {
    try {
      const data = {
        ...progress,
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('[DeepDiagnostic] Failed to save progress:', error)
    }
  }

  /**
   * Load progress from localStorage
   */
  static loadProgress(): DeepDiagnosticProgress | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return null
      
      const progress = JSON.parse(stored) as DeepDiagnosticProgress
      
      // Validate structure
      if (!progress.phases || !progress.currentPhase) {
        console.warn('[DeepDiagnostic] Invalid stored data, clearing')
        this.clearProgress()
        return null
      }
      
      return progress
    } catch (error) {
      console.error('[DeepDiagnostic] Failed to load progress:', error)
      return null
    }
  }

  /**
   * Clear all progress
   */
  static clearProgress(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('[DeepDiagnostic] Failed to clear progress:', error)
    }
  }

  /**
   * Submit diagnostic to VPS Bridge
   */
  static async submitDiagnostic(
    organizationId: string,
    phases: Record<PhaseId, Record<string, any>>
  ): Promise<DeepDiagnosticResponse> {
    const response = await fetch('/api/diagnostics/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organization_id: organizationId,
        mode: 'deep',
        phases
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: 'Failed to submit diagnostic' 
      }))
      throw new Error(error.message || 'Failed to submit diagnostic')
    }

    const result: DeepDiagnosticResponse = await response.json()
    
    // Validate response
    if (!result.diagnostic_id || typeof result.score !== 'number') {
      throw new Error('Invalid response format from server')
    }

    return result
  }

  /**
   * Save result to localStorage
   */
  static saveResult(result: DeepDiagnosticResult): void {
    try {
      localStorage.setItem(this.RESULT_KEY, JSON.stringify(result))
    } catch (error) {
      console.error('[DeepDiagnostic] Failed to save result:', error)
    }
  }

  /**
   * Load result from localStorage
   */
  static loadResult(): DeepDiagnosticResult | null {
    try {
      const stored = localStorage.getItem(this.RESULT_KEY)
      if (!stored) return null
      
      const result = JSON.parse(stored) as DeepDiagnosticResult
      
      // Validate structure
      if (!result.diagnostic_id || typeof result.score !== 'number') {
        console.warn('[DeepDiagnostic] Invalid result data, clearing')
        this.clearResult()
        return null
      }
      
      return result
    } catch (error) {
      console.error('[DeepDiagnostic] Failed to load result:', error)
      return null
    }
  }

  /**
   * Clear result
   */
  static clearResult(): void {
    try {
      localStorage.removeItem(this.RESULT_KEY)
    } catch (error) {
      console.error('[DeepDiagnostic] Failed to clear result:', error)
    }
  }

  /**
   * Generate blueprint from diagnostic
   */
  static async generateBlueprint(
    diagnosticId: string
  ): Promise<BlueprintGenerationResponse> {
    const response = await fetch('/api/blueprints/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        diagnostic_id: diagnosticId
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: 'Failed to generate blueprint' 
      }))
      throw new Error(error.message || 'Failed to generate blueprint')
    }

    return response.json()
  }

  /**
   * Validate phase completion
   */
  static validatePhase(
    phase: PhaseConfig,
    responses: Record<string, any>
  ): Record<string, string> {
    const errors: Record<string, string> = {}

    for (const question of phase.questions) {
      if (!question.required) continue

      const value = responses[question.id]

      // Check if answered
      if (value === undefined || value === null || value === '') {
        errors[question.id] = 'This field is required'
        continue
      }

      // Type-specific validation
      if (question.type === 'multiselect' && Array.isArray(value) && value.length === 0) {
        errors[question.id] = 'Please select at least one option'
      }

      // Custom validation rules
      if (question.validation) {
        const { minLength, maxLength, min, max, pattern } = question.validation

        if (typeof value === 'string') {
          if (minLength && value.length < minLength) {
            errors[question.id] = `Minimum ${minLength} characters required`
          }
          if (maxLength && value.length > maxLength) {
            errors[question.id] = `Maximum ${maxLength} characters allowed`
          }
          if (pattern && !new RegExp(pattern).test(value)) {
            errors[question.id] = 'Invalid format'
          }
        }

        if (typeof value === 'number') {
          if (min !== undefined && value < min) {
            errors[question.id] = `Minimum value is ${min}`
          }
          if (max !== undefined && value > max) {
            errors[question.id] = `Maximum value is ${max}`
          }
        }
      }
    }

    return errors
  }
}
```

## Data Models

### Phase Question Definitions

The questions for each phase are stored in a constants file:

```typescript
// constants/deepDiagnosticQuestions.ts

export const DEEP_DIAGNOSTIC_PHASES: PhaseConfig[] = [
  {
    id: 'business_objective_kpi',
    title: 'Business Objective & KPI',
    description: 'Define your business goals and how you measure success',
    questions: [
      {
        id: 'primary_objective',
        question: 'What is your primary business objective for AI implementation?',
        type: 'textarea',
        placeholder: 'Describe your main goal (e.g., reduce operational costs, improve customer experience)',
        helperText: 'Be as specific as possible',
        required: true,
        validation: {
          minLength: 20,
          maxLength: 500
        }
      },
      {
        id: 'quantified_goal',
        question: 'Do you have a quantified target for this objective?',
        type: 'radio',
        options: [
          'Yes, with specific metrics (e.g., reduce costs by 20%)',
          'Yes, but not quantified (e.g., improve efficiency)',
          'No, still exploring'
        ],
        required: true
      },
      {
        id: 'target_metrics',
        question: 'If yes, what are your target metrics?',
        type: 'textarea',
        placeholder: 'e.g., Reduce processing time by 30%, Increase accuracy to 95%',
        helperText: 'Leave blank if not applicable',
        required: false
      },
      {
        id: 'kpi_tracking',
        question: 'How do you currently track these KPIs?',
        type: 'select',
        options: [
          'Automated dashboards',
          'Manual reports',
          'Spreadsheets',
          'Not currently tracked',
          'Other'
        ],
        required: true
      },
      {
        id: 'success_timeline',
        question: 'What is your expected timeline for achieving these goals?',
        type: 'select',
        options: [
          '1-3 months',
          '3-6 months',
          '6-12 months',
          '12+ months',
          'Flexible/Ongoing'
        ],
        required: true
      }
    ]
  },
  {
    id: 'data_process_readiness',
    title: 'Data & Process Readiness',
    description: 'Assess your data infrastructure and process maturity',
    questions: [
      {
        id: 'data_centralization',
        question: 'How centralized is your data?',
        type: 'radio',
        options: [
          'Fully centralized in a data warehouse/lake',
          'Partially centralized across some systems',
          'Siloed across departments',
          'No centralization'
        ],
        required: true
      },
      {
        id: 'data_quality',
        question: 'How would you rate your data quality?',
        type: 'radio',
        options: [
          'High quality, clean, and consistent',
          'Good quality with minor issues',
          'Moderate quality, needs cleanup',
          'Poor quality, significant issues'
        ],
        required: true
      },
      {
        id: 'process_documentation',
        question: 'What percentage of your key processes are documented?',
        type: 'select',
        options: [
          '0-25%',
          '25-50%',
          '50-75%',
          '75-100%'
        ],
        required: true
      },
      {
        id: 'workflow_standardization',
        question: 'How standardized are your workflows?',
        type: 'radio',
        options: [
          'Fully standardized with clear procedures',
          'Mostly standardized with some variations',
          'Some standardization, mostly ad-hoc',
          'Completely ad-hoc'
        ],
        required: true
      },
      {
        id: 'system_integration',
        question: 'What is your current level of system integration?',
        type: 'radio',
        options: [
          'Fully integrated with APIs and automation',
          'Some integration between key systems',
          'Disconnected systems with manual data transfer',
          'No integration'
        ],
        required: true
      },
      {
        id: 'automation_current',
        question: 'What percentage of your processes are currently automated?',
        type: 'select',
        options: [
          '0-10%',
          '10-25%',
          '25-50%',
          '50-75%',
          '75-100%'
        ],
        required: true
      }
    ]
  },
  {
    id: 'risk_constraints',
    title: 'Risk & Constraints',
    description: 'Identify potential risks and organizational constraints',
    questions: [
      {
        id: 'budget_allocated',
        question: 'Do you have a dedicated budget for AI initiatives?',
        type: 'radio',
        options: [
          'Yes, with specific allocation',
          'Yes, but flexible/exploratory',
          'No, but exploring options',
          'No budget currently'
        ],
        required: true
      },
      {
        id: 'budget_range',
        question: 'If yes, what is your budget range?',
        type: 'select',
        options: [
          'Under $10k',
          '$10k - $50k',
          '$50k - $100k',
          '$100k - $500k',
          'Over $500k',
          'Not applicable'
        ],
        required: false
      },
      {
        id: 'leadership_alignment',
        question: 'How aligned is your leadership on AI initiatives?',
        type: 'radio',
        options: [
          'Fully aligned and championing',
          'Supportive but cautious',
          'Some interest, needs convincing',
          'No alignment or interest'
        ],
        required: true
      },
      {
        id: 'change_readiness',
        question: 'How ready is your organization for change?',
        type: 'radio',
        options: [
          'Embracing change actively',
          'Open to change with proper planning',
          'Cautious about change',
          'Resistant to change'
        ],
        required: true
      },
      {
        id: 'compliance_requirements',
        question: 'Do you have specific compliance or regulatory requirements?',
        type: 'multiselect',
        options: [
          'GDPR',
          'HIPAA',
          'SOC 2',
          'ISO 27001',
          'Industry-specific regulations',
          'None',
          'Other'
        ],
        helperText: 'Select all that apply',
        required: true
      },
      {
        id: 'risk_tolerance',
        question: 'What is your organization\'s risk tolerance for AI projects?',
        type: 'radio',
        options: [
          'High - willing to experiment and iterate',
          'Moderate - balanced approach',
          'Low - prefer proven solutions',
          'Very low - extremely cautious'
        ],
        required: true
      }
    ]
  },
  {
    id: 'ai_opportunity_mapping',
    title: 'AI Opportunity Mapping',
    description: 'Identify specific areas where AI can add value',
    questions: [
      {
        id: 'pain_points',
        question: 'What are your top 3 operational pain points?',
        type: 'textarea',
        placeholder: 'List your biggest challenges (one per line)',
        helperText: 'Be specific about what causes delays, errors, or inefficiencies',
        required: true,
        validation: {
          minLength: 30,
          maxLength: 1000
        }
      },
      {
        id: 'manual_processes',
        question: 'Which processes consume the most manual effort?',
        type: 'textarea',
        placeholder: 'Describe time-consuming manual tasks',
        helperText: 'Include approximate time spent per week if known',
        required: true,
        validation: {
          minLength: 20,
          maxLength: 1000
        }
      },
      {
        id: 'decision_speed',
        question: 'How fast can your organization make decisions on new initiatives?',
        type: 'radio',
        options: [
          'Hours to days',
          'Days to weeks',
          'Weeks to months',
          'Months or longer'
        ],
        required: true
      },
      {
        id: 'internal_capability',
        question: 'What is your internal AI/technical capability?',
        type: 'radio',
        options: [
          'Strong AI team with experience',
          'Some AI knowledge, need guidance',
          'Limited technical skills',
          'No technical team'
        ],
        required: true
      },
      {
        id: 'preferred_approach',
        question: 'What is your preferred approach to AI implementation?',
        type: 'radio',
        options: [
          'Build in-house with internal team',
          'Partner with external experts',
          'Hybrid approach (internal + external)',
          'Not sure yet'
        ],
        required: true
      },
      {
        id: 'priority_areas',
        question: 'Which areas are highest priority for AI implementation?',
        type: 'multiselect',
        options: [
          'Customer service/support',
          'Sales and marketing',
          'Operations and logistics',
          'Finance and accounting',
          'HR and recruitment',
          'Product development',
          'Data analysis and reporting',
          'Other'
        ],
        helperText: 'Select all that apply',
        required: true
      }
    ]
  }
]
```

### localStorage Schema

**Progress Storage** (`aivory_deep_diagnostic`):
```json
{
  "phases": {
    "business_objective_kpi": {
      "completed": true,
      "responses": {
        "primary_objective": "Reduce customer support response time",
        "quantified_goal": "Yes, with specific metrics (e.g., reduce costs by 20%)",
        "target_metrics": "Reduce average response time from 24h to 4h",
        "kpi_tracking": "Manual reports",
        "success_timeline": "3-6 months"
      }
    },
    "data_process_readiness": {
      "completed": false,
      "responses": {
        "data_centralization": "Partially centralized across some systems"
      }
    },
    "risk_constraints": {
      "completed": false,
      "responses": {}
    },
    "ai_opportunity_mapping": {
      "completed": false,
      "responses": {}
    }
  },
  "currentPhase": "data_process_readiness",
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

**Result Storage** (`aivory_deep_diagnostic_result`):
```json
{
  "diagnostic_id": "deep_diag_1234567890",
  "score": 72,
  "maturity_level": "Defined",
  "dimensions": {
    "business_alignment": 85,
    "data_readiness": 65,
    "process_maturity": 70,
    "risk_management": 75,
    "opportunity_identification": 80
  },
  "strengths": [
    "Clear quantified business objectives with measurable KPIs",
    "Strong leadership alignment and change readiness",
    "Well-identified priority areas for AI implementation"
  ],
  "blockers": [
    "Data quality and centralization need improvement"
  ],
  "opportunities": [
    "Customer service automation shows high ROI potential",
    "Process documentation can unlock workflow automation"
  ],
  "narrative": "Your organization demonstrates a Defined level of AI readiness with a score of 72/100. You have strong strategic foundations with clear objectives and leadership support. Your main challenge is data infrastructure maturity, but your identified pain points align well with proven AI solutions. The Deep Diagnostic reveals specific opportunities in customer service automation that could deliver quick wins while building toward broader AI adoption.",
  "recommendations": [
    "Start with a pilot project in customer service to demonstrate value",
    "Invest in data centralization and quality improvement",
    "Document key processes to enable workflow automation",
    "Consider hybrid approach with external AI expertise"
  ],
  "timestamp": "2024-01-15T11:00:00Z"
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies and consolidations:

- **Redundant**: 8.2 is covered by 7.1 and 7.2 (API payload inclusion)
- **Consolidated**: 2.1, 2.2, 2.3, 2.4 can be combined into a single property about progress tracker state synchronization
- **Consolidated**: 1.2, 1.3, 1.4, 1.5 can be combined into a single property about phase navigation rules
- **Consolidated**: 3.1 and 3.2 can be combined into a single property about localStorage persistence
- **Consolidated**: 4.2 and 4.3 can be combined into a single property about state restoration
- **Consolidated**: 5.2 and 5.3 can be combined into a single property about state reset
- **Consolidated**: 7.4 and 11.4 can be combined into a single property about API error handling
- **Consolidated**: 9.2 and 9.4 can be combined into a single property about results display completeness

These consolidations eliminate redundancy while ensuring each property provides unique validation value.

### Phase Navigation Properties

**Property 1: Phase navigation follows completion rules**

*For any* phase in the diagnostic flow, navigation to that phase should succeed if and only if either (a) the phase is already completed, or (b) all previous phases are completed. Attempting to navigate to a phase that doesn't meet these conditions should maintain the current phase without changing state.

**Validates: Requirements 1.2, 1.3, 1.4, 1.5**

**Property 2: Phase completion enables next phase**

*For any* phase that transitions from incomplete to complete, the immediately following phase (if it exists) should become navigable.

**Validates: Requirements 1.2**

### Progress Tracking Properties

**Property 3: Progress tracker reflects system state**

*For any* system state with phase completion data, the progress tracker should display: (a) the correct completion status for each phase, (b) the current active phase highlighted, (c) the correct count of completed phases, and (d) the correct total phase count (4).

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Data Persistence Properties

**Property 4: Response persistence round-trip**

*For any* question response or phase completion status, saving to localStorage and then loading should restore the exact same data structure with all fields intact.

**Validates: Requirements 3.1, 3.2, 3.4, 4.3**

**Property 5: Persistence timing**

*For any* user input event, the corresponding data should be persisted to localStorage within 500ms of the event.

**Validates: Requirements 3.3**

**Property 6: State restoration to correct phase**

*For any* saved progress with at least one incomplete phase, loading the system should navigate to the first incomplete phase and populate all previously saved responses.

**Validates: Requirements 4.2, 4.3**

**Property 7: Start Fresh clears all state**

*For any* system state with saved progress, activating "Start Fresh" (after confirmation) should clear all localStorage data and reset the system to phase one with empty responses for all questions.

**Validates: Requirements 5.2, 5.3**

### Summary View Properties

**Property 8: Summary view displays complete data**

*For any* completed diagnostic with all phases finished, the summary view should display all question responses organized by phase, with each phase showing all its questions and corresponding answers.

**Validates: Requirements 6.2**

**Property 9: Summary view enables all phase navigation**

*For any* phase in the summary view, an edit control should be available that navigates to that phase while preserving the summary state for return navigation.

**Validates: Requirements 6.3, 6.5**

**Property 10: Summary view appears when complete**

*For any* system state where all four phases are marked as complete, the system should display the summary view with a submit control.

**Validates: Requirements 6.1**

### API Integration Properties

**Property 11: Diagnostic submission payload format**

*For any* completed diagnostic, the API submission payload should be a JSON object containing: (a) organization_id, (b) mode set to "deep", and (c) phases object with all four phase IDs as keys, each containing all question-response pairs for that phase.

**Validates: Requirements 7.1, 7.2**

**Property 12: API error handling preserves data**

*For any* API request failure (diagnostic submission or blueprint generation), the system should display an error message and retain all user data in localStorage without modification.

**Validates: Requirements 7.4, 11.4**

**Property 13: Diagnostic ID persistence**

*For any* successful API response containing a diagnostic_id, that ID should be stored in localStorage for subsequent operations (results retrieval, blueprint generation).

**Validates: Requirements 8.4**

**Property 14: Blueprint generation includes diagnostic ID**

*For any* blueprint generation request, the API call should include the diagnostic_id from the stored results.

**Validates: Requirements 11.2**

### Results Display Properties

**Property 15: Results completeness**

*For any* diagnostic result, the results page should display all of the following: (a) overall score, (b) maturity level, (c) all dimension scores, (d) all strengths, (e) all blockers, (f) all opportunities, (g) narrative text, and (h) all recommendations.

**Validates: Requirements 9.2, 9.3, 9.4**

### Validation Properties

**Property 16: Question structure completeness**

*For all* questions in the DEEP_DIAGNOSTIC_PHASES constant, each question should have: (a) id, (b) question text, (c) type, and (d) required flag. Questions with type 'select', 'radio', or 'multiselect' should also have an options array.

**Validates: Requirements 14.3**

**Property 17: Phase completion validation**

*For any* phase with required questions, attempting to mark the phase as complete should succeed if and only if all required questions have valid responses. If validation fails, the system should display specific error messages for each invalid field and prevent phase completion.

**Validates: Requirements 15.1, 15.2**

**Property 18: Response type validation**

*For any* question response, the value type should match the question's input type: text/textarea should be strings, select/radio should be strings from the options array, multiselect should be arrays of strings from options, and number should be numeric values.

**Validates: Requirements 15.3**

**Property 19: Validation feedback timing**

*For any* validation error triggered by user interaction, the error message should appear in the UI within 200ms of the interaction.

**Validates: Requirements 15.4**

### Edge Cases

**Edge Case 1: No saved progress initialization**

When localStorage contains no saved progress, the system should initialize to phase one with empty responses for all questions.

**Validates: Requirements 4.4**

**Edge Case 2: Corrupted localStorage data**

When localStorage contains malformed or incomplete data, the system should detect the corruption, clear the invalid data, log a warning, and initialize to the default state (phase one, empty responses).

**Validates: Requirements 3.4, 4.1**

**Edge Case 3: localStorage unavailable**

When localStorage is unavailable (private browsing, disabled, quota exceeded), the system should handle the error gracefully, log a warning, and continue functioning with in-memory state only (with a warning to the user that progress won't be saved).

**Validates: Requirements 3.1, 3.2**

### Example-Based Tests

The following criteria are best tested with specific examples rather than properties:

**Example 1: Phase navigator displays correct phases**
- Verify Phase_Navigator renders four phases in order: Business Objective & KPI, Data & Process Readiness, Risk & Constraints, AI Opportunity Mapping
- **Validates: Requirements 1.1**

**Example 2: Start Fresh confirmation dialog**
- Click "Start Fresh" and verify confirmation dialog appears before clearing data
- **Validates: Requirements 5.1, 5.4**

**Example 3: Summary view submit button**
- Complete all phases and verify "Submit Diagnostic" button appears in summary view
- **Validates: Requirements 6.4**

**Example 4: Successful submission redirect**
- Submit diagnostic with valid data and verify redirect to /diagnostics/deep/result
- **Validates: Requirements 7.3**

**Example 5: Loading state during submission**
- Submit diagnostic and verify loading indicator appears and submit button is disabled
- **Validates: Requirements 7.5**

**Example 6: VPS Bridge endpoint configuration**
- Verify API calls are made to correct endpoint at port 3001
- **Validates: Requirements 8.1**

**Example 7: API timeout configuration**
- Verify fetch requests have 30-second timeout configured
- **Validates: Requirements 8.3**

**Example 8: ScoringCard component reuse**
- Verify results page imports and uses ScoringCard from Free Diagnostic
- **Validates: Requirements 9.1**

**Example 9: Deep vs Free comparison section**
- Verify results page displays comparison section with correct title and content
- **Validates: Requirements 10.1, 10.2, 10.3**

**Example 10: CSS modules usage**
- Verify all components use CSS modules (*.module.css) for styling
- **Validates: Requirements 10.4, 12.2**

**Example 11: Generate Blueprint button**
- Verify results page displays "Generate Blueprint" CTA button
- **Validates: Requirements 11.1**

**Example 12: Blueprint generation redirect**
- Click "Generate Blueprint" with valid diagnostic ID and verify redirect to blueprint viewer
- **Validates: Requirements 11.3**

**Example 13: Blueprint generation loading state**
- Click "Generate Blueprint" and verify loading indicator appears
- **Validates: Requirements 11.5**

**Example 14: No mock data in production**
- Verify codebase contains no mock data or hardcoded test values
- **Validates: Requirements 12.3**

**Example 15: File organization**
- Verify pages are in nextjs-console/app/diagnostics/deep/
- Verify components are in nextjs-console/components/diagnostics/
- Verify services are in nextjs-console/services/
- **Validates: Requirements 13.1, 13.2, 13.3**

**Example 16: Next.js App Router conventions**
- Verify page.tsx files follow App Router structure
- **Validates: Requirements 13.4**

**Example 17: Questions in constants file**
- Verify DEEP_DIAGNOSTIC_PHASES is defined in constants/deepDiagnosticQuestions.ts
- Verify questions are organized by phase identifier
- **Validates: Requirements 14.1, 14.2, 14.4**

## Error Handling

### Client-Side Error Handling

**Validation Errors**:
- Display inline error messages when required questions are unanswered
- Error message format: "{Question label} is required" or specific validation message
- Error styling: Red text (#ef4444) below the question field
- Clear errors when user provides valid input
- Prevent phase completion when validation errors exist

**Navigation Errors**:
- Prevent navigation to phases that don't meet completion requirements
- Silently maintain current phase when invalid navigation is attempted
- Log navigation attempts to console for debugging

**State Errors**:
- Handle missing or corrupted localStorage data gracefully
- If phase data is corrupted, clear and reinitialize
- Show user-friendly message: "Your progress data was corrupted. Starting fresh."
- Log corruption details to console

### API Error Handling

**Network Errors**:
- Catch fetch errors (network failure, timeout)
- Display error message: "Unable to connect to the server. Please check your connection and try again."
- Provide Retry button that re-attempts the API call
- Preserve all user data during error state
- Log error details to console

**Server Errors (4xx, 5xx)**:
- Parse error response from VPS Bridge
- Display server error message if provided, or generic message
- Generic message: "Something went wrong while processing your diagnostic. Please try again."
- Provide Retry button
- Preserve all user data
- Log error status and response to console

**Response Validation Errors**:
- Validate API response structure matches expected types
- If validation fails, treat as server error
- Log validation errors to console with response data (sanitized)
- Preserve all user data

**Timeout Errors**:
- Set 30-second timeout on all API requests
- If timeout occurs, display: "The request is taking longer than expected. Please try again."
- Provide Retry button
- Log timeout to console

### localStorage Error Handling

**Storage Unavailable**:
- Wrap all localStorage calls in try-catch blocks
- If localStorage is unavailable (private browsing, disabled), log warning
- Display warning message: "Progress cannot be saved in your browser. You can still complete the diagnostic, but you'll need to finish in one session."
- Continue with in-memory state only
- Disable "Resume" functionality

**Storage Quota Exceeded**:
- Catch QuotaExceededError when saving progress
- Attempt to clear old diagnostic data and retry
- If still fails, show error: "Unable to save progress due to storage limits. Please clear browser data and try again."
- Continue with in-memory state

**Corrupted Data**:
- Wrap JSON.parse in try-catch when reading from localStorage
- If parse fails, clear corrupted data and return null
- Log warning to console with error details
- Initialize to default state

**Data Migration**:
- If localStorage schema changes in future versions, detect old format
- Attempt to migrate data to new format
- If migration fails, clear old data and start fresh
- Log migration status to console

### Error Logging Strategy

**Development Mode**:
- Log all errors with full stack traces
- Log API requests and responses
- Log state changes for debugging
- Log localStorage operations

**Production Mode**:
- Log errors without sensitive data (no user IDs, no full responses)
- Log error types and messages only
- Sanitize any logged data to remove PII
- Use structured logging format

**Error Log Format**:
```typescript
console.error('[DeepDiagnostic]', {
  type: 'API_ERROR' | 'VALIDATION_ERROR' | 'STORAGE_ERROR' | 'NAVIGATION_ERROR',
  message: string,
  context: Record<string, any> // Sanitized context
})
```

**User-Facing Error Messages**:
- Keep messages clear and actionable
- Avoid technical jargon
- Provide next steps (Retry, Start Fresh, Contact Support)
- Maintain calm, professional tone consistent with brand

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, integration points, and UI behavior
- **Property tests**: Verify universal properties across all inputs and state transitions

Together, these approaches provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness.

### Property-Based Testing

**Library**: Use `fast-check` for TypeScript property-based testing

**Configuration**: Each property test should run a minimum of 100 iterations

**Tagging**: Each test must reference its design document property using the format:
```typescript
// Feature: deep-diagnostic-flow, Property 1: Phase navigation follows completion rules
```

**Property Test Examples**:

```typescript
// Property 1: Phase navigation follows completion rules
test('Property 1: Phase navigation follows completion rules', () => {
  fc.assert(
    fc.property(
      fc.array(fc.boolean(), { minLength: 4, maxLength: 4 }), // completion states
      fc.integer({ min: 0, max: 3 }), // target phase
      (completionStates, targetPhase) => {
        // Setup: Create phase data with given completion states
        const phaseData = createPhaseData(completionStates)
        
        // Action: Attempt navigation to target phase
        const result = canNavigateToPhase(targetPhase, phaseData)
        
        // Assertion: Navigation should succeed only if rules are met
        const isCompleted = completionStates[targetPhase]
        const allPreviousCompleted = completionStates
          .slice(0, targetPhase)
          .every(c => c)
        
        expect(result).toBe(isCompleted || allPreviousCompleted)
      }
    ),
    { numRuns: 100 }
  )
})

// Property 4: Response persistence round-trip
test('Property 4: Response persistence round-trip', () => {
  fc.assert(
    fc.property(
      fc.record({
        phases: fc.dictionary(
          fc.constantFrom('business_objective_kpi', 'data_process_readiness', 'risk_constraints', 'ai_opportunity_mapping'),
          fc.record({
            completed: fc.boolean(),
            responses: fc.dictionary(fc.string(), fc.anything())
          })
        ),
        currentPhase: fc.constantFrom('business_objective_kpi', 'data_process_readiness', 'risk_constraints', 'ai_opportunity_mapping')
      }),
      (progress) => {
        // Action: Save and load
        DeepDiagnosticService.saveProgress(progress)
        const loaded = DeepDiagnosticService.loadProgress()
        
        // Assertion: Data should match exactly
        expect(loaded).toEqual(expect.objectContaining({
          phases: progress.phases,
          currentPhase: progress.currentPhase
        }))
      }
    ),
    { numRuns: 100 }
  )
})

// Property 11: Diagnostic submission payload format
test('Property 11: Diagnostic submission payload format', () => {
  fc.assert(
    fc.property(
      fc.record({
        business_objective_kpi: fc.dictionary(fc.string(), fc.anything()),
        data_process_readiness: fc.dictionary(fc.string(), fc.anything()),
        risk_constraints: fc.dictionary(fc.string(), fc.anything()),
        ai_opportunity_mapping: fc.dictionary(fc.string(), fc.anything())
      }),
      (phases) => {
        // Action: Format payload
        const payload = formatDiagnosticPayload('test_org', phases)
        
        // Assertion: Payload should have correct structure
        expect(payload).toHaveProperty('organization_id', 'test_org')
        expect(payload).toHaveProperty('mode', 'deep')
        expect(payload).toHaveProperty('phases')
        expect(Object.keys(payload.phases)).toHaveLength(4)
        expect(payload.phases).toHaveProperty('business_objective_kpi')
        expect(payload.phases).toHaveProperty('data_process_readiness')
        expect(payload.phases).toHaveProperty('risk_constraints')
        expect(payload.phases).toHaveProperty('ai_opportunity_mapping')
      }
    ),
    { numRuns: 100 }
  )
})

// Property 17: Phase completion validation
test('Property 17: Phase completion validation', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 3 }), // phase index
      fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined))),
      (phaseIndex, responses) => {
        const phase = DEEP_DIAGNOSTIC_PHASES[phaseIndex]
        
        // Action: Validate phase
        const errors = DeepDiagnosticService.validatePhase(phase, responses)
        
        // Assertion: Should have errors for missing required fields
        const requiredQuestions = phase.questions.filter(q => q.required)
        for (const question of requiredQuestions) {
          const value = responses[question.id]
          const hasValue = value !== null && value !== undefined && value !== ''
          
          if (!hasValue) {
            expect(errors).toHaveProperty(question.id)
          }
        }
      }
    ),
    { numRuns: 100 }
  )
})
```

### Unit Testing

**Framework**: Jest + React Testing Library

**Coverage Areas**:
- Component rendering (Examples 1-17)
- User interactions (navigation, form input, submission)
- API integration (mocked)
- Error handling (Edge Cases 1-3)
- localStorage operations (mocked)
- State management

**Unit Test Examples**:

```typescript
// Example 1: Phase navigator displays correct phases
test('displays four phases in correct order', () => {
  const { getByText } = render(<PhaseNavigator phases={DEEP_DIAGNOSTIC_PHASES} currentPhase="business_objective_kpi" completedPhases={[]} onNavigate={jest.fn()} />)
  
  expect(getByText('Business Objective & KPI')).toBeInTheDocument()
  expect(getByText('Data & Process Readiness')).toBeInTheDocument()
  expect(getByText('Risk & Constraints')).toBeInTheDocument()
  expect(getByText('AI Opportunity Mapping')).toBeInTheDocument()
})

// Example 4: Successful submission redirect
test('redirects to results page after successful submission', async () => {
  const mockPush = jest.fn()
  jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({ push: mockPush })
  
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      diagnostic_id: 'test_123',
      score: 75,
      maturity_level: 'Defined'
    })
  })
  
  const { getByText } = render(<SummaryView />)
  
  fireEvent.click(getByText('Submit Diagnostic'))
  
  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith('/diagnostics/deep/result')
  })
})

// Edge Case 2: Corrupted localStorage data
test('handles corrupted localStorage data gracefully', () => {
  localStorage.setItem('aivory_deep_diagnostic', 'invalid json{')
  
  const { getByText } = render(<DeepDiagnosticFlow />)
  
  // Should initialize to phase one
  expect(getByText('Business Objective & KPI')).toBeInTheDocument()
  
  // Should clear corrupted data
  expect(localStorage.getItem('aivory_deep_diagnostic')).toBeNull()
})

// Edge Case 3: localStorage unavailable
test('continues functioning when localStorage is unavailable', () => {
  const mockSetItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('QuotaExceededError')
  })
  
  const { getByText, getByPlaceholderText } = render(<DeepDiagnosticFlow />)
  
  // Should display warning
  expect(getByText(/progress cannot be saved/i)).toBeInTheDocument()
  
  // Should still allow answering questions
  const input = getByPlaceholderText(/describe your main goal/i)
  fireEvent.change(input, { target: { value: 'Test objective' } })
  
  expect(input).toHaveValue('Test objective')
  
  mockSetItem.mockRestore()
})
```

### Integration Testing

**Scope**: Test complete user flows end-to-end

**Key Flows**:
1. Complete all four phases → Review in summary → Submit → View results → Generate blueprint
2. Start diagnostic → Complete phase 1 → Close browser → Reopen → Resume from phase 2
3. Complete diagnostic → Start Fresh → Confirm → Verify all data cleared
4. Complete diagnostic → View results → Navigate back → Edit phase 2 → Re-submit

**Tools**: Playwright or Cypress for E2E testing

### Testing Checklist

- [ ] All 19 properties have property-based tests (100+ iterations each)
- [ ] All 3 edge cases have unit tests
- [ ] All 17 examples have unit tests
- [ ] API integration is mocked and tested
- [ ] localStorage is mocked and tested
- [ ] Error scenarios are tested (network, server, validation, storage)
- [ ] TypeScript types are validated
- [ ] State management is tested
- [ ] Navigation flows are tested
- [ ] Form validation is tested
- [ ] Integration flows are tested E2E
- [ ] Performance requirements are tested (500ms persistence, 200ms validation feedback)


## Implementation Notes

### Development Approach

**Phase 1: Core Infrastructure**
1. Create TypeScript interfaces and types
2. Implement DeepDiagnosticService with localStorage operations
3. Create constants file with phase questions
4. Set up routing structure

**Phase 2: Phase Flow Components**
1. Implement PhaseNavigator component
2. Implement ProgressTracker component
3. Implement PhaseContent component with question rendering
4. Implement main DeepDiagnosticFlow page
5. Add validation logic

**Phase 3: Summary and Submission**
1. Implement SummaryView component
2. Add API integration for diagnostic submission
3. Implement loading and error states
4. Add "Start Fresh" functionality

**Phase 4: Results Display**
1. Implement DeepDiagnosticResult page
2. Reuse ScoringCard from Free Diagnostic
3. Add Deep vs Free comparison section
4. Implement blueprint generation integration

**Phase 5: Testing and Polish**
1. Write property-based tests
2. Write unit tests
3. Write integration tests
4. Add error handling and edge cases
5. Polish UI and styling

### Key Implementation Decisions

**State Management**:
- Use React useState for component-level state
- Use localStorage for persistence (no Redux/Zustand needed)
- Debounce localStorage writes to avoid performance issues
- Service layer handles all localStorage operations

**Validation Strategy**:
- Client-side validation only (no server-side validation needed)
- Validate on phase completion attempt
- Validate on form submission
- Show inline errors immediately
- Block navigation/submission when validation fails

**API Integration**:
- Use Next.js API routes as proxy to VPS Bridge
- Handle CORS and authentication in API routes
- Validate request/response formats
- Implement proper error handling and retries

**Component Reuse**:
- Reuse ScoringCard from Free Diagnostic
- Reuse styling patterns and CSS modules
- Share TypeScript types where applicable
- Follow existing naming conventions

**Performance Considerations**:
- Debounce localStorage writes (500ms)
- Lazy load phase content (only render current phase)
- Memoize expensive computations
- Optimize re-renders with React.memo where needed

**Accessibility**:
- Ensure keyboard navigation works for all controls
- Add ARIA labels for screen readers
- Maintain focus management during navigation
- Provide clear error messages
- Use semantic HTML elements

### File Structure

```
nextjs-console/
├── app/
│   ├── api/
│   │   └── diagnostics/
│   │       └── run/
│   │           └── route.ts (Deep diagnostic API endpoint)
│   └── diagnostics/
│       └── deep/
│           ├── page.tsx (Main flow)
│           ├── deep-diagnostic.module.css
│           ├── summary/
│           │   ├── page.tsx
│           │   └── summary.module.css
│           └── result/
│               ├── page.tsx
│               └── result.module.css
├── components/
│   └── diagnostics/
│       ├── PhaseNavigator.tsx
│       ├── PhaseNavigator.module.css
│       ├── ProgressTracker.tsx
│       ├── ProgressTracker.module.css
│       ├── PhaseContent.tsx
│       ├── PhaseContent.module.css
│       ├── SummaryView.tsx (or inline in page)
│       ├── DeepVsFreeComparison.tsx
│       └── DeepVsFreeComparison.module.css
├── services/
│   └── deepDiagnostic.ts
├── constants/
│   └── deepDiagnosticQuestions.ts
├── types/
│   └── deepDiagnostic.ts
└── lib/
    └── config.ts (VPS Bridge configuration)
```

### API Endpoint Implementation

**POST /api/diagnostics/run**:
```typescript
// nextjs-console/app/api/diagnostics/run/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { VPS_BRIDGE_CONFIG } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, mode, phases } = body

    // Validate request
    if (!organization_id || !mode || !phases) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (mode === 'deep') {
      // Validate deep diagnostic structure
      const requiredPhases = [
        'business_objective_kpi',
        'data_process_readiness',
        'risk_constraints',
        'ai_opportunity_mapping'
      ]
      
      for (const phaseId of requiredPhases) {
        if (!phases[phaseId]) {
          return NextResponse.json(
            { message: `Missing phase: ${phaseId}` },
            { status: 400 }
          )
        }
      }
    }

    // Call VPS Bridge
    const response = await fetch(`${VPS_BRIDGE_CONFIG.baseUrl}/diagnostics/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': VPS_BRIDGE_CONFIG.apiKey
      },
      body: JSON.stringify({
        organization_id,
        mode,
        phases,
        language: 'en'
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: true,
        code: 'VPS_BRIDGE_ERROR',
        message: 'VPS Bridge request failed' 
      }))
      return NextResponse.json(
        { 
          message: errorData.message || 'Failed to process diagnostic',
          error: errorData.error,
          code: errorData.code
        },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Diagnostic error:', error)
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { message: 'Request timeout. Please try again.' },
        { status: 504 }
      )
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Styling Guidelines

**Color Palette** (Warm Gray Theme):
- Background: `#1e1d1a`
- Card background: `#2a2926`
- Text primary: `#f5f5f4`
- Text secondary: `#a8a29e`
- Border: `#44403c`
- Accent: `#d97706` (amber)
- Success: `#10b981` (emerald)
- Error: `#ef4444` (red)
- Warning: `#f59e0b` (amber)

**Typography**:
- Font family: `'Inter Tight', sans-serif`
- Headings: 600 weight
- Body: 400 weight
- Labels: 500 weight

**Spacing**:
- Use consistent spacing scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px
- Card padding: 24px
- Section spacing: 32px
- Element spacing: 16px

**Component Patterns**:
- Cards: Rounded corners (8px), subtle shadow, border
- Buttons: Rounded (6px), hover states, disabled states
- Inputs: Rounded (6px), focus states, error states
- Progress bars: Rounded (4px), smooth transitions

### Security Considerations

**Data Privacy**:
- No PII should be logged to console in production
- Sanitize all error messages before logging
- Don't expose internal system details in error messages
- Use secure localStorage (HTTPS only in production)

**API Security**:
- API key stored in environment variables
- Never expose API key in client-side code
- Use Next.js API routes as proxy
- Validate all inputs before sending to VPS Bridge
- Implement rate limiting if needed

**Input Validation**:
- Validate all user inputs client-side
- Sanitize inputs before storage
- Prevent XSS attacks (React handles this by default)
- Validate data types and formats

### Performance Optimization

**Debouncing**:
- Debounce localStorage writes (500ms)
- Debounce validation feedback (200ms)
- Use lodash.debounce or custom implementation

**Code Splitting**:
- Lazy load phase content
- Dynamic imports for heavy components
- Split CSS modules per component

**Memoization**:
- Memoize expensive computations
- Use React.memo for pure components
- Use useMemo for derived state
- Use useCallback for event handlers

**Bundle Size**:
- Tree-shake unused code
- Minimize dependencies
- Use production builds
- Enable compression

### Migration from Free Diagnostic

**Shared Components**:
- ScoringCard: Reuse as-is
- NavigationControls: Adapt for phase navigation
- ProgressIndicator: Adapt for phase progress

**Shared Services**:
- API integration patterns
- localStorage patterns
- Error handling patterns

**Shared Types**:
- Diagnostic result types (extend for Deep)
- API request/response types
- Error types

**Shared Styling**:
- Color palette
- Typography
- Component patterns
- CSS module structure

### Future Enhancements

**Potential Improvements** (not in v1 scope):
- Auto-save draft responses to server
- Email resume link functionality
- PDF export of diagnostic results
- Comparison with industry benchmarks
- Historical diagnostic tracking
- Team collaboration features
- Admin dashboard for viewing diagnostics
- Analytics and reporting
- A/B testing different question sets
- Multi-language support

**Technical Debt to Address**:
- Consider moving to server-side state management for multi-device support
- Implement proper session management
- Add telemetry for user behavior analysis
- Optimize for mobile devices
- Add offline support with service workers

### Dependencies

**Required Packages**:
- `next`: ^13.0.0 (App Router)
- `react`: ^18.0.0
- `react-dom`: ^18.0.0
- `typescript`: ^5.0.0

**Development Dependencies**:
- `@testing-library/react`: ^14.0.0
- `@testing-library/jest-dom`: ^6.0.0
- `jest`: ^29.0.0
- `fast-check`: ^3.0.0 (property-based testing)
- `@types/node`: ^20.0.0
- `@types/react`: ^18.0.0

**No Additional Dependencies Needed**:
- No state management library (use React state + localStorage)
- No form library (custom implementation)
- No UI component library (custom components)
- No animation library (CSS transitions)

### Deployment Considerations

**Environment Variables**:
```env
NEXT_PUBLIC_VPS_BRIDGE_URL=http://localhost:3001
NEXT_PUBLIC_VPS_API_KEY=your_api_key_here
```

**Build Configuration**:
- Enable TypeScript strict mode
- Enable ESLint
- Configure CSS modules
- Set up proper error boundaries

**Monitoring**:
- Log API errors to monitoring service
- Track diagnostic completion rates
- Monitor localStorage usage
- Track performance metrics

**Rollout Strategy**:
1. Deploy to staging environment
2. Run integration tests
3. Perform manual QA
4. Deploy to production with feature flag
5. Monitor error rates and user feedback
6. Gradually enable for all users

