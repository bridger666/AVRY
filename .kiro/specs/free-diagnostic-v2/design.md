# Design Document: Free Diagnostic v2

## Overview

The Free Diagnostic v2 is a Next.js-based single-page application that guides users through a 12-question AI readiness assessment. The feature is designed as a modern, production-ready entry product that seamlessly integrates with the existing Aivory console ecosystem. It replaces the legacy HTML/JavaScript implementation with a type-safe, maintainable Next.js application using the App Router architecture.

The diagnostic flow follows a linear progression: users answer 12 questions one at a time, submit their responses to the VPS Bridge for AI-powered scoring, and receive a personalized scoring card with actionable insights. The results serve as a gateway to the Deep Diagnostic and AI System Blueprint offerings.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                         │
│                    (Port 3000)                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  /diagnostics (Hub)                                         │
│  ├── Free Diagnostic Section                               │
│  └── Deep Diagnostic Section                               │
│                                                             │
│  /diagnostics/free (Question Flow)                         │
│  ├── Question Card Component                               │
│  ├── Progress Indicator                                    │
│  ├── Navigation Controls                                   │
│  └── Validation Logic                                      │
│                                                             │
│  /diagnostics/free/result (Results Display)                │
│  ├── Scoring Card                                          │
│  ├── Narrative Section                                     │
│  └── CTA Buttons                                           │
│                                                             │
│  /dashboard (Integration Point)                            │
│  └── Diagnostic Status Card                                │
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
│  POST /diagnostics/free/run                                │
│  ├── Receives: { organization_id, answers }                │
│  ├── Processes: AI scoring logic                           │
│  └── Returns: { score, maturity_level, insights }          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ Stores
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Browser localStorage                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Key: "free_diagnostic_result"                             │
│  Value: {                                                   │
│    diagnostic_id: string                                    │
│    score: number                                            │
│    maturity_level: string                                   │
│    strengths: string[]                                      │
│    blockers: string[]                                       │
│    opportunities: string[]                                  │
│    narrative: string                                        │
│    timestamp: string                                        │
│  }                                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Routing Structure

```
/diagnostics
  ├── page.tsx (Hub: shows Free + Deep sections)
  └── free/
      ├── page.tsx (Question flow)
      ├── result/
      │   └── page.tsx (Results display)
      ├── free-diagnostic.module.css
      └── result.module.css
```

### Data Flow

1. **Question Flow**: User navigates through questions → Answers stored in component state → On submit, POST to VPS Bridge
2. **Scoring**: VPS Bridge receives answers → Processes with AI → Returns enriched results
3. **Persistence**: Results stored in localStorage → Dashboard reads from localStorage → Results page reads from localStorage
4. **Navigation**: Results page provides CTAs → Deep Diagnostic or Blueprint

## Components and Interfaces

### Core Components

#### 1. DiagnosticsHub Component (`/diagnostics/page.tsx`)

**Purpose**: Landing page showing both Free and Deep diagnostic options

**Props**: None (reads from localStorage)

**State**:
```typescript
{
  freeDiagnosticCompleted: boolean
  freeDiagnosticScore: number | null
  deepDiagnosticStatus: 'not_started' | 'in_progress' | 'completed'
}
```

**Responsibilities**:
- Display two distinct sections (Free and Deep)
- Check localStorage for completion status
- Render appropriate CTAs based on status
- Navigate to /diagnostics/free or existing deep diagnostic flow

#### 2. FreeDiagnosticFlow Component (`/diagnostics/free/page.tsx`)

**Purpose**: Main question flow component managing the 12-question assessment

**State**:
```typescript
{
  currentQuestionIndex: number
  answers: Record<string, number>
  isSubmitting: boolean
  validationError: string | null
}
```

**Responsibilities**:
- Render one question at a time
- Manage answer selection and navigation
- Validate selections before allowing Next
- Submit to VPS Bridge on completion
- Handle loading and error states

**Sub-components**:
- `QuestionCard`: Displays question text and options
- `ProgressIndicator`: Shows progress bar and "Question X of 12"
- `NavigationControls`: Previous/Next buttons with validation

#### 3. FreeDiagnosticResult Component (`/diagnostics/free/result/page.tsx`)

**Purpose**: Display scoring card and insights

**Props**: None (reads from localStorage)

**State**:
```typescript
{
  result: FreeDiagnosticResult | null
  isLoading: boolean
  error: string | null
}
```

**Responsibilities**:
- Retrieve results from localStorage
- Display scoring card with score, level, and insights
- Render narrative section
- Provide CTAs for next steps
- Handle download/copy actions (stubbed for v1)

#### 4. DashboardDiagnosticCard Component (Update to existing dashboard)

**Purpose**: Show diagnostic status on dashboard

**Props**: None (reads from localStorage)

**Responsibilities**:
- Check if Free Diagnostic is completed
- Display score if completed, or "Start" CTA if not
- Provide secondary CTA for Deep Diagnostic

### TypeScript Interfaces

```typescript
// Free Diagnostic Question Structure
export interface FreeDiagnosticQuestion {
  id: string
  question: string
  options: string[] // Always 4 options, index 0-3
}

// Answer format for API submission
export interface FreeDiagnosticAnswers {
  [questionId: string]: number // Option index 0-3
}

// API Request payload
export interface FreeDiagnosticRequest {
  organization_id: string
  answers: FreeDiagnosticAnswers
}

// API Response payload
export interface FreeDiagnosticResponse {
  diagnostic_id: string
  score: number // 0-100
  maturity_level: 'Initial' | 'Developing' | 'Defined' | 'Managed' | 'Optimizing'
  strengths: string[] // Top 3 strengths
  blockers: string[] // Top blocker
  opportunities: string[] // Top opportunity
  narrative: string // 1-2 paragraphs
  timestamp: string
}

// localStorage storage format
export interface FreeDiagnosticResult extends FreeDiagnosticResponse {
  // Same as response, stored directly
}

// Component state types
export interface QuestionFlowState {
  currentQuestionIndex: number
  answers: FreeDiagnosticAnswers
  isSubmitting: boolean
  validationError: string | null
}

export interface ResultPageState {
  result: FreeDiagnosticResult | null
  isLoading: boolean
  error: string | null
}
```

### API Integration Layer

```typescript
// services/freeDiagnostic.ts

export class FreeDiagnosticService {
  private static readonly STORAGE_KEY = 'free_diagnostic_result'
  private static readonly VPS_BRIDGE_URL = process.env.NEXT_PUBLIC_VPS_BRIDGE_URL || 'http://localhost:3001'

  /**
   * Submit diagnostic answers to VPS Bridge
   */
  static async submitDiagnostic(
    organizationId: string,
    answers: FreeDiagnosticAnswers
  ): Promise<FreeDiagnosticResponse> {
    const response = await fetch(`${this.VPS_BRIDGE_URL}/diagnostics/free/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.NEXT_PUBLIC_VPS_API_KEY || ''
      },
      body: JSON.stringify({
        organization_id: organizationId,
        answers
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to submit diagnostic')
    }

    return response.json()
  }

  /**
   * Save result to localStorage
   */
  static saveResult(result: FreeDiagnosticResult): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(result))
    } catch (error) {
      console.error('Failed to save diagnostic result:', error)
    }
  }

  /**
   * Retrieve result from localStorage
   */
  static getResult(): FreeDiagnosticResult | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Failed to retrieve diagnostic result:', error)
      return null
    }
  }

  /**
   * Check if diagnostic is completed
   */
  static isCompleted(): boolean {
    return this.getResult() !== null
  }

  /**
   * Clear stored result
   */
  static clearResult(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear diagnostic result:', error)
    }
  }
}
```

## Data Models

### Question Data

The 12 questions are stored as a constant array in the codebase:

```typescript
// constants/freeDiagnosticQuestions.ts

export const FREE_DIAGNOSTIC_QUESTIONS: FreeDiagnosticQuestion[] = [
  {
    id: 'business_objective',
    question: 'What is your primary business objective for AI?',
    options: [
      'No clear objective',
      'Vague goals (e.g., "be innovative")',
      'Specific goal (e.g., "reduce costs")',
      'Quantified goal (e.g., "reduce costs by 20%")'
    ]
  },
  {
    id: 'current_ai_usage',
    question: 'What is your current AI usage?',
    options: [
      'No AI usage',
      'Exploring/researching',
      'Running pilots',
      'Production deployment'
    ]
  },
  {
    id: 'data_availability',
    question: 'How is your data availability & quality?',
    options: [
      'No centralized data',
      'Siloed data across departments',
      'Partially centralized',
      'Fully centralized and accessible'
    ]
  },
  {
    id: 'process_documentation',
    question: 'What is your level of process documentation?',
    options: [
      'No documentation',
      'Informal/tribal knowledge',
      'Some processes documented',
      'Comprehensive documentation'
    ]
  },
  {
    id: 'workflow_standardization',
    question: 'How standardized are your workflows?',
    options: [
      'Ad-hoc workflows',
      'Some standardization',
      'Mostly standardized',
      'Fully standardized'
    ]
  },
  {
    id: 'erp_integration',
    question: 'What is your ERP / system integration level?',
    options: [
      'No systems',
      'Disconnected systems',
      'Some integration',
      'Fully integrated'
    ]
  },
  {
    id: 'automation_level',
    question: 'What is your current automation level?',
    options: [
      'Fully manual',
      'Minimal automation (<10%)',
      'Moderate automation (10-50%)',
      'High automation (>50%)'
    ]
  },
  {
    id: 'decision_speed',
    question: 'How fast is your decision-making?',
    options: [
      'Months',
      'Weeks',
      'Days',
      'Hours'
    ]
  },
  {
    id: 'leadership_alignment',
    question: 'What is your leadership alignment on AI?',
    options: [
      'No alignment',
      'Some interest',
      'Supportive',
      'Championing AI'
    ]
  },
  {
    id: 'budget_ownership',
    question: 'What is your budget situation for AI?',
    options: [
      'No budget',
      'Exploring budget',
      'Budget allocated',
      'Dedicated AI budget'
    ]
  },
  {
    id: 'change_readiness',
    question: 'How ready is your organization for change?',
    options: [
      'Resistant to change',
      'Cautious',
      'Open to change',
      'Embracing change'
    ]
  },
  {
    id: 'internal_capability',
    question: 'What is your internal AI capability?',
    options: [
      'No technical team',
      'Limited technical skills',
      'Some AI knowledge',
      'Strong AI team'
    ]
  }
]
```

### Scoring Logic (VPS Bridge)

The VPS Bridge endpoint `/diagnostics/free/run` implements the following scoring logic:

1. **Raw Score Calculation**: Sum of all answer indices (0-3) across 12 questions = 0-36 range
2. **Normalized Score**: (raw_score / 36) * 100 = 0-100 range
3. **Maturity Level Mapping**:
   - 0-20: "Initial"
   - 21-40: "Developing"
   - 41-60: "Defined"
   - 61-80: "Managed"
   - 81-100: "Optimizing"

4. **AI Enrichment**: The VPS Bridge uses an LLM to generate:
   - Top 3 strengths (based on highest-scoring dimensions)
   - Biggest blocker (based on lowest-scoring dimension)
   - Biggest opportunity (based on gap analysis)
   - Narrative (1-2 paragraphs explaining the score and recommending Deep Diagnostic)

### localStorage Schema

```typescript
// Key: "free_diagnostic_result"
{
  diagnostic_id: "diag_1234567890",
  score: 68,
  maturity_level: "Defined",
  strengths: [
    "Strong leadership alignment on AI initiatives",
    "Good data centralization and accessibility",
    "Clear quantified business objectives"
  ],
  blockers: [
    "Limited internal AI capability and technical skills"
  ],
  opportunities: [
    "Invest in AI training and talent acquisition to match your strong strategic foundation"
  ],
  narrative: "Your organization shows a Defined level of AI readiness with a score of 68/100. You have strong strategic foundations with clear objectives and leadership support, but your technical capabilities need development. Jumping straight to workflow automation could be risky without first building your internal AI competency. The Deep Diagnostic will help you create a phased roadmap that addresses capability gaps while leveraging your strategic strengths.",
  timestamp: "2024-01-15T10:30:00Z"
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:

- **Redundant**: 2.5 (backward navigation preserves answers) is covered by 1.6 and 2.4
- **Redundant**: 9.2 (store results in localStorage) is the same as 3.5
- **Redundant**: 10.1 (loading state) is the same as 3.3
- **Redundant**: 10.2 and 10.3 (error handling) are covered by 3.6
- **Redundant**: 10.4 (validation errors) is the same as 1.4
- **Redundant**: 11.1 (selected state indicator) is the same as 1.2
- **Redundant**: 11.3 (Next button validation) is covered by 1.4

These redundant criteria will not have separate properties. The remaining testable criteria are consolidated below.

### Core Navigation Properties

**Property 1: Answer selection updates UI state**

*For any* question and any answer option, when a user selects that option, the UI should display a selected state indicator for that option and no other option.

**Validates: Requirements 1.2, 11.1**

**Property 2: Navigation without selection shows validation error**

*For any* question where no answer is selected, clicking the Next button should display an inline validation error and prevent navigation to the next question.

**Validates: Requirements 1.4, 10.4, 11.3**

**Property 3: Navigation with selection advances and saves**

*For any* question with a selected answer, clicking the Next button should save the answer to state and advance to the next question (or submit if on Q12).

**Validates: Requirements 1.5**

**Property 4: Backward navigation preserves state**

*For any* question after Q1, clicking the Previous button should navigate to the previous question and display the previously selected answer.

**Validates: Requirements 1.6, 2.4, 2.5**

**Property 5: Progress indicators update with navigation**

*For any* question index from 1 to 12, the progress bar should show the correct percentage ((index / 12) * 100) and the label should show "Question {index} of 12".

**Validates: Requirements 2.1, 2.2, 2.3**

### Data Formatting and Persistence Properties

**Property 6: Answer payload format**

*For any* set of completed answers, the API request payload should format answers as an object where keys are question IDs and values are option indices (0-3).

**Validates: Requirements 3.2**

**Property 7: State management during flow**

*For any* answer selection during the diagnostic flow, the answer should be stored in component state and retrievable when navigating back to that question.

**Validates: Requirements 9.1**

**Property 8: localStorage structure**

*For any* completed diagnostic result, the data stored in localStorage should contain diagnostic_id, score, maturity_level, strengths, blockers, opportunities, narrative, and timestamp fields.

**Validates: Requirements 9.3**

**Property 9: API response parsing**

*For any* valid API response from the VPS Bridge, the system should successfully extract and store all required fields: score, maturity_level, strengths, blockers, opportunities, and narrative.

**Validates: Requirements 3.4**

**Property 10: TypeScript type validation**

*For any* API response, the system should validate that the response matches the expected FreeDiagnosticResponse type before processing.

**Validates: Requirements 12.4**

### Display and Rendering Properties

**Property 11: Results page displays all insights**

*For any* valid diagnostic result, the results page should display the score, maturity level, strengths (3 items), blocker (1 item), opportunity (1 item), and narrative text.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

**Property 12: Question structure validation**

*For all* questions in the FREE_DIAGNOSTIC_QUESTIONS array, each question should have exactly 4 answer options.

**Validates: Requirements 8.2**

**Property 13: Keyboard accessibility**

*For all* interactive elements (answer options, buttons), focus states should be defined to support keyboard navigation.

**Validates: Requirements 11.5**

### Edge Cases and Error Handling

**Edge Case 1: First question Previous button disabled**

When on question 1, the Previous button should be disabled with reduced opacity and cursor: not-allowed styling.

**Validates: Requirements 1.7, 11.2**

**Edge Case 2: API failure shows error and retry**

When the VPS Bridge API request fails, the system should display a user-friendly error message and provide a Retry button.

**Validates: Requirements 3.6, 10.2, 10.3**

**Edge Case 3: localStorage unavailable**

When localStorage is unavailable or cleared, the system should handle the error gracefully without crashing and show appropriate fallback UI.

**Validates: Requirements 9.5**

### Example-Based Tests

The following criteria are best tested with specific examples rather than properties:

**Example 1: Initial page load**
- Load /diagnostics/free and verify question 1 is displayed with 4 options
- **Validates: Requirements 1.1**

**Example 2: Submission flow**
- Complete all 12 questions, click Submit, verify API call is made and navigation occurs
- **Validates: Requirements 1.8, 3.1, 3.3, 10.1**

**Example 3: Results persistence**
- Complete diagnostic, verify results are stored in localStorage with correct key
- **Validates: Requirements 3.5, 9.2**

**Example 4: Hub page structure**
- Load /diagnostics and verify two sections exist with correct descriptions
- **Validates: Requirements 5.1, 5.2, 5.5**

**Example 5: Conditional rendering on hub**
- Test hub page with no completion: shows "Start Free Diagnostic"
- Test hub page with completion: shows score and "View Results"
- **Validates: Requirements 5.3, 5.4**

**Example 6: Dashboard integration**
- Test dashboard with no completion: shows "Start Free Diagnostic"
- Test dashboard with completion: shows score and "View Results"
- Test dashboard always shows "Deep Diagnostic" CTA
- **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

**Example 7: Results page CTAs**
- Verify "Continue to Deep Diagnostic" button links to /diagnostics
- Verify "See how AI System Blueprint works" button links to /blueprint
- Verify Download and Copy buttons exist (functionality optional)
- **Validates: Requirements 4.5, 4.6, 4.7**

**Example 8: Styling verification**
- Verify background color is #1e1d1a
- Verify font family is Inter Tight
- Verify no Tailwind classes are used
- **Validates: Requirements 7.1, 7.2, 7.6**

**Example 9: Question data structure**
- Verify FREE_DIAGNOSTIC_QUESTIONS has exactly 12 items
- Verify all required question IDs are present
- **Validates: Requirements 8.1, 8.3**

**Example 10: TypeScript configuration**
- Verify TypeScript interfaces exist for all data types
- Verify tsconfig.json has strict mode enabled
- **Validates: Requirements 12.1, 12.2, 12.3, 12.5**

**Example 11: Error logging**
- Trigger an error and verify it's logged to console without sensitive data
- **Validates: Requirements 10.5**



## Error Handling

### Client-Side Error Handling

**Validation Errors**:
- Display inline error messages when user attempts to navigate without selecting an answer
- Error message: "Please select an answer before continuing"
- Error styling: Red text (#ef4444) below the question card
- Clear error when user selects an answer

**Navigation Errors**:
- Prevent navigation to invalid question indices (< 1 or > 12)
- Redirect to question 1 if invalid index is detected
- Log warning to console for debugging

**State Errors**:
- Handle missing or corrupted state gracefully
- If answers object is corrupted, reset to empty and restart from Q1
- Show user-friendly message: "Your progress was lost. Starting over."

### API Error Handling

**Network Errors**:
- Catch fetch errors (network failure, timeout)
- Display error message: "Unable to connect to the server. Please check your connection and try again."
- Provide Retry button that re-attempts the API call
- Log error details to console

**Server Errors (4xx, 5xx)**:
- Parse error response from VPS Bridge
- Display server error message if provided, or generic message
- Generic message: "Something went wrong while processing your diagnostic. Please try again."
- Provide Retry button
- Log error status and response to console

**Response Validation Errors**:
- Validate API response structure matches FreeDiagnosticResponse type
- If validation fails, treat as server error
- Log validation errors to console with response data (sanitized)

### localStorage Error Handling

**Storage Unavailable**:
- Wrap all localStorage calls in try-catch blocks
- If localStorage is unavailable (private browsing, disabled), log warning
- Gracefully degrade: diagnostic still works, but results won't persist
- Show warning message: "Results cannot be saved in your browser. You can still complete the diagnostic."

**Storage Quota Exceeded**:
- Catch QuotaExceededError when saving results
- Attempt to clear old diagnostic results and retry
- If still fails, show error: "Unable to save results due to storage limits."

**Corrupted Data**:
- Wrap JSON.parse in try-catch when reading from localStorage
- If parse fails, clear corrupted data and return null
- Log warning to console

### Error Logging Strategy

**Development Mode**:
- Log all errors with full stack traces
- Log API requests and responses
- Log state changes for debugging

**Production Mode**:
- Log errors without sensitive data (no user IDs, no full responses)
- Log error types and messages only
- Sanitize any logged data to remove PII

**Error Log Format**:
```typescript
console.error('[FreeDiagnostic]', {
  type: 'API_ERROR' | 'VALIDATION_ERROR' | 'STORAGE_ERROR',
  message: string,
  context: Record<string, any> // Sanitized context
})
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and integration points
- **Property tests**: Verify universal properties across all inputs

Together, these approaches provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness.

### Property-Based Testing

**Library**: Use `fast-check` for TypeScript property-based testing

**Configuration**: Each property test should run a minimum of 100 iterations

**Tagging**: Each test must reference its design document property using the format:
```typescript
// Feature: free-diagnostic-v2, Property 1: Answer selection updates UI state
```

**Property Test Examples**:

```typescript
// Property 1: Answer selection updates UI state
test('Property 1: Answer selection updates UI state', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 11 }), // question index
      fc.integer({ min: 0, max: 3 }),  // option index
      (questionIndex, optionIndex) => {
        // Test that selecting an option updates UI state correctly
        const { getByTestId } = render(<FreeDiagnosticFlow />)
        // Navigate to question
        // Select option
        // Verify selected state
        // Verify other options not selected
      }
    ),
    { numRuns: 100 }
  )
})

// Property 6: Answer payload format
test('Property 6: Answer payload format', () => {
  fc.assert(
    fc.property(
      fc.array(fc.integer({ min: 0, max: 3 }), { minLength: 12, maxLength: 12 }),
      (answers) => {
        const payload = formatAnswersForAPI(answers)
        // Verify payload has correct structure
        // Verify all question IDs are present
        // Verify all values are 0-3
        expect(Object.keys(payload)).toHaveLength(12)
        Object.values(payload).forEach(value => {
          expect(value).toBeGreaterThanOrEqual(0)
          expect(value).toBeLessThanOrEqual(3)
        })
      }
    ),
    { numRuns: 100 }
  )
})
```

### Unit Testing

**Framework**: Jest + React Testing Library

**Coverage Areas**:
- Component rendering (Examples 1, 4, 7, 8, 9)
- User interactions (Examples 2, 5, 6)
- API integration (Example 2, 3)
- Error handling (Edge Cases 2, 3)
- TypeScript configuration (Example 10)

**Unit Test Examples**:

```typescript
// Example 1: Initial page load
test('displays first question on page load', () => {
  const { getByText } = render(<FreeDiagnosticFlow />)
  expect(getByText(FREE_DIAGNOSTIC_QUESTIONS[0].question)).toBeInTheDocument()
  expect(getByText('Question 1 of 12')).toBeInTheDocument()
})

// Example 2: Submission flow
test('submits diagnostic and navigates to results', async () => {
  const mockPush = jest.fn()
  jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({ push: mockPush })
  
  const { getByText, getByRole } = render(<FreeDiagnosticFlow />)
  
  // Answer all 12 questions
  for (let i = 0; i < 12; i++) {
    const option = getByText(FREE_DIAGNOSTIC_QUESTIONS[i].options[2])
    fireEvent.click(option)
    if (i < 11) {
      fireEvent.click(getByText('Next'))
    }
  }
  
  // Submit
  fireEvent.click(getByText('Submit'))
  
  // Verify API call
  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/diagnostics/free/run'),
      expect.objectContaining({ method: 'POST' })
    )
  })
  
  // Verify navigation
  expect(mockPush).toHaveBeenCalledWith('/diagnostics/free/result')
})

// Edge Case 2: API failure
test('shows error and retry button on API failure', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
  
  const { getByText, getByRole } = render(<FreeDiagnosticFlow />)
  
  // Answer all questions and submit
  // ... (same as above)
  
  await waitFor(() => {
    expect(getByText(/unable to connect/i)).toBeInTheDocument()
    expect(getByText('Retry')).toBeInTheDocument()
  })
})
```

### Integration Testing

**Scope**: Test complete user flows end-to-end

**Key Flows**:
1. Complete diagnostic → View results → Navigate to Deep Diagnostic
2. Complete diagnostic → Return to dashboard → View results again
3. Start diagnostic → Navigate away → Return and resume (if state persists)

**Tools**: Playwright or Cypress for E2E testing

### Testing Checklist

- [ ] All 13 properties have property-based tests (100+ iterations each)
- [ ] All 3 edge cases have unit tests
- [ ] All 11 examples have unit tests
- [ ] API integration is mocked and tested
- [ ] localStorage is mocked and tested
- [ ] Error scenarios are tested
- [ ] TypeScript types are validated
- [ ] Accessibility (keyboard navigation) is tested
- [ ] Integration flows are tested E2E

## Implementation Notes

### CSS Modules Structure

```
free-diagnostic.module.css
├── .pageContainer
├── .questionCard
├── .questionText
├── .optionsContainer
├── .option
├── .optionSelected
├── .optionHover
├── .progressBar
├── .progressFill
├── .progressLabel
├── .navigationControls
├── .buttonPrevious
├── .buttonNext
├── .buttonDisabled
├── .validationError
└── .loadingSpinner

result.module.css
├── .resultContainer
├── .scoringCard
├── .scoreDisplay
├── .maturityLevel
├── .insightsList
├── .narrativeSection
├── .ctaContainer
├── .ctaPrimary
├── .ctaSecondary
└── .downloadButtons
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_VPS_BRIDGE_URL=http://localhost:3001
NEXT_PUBLIC_VPS_API_KEY=your_api_key_here
```

### File Structure

```
nextjs-console/
├── app/
│   ├── diagnostics/
│   │   ├── page.tsx                    # Hub page
│   │   ├── diagnostics.module.css
│   │   └── free/
│   │       ├── page.tsx                # Question flow
│   │       ├── free-diagnostic.module.css
│   │       └── result/
│   │           ├── page.tsx            # Results page
│   │           └── result.module.css
│   └── dashboard/
│       └── page.tsx                    # Update for diagnostic card
│
├── components/
│   ├── diagnostics/
│   │   ├── QuestionCard.tsx
│   │   ├── ProgressIndicator.tsx
│   │   ├── NavigationControls.tsx
│   │   └── ScoringCard.tsx
│   └── dashboard/
│       └── DiagnosticStatusCard.tsx    # New component
│
├── services/
│   └── freeDiagnostic.ts               # API and localStorage service
│
├── constants/
│   └── freeDiagnosticQuestions.ts      # 12 questions data
│
├── types/
│   └── freeDiagnostic.ts               # TypeScript interfaces
│
└── __tests__/
    ├── freeDiagnostic.property.test.ts # Property-based tests
    ├── freeDiagnostic.unit.test.ts     # Unit tests
    └── freeDiagnostic.e2e.test.ts      # Integration tests
```

### Performance Considerations

- **Code Splitting**: Use dynamic imports for result page (not needed until submission)
- **Memoization**: Memoize question rendering to prevent unnecessary re-renders
- **Debouncing**: Not needed (no text input, only clicks)
- **Bundle Size**: Keep CSS modules small, avoid large dependencies

### Accessibility Considerations

- **Keyboard Navigation**: All interactive elements must be keyboard accessible
- **Focus Management**: Focus should move logically through the flow
- **ARIA Labels**: Add aria-labels to progress indicators and buttons
- **Screen Reader Support**: Announce question changes and validation errors
- **Color Contrast**: Ensure all text meets WCAG AA standards (4.5:1 ratio)

### Browser Compatibility

- **Target**: Modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
- **localStorage**: Gracefully degrade if unavailable
- **CSS**: Use standard CSS properties, avoid experimental features
- **JavaScript**: Use ES2020 features (supported by Next.js transpilation)

### Migration from Legacy

The legacy free diagnostic in `frontend/index.html` and `frontend/app.js` will remain in place during development. Once the Next.js version is complete and tested:

1. Update all navigation links to point to `/diagnostics/free`
2. Add redirect from old routes to new routes
3. Move legacy files to `frontend/legacy/` directory
4. Update documentation to reference new implementation

### Future Enhancements

**Phase 2 (Post-MVP)**:
- Download scoring card as PDF
- Copy summary to clipboard
- Email results to user
- Social sharing of score (anonymized)
- Multi-language support (Indonesian, Arabic)
- Progress saving across sessions (backend persistence)
- Comparison with industry benchmarks

**Phase 3 (Advanced)**:
- Animated transitions between questions
- Interactive score visualization (charts, graphs)
- Personalized recommendations based on score
- Integration with CRM for lead tracking
- A/B testing different question phrasings
