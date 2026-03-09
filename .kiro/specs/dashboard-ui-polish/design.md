# Design Document

## Overview

This design document specifies the implementation approach for polishing the Aivory Dashboard UI. Phase 1 (collapsible sidebar, scrollbar styling, navigation reordering) has been completed. This design focuses on the remaining high-priority improvements to transform the dashboard into an enterprise-grade product.

The design addresses five key areas:
1. Streaming AI response effect (typing animation)
2. Typography system refinement
3. Component visual polish
4. Header consolidation with profile dropdown
5. Accessibility compliance (WCAG 2.1 AA)

## Architecture

### Component Structure

The dashboard follows a standard layout architecture:

```
Dashboard Layout
├── Header (topbar)
│   ├── Logo
│   ├── Search (future)
│   └── Profile Dropdown (NEW)
│       ├── User Info
│       ├── Tier Badge
│       ├── Credits Display
│       └── Logout Button
├── Sidebar (collapsible 64px/220px)
│   ├── Main Navigation
│   ├── Settings Section
│   └── Toggle Button
├── Main Content Area
│   └── Dashboard Mode Content
└── Right Panel (optional)
    ├── System Status
    ├── Workflows
    └── Recent Executions
```

### Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 with custom properties
- **Testing**: Browser-based property testing with fast-check or similar
- **Accessibility**: WCAG 2.1 AA compliance

## Components and Interfaces

### 1. Streaming Text Component

**Purpose**: Display AI responses with character-by-character reveal animation

**Interface**:
```javascript
class StreamingText {
  constructor(container, options = {}) {
    this.container = container;
    this.charsPerSecond = options.charsPerSecond || 35; // 20-50 range
    this.showCursor = options.showCursor !== false;
    this.onComplete = options.onComplete || null;
  }
  
  stream(text) {
    // Returns Promise that resolves when streaming completes
  }
  
  cancel() {
    // Stops streaming and displays remaining text instantly
  }
}
```

**Key Methods**:
- `stream(text)`: Initiates character-by-character reveal
- `cancel()`: Stops streaming (for reduced motion or interruption)

**State Management**:
- Maintains queue of pending messages
- Ensures only one message streams at a time
- Respects `prefers-reduced-motion` media query


### 2. Profile Dropdown Component

**Purpose**: Consolidate user account information in a single dropdown menu

**Interface**:
```javascript
class ProfileDropdown {
  constructor(container, userData) {
    this.container = container;
    this.userData = userData; // { name, email, tier, credits, maxCredits }
    this.isOpen = false;
  }
  
  toggle() {
    // Opens or closes the dropdown
  }
  
  updateCredits(current, max) {
    // Updates credit display and progress bar
  }
  
  getWarningLevel() {
    // Returns 'none', 'low', 'critical' based on credit percentage
  }
}
```

**Visual States**:
- Closed: Shows user avatar/icon only
- Open: Shows full dropdown with user info, tier, credits, logout
- Warning: Shows warning icon when credits < 10%

### 3. Typography System

**Purpose**: Provide consistent, readable typography throughout the dashboard

**CSS Custom Properties**:
```css
:root {
  /* Font Sizes (1.250 ratio - Major Third) */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  
  /* Letter Spacing */
  --tracking-tight: -0.01em;
  
  /* Font Weights */
  --weight-light: 300;
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
}
```

### 4. Spacing System

**Purpose**: Maintain consistent spacing based on 8px grid

**CSS Custom Properties**:
```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
}
```

### 5. Border Radius System

**Purpose**: Provide consistent rounded corners across all components

**CSS Custom Properties**:
```css
:root {
  --radius-sm: 6px;      /* Badges */
  --radius-md: 8px;      /* Buttons, inputs */
  --radius-lg: 12px;     /* Cards, message bubbles */
  --radius-xl: 16px;     /* Hero sections */
  --radius-full: 9999px; /* Pills, avatars */
}
```

## Data Models

### User Data Model

```javascript
{
  name: string,           // User's full name
  email: string,          // User's email address
  tier: string,           // 'free' | 'builder' | 'operator' | 'enterprise'
  credits: number,        // Current credit balance
  maxCredits: number      // Maximum credits for tier
}
```

### Streaming Message Model

```javascript
{
  id: string,             // Unique message identifier
  text: string,           // Full message text
  sender: string,         // 'user' | 'ai'
  timestamp: Date,        // Message creation time
  isStreaming: boolean    // Whether currently streaming
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Streaming Text Properties

Property 1: Streaming reveals text character-by-character
*For any* text content, when streaming is initiated, characters should appear sequentially over time rather than all at once
**Validates: Requirements 1.1**

Property 2: Streaming rate is within specified range
*For any* text content, the streaming rate should be between 20-50 characters per second
**Validates: Requirements 1.2**

Property 3: Streaming completes with full text visible
*For any* text content, after streaming completes, the final DOM should contain the complete text
**Validates: Requirements 1.3**

Property 4: Streaming continues during scroll
*For any* text content being streamed, simulating scroll events should not interrupt or change the streaming rate
**Validates: Requirements 1.4**

Property 5: Messages queue properly
*For any* two messages triggered in quick succession, the second message should not start streaming until the first completes
**Validates: Requirements 1.5**

Property 6: Typing cursor appears during streaming
*For any* text content being streamed, a cursor element should be present in the DOM at the end of the revealed text
**Validates: Requirements 1.6**

Property 7: Reduced motion disables streaming
*For any* text content, when prefers-reduced-motion is enabled, text should appear instantly without character-by-character reveal
**Validates: Requirements 11.5**

### Typography Properties

Property 8: Font sizes follow mathematical scale
*For any* two consecutive font size levels in the typography scale, the larger should be 1.25x the smaller
**Validates: Requirements 2.1**

Property 9: Headings have consistent letter-spacing
*For any* heading element, the computed letter-spacing should be -0.01em
**Validates: Requirements 2.2**

Property 10: Line heights are consistent by element type
*For any* body text element, line-height should be 1.5; for any heading element, line-height should be 1.25
**Validates: Requirements 2.3**

Property 11: Spacing follows 8px grid
*For any* element's margin or padding value, it should be divisible by 8 (or 4 for extra-tight spacing)
**Validates: Requirements 2.4**

Property 12: Font weights are from allowed set
*For any* element, the computed font-weight should be one of: 300, 400, 500, 600, 700
**Validates: Requirements 2.5**

Property 13: Code elements use monospace fonts
*For any* code or pre element, the computed font-family should include "JetBrains Mono" or "Fira Code"
**Validates: Requirements 2.6**

### Component Styling Properties

Property 14: Border radius is consistent by component type
*For any* component, its border-radius should match its type: 6px (badges), 8px (buttons/inputs), 12px (cards/bubbles), 16px (hero), 9999px (circular)
**Validates: Requirements 3.1, 3.2, 3.3, 13.1, 13.2, 13.3, 13.4, 13.5**

Property 15: Input focus states are consistent
*For any* input element, when focused, it should have a 2px mint green border and 3px rgba(10, 232, 175, 0.1) box-shadow
**Validates: Requirements 3.4, 3.5, 5.5, 5.6**

Property 16: Message bubbles have consistent spacing
*For any* message bubble, it should have 12px horizontal and 16px vertical padding, with 12px gap to adjacent bubbles
**Validates: Requirements 3.6, 3.7**

Property 17: Send button meets size and style requirements
*For any* send button, it should have minimum 48px height, mint green background (#0ae8af), dark text (#1a1a24), and semibold weight (600)
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

Property 18: Send button hover state is correct
*For any* send button, when hovered, background should change to #1cffbf, transform should be translateY(-1px), and a glow shadow should appear
**Validates: Requirements 4.5, 4.6, 4.7**

Property 19: Input bar meets size and style requirements
*For any* input bar, it should have minimum 48px height, 12px horizontal and 16px vertical padding, 12px border-radius, 2px border, and 1rem font-size
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.7**

### Profile Dropdown Properties

Property 20: Profile dropdown displays required content
*For any* profile dropdown, when open, it should display user name, email, tier badge, credits with progress bar, and logout button
**Validates: Requirements 6.3, 6.4, 6.5, 6.7**

Property 21: Profile dropdown shows warning at low credits
*For any* profile dropdown, when credits are below 10% of total, a warning icon should be displayed
**Validates: Requirements 6.6**

Property 22: Header does not show redundant badges
*For any* header element, tier and credits badges should not exist outside the profile dropdown
**Validates: Requirements 6.8**

Property 23: Credit progress bar color-codes correctly
*For any* credit level, the progress bar color should be: green (>25%), yellow (10-25%), or red (<10%)
**Validates: Requirements 7.2, 7.5**

### Accessibility Properties

Property 24: Text contrast meets WCAG AA
*For any* text element, the contrast ratio against its background should be at least 4.5:1 (or 3:1 for large text 18pt+)
**Validates: Requirements 8.1, 8.2**

Property 25: Interactive elements have sufficient contrast
*For any* interactive element, the contrast ratio against its background should be at least 3:1
**Validates: Requirements 8.3**

Property 26: Text colors are consistent by hierarchy
*For any* text element, the color should match its hierarchy: rgba(255,255,255,0.95) primary, rgba(255,255,255,0.85) secondary, rgba(255,255,255,0.65) tertiary
**Validates: Requirements 8.4, 8.5, 8.6**

Property 27: All interactive elements are keyboard accessible
*For any* interactive element, it should be focusable via keyboard (tabindex >= 0 or naturally focusable)
**Validates: Requirements 9.1**

Property 28: Focus indicators are visible and consistent
*For any* focused element, it should display a 2px solid mint green outline with 2px offset
**Validates: Requirements 9.3, 9.4, 9.5**

Property 29: Modal focus is trapped
*For any* open modal, simulating tab key presses should keep focus within the modal boundaries
**Validates: Requirements 9.7**

Property 30: Icon buttons have ARIA labels
*For any* icon-only button, it should have an aria-label or aria-labelledby attribute
**Validates: Requirements 10.2**

Property 31: Images have alt text
*For any* img element, it should have a non-empty alt attribute
**Validates: Requirements 10.4**

Property 32: Form inputs have associated labels
*For any* input element, it should have an associated label via for/id or wrapping
**Validates: Requirements 10.5**

Property 33: Dynamic content uses ARIA live regions
*For any* element with dynamic content updates, it should have an aria-live attribute
**Validates: Requirements 10.3, 10.6**

Property 34: Reduced motion is respected
*For any* animated element, when prefers-reduced-motion is enabled, animation-duration and transition-duration should be 0.01ms or less
**Validates: Requirements 11.1, 11.2, 11.3**

Property 35: Touch targets meet minimum size
*For any* interactive element, its dimensions should be at least 44x44 pixels
**Validates: Requirements 12.1, 12.4, 12.5**

Property 36: Hover transitions are consistent
*For any* element with hover effects, transitions should use 200ms duration and cubic-bezier(0.4, 0, 0.2, 1) easing
**Validates: Requirements 15.5, 15.6**


## Error Handling

### Streaming Text Errors

**Scenario**: Streaming interrupted by navigation or component unmount
- **Handling**: Cancel streaming immediately, clean up timers
- **User Impact**: No visual glitches or memory leaks

**Scenario**: Invalid text content (null, undefined)
- **Handling**: Log warning, display empty message bubble
- **User Impact**: Graceful degradation

**Scenario**: Extremely long text (>10,000 characters)
- **Handling**: Stream first 10,000 characters, truncate with "..." indicator
- **User Impact**: Prevents performance issues

### Profile Dropdown Errors

**Scenario**: User data not available
- **Handling**: Display placeholder values, disable dropdown
- **User Impact**: Clear indication that data is loading

**Scenario**: Credit update fails
- **Handling**: Retry once, then show cached value with warning
- **User Impact**: User sees last known credit balance

### Accessibility Errors

**Scenario**: Focus trap fails in modal
- **Handling**: Fall back to standard focus behavior, log error
- **User Impact**: Modal still usable, just without focus trap

**Scenario**: ARIA attributes missing
- **Handling**: Log warnings in development, add default labels
- **User Impact**: Screen readers get generic but functional labels

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Streaming with empty text
- Streaming with very long text
- Profile dropdown with 0 credits
- Profile dropdown with exactly 10% credits
- Focus trap with single focusable element
- Color contrast for specific color combinations

**Property-Based Tests**: Verify universal properties across all inputs
- Streaming rate for random text lengths
- Typography scale ratios for all font sizes
- Border radius consistency for all component types
- Contrast ratios for all text elements
- Touch target sizes for all interactive elements
- Hover transition timing for all hoverable elements

### Property-Based Testing Configuration

**Library**: fast-check (JavaScript property testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: dashboard-ui-polish, Property N: [property description]`

**Example Test Structure**:
```javascript
// Feature: dashboard-ui-polish, Property 1: Streaming reveals text character-by-character
fc.assert(
  fc.property(fc.string(), async (text) => {
    const container = document.createElement('div');
    const streamer = new StreamingText(container);
    
    const startTime = Date.now();
    await streamer.stream(text);
    const endTime = Date.now();
    
    // Verify text appeared over time, not instantly
    const duration = endTime - startTime;
    const expectedMinDuration = text.length / 50 * 1000; // 50 chars/sec max
    
    return duration >= expectedMinDuration && 
           container.textContent === text;
  }),
  { numRuns: 100 }
);
```

### Testing Phases

**Phase 1: Component Unit Tests**
- Test streaming component with various text inputs
- Test profile dropdown with various credit levels
- Test focus management in modals
- Test color contrast calculations

**Phase 2: Property-Based Tests**
- Implement all 36 correctness properties as property tests
- Run with 100+ iterations each
- Verify properties hold across random inputs

**Phase 3: Accessibility Testing**
- Manual testing with screen readers (NVDA, JAWS, VoiceOver)
- Keyboard navigation testing
- Color contrast verification with automated tools
- Touch target size verification on mobile devices

**Phase 4: Cross-Browser Testing**
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Mobile)
- Verify reduced motion support
- Verify focus indicators

**Phase 5: Integration Testing**
- Test streaming in full dashboard context
- Test profile dropdown with real user data
- Test accessibility features in production-like environment
- Performance testing with large message histories

### Test Coverage Goals

- Unit test coverage: 80%+ of component code
- Property test coverage: 100% of correctness properties
- Accessibility compliance: 100% WCAG 2.1 AA
- Browser compatibility: 95%+ of users

